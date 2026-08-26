import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.parser_registry import ParserRegistry


registry = ParserRegistry(
    PROJECT_ROOT / "data" / "parser_registry.json"
)

messages = [
    "Payment TX-77 failed user=83 latency=92ms",
    "Payment TX-999 failed user=12 latency=41ms",
    "Database postgres connection failed",
]

for message in messages:
    result = registry.match(message)

    print("=" * 70)
    print("MESSAGE:")
    print(message)

    print()
    print("RESULT:")
    print(result)
