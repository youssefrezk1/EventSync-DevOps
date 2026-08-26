import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.runtime_slot_discoverer import (
    RuntimeSlotDiscoverer,
)


discoverer = RuntimeSlotDiscoverer()


cases = {
    # ---------------------------------------------------------
    # GOOD:
    # These really are runtime-value positions.
    # ---------------------------------------------------------
    "runtime_identity": [
        "Session abc123 expired for user alice",
        "Session def456 expired for user bob",
        "Session ghi789 expired for user charlie",
    ],

    "runtime_unicode": [
        "مستخدم أحمد فشل تسجيل الدخول",
        "مستخدم محمد فشل تسجيل الدخول",
        "مستخدم سارة فشل تسجيل الدخول",
    ],

    # ---------------------------------------------------------
    # DANGEROUS:
    # These are semantic/event-state differences.
    # A portable system must not blindly assume that every
    # varying token surrounded by stable context is runtime data.
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # MIXED:
    # Position 1 looks like a runtime identity.
    # Position 2 represents semantic state.
    # ---------------------------------------------------------
    "runtime_plus_semantic": [
        "job alpha started",
        "job beta completed",
        "job gamma failed",
    ],

    # ---------------------------------------------------------
    # DIFFERENT LENGTHS:
    # We must remain conservative when structure varies.
    # ---------------------------------------------------------
    "different_lengths": [
        "connection failed host alpha",
        "connection failed host beta retry scheduled",
        "connection failed host gamma after timeout",
    ],
}


print("===== RUNTIME SLOT ADVERSARIAL TEST =====")


for name, messages in cases.items():
    print()
    print("=" * 80)
    print(name.upper())

    positions = discoverer.discover(
        messages
    )

    masked = discoverer.mask(
        messages,
        positions,
    )

    print()
    print("INPUT:")

    for message in messages:
        print(message)

    print()
    print("DISCOVERED POSITIONS:")
    print(sorted(positions))

    print()
    print("MASKED:")

    for message in masked:
        print(message)


print()
print("=" * 80)
print("===== OBSERVATIONS =====")

semantic_state = discoverer.discover(
    cases["semantic_state"]
)

semantic_action = discoverer.discover(
    cases["semantic_action"]
)

runtime_plus_semantic = discoverer.discover(
    cases["runtime_plus_semantic"]
)

print(
    "semantic_state:",
    sorted(semantic_state),
)

print(
    "semantic_action:",
    sorted(semantic_action),
)

print(
    "runtime_plus_semantic:",
    sorted(runtime_plus_semantic),
)

print()
print(
    "This diagnostic intentionally has no assertions "
    "for semantic cases yet."
)

print(
    "We first want to observe exactly where the current "
    "algorithm over-generalizes."
)

print()
print(
    "RUNTIME SLOT ADVERSARIAL DIAGNOSTIC COMPLETED"
)
