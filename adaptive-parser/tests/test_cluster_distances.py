import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_distances


messages = [
    "Database postgres connection failed",
    "Database mysql connection failed",
    "Database mongodb connection failed",

    "Payment TX-100 failed user=41 latency=81ms",
    "Payment TX-200 failed user=72 latency=35ms",
    "Payment TX-300 failed user=19 latency=54ms",

    "Queue orders contains 841 messages",
]

vectorizer = TfidfVectorizer(
    analyzer="char_wb",
    ngram_range=(3, 5),
    lowercase=True,
)

matrix = vectorizer.fit_transform(messages)

distances = cosine_distances(matrix)

print("===== MESSAGE NUMBERS =====")

for i, message in enumerate(messages):
    print(f"{i}: {message}")

print()
print("===== PAIRWISE COSINE DISTANCES =====")

for i in range(len(messages)):
    for j in range(i + 1, len(messages)):
        print(
            f"{i} <-> {j}: "
            f"{distances[i][j]:.3f}"
        )
