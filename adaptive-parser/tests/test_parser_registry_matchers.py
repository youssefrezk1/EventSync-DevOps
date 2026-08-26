import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matcher_registry import MatcherRegistry
from app.parser_registry import ParserRegistry


registry_path = (
    PROJECT_ROOT
    / "data"
    / "parser_registry_matchers.test.json"
)


# =========================================================
# Legacy regex parser.
# =========================================================

registry_path.write_text(
    json.dumps(
        {
            "parsers": [
                {
                    "id": "legacy_parser",
                    "template": (
                        "request req-<*> failed"
                    ),
                    "regex": (
                        r"^request req-(.*?) failed$"
                    ),
                    "parameter_count": 1,
                    "validated": True,
                    "validation": {},
                }
            ]
        },
        indent=2,
    ),
    encoding="utf-8",
)


registry = ParserRegistry(
    registry_path
)


print("===== LEGACY REGEX PARSER =====")

result = registry.match(
    "request req-781 failed"
)

print(result)

assert result["matched"] is True
assert result["parser_id"] == (
    "legacy_parser"
)
assert result["parameters"] == [
    "781"
]


# =========================================================
# Generic matcher parser.
# =========================================================

registry.parsers = [
    {
        "id": "generic_parser",
        "template": "unused",
        "matcher": {
            "type": "regex",
            "config": {
                "pattern": (
                    r"^queue (.*?) depth=(.*?)$"
                )
            },
        },
        "parameter_count": 2,
        "validated": True,
        "validation": {},
    }
]


print()
print("===== GENERIC MATCHER PARSER =====")

result = registry.match(
    "queue orders depth=101"
)

print(result)

assert result["matched"] is True
assert result["parser_id"] == (
    "generic_parser"
)
assert result["parameters"] == [
    "orders",
    "101",
]


# =========================================================
# Pluggable strategy.
#
# This proves ParserRegistry itself does not require regex.
# =========================================================

class PrefixMatcher:
    def match(
        self,
        message,
        config,
    ):
        prefix = config.get(
            "prefix",
            "",
        )

        if not message.startswith(prefix):
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


registry = ParserRegistry(
    registry_path,
    matcher_registry=matcher_registry,
)

registry.parsers = [
    {
        "id": "pluggable_parser",
        "template": "unused",
        "matcher": {
            "type": "prefix-test",
            "config": {
                "prefix": "event:"
            },
        },
        "parameter_count": 1,
        "validated": True,
        "validation": {},
    }
]


print()
print("===== PLUGGABLE NON-REGEX MATCHER =====")

result = registry.match(
    "event:any-runtime-content"
)

print(result)

assert result["matched"] is True
assert result["parser_id"] == (
    "pluggable_parser"
)
assert result["parameters"] == [
    "any-runtime-content"
]


print()
print("=" * 80)
print(
    "PARSER REGISTRY MATCHER ABSTRACTION TEST PASSED"
)


registry_path.unlink(
    missing_ok=True
)
