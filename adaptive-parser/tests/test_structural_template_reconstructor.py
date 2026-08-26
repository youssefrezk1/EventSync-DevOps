import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.structural_template_reconstructor import (
    StructuralTemplateReconstructor,
)


reconstructor = StructuralTemplateReconstructor()


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

text_template = reconstructor.reconstruct(
    text_messages,
    "request req-<NUM> failed",
)


print("===== TEXT TEMPLATE =====")
print(text_template)

assert text_template == (
    "<*> ERROR request req-<*> failed"
)

assert reconstructor.can_reconstruct(
    text_messages
) is True


# =========================================================
# STRUCTURED FAMILY
#
# No serialization type is supplied to the reconstructor.
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

structured_template = reconstructor.reconstruct(
    structured_messages,
    "request req-<NUM> failed",
)


print()
print("===== STRUCTURED TEMPLATE =====")
print(structured_template)

assert structured_template == (
    '{"timestamp":"<*>",'
    '"level":"error",'
    '"message":"request req-<*> failed"}'
)

assert reconstructor.can_reconstruct(
    structured_messages
) is True


# =========================================================
# INTERNAL PLACEHOLDERS
# =========================================================

placeholder_messages = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "request req-101 failed "
        "ip=10.0.0.1"
    ),
    (
        "2026-08-25T13:01:04Z ERROR "
        "request req-205 failed "
        "ip=10.0.0.2"
    ),
    (
        "2026-08-25T13:01:09Z ERROR "
        "request req-991 failed "
        "ip=10.0.0.3"
    ),
]

placeholder_template = reconstructor.reconstruct(
    placeholder_messages,
    (
        "request req-<NUM> failed "
        "ip=<IP>"
    ),
)


print()
print("===== PLACEHOLDER NORMALIZATION =====")
print(placeholder_template)

assert placeholder_template == (
    "<*> ERROR "
    "request req-<*> failed ip=<*>"
)


# =========================================================
# INCOMPATIBLE STRUCTURE
# =========================================================

incompatible_messages = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "request req-101 failed"
    ),
    (
        "2026-08-25T13:01:04Z - ERROR - "
        "request req-205 failed"
    ),
]

unsafe_template = reconstructor.reconstruct(
    incompatible_messages,
    "request req-<NUM> failed",
)


print()
print("===== INCOMPATIBLE STRUCTURE =====")
print(unsafe_template)

assert unsafe_template is None

assert reconstructor.can_reconstruct(
    incompatible_messages
) is False


print()
print("=" * 80)
print(
    "STRUCTURAL TEMPLATE RECONSTRUCTOR TEST PASSED"
)
