from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load free local model (downloads once, ~90MB)
model = SentenceTransformer("all-MiniLM-L6-v2")

def check_plagiarism(answers: dict, threshold=0.85):
    """
    answers = {"student_name": "their answer text"}
    threshold = how similar before flagging (0.85 = 85% similar)
    """
    names = list(answers.keys())
    texts = list(answers.values())

    # Convert all answers to embeddings
    embeddings = model.encode(texts)

    # Compare every pair
    similarity_matrix = cosine_similarity(embeddings)

    flagged = []
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            similarity = similarity_matrix[i][j]
            if similarity >= threshold:
                flagged.append({
                    "student1": names[i],
                    "student2": names[j],
                    "similarity": round(float(similarity), 2),
                    "verdict": "FLAGGED"
                })

    return flagged


# Test it
answers = {
    "Alice": "Newton's second law states that force equals mass times acceleration F=ma",
    "Bob":   "According to Newton's second law, force is mass multiplied by acceleration F=ma",
    "Charlie": "Photosynthesis is the process by which plants make food using sunlight"
}

results = check_plagiarism(answers)

if results:
    print("FLAGGED PAIRS:")
    for r in results:
        print(r)
else:
    print("No plagiarism detected")