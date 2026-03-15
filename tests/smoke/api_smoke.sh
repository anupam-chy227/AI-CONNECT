#!/usr/bin/env bash
set -e
API_HOST=${API_HOST:-http://localhost:3001}
WS_HOST=${WS_HOST:-ws://localhost:3001}
INTERNAL_TOKEN=${INTERNAL_TOKEN:-dev_internal_token_secret}

echo "1) POST /api/generate"
job=$(curl -s -X POST "$API_HOST/api/generate" -H "Content-Type: application/json" -d @./gen_request.json)
echo "generate response: $job"
job_id=$(echo "$job" | jq -r '.job_id')
if [ -z "$job_id" ] || [ "$job_id" == "null" ]; then
  echo "ERROR: no job_id"
  exit 2
fi
echo "job_id=$job_id"

echo "2) Poll status (30 attempts, 2s each)"
status=""
for i in {1..30}; do
  sleep 2
  s=$(curl -s "$API_HOST/api/media/status/$job_id")
  status=$(echo "$s" | jq -r '.status')
  echo "status=$status"
  if [ "$status" == "completed" ]; then
    media_urls=$(echo "$s" | jq -r '.media_urls | join(",")')
    echo "media_urls: $media_urls"
    break
  fi
done

if [ "$status" != "completed" ]; then
  echo "Job did not complete in time (status: $status)"
  echo "Full response: $s"
  exit 3
fi

echo "3) Check /api/posts endpoint (recent posts)"
posts=$(curl -s "$API_HOST/api/posts?limit=5")
echo "$posts" | jq -r '.'

echo "4) Connect WS and listen for post.created (10s timeout)"
timeout 10 node - <<'NODE' || true
const io = require('socket.io-client');
const WS_HOST = process.env.WS_HOST || 'ws://localhost:3001';
const token = 'demo-token'; // Replace with valid JWT if auth required

console.log('[WS] Connecting to', WS_HOST);
const socket = io(WS_HOST, {
  auth: { token },
  reconnection: true,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('[WS] Connected');
});

socket.on('post:created', (post) => {
  console.log('[WS] post:created event:', post);
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('[WS] Error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.log('[WS] Timeout - no post:created event received');
  socket.disconnect();
  process.exit(2);
}, 10000);
NODE

echo "✓ Smoke test completed"
