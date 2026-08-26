import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.cross_structure_evidence import (
    CrossStructureRuntimeEvidence,
)
from app.log_normalizer import LogNormalizer


normalizer = LogNormalizer()
evidence = CrossStructureRuntimeEvidence()


queue_messages = [
    "queue orders depth=101",
    "queue payments depth=205",
    "queue notifications depth=991",

    "queue orders processing delay=81ms",
    "queue payments processing delay=35ms",
    "queue notifications processing delay=54ms",
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


def normalize(messages):
    return [
        normalizer.normalize(message)
        for message in messages
    ]


queue_normalized = normalize(
    queue_messages
)

state_normalized = normalize(
    semantic_state
)

action_normalized = normalize(
    semantic_action
)


print("===== QUEUE CROSS-STRUCTURE EVIDENCE =====")

for message in queue_normalized:
    print(message)

queue_positions = evidence.discover(
    queue_normalized
)

print()
print("AUTHORIZED:")
print(sorted(queue_positions))


print()
print("===== SEMANTIC STATE =====")

for message in state_normalized:
    print(message)

state_positions = evidence.discover(
    state_normalized
)

print()
print("AUTHORIZED:")
print(sorted(state_positions))


print()
print("===== SEMANTIC ACTION =====")

for message in action_normalized:
    print(message)

action_positions = evidence.discover(
    action_normalized
)

print()
print("AUTHORIZED:")
print(sorted(action_positions))


assert queue_positions == {1}
assert state_positions == set()
assert action_positions == set()


print()
print(
    "CROSS-STRUCTURE RUNTIME EVIDENCE TEST PASSED"
)
