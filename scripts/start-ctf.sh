#!/usr/bin/env bash
# Usage: ./scripts/start-ctf.sh [--lan] [--rebuild]   (default: bind 127.0.0.1 only)
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out-build; PID=.ctf.pid; INFO=.ctf.info
BIND=127.0.0.1; REBUILD=0
for a in "$@"; do case $a in --lan) BIND=0.0.0.0;; --rebuild) REBUILD=1;; esac; done

if [ -f "$PID" ] && kill -0 "$(cat $PID)" 2>/dev/null; then
  echo "Already running: $(cat $INFO)"; exit 0
fi
rm -f "$PID" "$INFO"

if [ "$REBUILD" = 1 ] || [ ! -f "$DIR/index.html" ]; then
  command -v npm >/dev/null || { echo "No $DIR/ and npm missing"; exit 1; }
  [ -d node_modules ] || npm install
  STATIC_EXPORT=1 npx next build
fi
command -v python3 >/dev/null || { echo "python3 required"; exit 1; }

port_free() { python3 -c "import socket,sys;s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('$BIND',$1))" 2>/dev/null; }
PORT=4300
while ! port_free $PORT; do PORT=$((PORT+1)); [ $PORT -gt 4399 ] && { echo "No free port 4300-4399"; exit 1; }; done

nohup python3 -m http.server "$PORT" --bind "$BIND" --directory "$DIR" >.ctf.log 2>&1 &
echo $! >"$PID"
sleep 1
kill -0 "$(cat $PID)" 2>/dev/null || { echo "Failed, see .ctf.log"; rm -f "$PID"; exit 1; }

MSG="http://127.0.0.1:$PORT"
if [ "$BIND" = 0.0.0.0 ]; then
  IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
  MSG="$MSG  |  LAN: http://${IP:-<LAN-IP>}:$PORT  (LAN-only; unauthenticated)"
fi
echo "$MSG" | tee "$INFO"
