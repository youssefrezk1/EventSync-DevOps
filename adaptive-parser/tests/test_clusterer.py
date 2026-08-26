import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer


messages = [
    "Database postgres connection failed",
    "Database mysql connection failed",
    "Database mongodb connection failed",

    "Payment TX-100 failed user=41 latency=81ms",
    "Payment TX-200 failed user=72 latency=35ms",
    "Payment TX-300 failed user=19 latency=54ms",

    "Queue orders contains 841 messages",
]

clusterer = UnknownLogClusterer(
    eps=0.60,
    min_samples=2,
)

clusters = clusterer.cluster(messages)

for cluster_id, cluster_messages in sorted(clusters.items()):
    print("=" * 70)
    print(f"CLUSTER {cluster_id}")

    for message in cluster_messages:
        print(message)
