import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.log_adapter import LogAdapter
from app.log_signature import LogSignature


adapter = LogAdapter()
signature = LogSignature()


cases = [
    (
        "2026-08-25T16:00:01Z "
        "ERROR مستخدم أحمد فشل تسجيل الدخول",
        "level=error|root=مستخدم",
    ),
    (
        "2026-08-25T16:00:02Z "
        "ERROR échec connexion utilisateur",
        "level=error|root=échec",
    ),
    (
        "2026-08-25T16:00:03Z "
        "ERROR пользователь недоступен",
        "level=error|root=пользователь",
    ),
    (
        "2026-08-25T16:00:04Z "
        "ERROR 用户 登录失败",
        "level=error|root=用户",
    ),
]


print("===== UNICODE SIGNATURES =====")

for raw, expected in cases:
    event = adapter.adapt(raw)
    result = signature.build(event)

    print()
    print("RAW:")
    print(raw)

    print("MESSAGE:")
    print(event.message)

    print("SIGNATURE:")
    print(result)

    print("EXPECTED:")
    print(expected)

    assert result == expected


print()
print("UNICODE SIGNATURE TEST PASSED")
