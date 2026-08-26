import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_normalizer import LogNormalizer
from app.runtime_slot_discoverer import (
    RuntimeSlotDiscoverer,
)


normalizer = LogNormalizer()
discoverer = RuntimeSlotDiscoverer()


# ---------------------------------------------------------
# Case 1:
# Runtime values in ordinary plain text.
# No application-specific vocabulary is supplied to the
# discoverer.
# ---------------------------------------------------------

session_messages = [
    "Session abc123 expired for user alice",
    "Session def456 expired for user bob",
    "Session ghi789 expired for user charlie",
]

session_normalized = [
    normalizer.normalize(message)
    for message in session_messages
]

session_positions = discoverer.discover(
    session_normalized
)

session_masked = discoverer.mask(
    session_normalized,
    session_positions,
)


print("===== SESSION FAMILY =====")

for message in session_normalized:
    print(message)

print()
print("POSITIONS:")
print(sorted(session_positions))

print()
print("MASKED:")

for message in session_masked:
    print(message)


assert session_positions == {1, 5}

assert session_masked == [
    "Session <VAR> expired for user <VAR>",
    "Session <VAR> expired for user <VAR>",
    "Session <VAR> expired for user <VAR>",
]


# ---------------------------------------------------------
# Case 2:
# Unicode values must behave exactly like ASCII values.
# ---------------------------------------------------------

arabic_messages = [
    "مستخدم أحمد فشل تسجيل الدخول",
    "مستخدم محمد فشل تسجيل الدخول",
    "مستخدم سارة فشل تسجيل الدخول",
]

arabic_positions = discoverer.discover(
    arabic_messages
)

arabic_masked = discoverer.mask(
    arabic_messages,
    arabic_positions,
)


print()
print("===== UNICODE FAMILY =====")

for message in arabic_messages:
    print(message)

print()
print("POSITIONS:")
print(sorted(arabic_positions))

print()
print("MASKED:")

for message in arabic_masked:
    print(message)


assert 1 in arabic_positions

assert arabic_masked == [
    "مستخدم <VAR> فشل تسجيل الدخول",
    "مستخدم <VAR> فشل تسجيل الدخول",
    "مستخدم <VAR> فشل تسجيل الدخول",
]


# ---------------------------------------------------------
# Case 3:
# A single message provides insufficient evidence for
# runtime-slot discovery.
# ---------------------------------------------------------

single = [
    "Session abc123 expired for user alice"
]

assert discoverer.discover(single) == set()

assert discoverer.mask(single) == single


print()
print(
    "RUNTIME SLOT DISCOVERER TEST PASSED"
)
