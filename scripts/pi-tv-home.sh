#!/usr/bin/env bash
# Back to the launcher from wherever you are.
# Bound to the remote's house button, and to Super+Escape.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

# While the user is on the ordinary desktop, these keys belong to whatever
# they are doing - only the envelope button leaves that mode.
[[ -f "$PI_TV_DESKTOP_FLAG" ]] && exit 0

# Closes any extra window (the Browser tile opens one) and points the kiosk
# window back at the launcher.
if ! pi_tv_cdp home 2>/dev/null; then
  # The browser is not up at all - start it.
  pgrep -f "pi-tv-kiosk.sh" >/dev/null 2>&1 || setsid "$HERE/pi-tv-kiosk.sh" >/dev/null 2>&1 &
fi
