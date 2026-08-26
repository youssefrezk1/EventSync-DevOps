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
    / "parser_registry_persistence.test.json"
)

registry_path.write_text(
    json.dumps(
        {
            "parsers": []
        },
        indent=2,
    ),
    encoding="utf-8",
)


validation = {
    "passed": True,
    "coverage": 1.0,
    "negative_match_rate": 0.0,
    "parameter_count_consistent": True,
}


# =========================================================
# Legacy registration API.
# =========================================================

registry = ParserRegistry(
    registry_path
)

parser = registry.register(
    parser_id="legacy_registration",
    template="request req-<*> failed",
    regex=r"^request req-(.*?) failed$",
    parameter_count=1,
    validation=validation,
)


print("===== LEGACY REGISTRATION INPUT =====")
print(parser)

assert "matcher" in parser
assert "regex" not in parser

assert parser["matcher"] == {
    "type": "regex",
    "config": {
        "pattern": (
            r"^request req-(.*?) failed$"
        )
    },
}


# Prove persistence, not merely in-memory behavior.

reloaded = ParserRegistry(
    registry_path
)

result = reloaded.match(
    "request req-781 failed"
)

print()
print("===== RELOADED GENERIC RECORD =====")
print(result)

assert result["matched"] is True
assert result["parameters"] == [
    "781"
]


# =========================================================
# Generic registration API with a non-regex strategy.
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


generic_registry = ParserRegistry(
    registry_path,
    matcher_registry=matcher_registry,
)

generic_parser = generic_registry.register(
    parser_id="generic_registration",
    template="unused",
    matcher={
        "type": "prefix-test",
        "config": {
            "prefix": "event:"
        },
    },
    parameter_count=1,
    validation=validation,
)


print()
print("===== GENERIC REGISTRATION INPUT =====")
print(generic_parser)

assert generic_parser["matcher"] == {
    "type": "prefix-test",
    "config": {
        "prefix": "event:"
    },
}


# Reload using a registry that knows the capability.

reloaded_matchers = MatcherRegistry()

reloaded_matchers.register(
    "prefix-test",
    PrefixMatcher(),
)

reloaded_generic = ParserRegistry(
    registry_path,
    matcher_registry=reloaded_matchers,
)

result = reloaded_generic.match(
    "event:any-runtime-content"
)

print()
print("===== RELOADED PLUGGABLE MATCHER =====")
print(result)

assert result["matched"] is True
assert result["parameters"] == [
    "any-runtime-content"
]


print()
print("=" * 80)
print(
    "GENERIC PARSER PERSISTENCE TEST PASSED"
)


registry_path.unlink(
    missing_ok=True
)
