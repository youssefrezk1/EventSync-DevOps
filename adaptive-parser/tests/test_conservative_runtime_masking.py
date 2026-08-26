import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_distances

from app.log_normalizer import LogNormalizer


normalizer = LogNormalizer()


def looks_like_runtime_identifier(token):
    """
    Experimental conservative rule.

    A token is considered identifier-like when it contains both
    alphabetic and numeric characters.

    Existing normalized placeholders are preserved separately.

    This diagnostic deliberately does NOT classify ordinary words
    as runtime values.
    """

    # A complete normalized placeholder is already runtime data.
    # Do not replace it again.
    if (
        token.startswith("<")
        and token.endswith(">")
    ):
        return False

    # LogNormalizer may normalize only the numeric portion of an
    # identifier:
    #
    #     abc123  -> abc<NUM>
    #     TX-991  -> TX-<NUM>
    #
    # Such tokens still contain static identifier material plus a
    # runtime placeholder and should be treated as opaque runtime
    # identifiers for clustering.
    if "<NUM>" in token:
        remaining = token.replace(
            "<NUM>",
            "",
        )

        if any(
            character.isalpha()
            for character in remaining
        ):
            return True

    has_letter = any(
        character.isalpha()
        for character in token
    )

    has_digit = any(
        character.isdigit()
        for character in token
    )

    return has_letter and has_digit


def mask_runtime_identifiers(message):
    output = []

    for token in message.split():
        if looks_like_runtime_identifier(token):
            output.append("<VAR>")
        else:
            output.append(token)

    return " ".join(output)


def analyze(name, messages):
    normalized = [
        normalizer.normalize(message)
        for message in messages
    ]

    masked = [
        mask_runtime_identifiers(message)
        for message in normalized
    ]

    print()
    print("=" * 80)
    print(name)

    print()
    print("NORMALIZED:")

    for message in normalized:
        print(message)

    print()
    print("CONSERVATIVE MASKING:")

    for message in masked:
        print(message)

    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        lowercase=True,
    )

    matrix = vectorizer.fit_transform(
        masked
    )

    distances = cosine_distances(
        matrix
    )

    print()
    print("PAIRWISE DISTANCES:")

    for i in range(len(masked)):
        for j in range(i + 1, len(masked)):
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

    return masked, labels.tolist()


session = [
    "Session abc123 expired for user alice",
    "Session def456 expired for user bob",
    "Session ghi789 expired for user charlie",
]

semantic_state = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",
]

semantic_action = [
    "worker task started successfully",
    "worker task completed successfully",
    "worker task cancelled successfully",
]

runtime_plus_semantic = [
    "job alpha1 started",
    "job beta2 completed",
    "job gamma3 failed",
]


session_masked, session_labels = analyze(
    "SESSION",
    session,
)

state_masked, state_labels = analyze(
    "SEMANTIC STATE",
    semantic_state,
)

action_masked, action_labels = analyze(
    "SEMANTIC ACTION",
    semantic_action,
)

mixed_masked, mixed_labels = analyze(
    "RUNTIME + SEMANTIC",
    runtime_plus_semantic,
)


print()
print("=" * 80)
print("===== SAFETY ASSERTIONS =====")


assert session_masked == [
    "Session <VAR> expired for user alice",
    "Session <VAR> expired for user bob",
    "Session <VAR> expired for user charlie",
]

assert len(set(session_labels)) == 1
assert session_labels[0] != -1


assert state_masked == semantic_state

assert action_masked == semantic_action


assert mixed_masked == [
    "job <VAR> started",
    "job <VAR> completed",
    "job <VAR> failed",
]


print(
    "IDENTIFIER-LIKE RUNTIME VALUES MASKED"
)

print(
    "ORDINARY SEMANTIC WORDS PRESERVED"
)

print(
    "CONSERVATIVE RUNTIME MASKING TEST PASSED"
)
