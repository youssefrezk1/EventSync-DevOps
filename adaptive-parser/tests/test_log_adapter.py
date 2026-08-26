import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_adapter import LogAdapter


adapter = LogAdapter()

samples = {
    "plain_node_style": (
        "2026-08-25T13:01:00Z "
        "ERROR database postgres timeout after 5000ms"
    ),

    "python_style": (
        "2026-08-25 13:01:00,123 - "
        "database - ERROR - "
        "connection timeout host=postgres duration=5000ms"
    ),

    "java_style": (
        "2026-08-25 13:01:00.331 "
        "ERROR DatabaseService - "
        "connection timeout host=postgres duration=5000ms"
    ),

    "go_key_value": (
        'time=2026-08-25T13:01:00Z '
        'level=error '
        'service=database '
        'msg="connection timeout" '
        'host=postgres '
        'duration=5000'
    ),

    "json_style": (
        '{"timestamp":"2026-08-25T13:01:00Z",'
        '"level":"error",'
        '"service":"database",'
        '"message":"connection timeout",'
        '"host":"postgres",'
        '"duration":5000}'
    ),

    "no_level_plaintext": (
        "Payment TX-77 failed user=83 latency=92ms"
    ),
}


print("===== CANONICAL LOG EVENTS =====")

for name, raw in samples.items():
    event = adapter.adapt(raw)

    print()
    print("=" * 80)
    print("SAMPLE:")
    print(name)

    print("RAW:")
    print(event.raw_message)

    print("MESSAGE:")
    print(event.message)

    print("TIMESTAMP:")
    print(event.timestamp)

    print("LEVEL:")
    print(event.level)

    print("SOURCE:")
    print(event.source)

    print("METADATA:")
    print(event.metadata)


print()
print("===== ASSERTIONS =====")

go_event = adapter.adapt(
    samples["go_key_value"]
)

assert go_event.level == "ERROR"
assert go_event.source == "database"
assert go_event.message == "connection timeout"

json_event = adapter.adapt(
    samples["json_style"]
)

assert json_event.level == "ERROR"
assert json_event.source == "database"
assert json_event.message == "connection timeout"

plain_event = adapter.adapt(
    samples["plain_node_style"]
)

assert plain_event.level == "ERROR"

no_level_event = adapter.adapt(
    samples["no_level_plaintext"]
)

assert no_level_event.level is None
assert no_level_event.message == (
    "Payment TX-77 failed user=83 latency=92ms"
)

python_event = adapter.adapt(
    samples["python_style"]
)

assert python_event.timestamp == (
    "2026-08-25 13:01:00,123"
)
assert python_event.level == "ERROR"
assert python_event.metadata["host"] == "postgres"
assert python_event.metadata["duration"] == "5000ms"
assert python_event.source == "database"
assert python_event.message == (
    "connection timeout "
    "host=postgres duration=5000ms"
)


java_event = adapter.adapt(
    samples["java_style"]
)

assert java_event.timestamp == (
    "2026-08-25 13:01:00.331"
)
assert java_event.level == "ERROR"
assert java_event.metadata["host"] == "postgres"
assert java_event.metadata["duration"] == "5000ms"
assert java_event.source == "DatabaseService"
assert java_event.message == (
    "connection timeout "
    "host=postgres duration=5000ms"
)


# Runtime key/value parameters must not cause an otherwise
# plain-text event to be misclassified as a structured KV log.
parameterized_plain = adapter.adapt(
    "Payment TX-77 failed "
    "user=83 latency=92ms"
)

assert parameterized_plain.level is None
assert parameterized_plain.message.startswith(
    "Payment TX-77 failed"
)
assert parameterized_plain.metadata["user"] == "83"
assert parameterized_plain.metadata["latency"] == "92ms"


print("LOG ADAPTER TEST PASSED")
