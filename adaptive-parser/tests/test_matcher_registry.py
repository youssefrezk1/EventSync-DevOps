import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matcher_registry import MatcherRegistry


registry = MatcherRegistry()


definition = {
    "type": "regex",
    "config": {
        "pattern": (
            r"^request req-(.*?) "
            r"failed user=(.*?)$"
        )
    },
}


print("===== MATCH =====")

result = registry.match(
    definition,
    "request req-781 failed user=42",
)

print(result)

assert result == {
    "matched": True,
    "parameters": [
        "781",
        "42",
    ],
}


print()
print("===== NO MATCH =====")

result = registry.match(
    definition,
    "queue orders depth=101",
)

print(result)

assert result == {
    "matched": False,
    "parameters": [],
}


print()
print("===== EXTENSIBILITY =====")


class AlwaysMatcher:
    def match(
        self,
        message,
        config,
    ):
        return {
            "matched": True,
            "parameters": [
                message
            ],
        }


registry.register(
    "custom-test",
    AlwaysMatcher(),
)

custom_result = registry.match(
    {
        "type": "custom-test",
        "config": {},
    },
    "anything",
)

print(custom_result)

assert custom_result == {
    "matched": True,
    "parameters": [
        "anything"
    ],
}


print()
print(
    "GENERIC MATCHER REGISTRY TEST PASSED"
)
