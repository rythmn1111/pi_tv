#!/usr/bin/env bash
# Open a service in its own window.
#   kiosk  - fullscreen, no browser UI at all (the streaming services)
#   window - maximised with a visible address bar (the general browser tile)
#
# Usage: pi-tv-launch.sh <url> [kiosk|window] [user-agent]
set -uo pipefail

URL="${1:?usage: pi-tv-launch.sh <url> [kiosk|window] [user-agent]}"
MODE="${2:-kiosk}"
UA="${3:-}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

# On a Mac this is only ever exercised while developing the launcher.
if [[ "$(uname -s)" == "Darwin" ]]; then
  open -na "Google Chrome" --args --app="$URL"
  exit 0
fi

# Anything already open gets closed first, so windows never stack up.
"$HERE/pi-tv-home.sh" >/dev/null 2>&1 || true

BROWSER="$(pi_tv_chromium)"
if [[ -z "$BROWSER" ]]; then
  echo "pi-tv: chromium not found" >&2
  exit 1
fi

mkdir -p "$PI_TV_SERVICE_PROFILE"

mapfile -t ARGS < <(pi_tv_common_flags)
ARGS+=(
  --user-data-dir="$PI_TV_SERVICE_PROFILE"
  --class=pi-tv-service
)
if [[ "$MODE" == "window" ]]; then
  # Chromium hides its toolbar in fullscreen, so a browsable window has to be
  # maximised rather than fullscreen or there is nowhere to type a URL.
  ARGS+=(--start-maximized)
else
  ARGS+=(--kiosk)
fi
[[ -n "$UA" ]] && ARGS+=(--user-agent="$UA")
ARGS+=("$URL")

exec "$BROWSER" "${ARGS[@]}" >/dev/null 2>&1
