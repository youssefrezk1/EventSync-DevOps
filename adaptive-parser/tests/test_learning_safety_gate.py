import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.learning_candidate_evaluator import (
    LearningCandidateEvaluator,
)


class RecordingTemplateGenerator:
    """
    Test double proving whether generation was reached.
    """

    def __init__(self):
        self.calls = []

    def generate(self, messages):
        self.calls.append(
            list(messages)
        )

        return "unused"


generator = RecordingTemplateGenerator()
evaluator = LearningCandidateEvaluator()


def attempt_generation(
    cluster_messages,
    evidence_messages=None,
):
    evaluation = evaluator.evaluate(
        cluster_messages,
        evidence_messages=evidence_messages,
    )

    if not evaluation["safe"]:
        return {
            "generated": False,
            "evaluation": evaluation,
        }

    generator.generate(
        cluster_messages
    )

    return {
        "generated": True,
        "evaluation": evaluation,
    }


# =========================================================
# Unsafe semantic state variation.
# =========================================================

semantic_state = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",
]

result = attempt_generation(
    semantic_state
)

print("===== SEMANTIC STATE =====")
print(result)

assert result["generated"] is False
assert generator.calls == []


# =========================================================
# Unsafe semantic action variation.
# =========================================================

semantic_action = [
    "worker task started successfully",
    "worker task completed successfully",
    "worker task cancelled successfully",
]

result = attempt_generation(
    semantic_action
)

print()
print("===== SEMANTIC ACTION =====")
print(result)

assert result["generated"] is False
assert generator.calls == []


# =========================================================
# Mixed runtime + semantic variation.
# Runtime identifier is authorized, semantic action is not.
# =========================================================

mixed = [
    "job alpha1 started",
    "job beta2 completed",
    "job gamma3 failed",
]

result = attempt_generation(
    mixed
)

print()
print("===== MIXED VARIATION =====")
print(result)

assert result["generated"] is False
assert generator.calls == []


# =========================================================
# Safe normalized runtime family.
# =========================================================

safe_requests = [
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

result = attempt_generation(
    safe_requests
)

print()
print("===== SAFE REQUEST FAMILY =====")
print(result)

assert result["generated"] is True
assert len(generator.calls) == 1
assert generator.calls[0] == safe_requests


# =========================================================
# Safe lexical entity discovered from broader structure.
# =========================================================

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

result = attempt_generation(
    queue_depth,
    evidence_messages=queue_population,
)

print()
print("===== CROSS-STRUCTURE SAFE FAMILY =====")
print(result)

assert result["generated"] is True
assert len(generator.calls) == 2
assert generator.calls[1] == queue_depth


print()
print("=" * 80)
print("GENERATOR CALL COUNT:")
print(len(generator.calls))

print()
print(
    "LEARNING SAFETY GATE TEST PASSED"
)
