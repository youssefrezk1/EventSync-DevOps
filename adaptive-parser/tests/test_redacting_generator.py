import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.redacting_generator import RedactingTemplateGenerator


class CaptureGenerator:
    def __init__(self):
        self.received_messages = []

    def generate(self, messages):
        self.received_messages = list(messages)

        return "Email sent successfully to <EMAIL>"


raw_messages = [
    "Email sent successfully to alice@example.com",
    "Email sent successfully to bob@example.com",
    "Email sent successfully to charlie@example.com",
]

capture = CaptureGenerator()

generator = RedactingTemplateGenerator(
    generator=capture
)

template = generator.generate(
    raw_messages
)

print("===== TEMPLATE =====")
print(template)

print()
print("===== PROVIDER RECEIVED =====")

for message in capture.received_messages:
    print(message)

print()
print("===== SECURITY ASSERTIONS =====")

for raw in raw_messages:
    assert raw not in capture.received_messages

for sensitive_value in [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com",
]:
    assert all(
        sensitive_value not in message
        for message in capture.received_messages
    )

assert capture.received_messages == [
    "Email sent successfully to <EMAIL>",
    "Email sent successfully to <EMAIL>",
    "Email sent successfully to <EMAIL>",
]

print("RAW EMAIL ADDRESSES DID NOT REACH PROVIDER")
print("ALL SECURITY BOUNDARY TESTS PASSED")
