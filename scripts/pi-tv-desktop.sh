#!/usr/bin/env bash
# Toggle between the kiosk and the ordinary Raspberry Pi desktop.
# Bound to the remote's envelope button, and to Super+D.
#
# The desktop and taskbar run underneath the kiosk the whole time, so dropping
# out of kiosk mode is just a matter of getting our windows out of the way.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

if [[ -f "$PI_TV_DESKTOP_FLAG" ]]; then
  rm -f "$PI_TV_DESKTOP_FLAG"
  setsid "$HERE/pi-tv-kiosk.sh" >/dev/null 2>&1 &
  pi_tv_notify "Pi TV" "Back to the media center"
else
  : > "$PI_TV_DESKTOP_FLAG"
  # Stop the respawn loop *before* the window it watches, or the kiosk comes
  # straight back.
  pkill -f "pi-tv-kiosk.sh" 2>/dev/null || true
  sleep 0.3
  pkill -f -- "--class=pi-tv-launcher" 2>/dev/null || true
  pkill -f -- "--class=pi-tv-service" 2>/dev/null || true
  pi_tv_notify "Desktop mode" "Press the envelope button on the remote to return to Pi TV"
fi
