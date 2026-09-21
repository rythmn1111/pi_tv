#!/usr/bin/env bash
# Diagnostic: press a button on the remote and see the name to bind it to.
#
# Remotes vary. If one of yours does not do what the README says it should,
# run this, press it, and use the printed keysym in ~/.config/labwc/rc.xml.
set -uo pipefail

echo "Press buttons on the remote. Ctrl-C when done."
echo "The name after 'sym' is what goes in a labwc <keybind key=\"...\">."
echo

if ! command -v libinput >/dev/null 2>&1; then
  echo "libinput not found: sudo apt install libinput-tools" >&2
  exit 1
fi

# Needs read access to /dev/input/event*, hence sudo.
sudo libinput debug-events --show-keycodes 2>/dev/null \
  | grep --line-buffered -E "KEYBOARD_KEY" \
  | sed -u -E 's/.*KEYBOARD_KEY\s+//; s/\s+$//'
