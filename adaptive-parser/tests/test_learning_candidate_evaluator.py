import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.learning_candidate_evaluator import (
    LearningCandidateEvaluator,
)


evaluator = LearningCandidateEvaluator()


cases = {
    "request_failure": {
        "messages": [
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
        ],
        "expected": True,
    },

    "semantic_state": {
        "messages": [
            "database connection failed",
            "database connection restored",
            "database connection delayed",
        ],
        "expected": False,
    },

    "semantic_action": {
        "messages": [
            "worker task started successfully",
            "worker task completed successfully",
            "worker task cancelled successfully",
        ],
        "expected": False,
    },

    "runtime_plus_semantic": {
        "messages": [
            "job alpha1 started",
            "job beta2 completed",
            "job gamma3 failed",
        ],
        "expected": False,
    },
}


print("===== LEARNING CANDIDATE EVALUATOR =====")

for name, case in cases.items():
    result = evaluator.evaluate(
        case["messages"]
    )

    print()
    print("=" * 80)
    print(name.upper())

    print()
    print("SAFE:")
    print(result["safe"])

    print("REASON:")
    print(result["reason"])

    print("RUNTIME POSITIONS:")
    print(result["runtime_positions"])

    print("UNSAFE POSITIONS:")
    print(result["unsafe_positions"])

    print("MASKED:")
    for message in result["masked_messages"]:
        print(message)

    assert result["safe"] is case["expected"]


print()
print("=" * 80)
print("BROADER EVIDENCE")


queue_depth = [
    "queue orders depth=101",
    "queue payments depth=205",
    "queue notifications depth=991",
]

queue_population = [
    *queue_depth,
    "queue orders processing delay=81ms",
    "queue payments processing delay=35ms",
    "queue notifications processing delay=54ms",
]

without_context = evaluator.evaluate(
    queue_depth
)

with_context = evaluator.evaluate(
    queue_depth,
    evidence_messages=queue_population,
)

print("WITHOUT CONTEXT:")
print(without_context)

print()
print("WITH CONTEXT:")
print(with_context)

assert without_context["safe"] is False
assert without_context["runtime_positions"] == []

assert with_context["safe"] is True
assert with_context["runtime_positions"] == [1]


print()
print(
    "LEARNING CANDIDATE EVALUATOR TEST PASSED"
)
