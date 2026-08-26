import sys
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_distances

from app.log_normalizer import LogNormalizer


messages = [
    "Session abc123 expired for user alice",
    "Session def456 expired for user bob",
    "Session ghi789 expired for user charlie",
]

normalizer = LogNormalizer()

normalized = [
    normalizer.normalize(message)
    for message in messages
]

tokenized = [
    message.split()
    for message in normalized
]


print("===== NORMALIZED =====")

for index, message in enumerate(normalized):
    print(f"{index}: {message}")


print()
print("===== TOKEN POSITIONS =====")

maximum_length = max(
    len(tokens)
    for tokens in tokenized
)

variable_positions = []

for position in range(maximum_length):
    values = [
        tokens[position]
        for tokens in tokenized
        if position < len(tokens)
    ]

    counts = Counter(values)

    print()
    print(f"POSITION {position}:")
    print(values)
    print("UNIQUE:")
    print(len(counts))

    if (
        len(values) == len(tokenized)
        and len(counts) > 1
    ):
        variable_positions.append(
            position
        )


print()
print("===== DISCOVERED VARIABLE POSITIONS =====")
print(variable_positions)


masked = []

for tokens in tokenized:
    output = []

    for position, token in enumerate(tokens):
        if position in variable_positions:
            output.append("<VAR>")
        else:
            output.append(token)

    masked.append(
        " ".join(output)
    )


print()
print("===== MASKED REPRESENTATION =====")

for index, message in enumerate(masked):
    print(f"{index}: {message}")


def analyze(label, corpus):
    print()
    print("=" * 80)
    print(label)

    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        lowercase=True,
    )

    matrix = vectorizer.fit_transform(
        corpus
    )

    distances = cosine_distances(
        matrix
    )

    print()
    print("PAIRWISE DISTANCES:")

    for i in range(len(corpus)):
        for j in range(i + 1, len(corpus)):
            print(
                f"{i} <-> {j}: "
                f"{distances[i][j]:.3f}"
            )

    labels = DBSCAN(
        eps=0.50,
        min_samples=2,
        metric="cosine",
    ).fit_predict(
        matrix
    )

    print()
    print("DBSCAN:")
    print(labels.tolist())


analyze(
    "ORIGINAL NORMALIZED",
    normalized,
)

analyze(
    "VARIABLE-SLOT MASKED",
    masked,
)
