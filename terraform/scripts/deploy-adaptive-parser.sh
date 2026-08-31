#!/bin/bash
set -euo pipefail

if [ "$#" -ne 5 ]; then
  echo "Usage: $0 <registry> <repository> <tag> <region> <secret-name>"
  exit 2
fi

REGISTRY="$1"
REPOSITORY="$2"
TAG="$3"
AWS_REGION="$4"
SECRET_NAME="$5"

CONTAINER="eventsync-adaptive-parser"
PREVIOUS="${CONTAINER}-previous"
NETWORK="eventsync-observability"
DATA_VOLUME="eventsync-adaptive-parser-data"
ENV_DIR="/opt/eventsync-observability/adaptive-parser"
ENV_FILE="${ENV_DIR}/providers.env"
IMAGE="${REGISTRY}/${REPOSITORY}:${TAG}"

echo "===== ADAPTIVE PARSER DEPLOYMENT ====="
echo "Image: ${REGISTRY}/${REPOSITORY}:${TAG}"

command -v aws >/dev/null
command -v docker >/dev/null
command -v python3 >/dev/null

docker network inspect "${NETWORK}" >/dev/null

mkdir -p "${ENV_DIR}"
chmod 700 "${ENV_DIR}"
umask 077

SECRET_TMP="$(mktemp)"
cleanup() {
  rm -f "${SECRET_TMP}"
  docker logout "${REGISTRY}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "===== LOAD PROVIDER CREDENTIALS ====="
aws secretsmanager get-secret-value \
  --secret-id "${SECRET_NAME}" \
  --region "${AWS_REGION}" \
  --query SecretString \
  --output text \
  > "${SECRET_TMP}"

python3 - "${SECRET_TMP}" "${ENV_FILE}" <<'PY'
import json
import os
import sys

source, destination = sys.argv[1:3]

with open(source) as f:
    values = json.load(f)

required = (
    "GROQ_API_KEY",
    "MISTRAL_API_KEY",
)

allowed = (
    "GROQ_API_KEY",
    "MISTRAL_API_KEY",
    "GROQ_MODEL",
    "MISTRAL_MODEL",
)

for name in required:
    if not values.get(name):
        raise SystemExit(f"Required provider setting is missing: {name}")

with open(destination, "w") as f:
    for name in allowed:
        if name not in values:
            continue

        value = str(values[name])

        if "\n" in value or "\r" in value:
            raise SystemExit(f"Invalid newline in provider setting: {name}")

        f.write(f"{name}={value}\n")

os.chmod(destination, 0o600)

print("PASS: provider environment prepared")
PY

echo "===== ECR LOGIN / IMAGE PULL ====="
aws ecr get-login-password \
  --region "${AWS_REGION}" |
docker login \
  --username AWS \
  --password-stdin "${REGISTRY}" \
  >/dev/null

docker pull "${IMAGE}"
docker volume create "${DATA_VOLUME}" >/dev/null

echo "===== REPLACE PARSER CONTAINER ====="
docker rm -f "${PREVIOUS}" >/dev/null 2>&1 || true

HAD_PREVIOUS=false

if docker inspect "${CONTAINER}" >/dev/null 2>&1; then
  HAD_PREVIOUS=true
  docker stop "${CONTAINER}" >/dev/null
  docker rename "${CONTAINER}" "${PREVIOUS}"
fi

rollback() {
  echo "ERROR: new Adaptive Parser failed readiness check"

  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true

  if [ "${HAD_PREVIOUS}" = true ]; then
    docker rename "${PREVIOUS}" "${CONTAINER}"
    docker start "${CONTAINER}" >/dev/null
    echo "PASS: previous Adaptive Parser restored"
  fi

  exit 1
}

if ! docker run -d \
  --name "${CONTAINER}" \
  --network "${NETWORK}" \
  --restart unless-stopped \
  --env-file "${ENV_FILE}" \
  -v "${DATA_VOLUME}:/app/data" \
  "${IMAGE}" \
  >/dev/null
then
  rollback
fi

echo "===== READINESS CHECK ====="
READY=false

for _ in $(seq 1 30); do
  if docker exec "${CONTAINER}" \
    python -c \
    'import urllib.request; urllib.request.urlopen("http://127.0.0.1:8000/metrics", timeout=2).read()' \
    >/dev/null 2>&1
  then
    READY=true
    break
  fi

  sleep 2
done

if [ "${READY}" != true ]; then
  rollback
fi

if [ "${HAD_PREVIOUS}" = true ]; then
  docker rm -f "${PREVIOUS}" >/dev/null
fi

echo "PASS: Adaptive Parser deployment healthy"
