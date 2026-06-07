from groq import Groq
from dotenv import load_dotenv
import os
import base64

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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

# Test it
result = read_handwriting("textsample.jpg")
print(result)