import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_normalizer import LogNormalizer


normalizer = LogNormalizer()

messages = [
    "2026-08-24T16:00:01Z WARN queue orders depth=101",
    "2026-08-24T16:00:04Z WARN queue payments depth=205",
    "2026-08-24T16:00:09Z WARN queue notifications depth=991",

    "2026-08-24T17:10:22Z ERROR request req-781 ip=10.0.0.5 latency=81ms",

    "2026-08-24T17:11:00Z INFO trace 550e8400-e29b-41d4-a716-446655440000 completed",
]

for message in messages:
    print("=" * 70)
    print("RAW:")
    print(message)

    print()
    print("NORMALIZED:")
    print(normalizer.normalize(message))


print()
print("=" * 70)
print("SENSITIVE VALUE NORMALIZATION")


sensitive_cases = [
    (
        (
            "login failed "
            "email=alice@example.com "
            "password=alpha-secret"
        ),
        (
            "login failed "
            "email=<EMAIL> "
            "password=<SECRET>"
        ),
    ),
    (
        (
            "authentication rejected "
            "email=bob@example.com "
            "api_key=secret-beta"
        ),
        (
            "authentication rejected "
            "email=<EMAIL> "
            "api_key=<SECRET>"
        ),
    ),
]


for raw, expected in sensitive_cases:
    actual = normalizer.normalize(
        raw
    )

    print()
    print("RAW:")
    print(raw)

    print("NORMALIZED:")
    print(actual)

    assert actual == expected, (
        f"Expected: {expected}\n"
        f"Actual:   {actual}"
    )


print()
print(
    "SENSITIVE VALUES NORMALIZED "
    "WITHOUT DUPLICATING SECURITY RULES"
)
