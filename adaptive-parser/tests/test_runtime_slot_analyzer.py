import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_normalizer import LogNormalizer
from app.runtime_slot_analyzer import RuntimeSlotAnalyzer


normalizer = LogNormalizer()
analyzer = RuntimeSlotAnalyzer()


cases = {
    "embedded_identifier": [
        "Session abc123 expired",
        "Session def456 expired",
        "Session ghi789 expired",
    ],

    "semantic_state": [
        "database connection failed",
        "database connection restored",
        "database connection delayed",
    ],

    "semantic_action": [
        "worker task started successfully",
        "worker task completed successfully",
        "worker task cancelled successfully",
    ],

    "runtime_plus_semantic": [
        "job alpha1 started",
        "job beta2 completed",
        "job gamma3 failed",
    ],

    "queue_names": [
        "queue orders depth=101",
        "queue payments depth=205",
        "queue notifications depth=991",
    ],
}


results = {}

print("===== RUNTIME SLOT EVIDENCE =====")

for name, messages in cases.items():
    normalized = [
        normalizer.normalize(message)
        for message in messages
    ]

    slots = analyzer.analyze(
        normalized
    )

    results[name] = {
        "normalized": normalized,
        "slots": slots,
        "authorized": (
            analyzer.authorized_positions(
                normalized
            )
        ),
    }

    print()
    print("=" * 80)
    print(name.upper())

    print()
    print("NORMALIZED:")

    for message in normalized:
        print(message)

    print()
    print("SLOT ANALYSIS:")

    for slot in slots:
        print(slot)

    print()
    print("AUTHORIZED POSITIONS:")
    print(
        sorted(
            results[name]["authorized"]
        )
    )


print()
print("=" * 80)
print("===== ASSERTIONS =====")

assert (
    results["embedded_identifier"]["authorized"]
    == {1}
)

assert (
    results["semantic_state"]["authorized"]
    == set()
)

assert (
    results["semantic_action"]["authorized"]
    == set()
)

assert (
    results["runtime_plus_semantic"]["authorized"]
    == {1}
)

# Queue names vary lexically, so this conservative first pass
# must NOT authorize them merely because they differ.
assert (
    results["queue_names"]["authorized"]
    == set()
)

print(
    "STRONG RUNTIME EVIDENCE AUTHORIZED"
)

print(
    "LEXICAL VARIATION ALONE NOT AUTHORIZED"
)

print(
    "RUNTIME SLOT ANALYZER TEST PASSED"
)
