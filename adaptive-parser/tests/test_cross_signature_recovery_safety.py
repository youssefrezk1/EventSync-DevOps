import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer


messages = [
    # Family A
    "ERROR request req-101 failed user=41 latency=81ms",
    "ERROR request req-205 failed user=72 latency=35ms",
    "ERROR request req-991 failed user=19 latency=54ms",

    # Family B - intentionally similar, but semantically distinct
    "ERROR payment TX-100 failed user=41 latency=81ms",
    "ERROR payment TX-200 failed user=72 latency=35ms",
    "ERROR payment TX-300 failed user=19 latency=54ms",
]


clusterer = UnknownLogClusterer(
    eps=0.60,
    min_samples=2,
)

clusters = clusterer.cluster(messages)

print("===== CROSS-SIGNATURE RECOVERY SAFETY =====")

for cluster_id, group in sorted(
    clusters.items(),
    key=lambda item: item[0],
):
    print()
    print(
        f"CLUSTER {cluster_id} "
        f"({len(group)} messages)"
    )

    for message in group:
        print(message)


real_clusters = [
    group
    for cluster_id, group in clusters.items()
    if cluster_id != -1
]

assert len(real_clusters) == 2, (
    "Distinct semantic families must not be merged "
    "during cross-signature recovery."
)

assert all(
    len(group) == 3
    for group in real_clusters
)

print()
print(
    "CROSS-SIGNATURE RECOVERY SAFETY TEST PASSED"
)
