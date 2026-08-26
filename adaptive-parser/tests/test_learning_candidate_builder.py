import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.learning_candidate_builder import (
    LearningCandidateBuilder,
)


builder = LearningCandidateBuilder()


print("===== SAFE NORMALIZED FAMILY =====")

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

request_candidate = builder.build(
    request_messages
)

assert request_candidate is not None

print("RAW:")
for message in request_candidate.raw_messages:
    print(message)

print()
print("LEARNING:")
for message in request_candidate.learning_messages:
    print(message)


print()
print("===== CROSS-STRUCTURE FAMILY =====")

queue_candidate_messages = [
    "queue orders depth=101",
    "queue payments depth=205",
    "queue notifications depth=991",
]

queue_evidence = [
    *queue_candidate_messages,
    "queue orders processing delay=81ms",
    "queue payments processing delay=35ms",
    "queue notifications processing delay=54ms",
]

queue_candidate = builder.build(
    queue_candidate_messages,
    evidence_messages=queue_evidence,
)

assert queue_candidate is not None

assert queue_candidate.runtime_positions == {
    1
}

assert queue_candidate.learning_messages == [
    "queue <VAR> depth=<NUM>",
    "queue <VAR> depth=<NUM>",
    "queue <VAR> depth=<NUM>",
]

print("RAW:")
for message in queue_candidate.raw_messages:
    print(message)

print()
print("LEARNING:")
for message in queue_candidate.learning_messages:
    print(message)


print()
print("===== UNSAFE SEMANTIC FAMILY =====")

unsafe_messages = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",
]

unsafe_candidate = builder.build(
    unsafe_messages
)

print(unsafe_candidate)

assert unsafe_candidate is None


print()
print("===== MIXED RUNTIME + SEMANTIC =====")

mixed_messages = [
    "job alpha1 started",
    "job beta2 completed",
    "job gamma3 failed",
]

mixed_candidate = builder.build(
    mixed_messages
)

print(mixed_candidate)

assert mixed_candidate is None


print()
print(
    "LEARNING CANDIDATE BUILDER TEST PASSED"
)
