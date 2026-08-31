import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer


messages = [
    # Established runtime-bearing family.
    "ALPHA worker job=101 result=ok",
    "ALPHA worker job=205 result=ok",
    "ALPHA worker job=991 result=ok",

    # Similar-looking but semantically different structure.
    # The dash is ordinary syntax here and must not cause recovery.
    "BETA worker mode=- result=failed",
]


clusterer = UnknownLogClusterer(
    eps=0.50,
    min_samples=2,
)

clusters = clusterer.cluster(messages)


print("===== OPTIONAL RUNTIME VALUE SAFETY =====")

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

assert len(real_clusters) == 1
assert len(real_clusters[0]) == 3

assert -1 in clusters
assert clusters[-1] == [
    "BETA worker mode=- result=failed"
]

print()
print("OPTIONAL RUNTIME VALUE SAFETY TEST PASSED")
