#!/bin/bash
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 <registry> <repository> <tag> <region>"
  exit 2
fi

REGISTRY="$1"
REPOSITORY="$2"
TAG="$3"
AWS_REGION="$4"

SECRET_NAME="eventsync-adaptive-parser-providers"
REMOTE_SCRIPT="/tmp/eventsync-deploy-adaptive-parser.sh"

echo "===== FIND OBSERVABILITY HOST ====="

INSTANCE_ID="$(
  aws ec2 describe-instances \
    --region "${AWS_REGION}" \
    --filters \
      "Name=tag:Project,Values=EventSync" \
      "Name=tag:Environment,Values=dev" \
      "Name=tag:Role,Values=observability" \
      "Name=instance-state-name,Values=running" \
    --query 'Reservations[].Instances[].InstanceId' \
    --output text
)"

if [ -z "${INSTANCE_ID}" ]; then
  echo "ERROR: no running EventSync observability instance found"
  exit 1
fi

if [ "$(wc -w <<< "${INSTANCE_ID}")" -ne 1 ]; then
  echo "ERROR: expected exactly one observability instance"
  exit 1
fi

echo "Observability instance: ${INSTANCE_ID}"

echo "===== PREPARE SSM DEPLOYMENT ====="

SCRIPT_B64="$(
  base64 -w 0 terraform/scripts/deploy-adaptive-parser.sh
)"

REMOTE_COMMAND="echo '${SCRIPT_B64}' | base64 -d > '${REMOTE_SCRIPT}' && \
chmod 700 '${REMOTE_SCRIPT}' && \
'${REMOTE_SCRIPT}' '${REGISTRY}' '${REPOSITORY}' '${TAG}' '${AWS_REGION}' '${SECRET_NAME}'"

COMMAND_ID="$(
  aws ssm send-command \
    --region "${AWS_REGION}" \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters commands="${REMOTE_COMMAND}" \
    --comment "Deploy EventSync Adaptive Parser ${TAG}" \
    --query 'Command.CommandId' \
    --output text
)"

echo "SSM command: ${COMMAND_ID}"

echo "===== WAIT FOR SSM ====="

if ! aws ssm wait command-executed \
  --region "${AWS_REGION}" \
  --command-id "${COMMAND_ID}" \
  --instance-id "${INSTANCE_ID}"
then
  echo "ERROR: Adaptive Parser SSM deployment failed"

  aws ssm get-command-invocation \
    --region "${AWS_REGION}" \
    --command-id "${COMMAND_ID}" \
    --instance-id "${INSTANCE_ID}" \
    --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}' \
    --output json

  exit 1
fi

STATUS="$(
  aws ssm get-command-invocation \
    --region "${AWS_REGION}" \
    --command-id "${COMMAND_ID}" \
    --instance-id "${INSTANCE_ID}" \
    --query 'Status' \
    --output text
)"

if [ "${STATUS}" != "Success" ]; then
  echo "ERROR: SSM finished with status ${STATUS}"
  exit 1
fi

echo "PASS: Adaptive Parser deployed through SSM"
