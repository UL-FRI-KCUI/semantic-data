#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

RMD_FILE="predstavitev.Rmd"
PORT="8000"
URL="http://127.0.0.1:${PORT}/predstavitev.html"
SERVER_PID=""

if [[ ! -f "$RMD_FILE" ]]; then
  echo "Napaka: datoteka $RMD_FILE ne obstaja v $SCRIPT_DIR"
  exit 1
fi

reload_chrome() {
  if command -v osascript >/dev/null 2>&1; then
    osascript -e 'tell application "Google Chrome" to tell active tab of front window to reload' 2>/dev/null || \
    osascript -e 'tell application "Google Chrome" to make new tab with properties {URL:"http://127.0.0.1:8000/predstavitev.html"}' 2>/dev/null || \
    open -a "Google Chrome" "$URL" 2>/dev/null || true
  else
    open "$URL" 2>/dev/null || true
  fi
}

render_and_refresh() {
  echo "[$(date '+%H:%M:%S')] Obnavljam HTML in PDF iz $RMD_FILE..."
  ./build_predstavitev.sh
  echo "[$(date '+%H:%M:%S')] Predstavitev je bila uspešno prevedena v HTML in PDF."
  reload_chrome
}

start_server() {
  if command -v http-server >/dev/null 2>&1; then
    echo "[$(date '+%H:%M:%S')] Zaganjam http-server na ${URL}"
    http-server . -p "$PORT" >/tmp/predstavitev_http.log 2>&1 &
    SERVER_PID=$!
  else
    echo "[$(date '+%H:%M:%S')] Ukaz http-server ni na voljo; uporabljam python3 -m http.server"
    python3 -m http.server "$PORT" >/tmp/predstavitev_http.log 2>&1 &
    SERVER_PID=$!
  fi

  for i in {1..30}; do
    if curl -fsS "$URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  echo "Napaka: strežnik se ni zagnal na ${URL}"
  exit 1
}

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

render_and_refresh
start_server

if command -v open >/dev/null 2>&1; then
  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL" 2>/dev/null || true
else
  echo "Chrome/Open ni na voljo; URL je pripravljen: ${URL}"
fi

echo "[$(date '+%H:%M:%S')] Strežnik teče in predstavitev je odprta v Chrome."
echo "[$(date '+%H:%M:%S')] Čakam na spremembe v $RMD_FILE..."

if command -v fswatch >/dev/null 2>&1; then
  fswatch -0 "$RMD_FILE" | while IFS= read -r -d '' _; do
    render_and_refresh
  done
else
  last_mtime=$(stat -f %m "$RMD_FILE")
  while true; do
    sleep 0.5
    current_mtime=$(stat -f %m "$RMD_FILE")
    if [[ "$current_mtime" != "$last_mtime" ]]; then
      last_mtime="$current_mtime"
      render_and_refresh
    fi
  done
fi
