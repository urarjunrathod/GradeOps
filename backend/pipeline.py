from groq import Groq
from dotenv import load_dotenv
import os
import json
import base64

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# STEP 1 - OCR: Read handwriting from image
def read_handwriting(image_path):
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
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
    return response.choices[0].message.content


# STEP 2 - GRADER: Grade the transcribed text
def grade_answer(student_answer, rubric):
    prompt = f"""
You are a strict but fair exam grader.

RUBRIC:
{rubric}

STUDENT ANSWER:
{student_answer}

Grade this answer based on the rubric. Respond ONLY in this exact JSON format, nothing else:
{{
  "score": <number>,
  "max_score": <number>,
  "justification": "<your reasoning here>"
}}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(response.choices[0].message.content)


# STEP 3 - PIPELINE: Connect both steps
def run_pipeline(image_path, rubric):
    print("Step 1: Reading handwriting...")
    transcribed = read_handwriting(image_path)
    print(f"Transcribed text: {transcribed}\n")

    print("Step 2: Grading answer...")
    result = grade_answer(transcribed, rubric)
    print(f"Grade: {result}\n")

    return {
        "transcribed_answer": transcribed,
        "score": result["score"],
        "max_score": result["max_score"],
        "justification": result["justification"]
    }


# Test the full pipeline
rubric = """
Max score: 10
- Mentions Newton's second law (3 points)
- States F = ma (3 points)
- Defines F as force, m as mass, a as acceleration (4 points)
"""

final_result = run_pipeline("textsample.jpg", rubric)
print("FINAL RESULT:")
print(json.dumps(final_result, indent=2))