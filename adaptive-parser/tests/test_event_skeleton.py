import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.event_skeleton import EventSkeletonBuilder
from app.log_normalizer import LogNormalizer


messages = [
    "2026-08-25T13:05:01Z WARN queue orders depth=101",
    "2026-08-25T13:05:04Z WARN queue payments depth=205",
    "2026-08-25T13:05:09Z WARN queue notifications depth=991",

    "2026-08-25T13:06:01Z WARN queue orders processing delay=81ms",
    "2026-08-25T13:06:04Z WARN queue payments processing delay=35ms",
    "2026-08-25T13:06:09Z WARN queue notifications processing delay=54ms",
]

normalizer = LogNormalizer()
builder = EventSkeletonBuilder()

normalized = [
    normalizer.normalize(message)
    for message in messages
]

skeletons = builder.build_partition(
    normalized
)

print("===== NORMALIZED =====")

for message in normalized:
    print(message)

print()
print("===== SKELETONS =====")

for message in skeletons:
    print(message)


expected = [
    "<TIMESTAMP> WARN queue <ENTITY> depth=<NUM>",
    "<TIMESTAMP> WARN queue <ENTITY> depth=<NUM>",
    "<TIMESTAMP> WARN queue <ENTITY> depth=<NUM>",

    "<TIMESTAMP> WARN queue <ENTITY> processing delay=<NUM>ms",
    "<TIMESTAMP> WARN queue <ENTITY> processing delay=<NUM>ms",
    "<TIMESTAMP> WARN queue <ENTITY> processing delay=<NUM>ms",
]

assert skeletons == expected

print()
print("EVENT SKELETON TEST PASSED")
