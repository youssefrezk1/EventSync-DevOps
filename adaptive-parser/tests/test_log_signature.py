import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_adapter import LogAdapter
from app.log_signature import LogSignature


adapter = LogAdapter()
signature = LogSignature()


messages = [
    (
        "2026-08-25T12:00:01Z ERROR "
        "request req-101 failed user=41 "
        "ip=10.0.0.5 latency=81ms"
    ),
    (
        "2026-08-25T12:05:01Z ERROR "
        "payment TX-100 failed user=41 latency=81ms"
    ),
    (
        "2026-08-25T12:03:01Z INFO "
        "user alice authenticated from 192.168.1.20"
    ),
    (
        "2026-08-25T12:04:01Z ERROR "
        "user david authentication failed from 192.168.1.50"
    ),
    (
        "2026-08-25T12:01:01Z WARN "
        "database postgres connection timeout after 5000ms"
    ),
    (
        "2026-08-25T12:02:01Z WARN "
        "queue orders depth=101"
    ),
    (
        "2026-08-25T12:06:01Z INFO "
        "email sent successfully to alice@example.com"
    ),
    (
        "2026-08-25T12:07:01Z ERROR "
        "email delivery failed to david@example.com"
    ),
]


print("===== STRUCTURAL SIGNATURES =====")

results = []

for message in messages:
    event = adapter.adapt(message)
    result = signature.build(event)

    results.append(
        {
            "raw": message,
            "event": event,
            "signature": result,
        }
    )

    print()
    print("=" * 80)

    print("RAW:")
    print(message)

    print("CANONICAL MESSAGE:")
    print(event.message)

    print("LEVEL:")
    print(event.level)

    print("SOURCE:")
    print(event.source)

    print("SIGNATURE:")
    print(result)


print()
print("===== ASSERTIONS =====")

expected = [
    "level=error|root=request",
    "level=error|root=payment",
    "level=info|root=user",
    "level=error|root=user",
    "level=warn|root=database",
    "level=warn|root=queue",
    "level=info|root=sent",
    "level=error|root=delivery",
]

actual = [
    item["signature"]
    for item in results
]

assert actual == expected

# The signature layer must consume canonical events rather than
# independently parsing raw log syntax.
try:
    signature.build(
        "2026-08-25T12:00:01Z ERROR example"
    )
except TypeError:
    pass
else:
    raise AssertionError(
        "LogSignature unexpectedly accepted raw text."
    )

print(
    "CANONICAL STRUCTURAL SIGNATURE TEST PASSED"
)
