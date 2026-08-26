import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.unknown_buffer import UnknownBuffer


buffer = UnknownBuffer()

messages = [
    "Database postgres connection failed",
    "Database mysql connection failed",
    "Database mongodb connection failed",
]

for message in messages:
    buffer.add(message)

print("===== BUFFER COUNT =====")
print(buffer.count())

print()
print("===== BUFFER CONTENT =====")

for message in buffer.get_messages():
    print(message)
