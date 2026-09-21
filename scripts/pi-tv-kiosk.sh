#!/usr/bin/env bash
# Boot entry point: wait for the web server, then show the launcher fullscreen.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

BROWSER="$(pi_tv_chromium)"
if [[ -z "$BROWSER" ]]; then
  echo "pi-tv: chromium not found" >&2
  exit 1
fi

if ! pi_tv_wait_for_server 150; then
  echo "pi-tv: $PI_TV_URL never came up" >&2
  exit 1
fi

mkdir -p "$PI_TV_LAUNCHER_PROFILE"

# A crashed kiosk should come straight back rather than dumping the user on
# an empty desktop, so respawn in a loop.
while true; do
  mapfile -t ARGS < <(pi_tv_common_flags)
  ARGS+=(
    --user-data-dir="$PI_TV_LAUNCHER_PROFILE"
    --class=pi-tv-launcher
    --kiosk
    "$PI_TV_URL"
  )
  "$BROWSER" "${ARGS[@]}" >/dev/null 2>&1
  sleep 2
done
