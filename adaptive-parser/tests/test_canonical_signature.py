import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_adapter import LogAdapter
from app.log_signature import LogSignature


adapter = LogAdapter()
signature = LogSignature()


samples = {
    "plain": (
        "2026-08-25T13:01:00Z "
        "ERROR database postgres timeout after 5000ms"
    ),

    "python": (
        "2026-08-25 13:01:00,123 - "
        "database - ERROR - "
        "connection timeout host=postgres duration=5000ms"
    ),

    "java": (
        "2026-08-25 13:01:00.331 "
        "ERROR DatabaseService - "
        "connection timeout host=postgres duration=5000ms"
    ),

    "go": (
        'time=2026-08-25T13:01:00Z '
        'level=error '
        'service=database '
        'msg="connection timeout" '
        'host=postgres '
        'duration=5000'
    ),

    "json": (
        '{"timestamp":"2026-08-25T13:01:00Z",'
        '"level":"error",'
        '"service":"database",'
        '"message":"connection timeout",'
        '"host":"postgres",'
        '"duration":5000}'
    ),

    "no_level": (
        "Payment TX-77 failed user=83 latency=92ms"
    ),

    "minimal": (
        "connection refused"
    ),
}


print("===== CANONICAL SIGNATURES =====")

results = {}

for name, raw in samples.items():
    event = adapter.adapt(raw)
    result = signature.build(event)

    results[name] = result

    print()
    print("=" * 80)
    print("SAMPLE:")
    print(name)

    print("LEVEL:")
    print(event.level)

    print("SOURCE:")
    print(event.source)

    print("MESSAGE:")
    print(event.message)

    print("SIGNATURE:")
    print(result)


print()
print("===== ASSERTIONS =====")

assert results["go"] == (
    "level=error|root=connection"
)

assert results["json"] == (
    "level=error|root=connection"
)

assert results["plain"].startswith(
    "level=error|"
)

assert results["python"].startswith(
    "level=error|"
)

assert results["java"].startswith(
    "level=error|"
)

assert results["no_level"].startswith(
    "root=payment"
)

assert results["minimal"] == (
    "root=connection"
)

print(
    "CANONICAL SIGNATURE TEST PASSED"
)
