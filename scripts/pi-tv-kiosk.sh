#!/usr/bin/env bash
# Boot entry point: wait for the web server, then show the launcher fullscreen.
#
# One window, on your ordinary Chromium profile, so every extension you have
# installed applies to Netflix, YouTube and everything else Pi TV opens.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

rm -f "$PI_TV_DESKTOP_FLAG"

BROWSER="$(pi_tv_chromium)"
[[ -n "$BROWSER" ]] || { echo "pi-tv: chromium not found" >&2; exit 1; }

if ! pi_tv_wait_for_server 150; then
  echo "pi-tv: $PI_TV_URL never came up" >&2
  exit 1
fi

# A crashed kiosk should come straight back rather than dumping the user on
# an empty desktop, so respawn in a loop.
while true; do
  pi_tv_clear_stale_lock

  mapfile -t ARGS < <(pi_tv_common_flags)
  ARGS+=(
    --user-data-dir="$PI_TV_PROFILE"
    --class=pi-tv
    --kiosk
    --homepage="$PI_TV_URL"
    # Bound to 127.0.0.1. This is how the home and back keys steer the window;
    # --kiosk suppresses the usual accelerators, so asking the browser
    # directly is the only reliable route.
    --remote-debugging-port="$PI_TV_DEBUG_PORT"
    "$PI_TV_URL"
  )
  "$BROWSER" "${ARGS[@]}" >/dev/null 2>&1
  sleep 2
done
