from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    
    result = response.choices[0].message.content
    return json.loads(result)


# Test it
rubric = """
Max score: 10
- Mentions Newton's second law (3 points)
- States F = ma (3 points)  
- Defines F as force, m as mass, a as acceleration (4 points)
"""

student_answer = "Newton's second law says force equals mass times acceleration, F=ma"

result = grade_answer(student_answer, rubric)
print(result)