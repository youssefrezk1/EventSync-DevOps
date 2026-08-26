import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer
from app.log_normalizer import LogNormalizer


messages = [
    # ---------------------------------------------------------
    # FAMILY A: request failures
    # ---------------------------------------------------------
    "2026-08-25T12:00:01Z ERROR request req-101 failed user=41 ip=10.0.0.5 latency=81ms",
    "2026-08-25T12:00:04Z ERROR request req-205 failed user=72 ip=10.0.0.8 latency=35ms",
    "2026-08-25T12:00:09Z ERROR request req-991 failed user=19 ip=10.0.0.11 latency=54ms",

    # ---------------------------------------------------------
    # FAMILY B: database timeouts
    # ---------------------------------------------------------
    "2026-08-25T12:01:01Z WARN database postgres connection timeout after 5000ms",
    "2026-08-25T12:01:04Z WARN database mysql connection timeout after 7000ms",
    "2026-08-25T12:01:09Z WARN database mongodb connection timeout after 3000ms",

    # ---------------------------------------------------------
    # FAMILY C: queue depth warnings
    # ---------------------------------------------------------
    "2026-08-25T12:02:01Z WARN queue orders depth=101",
    "2026-08-25T12:02:04Z WARN queue payments depth=205",
    "2026-08-25T12:02:09Z WARN queue notifications depth=991",

    # ---------------------------------------------------------
    # FAMILY D: successful authentication
    # ---------------------------------------------------------
    "2026-08-25T12:03:01Z INFO user alice authenticated from 192.168.1.20",
    "2026-08-25T12:03:05Z INFO user bob authenticated from 10.20.5.31",
    "2026-08-25T12:03:08Z INFO user charlie authenticated from 172.16.4.42",

    # ---------------------------------------------------------
    # FAMILY E: authentication failures
    #
    # Deliberately similar to FAMILY D.
    # These must NOT be merged with successful authentication.
    # ---------------------------------------------------------
    "2026-08-25T12:04:01Z ERROR user david authentication failed from 192.168.1.50",
    "2026-08-25T12:04:05Z ERROR user emma authentication failed from 10.20.5.51",
    "2026-08-25T12:04:08Z ERROR user frank authentication failed from 172.16.4.52",

    # ---------------------------------------------------------
    # FAMILY F: payment failures
    # ---------------------------------------------------------
    "2026-08-25T12:05:01Z ERROR payment TX-100 failed user=41 latency=81ms",
    "2026-08-25T12:05:04Z ERROR payment TX-200 failed user=72 latency=35ms",
    "2026-08-25T12:05:09Z ERROR payment TX-300 failed user=19 latency=54ms",

    # ---------------------------------------------------------
    # FAMILY G: successful email delivery
    # ---------------------------------------------------------
    "2026-08-25T12:06:01Z INFO email sent successfully to alice@example.com",
    "2026-08-25T12:06:04Z INFO email sent successfully to bob@example.com",
    "2026-08-25T12:06:09Z INFO email sent successfully to charlie@example.com",

    # ---------------------------------------------------------
    # FAMILY H: email delivery failures
    #
    # Deliberately related to FAMILY G but semantically different.
    # ---------------------------------------------------------
    "2026-08-25T12:07:01Z ERROR email delivery failed to david@example.com",
    "2026-08-25T12:07:04Z ERROR email delivery failed to emma@example.com",
    "2026-08-25T12:07:09Z ERROR email delivery failed to frank@example.com",
]


normalizer = LogNormalizer()

clusterer = UnknownLogClusterer(
    eps=0.60,
    min_samples=2,
    normalizer=normalizer,
)


print("===== NORMALIZED CORPUS =====")

for index, message in enumerate(messages, start=1):
    print()
    print(f"[{index}] RAW:")
    print(message)

    print("NORMALIZED:")
    print(normalizer.normalize(message))


print()
print("=" * 80)
print("===== CLUSTERS =====")

clusters = clusterer.cluster(messages)

for cluster_id in sorted(clusters):
    cluster_messages = clusters[cluster_id]

    print()
    print("=" * 80)
    print(
        f"CLUSTER {cluster_id} "
        f"({len(cluster_messages)} messages)"
    )

    for message in cluster_messages:
        print(message)


print()
print("=" * 80)
print("===== SUMMARY =====")

print("TOTAL MESSAGES:")
print(len(messages))

print("TOTAL CLUSTER LABELS:")
print(len(clusters))

print("NOISE COUNT:")
print(
    len(
        clusters.get(
            -1,
            [],
        )
    )
)

print()
print(
    "EXPECTED IDEAL RESULT: "
    "8 semantic families of 3 messages each, "
    "with no cross-family merges."
)
