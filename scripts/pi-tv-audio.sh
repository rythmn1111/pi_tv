#!/usr/bin/env bash
# Make sure sound actually has somewhere to go.
#
# If the Pi boots while the TV is off or still negotiating HDMI, no HDMI audio
# sink exists yet and WirePlumber settles on "Dummy Output" - everything looks
# fine, nothing is audible, and it stays that way until something re-probes.
# Turning the TV on later does not fix it on its own.
#
# Usage: pi-tv-audio.sh [--watch]
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

sink_name() {
  wpctl inspect @DEFAULT_AUDIO_SINK@ 2>/dev/null \
    | grep -m1 'node.description' | cut -d'"' -f2
}

is_dummy() {
  local name; name="$(sink_name)"
  [[ -z "$name" || "$name" == *"Dummy"* || "$name" == *"Auto Null"* ]]
}

recover() {
  systemctl --user restart wireplumber pipewire pipewire-pulse 2>/dev/null
  sleep 5
}

# Give the session a moment to bring PipeWire up before judging it.
sleep 4

for attempt in 1 2 3; do
  if ! is_dummy; then
    echo "pi-tv-audio: output is '$(sink_name)'"
    exit 0
  fi
  echo "pi-tv-audio: stuck on a dummy sink, re-probing ($attempt/3)" >&2
  recover
done

if is_dummy; then
  echo "pi-tv-audio: still no real output - is the TV on and on the right input?" >&2
  exit 1
fi
