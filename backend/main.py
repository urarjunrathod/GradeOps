from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
import bcrypt
import json
import uuid
import os
import shutil
from groq import Groq
from dotenv import load_dotenv
import base64


load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = FastAPI(title="GradeOps API")

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

plagiarism_model = SentenceTransformer("all-MiniLM-L6-v2")

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SECRET_KEY = "gradeops-secret-key-change-in-production"
ALGORITHM = "HS256"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ─── MOCK DB (replace with real DB later) ────────────────────────────────────
# In production, use PostgreSQL with SQLAlchemy
USERS_DB = {
    "prof@iitg.ac.in": {
        "id": "u1",
        "name": "Prof. Sharma",
        "email": "prof@iitg.ac.in",
        "role": "instructor",
        # password: "password123"
        "hashed_password": bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()
    },
    "ta@iitg.ac.in": {
        "id": "u2",
        "name": "Rahul (TA)",
        "email": "ta@iitg.ac.in",
        "role": "ta",
        # password: "password123"
        "hashed_password": bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()
    }
}

EXAMS_DB = {}       # exam_id -> exam data
GRADES_DB = {}      # grade_id -> grade data

# ─── MODELS ──────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class GradeUpdate(BaseModel):
    action: str          # "approve" | "override"
    override_score: Optional[float] = None
    override_feedback: Optional[str] = None

class RubricItem(BaseModel):
    question_number: int
    max_marks: float
    criteria: str

# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({**data, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email not in USERS_DB:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = USERS_DB[email].copy()
        user.pop("hashed_password", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(roles: list):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker

# ─── MOCK AI GRADER (replace with real ML pipeline) ──────────────────────────
def mock_ai_grade(rubric: list, student_id: str, image_path: str = None):
    import json

    # STEP 1 - OCR: Read handwriting from image
    transcribed_text = ""
    if image_path and os.path.exists(image_path):
        if image_path.lower().endswith(".pdf"):
            import fitz
            pdf = fitz.open(image_path)
            page = pdf[0]
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("jpeg")
            image_data = base64.b64encode(img_bytes).decode("utf-8")
        else:
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")

        ocr_response = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                    },
                    {
                        "type": "text",
                        "text": "Transcribe all the handwritten text in this image exactly as written."
                    }
                ]
            }]
        )
        transcribed_text = ocr_response.choices[0].message.content

    # STEP 2 - Grade each rubric item
    grades = []
    for item in rubric:
        prompt = f"""
You are a strict but fair exam grader.

QUESTION {item['question_number']} RUBRIC:
Max marks: {item['max_marks']}
Criteria: {item['criteria']}

STUDENT ANSWER:
{transcribed_text if transcribed_text else "No answer provided"}

Respond ONLY in this exact JSON format, nothing else:
{{
  "awarded_marks": <number between 0 and {item['max_marks']}>,
  "justification": "<your reasoning>"
}}
"""
        grade_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(grade_response.choices[0].message.content)

        grades.append({
            "question_number": item["question_number"],
            "max_marks": item["max_marks"],
            "awarded_marks": result["awarded_marks"],
            "justification": result["justification"],
            "plagiarism_flag": False
        })

    total = sum(g["awarded_marks"] for g in grades)
    max_total = sum(g["max_marks"] for g in grades)
    return {
        "grades": grades,
        "total_score": total,
        "max_score": max_total,
        "percentage": round((total / max_total) * 100, 1) if max_total > 0 else 0,
        "transcribed_text": transcribed_text
    }
#PLAGIARISM CHECKER (optional, can be enhanced later)
def check_plagiarism(grade_entries: list, threshold=0.60):
    if len(grade_entries) < 2:
        return

    texts = []
    for g in grade_entries:
        transcribed = g["ai_result"].get("transcribed_text", "")
        if not transcribed:
            transcribed = " ".join([q["justification"] for q in g["ai_result"].get("grades", [])])
        texts.append(transcribed)

    ids = [g["student_id"] for g in grade_entries]

    embeddings = plagiarism_model.encode(texts)
    similarity_matrix = cosine_similarity(embeddings)

    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            similarity = float(similarity_matrix[i][j])
            if similarity >= threshold:
                grade_entries[i]["plagiarism_flagged"] = True
                grade_entries[i]["plagiarism_similarity"] = round(similarity, 2)
                grade_entries[i]["plagiarism_with"] = ids[j]
                grade_entries[j]["plagiarism_flagged"] = True
                grade_entries[j]["plagiarism_similarity"] = round(similarity, 2)
                grade_entries[j]["plagiarism_with"] = ids[i]
# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = USERS_DB.get(form_data.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(form_data.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user["email"], "role": user["role"]})
    safe_user = {k: v for k, v in user.items() if k != "hashed_password"}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@app.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

# ─── EXAM ROUTES ──────────────────────────────────────────────────────────────
@app.post("/exams/upload")
async def upload_exam(
    exam_title: str = Form(...),
    rubric_json: str = Form(...),
    files: List[UploadFile] = File(...),
    user=Depends(require_role(["instructor"]))
):
    try:
        rubric = json.loads(rubric_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid rubric JSON")

    exam_id = str(uuid.uuid4())[:8]
    exam_dir = os.path.join(UPLOAD_DIR, exam_id)
    os.makedirs(exam_dir, exist_ok=True)

    submissions = []
    for i, file in enumerate(files):
        student_id = f"STU{str(i+1).zfill(3)}"
        file_path = os.path.join(exam_dir, f"{student_id}_{file.filename}")
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        ai_result = mock_ai_grade(rubric, student_id, image_path=file_path)

        grade_id = str(uuid.uuid4())[:8]
        grade_entry = {
            "grade_id": grade_id,
            "exam_id": exam_id,
            "student_id": student_id,
            "file_path": file_path,
            "filename": file.filename,
            "ai_result": ai_result,
            "status": "pending",
            "reviewed_by": None,
            "reviewed_at": None,
            "final_score": ai_result["total_score"],
            "final_feedback": None,
            "created_at": datetime.utcnow().isoformat()
        }
        GRADES_DB[grade_id] = grade_entry
        submissions.append({"student_id": student_id, "grade_id": grade_id})

    # Run plagiarism check across all submissions
    all_grade_entries = [GRADES_DB[s["grade_id"]] for s in submissions]
    check_plagiarism(all_grade_entries, threshold=0.60)

    EXAMS_DB[exam_id] = {
        "exam_id": exam_id,
        "title": exam_title,
        "rubric": rubric,
        "uploaded_by": user["email"],
        "created_at": datetime.utcnow().isoformat(),
        "total_submissions": len(files),
        "submissions": submissions
    }

    return {"exam_id": exam_id, "message": f"Uploaded {len(files)} exams successfully", "submissions": submissions}

@app.get("/exams")
async def list_exams(user=Depends(get_current_user)):
    exams = list(EXAMS_DB.values())
    # Add stats
    for exam in exams:
        exam_grades = [g for g in GRADES_DB.values() if g["exam_id"] == exam["exam_id"]]
        exam["pending_count"] = sum(1 for g in exam_grades if g["status"] == "pending")
        exam["approved_count"] = sum(1 for g in exam_grades if g["status"] != "pending")
    return exams

@app.get("/exams/{exam_id}")
async def get_exam(exam_id: str, user=Depends(get_current_user)):
    exam = EXAMS_DB.get(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

# ─── GRADE ROUTES ─────────────────────────────────────────────────────────────
@app.get("/grades/exam/{exam_id}")
async def get_exam_grades(exam_id: str, user=Depends(get_current_user)):
    grades = [g for g in GRADES_DB.values() if g["exam_id"] == exam_id]
    return sorted(grades, key=lambda x: x["student_id"])

@app.get("/grades/{grade_id}")
async def get_grade(grade_id: str, user=Depends(get_current_user)):
    grade = GRADES_DB.get(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    return grade

@app.patch("/grades/{grade_id}")
async def update_grade(
    grade_id: str,
    update: GradeUpdate,
    user=Depends(require_role(["ta", "instructor"]))
):
    grade = GRADES_DB.get(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    if update.action == "approve":
        grade["status"] = "approved"
        grade["final_score"] = grade["ai_result"]["total_score"]
    elif update.action == "override":
        grade["status"] = "overridden"
        grade["final_score"] = update.override_score
        grade["final_feedback"] = update.override_feedback

    grade["reviewed_by"] = user["name"]
    grade["reviewed_at"] = datetime.utcnow().isoformat()
    GRADES_DB[grade_id] = grade
    return grade

@app.get("/grades/exam/{exam_id}/stats")
async def get_exam_stats(exam_id: str, user=Depends(get_current_user)):
    grades = [g for g in GRADES_DB.values() if g["exam_id"] == exam_id]
    if not grades:
        return {}
    scores = [g["final_score"] for g in grades]
    return {
        "total": len(grades),
        "pending": sum(1 for g in grades if g["status"] == "pending"),
        "approved": sum(1 for g in grades if g["status"] == "approved"),
        "overridden": sum(1 for g in grades if g["status"] == "overridden"),
        "avg_score": round(sum(scores) / len(scores), 2),
        "max_score": max(scores),
        "min_score": min(scores),
        "plagiarism_flags": sum(
    1 for g in grades
    if g.get("plagiarism_flagged")
)
    }

# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "GradeOps API running", "version": "1.0.0"}
