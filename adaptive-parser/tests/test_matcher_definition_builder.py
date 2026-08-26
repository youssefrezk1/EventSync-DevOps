import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matcher_definition_builder import (
    MatcherDefinitionBuilder,
    RegexMatcherDefinitionBuilder,
)


builder = RegexMatcherDefinitionBuilder()


print("===== REGEX MATCHER DEFINITION =====")

definition = builder.build(
    "request req-<*> failed user=<*>"
)

print(definition)

assert definition == {
    "type": "regex",
    "config": {
        "pattern": (
            r"^request\ req\-(.*?)\ failed\ user=(.*?)$"
        ),
    },
}


print()
print("===== GENERIC BUILDER CONTRACT =====")

assert isinstance(
    builder,
    MatcherDefinitionBuilder,
)

print(
    "ENGINE CAN DEPEND ON GENERIC BUILDER CONTRACT"
)


print()
print("=" * 80)
print(
    "MATCHER DEFINITION BUILDER TEST PASSED"
)
