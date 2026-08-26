import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_distances

from app.log_normalizer import LogNormalizer


messages = [
    "2026-08-24T16:00:01Z WARN queue orders depth=101",
    "2026-08-24T16:00:04Z WARN queue payments depth=205",
    "2026-08-24T16:00:09Z WARN queue notifications depth=991",
]

normalizer = LogNormalizer()

normalized_messages = [
    normalizer.normalize(message)
    for message in messages
]


def calculate(messages_to_compare):
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        lowercase=True,
    )

    matrix = vectorizer.fit_transform(
        messages_to_compare
    )

    distances = cosine_distances(matrix)

    labels = DBSCAN(
        eps=0.60,
        min_samples=2,
        metric="cosine",
    ).fit_predict(matrix)

    return distances, labels


raw_distances, raw_labels = calculate(messages)
normalized_distances, normalized_labels = calculate(
    normalized_messages
)

print("===== NORMALIZED MESSAGES =====")

for message in normalized_messages:
    print(message)

print()
print("===== RAW DISTANCES =====")

for i in range(len(messages)):
    for j in range(i + 1, len(messages)):
        print(
            f"{i} <-> {j}: "
            f"{raw_distances[i][j]:.3f}"
        )

print("RAW LABELS:", raw_labels.tolist())

print()
print("===== NORMALIZED DISTANCES =====")

for i in range(len(messages)):
    for j in range(i + 1, len(messages)):
        print(
            f"{i} <-> {j}: "
            f"{normalized_distances[i][j]:.3f}"
        )

print(
    "NORMALIZED LABELS:",
    normalized_labels.tolist(),
)
