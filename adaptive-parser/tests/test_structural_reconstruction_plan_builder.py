import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.structural_reconstruction_plan_builder import (
    StructuralReconstructionPlanBuilder,
)


builder = StructuralReconstructionPlanBuilder()


# =========================================================
# TEXTUAL FAMILY
# =========================================================

text_messages = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25T13:01:04Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25T13:01:09Z ERROR "
        "database timeout"
    ),
]

text_plan = builder.build(
    text_messages
)

print("===== TEXT PLAN =====")
print(text_plan)

assert text_plan.authorized is True

assert [
    segment.kind
    for segment in text_plan.segments
] == [
    "wildcard",
    "literal",
    "literal",
    "literal",
    "message",
]


# =========================================================
# STRUCTURED FAMILY
# =========================================================

structured_messages = [
    (
        '{"timestamp":"2026-08-25T13:01:01Z",'
        '"level":"error",'
        '"message":"connection timeout"}'
    ),
    (
        '{"timestamp":"2026-08-25T13:01:04Z",'
        '"level":"error",'
        '"message":"connection timeout"}'
    ),
    (
        '{"timestamp":"2026-08-25T13:01:09Z",'
        '"level":"error",'
        '"message":"connection timeout"}'
    ),
]

structured_plan = builder.build(
    structured_messages
)

print()
print("===== STRUCTURED PLAN =====")
print(structured_plan)

assert structured_plan.authorized is True

assert [
    segment.kind
    for segment in structured_plan.segments
] == [
    "literal",
    "wildcard",
    "literal",
    "literal",
    "literal",
    "message",
    "literal",
]


# =========================================================
# INCOMPATIBLE FAMILY
# =========================================================

incompatible_messages = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25T13:01:04Z - ERROR - "
        "database timeout"
    ),
]

unsafe_plan = builder.build(
    incompatible_messages
)

print()
print("===== INCOMPATIBLE PLAN =====")
print(unsafe_plan)

assert unsafe_plan.authorized is False


# =========================================================
# FORMAT-INDEPENDENCE
# =========================================================

for plan in (
    text_plan,
    structured_plan,
):
    for segment in plan.segments:
        assert segment.kind not in {
            "json",
            "key_value",
            "java",
            "python",
            "syslog",
        }


print()
print("=" * 80)
print(
    "STRUCTURAL RECONSTRUCTION PLAN TEST PASSED"
)
