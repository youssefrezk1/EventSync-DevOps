import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matcher_registry import MatcherRegistry
from app.parser_matcher import ParserMatcher
from app.validator import ParserValidator


class PrefixMatcher(ParserMatcher):
    """
    Test-only non-regex matcher.

    Matches messages beginning with a configured prefix and returns
    the remaining content as one parameter.
    """

    def match(
        self,
        message,
        config,
    ):
        prefix = config.get(
            "prefix"
        )

        if not prefix:
            raise ValueError(
                "Prefix is required."
            )

        if not message.startswith(
            prefix
        ):
            return {
                "matched": False,
                "parameters": [],
            }

        return {
            "matched": True,
            "parameters": [
                message[len(prefix):]
            ],
        }


matcher_registry = MatcherRegistry()

matcher_registry.register(
    "prefix-test",
    PrefixMatcher(),
)

validator = ParserValidator(
    matcher_registry=matcher_registry
)


matcher = {
    "type": "prefix-test",
    "config": {
        "prefix": "event:",
    },
}


positive_messages = [
    "event:orders",
    "event:payments",
    "event:notifications",
]

negative_messages = [
    "metric:orders",
    "trace:payments",
    "plain message",
]


print("===== GENERIC NON-REGEX VALIDATION =====")

result = validator.validate(
    matcher=matcher,
    positive_messages=positive_messages,
    negative_messages=negative_messages,
)

print(result)

assert result["passed"] is True
assert result["coverage"] == 1.0
assert result["negative_match_rate"] == 0.0
assert (
    result["parameter_count_consistent"]
    is True
)
assert result["parameter_count"] == 1


print()
print("===== LEGACY REGEX COMPATIBILITY =====")

legacy_result = validator.validate(
    regex=r"^request req-(.*?) failed$",
    positive_messages=[
        "request req-101 failed",
        "request req-205 failed",
        "request req-991 failed",
    ],
    negative_messages=[
        "queue orders depth=101",
    ],
)

print(legacy_result)

assert legacy_result["passed"] is True
assert legacy_result["parameter_count"] == 1


print()
print("=" * 80)
print(
    "GENERIC PARSER VALIDATOR TEST PASSED"
)
