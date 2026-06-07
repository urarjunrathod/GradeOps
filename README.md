# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Memo.png" width="35px"> GradeOps

> **"Transforming the chaos of handwritten exam grading into a fast, fair, and intelligent pipeline."**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_4-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
[![LangChain](https://img.shields.io/badge/LangChain-Agentic-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://langchain.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)]()

---

[🚀 Features](#-key-features) • [🧬 How it Works](#-how-it-works) • [🛠 Setup](#-installation--setup) • [📁 Project Structure](#-project-structure) • [🖼 Screenshots](#-screenshots) • [👥 Team](#-team)

---

## 🧭 The Problem

Grading handwritten exams is **time-consuming**, **inconsistent**, and prone to **fatigue-induced bias**. A single professor may grade hundreds of papers in one sitting — leading to unfair, rushed evaluations.

**GradeOps** solves this by introducing a Human-in-the-Loop (HITL) AI grading pipeline that:
- Reads handwritten answers using Vision-Language Models (VLMs)
- Grades them against strict rubrics using Agentic LLMs
- Pushes results to a high-speed dashboard for Teaching Assistants (TAs) to review, approve, or override

---

## 🚀 Key Features

### 👁️ Vision-Based OCR
Upload scanned exam PDFs and let LLaMA 4 Scout Vision extract even the messiest handwritten answers — no preprocessing required.

### 🤖 Agentic LLM Grading
Each answer is graded against a professor-defined rubric. The AI awards partial credit and generates a structured textual justification for every mark given.

### 🔍 Plagiarism Detection
Using SentenceTransformer embeddings and cosine similarity, GradeOps flags student pairs whose answers are suspiciously similar — automatically.

### ⚡ High-Speed TA Dashboard
TAs review the original scanned answer side-by-side with the AI grade. Approve or override decisions in seconds — massive time savings, full human control.

### 🔐 Role-Based Access Control
Separate logins for **Instructors** (upload exams, define rubrics) and **TAs** (review and approve grades).

---

## 🧬 How it Works

```
📄 PDF Upload
     │
     ▼
🔍 LLaMA 4 Scout Vision (OCR)
     │  Extracts handwritten text from scanned pages
     ▼
🤖 LLaMA 3.3 70B (Grader Agent)
     │  Scores each question against the rubric
     │  Generates justification for awarded marks
     ▼
📊 FastAPI Backend
     │  Stores grades, manages users and exams
     ▼
⚡ React Dashboard
     │  TAs review AI grades side-by-side with scans
     ▼
✅ Approved / Overridden Grade
     │
     ▼
🔍 SentenceTransformers (Plagiarism Check)
     Flags suspicious answer pairs by semantic similarity
```

---

## 🏗 Architecture

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React + Vite | TA/Instructor dashboard UI |
| **Backend** | FastAPI (Python) | API endpoints, auth, file handling |
| **OCR** | LLaMA 4 Scout Vision (Groq) | Handwriting extraction from PDFs |
| **Grader** | LLaMA 3.3 70B (Groq) | Rubric-based answer scoring |
| **Plagiarism** | SentenceTransformers (`all-MiniLM-L6-v2`) | Semantic similarity detection |
| **Auth** | JWT + bcrypt | Secure role-based access control |
| **Storage** | Local filesystem + in-memory DB | Exam files and grade records |

---

## 📁 Project Structure

```
gradeops/
├── backend/
│   ├── main.py              # FastAPI app — all routes and AI pipeline
│   ├── requirements.txt     # Python dependencies
│   └── uploads/             # Uploaded exam PDFs stored here
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── ReviewPage.jsx
│   │   │   └── ExamDetailPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .env                     # API keys (never commit this)
└── README.md
```

---

## 🛠 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Groq API Key](https://console.groq.com)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/gradeops.git
cd gradeops
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt
pip install groq python-dotenv pymupdf sentence-transformers
```

---

### Step 3 — Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key at [console.groq.com](https://console.groq.com).

---

### Step 4 — Start the Backend

```bash
# Make sure you're inside the backend/ folder
uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`

---

### Step 5 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### Step 6 — Login and Test

Open `http://localhost:5173` in your browser.

| Role | Email | Password |
|---|---|---|
| Instructor | `prof@iitg.ac.in` | `password123` |
| Teaching Assistant | `ta@iitg.ac.in` | `password123` |

---

## 🔌 API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/auth/login` | All | Login and get JWT token |
| `GET` | `/auth/me` | All | Get current user info |
| `POST` | `/exams/upload` | Instructor | Upload exam PDFs + rubric |
| `GET` | `/exams` | All | List all exams |
| `GET` | `/grades/exam/{id}` | All | Get all grades for an exam |
| `PATCH` | `/grades/{id}` | TA/Instructor | Approve or override a grade |
| `GET` | `/grades/exam/{id}/stats` | All | Get exam statistics |

---

## 🤖 AI Models Used

| Task | Model | Provider |
|---|---|---|
| Handwriting OCR | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq |
| Answer Grading | `llama-3.3-70b-versatile` | Groq |
| Plagiarism Detection | `all-MiniLM-L6-v2` | HuggingFace (local) |

---

## ⚠️ Known Limitations

- In-memory database resets when the server restarts (no persistent storage yet)
- OCR accuracy depends on handwriting legibility
- Groq free tier has rate limits — avoid uploading 20+ papers at once
- Plagiarism detection works best for text-heavy answers, not diagrams/equations

---

## 🔮 Future Improvements

- PostgreSQL integration for persistent storage
- Async processing with background task queues
- Support for multi-page PDFs (currently processes page 1 only)
- Export grades to CSV/Excel
- Email notifications to students
- Fine-tuned grading model for domain-specific subjects

---

## 👥 Team

Built as part of a college project submission.

| Role | Contribution |
|---|---|
| AI/ML Engineer | OCR pipeline, LLM grading agent, plagiarism detection |
| Web Developer | React frontend, FastAPI backend, authentication |

---

## 📄 License

This project is licensed under the MIT License.

---

*"Grading shouldn't take longer than learning."*
**— The GradeOps Team**
