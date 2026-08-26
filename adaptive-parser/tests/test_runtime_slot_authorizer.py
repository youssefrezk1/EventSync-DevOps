import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_normalizer import LogNormalizer
from app.runtime_slot_authorizer import (
    RuntimeSlotAuthorizer,
)


normalizer = LogNormalizer()
authorizer = RuntimeSlotAuthorizer()


cases = {
    "embedded_identifier": [
        "Session abc123 expired",
        "Session def456 expired",
        "Session ghi789 expired",
    ],

    "queue_cross_structure": [
        "queue orders depth=101",
        "queue payments depth=205",
        "queue notifications depth=991",

        "queue orders processing delay=81ms",
        "queue payments processing delay=35ms",
        "queue notifications processing delay=54ms",
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
}


expected = {
    "embedded_identifier": {1},
    "queue_cross_structure": {1},
    "semantic_state": set(),
    "semantic_action": set(),
    "runtime_plus_semantic": {1},
}


print("===== COMBINED RUNTIME SLOT AUTHORIZATION =====")


for name, messages in cases.items():
    normalized = [
        normalizer.normalize(message)
        for message in messages
    ]

    slots = authorizer.analyze(
        normalized
    )

    authorized = (
        authorizer.authorized_positions(
            normalized
        )
    )

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
    print("AUTHORIZED:")
    print(sorted(authorized))

    assert authorized == expected[name], (
        f"{name}: expected "
        f"{sorted(expected[name])}, "
        f"got {sorted(authorized)}"
    )


print()
print("=" * 80)
print(
    "RUNTIME SLOT AUTHORIZER TEST PASSED"
)
