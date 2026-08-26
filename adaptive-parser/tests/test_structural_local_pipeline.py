import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matcher_definition_builder import (
    RegexMatcherDefinitionBuilder,
)
from app.structural_template_reconstructor import (
    StructuralTemplateReconstructor,
)
from app.validator import ParserValidator


reconstructor = StructuralTemplateReconstructor()
matcher_builder = RegexMatcherDefinitionBuilder()
validator = ParserValidator()


def validate_family(
    raw_messages,
    message_template,
    negatives=None,
):
    template = reconstructor.reconstruct(
        raw_messages,
        message_template,
    )

    if template is None:
        return {
            "template": None,
            "matcher": None,
            "validation": None,
        }

    matcher = matcher_builder.build(
        template
    )

    validation = validator.validate(
        matcher=matcher,
        positive_messages=raw_messages,
        negative_messages=negatives or [],
    )

    return {
        "template": template,
        "matcher": matcher,
        "validation": validation,
    }


# =========================================================
# TEXT FAMILY
# =========================================================

text_messages = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "request req-101 failed"
    ),
    (
        "2026-08-25T13:01:04Z ERROR "
        "request req-205 failed"
    ),
    (
        "2026-08-25T13:01:09Z ERROR "
        "request req-991 failed"
    ),
]

text_result = validate_family(
    text_messages,
    "request req-<NUM> failed",
    negatives=[
        "2026-08-25T13:01:11Z WARN queue orders depth=101",
    ],
)

print("===== TEXT FAMILY =====")
print(text_result)

assert text_result["template"] == (
    "<*> ERROR request req-<*> failed"
)

assert text_result["validation"]["passed"] is True
assert text_result["validation"]["coverage"] == 1.0
assert (
    text_result["validation"]["negative_match_rate"]
    == 0.0
)


# =========================================================
# STRUCTURED FAMILY
#
# No serialization type is supplied anywhere in this local
# validation chain.
# =========================================================

structured_messages = [
    (
        '{"timestamp":"2026-08-25T13:01:01Z",'
        '"level":"error",'
        '"message":"request req-101 failed"}'
    ),
    (
        '{"timestamp":"2026-08-25T13:01:04Z",'
        '"level":"error",'
        '"message":"request req-205 failed"}'
    ),
    (
        '{"timestamp":"2026-08-25T13:01:09Z",'
        '"level":"error",'
        '"message":"request req-991 failed"}'
    ),
]

structured_result = validate_family(
    structured_messages,
    "request req-<NUM> failed",
    negatives=[
        (
            '{"timestamp":"2026-08-25T13:01:11Z",'
            '"level":"warn",'
            '"message":"queue depth high"}'
        )
    ],
)

print()
print("===== STRUCTURED FAMILY =====")
print(structured_result)

assert structured_result["template"] == (
    '{"timestamp":"<*>",'
    '"level":"error",'
    '"message":"request req-<*> failed"}'
)

assert (
    structured_result["validation"]["passed"]
    is True
)

assert (
    structured_result["validation"]["coverage"]
    == 1.0
)

assert (
    structured_result["validation"][
        "negative_match_rate"
    ]
    == 0.0
)


# =========================================================
# INCOMPATIBLE STRUCTURE
# =========================================================

unsafe_messages = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "request req-101 failed"
    ),
    (
        "2026-08-25T13:01:04Z - ERROR - "
        "request req-205 failed"
    ),
]

unsafe_result = validate_family(
    unsafe_messages,
    "request req-<NUM> failed",
)

print()
print("===== INCOMPATIBLE FAMILY =====")
print(unsafe_result)

assert unsafe_result["template"] is None
assert unsafe_result["matcher"] is None
assert unsafe_result["validation"] is None


print()
print("=" * 80)
print(
    "STRUCTURAL LOCAL PIPELINE TEST PASSED"
)
