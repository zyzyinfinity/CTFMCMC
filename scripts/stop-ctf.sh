#!/usr/bin/env bash
cd "$(dirname "$0")/.."
if [ -f .ctf.pid ] && P=$(cat .ctf.pid) && kill -0 "$P" 2>/dev/null \
   && ps -p "$P" -o args= | grep -q "http.server"; then
  kill "$P" && echo "Stopped ($P)"
else
  echo "Not running"
fi
rm -f .ctf.pid .ctf.info
