#!/usr/bin/env bash
# Close whatever service window is open and fall back to the launcher.
# Bound to Super+Escape (and friends) so it works from inside Netflix et al.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

# While the user is on the ordinary desktop, the home and back keys belong to
# whatever they are doing - only the envelope button leaves that mode.
[[ -f "$PI_TV_DESKTOP_FLAG" ]] && exit 0

# Matching on the profile path only ever hits service windows - the launcher
# runs out of a different profile directory and is left alone.
pkill -f -- "--user-data-dir=$PI_TV_SERVICE_PROFILE" 2>/dev/null || true

# If the launcher died at some point, bring it back rather than leaving a
# blank screen behind.
sleep 0.4
if ! pgrep -f -- "--user-data-dir=$PI_TV_LAUNCHER_PROFILE" >/dev/null 2>&1; then
  setsid "$HERE/pi-tv-kiosk.sh" >/dev/null 2>&1 &
fi
