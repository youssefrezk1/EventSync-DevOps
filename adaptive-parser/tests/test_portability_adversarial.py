import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer
from app.log_adapter import LogAdapter
from app.log_signature import LogSignature


adapter = LogAdapter()
signature_builder = LogSignature()

messages = [
    # =========================================================
    # FAMILY A
    # Same conceptual event, mixed envelopes
    # =========================================================
    (
        "2026-08-25T15:00:01Z "
        "ERROR connection refused host=alpha port=5432"
    ),
    (
        "2026-08-25 15:00:04,123 - network - ERROR - "
        "connection refused host=beta port=3306"
    ),
    (
        'level=error '
        'time=2026-08-25T15:00:09Z '
        'service=network '
        'port=27017 '
        'host=gamma '
        'msg="connection refused"'
    ),

    # =========================================================
    # FAMILY B
    # No severity level
    # =========================================================
    "Session abc123 expired for user alice",
    "Session def456 expired for user bob",
    "Session ghi789 expired for user charlie",

    # =========================================================
    # FAMILY C
    # Unicode / non-English text
    # =========================================================
    "2026-08-25T15:02:01Z ERROR utilisateur alice authentification échouée",
    "2026-08-25T15:02:04Z ERROR utilisateur bob authentification échouée",
    "2026-08-25T15:02:09Z ERROR utilisateur charlie authentification échouée",

    # =========================================================
    # FAMILY D
    # Arabic text
    # =========================================================
    "2026-08-25T15:03:01Z ERROR مستخدم أحمد فشل تسجيل الدخول",
    "2026-08-25T15:03:04Z ERROR مستخدم محمد فشل تسجيل الدخول",
    "2026-08-25T15:03:09Z ERROR مستخدم سارة فشل تسجيل الدخول",

    # =========================================================
    # FAMILY E
    # JSON with reordered fields
    # =========================================================
    (
        '{"level":"warn","service":"cache",'
        '"message":"entry expired","key":"user:101"}'
    ),
    (
        '{"key":"user:205","message":"entry expired",'
        '"service":"cache","level":"warn"}'
    ),
    (
        '{"service":"cache","level":"warn",'
        '"key":"user:991","message":"entry expired"}'
    ),

    # =========================================================
    # FAMILY F
    # Structured key=value with reordered fields
    # =========================================================
    (
        'level=info service=worker '
        'msg="task completed" task=101 duration=31'
    ),
    (
        'duration=47 task=205 '
        'service=worker msg="task completed" level=info'
    ),
    (
        'task=991 level=info '
        'msg="task completed" duration=22 service=worker'
    ),

    # =========================================================
    # MALFORMED / SINGLETON / EDGE CASES
    # =========================================================

    # malformed JSON: should fall back safely
    '{"level":"error","message":"broken JSON"',

    # very short message
    "heartbeat",

    # single unique event
    "2026-08-25T15:10:00Z CRITICAL disk controller offline",
]


print("===== ADAPTED EVENTS =====")

for index, raw in enumerate(messages, start=1):
    event = adapter.adapt(raw)
    signature = signature_builder.build(event)

    print()
    print("=" * 80)
    print(f"[{index}] RAW:")
    print(raw)

    print("MESSAGE:")
    print(event.message)

    print("LEVEL:")
    print(event.level)

    print("SOURCE:")
    print(event.source)

    print("SIGNATURE:")
    print(signature)


print()
print("=" * 80)
print("===== CLUSTERING =====")

clusterer = UnknownLogClusterer(
    eps=0.50,
    min_samples=2,
)

clusters = clusterer.cluster(messages)

for cluster_id, group in sorted(
    clusters.items(),
    key=lambda item: item[0],
):
    print()
    print("=" * 80)
    print(
        f"CLUSTER {cluster_id} "
        f"({len(group)} messages)"
    )

    for message in group:
        print(message)


print()
print("=" * 80)
print("===== SUMMARY =====")

real_clusters = {
    cluster_id: group
    for cluster_id, group in clusters.items()
    if cluster_id != -1
}

noise = clusters.get(-1, [])

print("TOTAL INPUTS:")
print(len(messages))

print("REAL CLUSTERS:")
print(len(real_clusters))

print("NOISE COUNT:")
print(len(noise))


print()
print("===== BASIC ASSERTIONS =====")

# Every input must appear exactly once.
all_output = [
    message
    for group in clusters.values()
    for message in group
]

assert sorted(all_output) == sorted(messages)

# Reordered JSON family must cluster together.
json_family = [
    message
    for message in messages
    if message.startswith("{")
    and message.endswith("}")
]

assert any(
    sorted(group) == sorted(json_family)
    for group in real_clusters.values()
)

# Reordered key=value task family must cluster together.
kv_family = [
    message
    for message in messages
    if 'msg="task completed"' in message
]

assert any(
    sorted(group) == sorted(kv_family)
    for group in real_clusters.values()
)

print("ALL INPUTS PRESERVED")
print("JSON FIELD ORDER DID NOT BREAK CLUSTERING")
print("KEY/VALUE FIELD ORDER DID NOT BREAK CLUSTERING")

print()
print(
    "PORTABILITY ADVERSARIAL TEST COMPLETED"
)
