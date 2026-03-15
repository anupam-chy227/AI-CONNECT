#!/usr/bin/env bash
set -e
API_HOST=${API_HOST:-http://localhost:3001}
WS_HOST=${WS_HOST:-ws://localhost:3001}
INTERNAL_TOKEN=${INTERNAL_TOKEN:-change_this_local_token}

echo "1) POST generate job"
job=$(curl -s -X POST "$API_HOST/api/generate" -H "Content-Type: application/json" -d @gen_request.json)
echo "generate response: $job"
job_id=$(echo "$job" | jq -r '.jobId')
if [ -z "$job_id" ] || [ "$job_id" == "null" ]; then
  echo "ERROR: no job_id"
  exit 2
fi
echo "job_id=$job_id"

echo "2) Poll status"
status=""
for i in {1..30}; do
  sleep 2
  s=$(curl -s "$API_HOST/api/media/status/$job_id")
  status=$(echo "$s" | jq -r '.status')
  echo "status=$status"
  if [ "$status" == "completed" ]; then
    break
  fi
done

if [ "$status" != "completed" ]; then
  echo "Job did not complete in time"
  exit 3
fi

echo "3) Check posts endpoint"
posts=$(curl -s "$API_HOST/api/posts?limit=5")
echo "$posts" | jq '.'

echo "4) WS test (manual - open localhost:5173)"
echo "Smoke test finished"

