#!/usr/bin/env bash
# Runs the on-screen volume bar. wob is a layer-shell client, so it paints
# above fullscreen Chromium - the desktop panel's own indicator does not.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

command -v wob >/dev/null 2>&1 || { echo "pi-tv: wob not installed, no OSD" >&2; exit 0; }

# A stale pipe from a previous session would silently swallow every value.
rm -f "$PI_TV_OSD_FIFO"
mkfifo "$PI_TV_OSD_FIFO"

CONFIG="$PI_TV_DIR/config/wob.ini"
ARGS=()
[[ -f "$CONFIG" ]] && ARGS=(--config "$CONFIG")

# `tail -f` keeps the pipe open across writers, so wob survives between key
# presses instead of exiting on the first EOF.
exec tail -f "$PI_TV_OSD_FIFO" | wob "${ARGS[@]}"
