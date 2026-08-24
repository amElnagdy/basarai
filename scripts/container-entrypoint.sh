#!/usr/bin/env bash
set -e

BACKEND_PID=""
FRONTEND_PID=""
SHUTDOWN=0

cleanup() {
    echo "Received shutdown signal, cleaning up..."
    SHUTDOWN=1
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    echo "Cleanup complete."
    exit "${1:-1}"
}

trap 'cleanup' SIGTERM SIGINT

MISSING_VARS=""
[ -z "$SUPABASE_URL" ] && MISSING_VARS="$MISSING_VARS SUPABASE_URL"
[ -z "$SUPABASE_SECRET_KEY" ] && MISSING_VARS="$MISSING_VARS SUPABASE_SECRET_KEY"
[ -z "$CLERK_SECRET_KEY" ] && MISSING_VARS="$MISSING_VARS CLERK_SECRET_KEY"
[ -z "$CLERK_ISSUER" ] && MISSING_VARS="$MISSING_VARS CLERK_ISSUER"
[ -z "$CLERK_AUTHORIZED_PARTIES" ] && MISSING_VARS="$MISSING_VARS CLERK_AUTHORIZED_PARTIES"

if [ -n "$MISSING_VARS" ]; then
    echo "ERROR: Missing required environment variables:$MISSING_VARS"
    echo "Please set all required variables: SUPABASE_URL, SUPABASE_SECRET_KEY, CLERK_SECRET_KEY, CLERK_ISSUER, CLERK_AUTHORIZED_PARTIES"
    exit 1
fi

BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

echo "Starting backend on ${BACKEND_HOST}:${BACKEND_PORT}..."
cd /app/backend
uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" &
BACKEND_PID=$!

echo "Waiting for backend to be ready..."
TIMEOUT=30
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    [ "$SHUTDOWN" -eq 1 ] && exit 1
    if python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${BACKEND_PORT}/health')" 2>/dev/null; then
        echo "Backend is ready."
        break
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "ERROR: Backend failed to start within ${TIMEOUT} seconds"
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    exit 1
fi

echo "Starting frontend on port ${FRONTEND_PORT}..."
cd /app/frontend
export NEXT_SERVER_API_URL="http://127.0.0.1:${BACKEND_PORT}"
HOSTNAME=0.0.0.0 PORT="$FRONTEND_PORT" node server.js &
FRONTEND_PID=$!

echo "Both services started. Monitoring processes..."
set +e
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?
set -e

cleanup "$EXIT_CODE"
