import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer
from app.router import LogRouter


registry = ParserRegistry(
    PROJECT_ROOT / "data" / "parser_registry.json"
)

unknown_buffer = UnknownBuffer()

router = LogRouter(
    registry=registry,
    unknown_buffer=unknown_buffer,
)

messages = [
    "Payment TX-77 failed user=83 latency=92ms",
    "Database postgres connection failed",
    "Payment TX-999 failed user=12 latency=41ms",
    "Database mysql connection failed",
    "Database mongodb connection failed",
]

for message in messages:
    result = router.process(message)

    print("=" * 70)
    print("MESSAGE:")
    print(message)

    print()
    print("ROUTER RESULT:")
    print(result)

print()
print("===== FINAL UNKNOWN BUFFER =====")

for message in unknown_buffer.get_messages():
    print(message)
