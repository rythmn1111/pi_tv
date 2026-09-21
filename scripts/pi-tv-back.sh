#!/usr/bin/env bash
# One step back in history - out of a video, off a film's page.
# Bound to the remote's "e" button and its BACK key.
#
# This is a real history step, not a jump home: inside a YouTube video it
# returns you to the page you came from. At the start of history it falls
# back to the launcher so the button is never a dead end.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

[[ -f "$PI_TV_DESKTOP_FLAG" ]] && exit 0

pi_tv_cdp back 2>/dev/null || true
