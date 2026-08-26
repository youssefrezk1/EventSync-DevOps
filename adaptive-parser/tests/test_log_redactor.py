import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_redactor import LogRedactor


redactor = LogRedactor()

cases = [
    (
        "Email sent successfully to alice@example.com",
        "Email sent successfully to <EMAIL>",
    ),
    (
        "Authorization: Bearer "
        "eyJhbGciOiJIUzI1NiJ9."
        "eyJzdWIiOiIxMjM0NTY3ODkwIn0."
        "abc123",
        "Authorization: <SECRET>",
    ),
    (
        "JWT Token: "
        "eyJhbGciOiJIUzI1NiJ9."
        "eyJ1c2VyIjoiNDIifQ."
        "signature123",
        "JWT Token: <SECRET>",
    ),
    (
        "password=my-super-secret-password",
        "password=<SECRET>",
    ),
    (
        "api_key=abcdef123456789",
        "api_key=<SECRET>",
    ),
    (
        "client_secret: very-secret-value",
        "client_secret: <SECRET>",
    ),
    (
        "2026-08-25T10:15:22Z "
        "ERROR request req-781 "
        "user=42 ip=10.0.0.5 latency=81ms",
        "2026-08-25T10:15:22Z "
        "ERROR request req-781 "
        "user=42 ip=10.0.0.5 latency=81ms",
    ),
]


for raw, expected in cases:
    actual = redactor.redact(raw)

    print("=" * 70)
    print("RAW:")
    print(raw)

    print()
    print("REDACTED:")
    print(actual)

    assert actual == expected, (
        f"Redaction mismatch.\n"
        f"Expected: {expected}\n"
        f"Actual:   {actual}"
    )


print()
print("ALL REDACTION TESTS PASSED")
