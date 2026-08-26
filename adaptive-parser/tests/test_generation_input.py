import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.generation_input import GenerationInput
from app.learning_candidate_builder import (
    LearningCandidateBuilder,
)


builder = LearningCandidateBuilder()


# =========================================================
# CASE 1
# Ordinary normalized runtime values.
# =========================================================

request_messages = [
    (
        "2026-08-25T16:00:01Z ERROR "
        "request req-101 failed user=41 "
        "ip=10.0.0.5 latency=81ms"
    ),
    (
        "2026-08-25T16:00:04Z ERROR "
        "request req-205 failed user=72 "
        "ip=10.0.0.8 latency=35ms"
    ),
    (
        "2026-08-25T16:00:09Z ERROR "
        "request req-991 failed user=19 "
        "ip=10.0.0.11 latency=54ms"
    ),
]

candidate = builder.build(
    request_messages
)

assert candidate is not None

generation_input = GenerationInput.from_candidate(
    candidate
)

print("===== REQUEST GENERATION INPUT =====")

for message in generation_input.learning_messages:
    print(message)

print("RUNTIME POSITIONS:")
print(sorted(generation_input.runtime_positions))


assert generation_input.learning_messages == (
    (
        "request req-<NUM> failed "
        "user=<NUM> ip=<IP> latency=<NUM>ms"
    ),
    (
        "request req-<NUM> failed "
        "user=<NUM> ip=<IP> latency=<NUM>ms"
    ),
    (
        "request req-<NUM> failed "
        "user=<NUM> ip=<IP> latency=<NUM>ms"
    ),
)

# Critical boundary assertion:
#
# The provider-facing representation must not contain values
# that existed only in the original raw logs.
joined = "\n".join(
    generation_input.learning_messages
)

for sensitive_runtime_value in (
    "req-101",
    "req-205",
    "req-991",
    "10.0.0.5",
    "10.0.0.8",
    "10.0.0.11",
):
    assert sensitive_runtime_value not in joined


# =========================================================
# CASE 2
# Structurally authorized lexical runtime dimension.
# =========================================================

queue_cluster = [
    "queue orders depth=101",
    "queue payments depth=205",
    "queue notifications depth=991",
]

queue_population = [
    *queue_cluster,

    "queue orders processing delay=81ms",
    "queue payments processing delay=35ms",
    "queue notifications processing delay=54ms",
]

candidate = builder.build(
    queue_cluster,
    evidence_messages=queue_population,
)

assert candidate is not None

generation_input = GenerationInput.from_candidate(
    candidate
)

print()
print("===== QUEUE GENERATION INPUT =====")

for message in generation_input.learning_messages:
    print(message)

print("RUNTIME POSITIONS:")
print(sorted(generation_input.runtime_positions))


assert generation_input.learning_messages == (
    "queue <VAR> depth=<NUM>",
    "queue <VAR> depth=<NUM>",
    "queue <VAR> depth=<NUM>",
)

assert generation_input.runtime_positions == frozenset(
    {1}
)

joined = "\n".join(
    generation_input.learning_messages
)

for runtime_value in (
    "orders",
    "payments",
    "notifications",
):
    assert runtime_value not in joined


# =========================================================
# CASE 3
# Unsafe semantic variation never obtains a generation input.
# =========================================================

unsafe_messages = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",
]

candidate = builder.build(
    unsafe_messages
)

print()
print("===== UNSAFE CANDIDATE =====")
print(candidate)

assert candidate is None


print()
print("=" * 80)
print("GENERATION INPUT BOUNDARY TEST PASSED")
