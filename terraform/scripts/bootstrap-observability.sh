#!/bin/bash
set -euo pipefail

ELASTIC_VERSION="9.5.0"
OBS_DIR="/opt/eventsync-observability"
LOGSTASH_PIPELINE_DIR="${OBS_DIR}/logstash/pipeline"

echo "===== SYSTEM UPDATE ====="
dnf update -y

echo "===== INSTALL DOCKER ====="
dnf install -y docker

systemctl enable --now docker

echo "===== ELASTICSEARCH KERNEL SETTING ====="
cat > /etc/sysctl.d/99-elasticsearch.conf <<'SYSCTL'
vm.max_map_count=262144
SYSCTL

sysctl --system

echo "===== OBSERVABILITY DIRECTORIES ====="
mkdir -p "${LOGSTASH_PIPELINE_DIR}"

echo "===== LOGSTASH PIPELINE ====="
echo "__EVENTSYNC_LOGSTASH_PIPELINE_B64__" | base64 -d > "${LOGSTASH_PIPELINE_DIR}/logstash.conf"

echo "===== DOCKER NETWORK ====="
docker network inspect eventsync-observability >/dev/null 2>&1 || \
docker network create eventsync-observability

echo "===== ELASTICSEARCH ====="
docker rm -f eventsync-elasticsearch >/dev/null 2>&1 || true

docker run -d \
  --name eventsync-elasticsearch \
  --network eventsync-observability \
  --restart unless-stopped \
  -p 127.0.0.1:9200:9200 \
  -e discovery.type=single-node \
  -e xpack.security.enabled=false \
  -e ES_JAVA_OPTS="-Xms2g -Xmx2g" \
  -v eventsync-elasticsearch-data:/usr/share/elasticsearch/data \
  "docker.elastic.co/elasticsearch/elasticsearch:${ELASTIC_VERSION}"

echo "===== WAIT FOR ELASTICSEARCH ====="
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:9200 >/dev/null 2>&1; then
    break
  fi

  sleep 5
done

curl -fsS http://127.0.0.1:9200 >/dev/null

echo "===== LOGSTASH ====="
docker rm -f eventsync-logstash >/dev/null 2>&1 || true

docker run -d \
  --name eventsync-logstash \
  --network eventsync-observability \
  --restart unless-stopped \
  -p 5044:5044 \
  -e LS_JAVA_OPTS="-Xms512m -Xmx512m" \
  -v "${LOGSTASH_PIPELINE_DIR}:/usr/share/logstash/pipeline:ro" \
  "docker.elastic.co/logstash/logstash:${ELASTIC_VERSION}"

echo "===== KIBANA ====="
docker rm -f eventsync-kibana >/dev/null 2>&1 || true

docker run -d \
  --name eventsync-kibana \
  --network eventsync-observability \
  --restart unless-stopped \
  -p 127.0.0.1:5601:5601 \
  -e 'ELASTICSEARCH_HOSTS=["http://eventsync-elasticsearch:9200"]' \
  -e XPACK_SECURITY_ENABLED=false \
  -e NODE_OPTIONS="--max-old-space-size=768" \
  "docker.elastic.co/kibana/kibana:${ELASTIC_VERSION}"

echo "===== BOOTSTRAP COMPLETE ====="
docker ps
