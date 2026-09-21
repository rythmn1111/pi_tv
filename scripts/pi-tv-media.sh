#!/usr/bin/env bash
# Volume and playback control for the remote's media keys. Bound in labwc so
# it works everywhere, including inside a fullscreen Netflix window where the
# launcher is not listening for keys.
#
# Usage: pi-tv-media.sh volume-up|volume-down|mute|play-pause|next|previous|stop|forward|rewind
set -uo pipefail

ACTION="${1:?usage: pi-tv-media.sh <action>}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

SINK="@DEFAULT_AUDIO_SINK@"
STEP="${PI_TV_VOLUME_STEP:-5}"
SEEK="${PI_TV_SEEK_SECONDS:-10}"

# Chromium publishes each tab as chromium.instanceNNNN over MPRIS; prefer it,
# but fall back to whatever else is playing.
PLAYER=(--player=chromium,firefox,%any)

# Feed the on-screen bar, if one is running. Never block on a pipe with no
# reader - the OSD is optional decoration.
osd() {
  [[ -p "$PI_TV_OSD_FIFO" ]] || return 0
  timeout 0.3 bash -c "printf '%s\n' '$1' > '$PI_TV_OSD_FIFO'" 2>/dev/null || true
}

volume_pct() {
  local out
  out="$(wpctl get-volume "$SINK" 2>/dev/null)" || return 1
  # "Volume: 0.35" or "Volume: 0.35 [MUTED]"
  [[ "$out" == *MUTED* ]] && { printf '0\n'; return 0; }
  awk '{ printf "%d\n", ($2 * 100) + 0.5 }' <<<"$out"
}

# A dummy sink means the TV was off when the session started. Reaching for
# the volume is a good signal that someone is listening now.
case "$ACTION" in
  volume-up|volume-down|mute)
    desc="$(wpctl inspect @DEFAULT_AUDIO_SINK@ 2>/dev/null | grep -m1 'node.description' | cut -d'"' -f2)"
    if [[ -z "$desc" || "$desc" == *Dummy* || "$desc" == *"Auto Null"* ]]; then
      "$HERE/pi-tv-audio.sh" >/dev/null 2>&1 &
    fi
    ;;
esac

case "$ACTION" in
  volume-up)
    wpctl set-mute "$SINK" 0 2>/dev/null
    wpctl set-volume -l 1.0 "$SINK" "${STEP}%+" && osd "$(volume_pct)"
    ;;
  volume-down)
    wpctl set-volume "$SINK" "${STEP}%-" && osd "$(volume_pct)"
    ;;
  mute)
    wpctl set-mute "$SINK" toggle && osd "$(volume_pct)"
    ;;
  play-pause) playerctl "${PLAYER[@]}" play-pause ;;
  next)       playerctl "${PLAYER[@]}" next ;;
  previous)   playerctl "${PLAYER[@]}" previous ;;
  stop)       playerctl "${PLAYER[@]}" stop ;;
  # Netflix and friends do not always implement MPRIS Seek; failing here is
  # harmless, the key just does nothing on those sites.
  forward)    playerctl "${PLAYER[@]}" position "${SEEK}+" ;;
  rewind)     playerctl "${PLAYER[@]}" position "${SEEK}-" ;;
  *)
    echo "pi-tv-media: unknown action '$ACTION'" >&2
    exit 2
    ;;
esac
