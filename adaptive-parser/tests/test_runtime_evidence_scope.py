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


def normalize(messages):
    return [
        normalizer.normalize(message)
        for message in messages
    ]


queue_depth = normalize([
    "queue orders depth=101",
    "queue payments depth=205",
    "queue notifications depth=991",
])

queue_population = normalize([
    "queue orders depth=101",
    "queue payments depth=205",
    "queue notifications depth=991",

    "queue orders processing delay=81ms",
    "queue payments processing delay=35ms",
    "queue notifications processing delay=54ms",
])


print("===== LOCAL EVIDENCE ONLY =====")

local_positions = (
    authorizer.authorized_positions(
        queue_depth
    )
)

print(sorted(local_positions))

assert local_positions == set()


print()
print("===== BROADER STRUCTURAL EVIDENCE =====")

context_positions = (
    authorizer.authorized_positions(
        queue_depth,
        evidence_messages=queue_population,
    )
)

print(sorted(context_positions))

assert context_positions == {1}


semantic_state = normalize([
    "database connection failed",
    "database connection restored",
    "database connection delayed",
])


print()
print("===== SEMANTIC VARIATION =====")

semantic_positions = (
    authorizer.authorized_positions(
        semantic_state
    )
)

print(sorted(semantic_positions))

assert semantic_positions == set()


print()
print(
    "RUNTIME EVIDENCE SCOPE TEST PASSED"
)
