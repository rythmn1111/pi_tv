#!/usr/bin/env bash
# Shared paths and Wayland session wiring. Sourced by every other script.
#
# These scripts get run from a systemd *user* service, which can start before
# the compositor exists, so nothing here may rely on an inherited environment.

PI_TV_DIR="${PI_TV_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PI_TV_PORT="${PI_TV_PORT:-3000}"
PI_TV_URL="${PI_TV_URL:-http://localhost:${PI_TV_PORT}}"

PI_TV_STATE="${PI_TV_STATE:-$HOME/.local/share/pi-tv}"
# Separate profiles keep the launcher immune to whatever a service does, and
# let us kill a service window without touching the launcher.
PI_TV_LAUNCHER_PROFILE="${PI_TV_LAUNCHER_PROFILE:-$PI_TV_STATE/profiles/launcher}"
PI_TV_SERVICE_PROFILE="${PI_TV_SERVICE_PROFILE:-$PI_TV_STATE/profiles/services}"

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"

pi_tv_chromium() {
  command -v chromium 2>/dev/null || command -v chromium-browser 2>/dev/null
}

# Flags shared by the launcher and every service window.
pi_tv_common_flags() {
  # Chromium's ozone default is X11, and it will bail with "Missing X server"
  # on a Wayland-only session no matter what WAYLAND_DISPLAY says, so the
  # backend has to be named explicitly.
  if [[ -S "$XDG_RUNTIME_DIR/${WAYLAND_DISPLAY:-}" ]]; then
    printf '%s\n' --ozone-platform=wayland
  fi
  printf '%s\n' \
    --no-first-run \
    --no-default-browser-check \
    --disable-session-crashed-bubble \
    --disable-infobars \
    --hide-crash-restore-bubble \
    --autoplay-policy=no-user-gesture-required \
    --disable-features=TranslateUI,Translate \
    --password-store=basic \
    --check-for-update-interval=31536000
}

pi_tv_wait_for_server() {
  local tries="${1:-120}"
  for _ in $(seq 1 "$tries"); do
    if curl -sf -o /dev/null "$PI_TV_URL"; then return 0; fi
    sleep 1
  done
  return 1
}
