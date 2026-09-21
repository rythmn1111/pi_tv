#!/usr/bin/env bash
# Shared paths and Wayland session wiring. Sourced by every other script.
#
# These scripts get run from a systemd *user* service and from labwc keybinds,
# neither of which can be relied on for an inherited environment.

PI_TV_DIR="${PI_TV_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PI_TV_PORT="${PI_TV_PORT:-3000}"
PI_TV_URL="${PI_TV_URL:-http://localhost:${PI_TV_PORT}}"

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
export PATH="$HOME/.bun/bin:$PATH"

PI_TV_STATE="${PI_TV_STATE:-$HOME/.local/share/pi-tv}"

# Your ordinary Chromium profile, deliberately. One profile means the
# extensions and sign-ins you already have apply to everything Pi TV opens.
# The cost is that there is only ever one browser process, so navigation is
# done over the DevTools protocol rather than by spawning and killing windows.
PI_TV_PROFILE="${PI_TV_PROFILE:-$HOME/.config/chromium}"
PI_TV_DEBUG_PORT="${PI_TV_DEBUG_PORT:-9222}"

# Named pipe feeding the on-screen volume bar; absent means no OSD, which
# every caller treats as fine.
PI_TV_OSD_FIFO="${PI_TV_OSD_FIFO:-$XDG_RUNTIME_DIR/pi-tv-osd.fifo}"

# Set while the user has dropped to the ordinary desktop. Lives in the runtime
# dir so a reboot always comes back up in kiosk mode.
PI_TV_DESKTOP_FLAG="${PI_TV_DESKTOP_FLAG:-$XDG_RUNTIME_DIR/pi-tv-desktop-mode}"

pi_tv_chromium() {
  command -v chromium 2>/dev/null || command -v chromium-browser 2>/dev/null
}

pi_tv_cdp() {
  command -v bun >/dev/null 2>&1 || return 1
  PI_TV_URL="$PI_TV_URL" PI_TV_DEBUG_PORT="$PI_TV_DEBUG_PORT" \
    bun "$PI_TV_DIR/scripts/pi-tv-cdp.ts" "$@"
}

# Flags shared by every window we open.
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

# SingletonLock is a symlink to host-PID. A stale one left by a crash stops
# Chromium starting at all, so clear it only when the PID is really gone.
pi_tv_clear_stale_lock() {
  local lock="$PI_TV_PROFILE/SingletonLock" target pid
  [[ -L "$lock" ]] || return 0
  target="$(readlink "$lock")"
  pid="${target##*-}"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    return 0   # genuinely in use
  fi
  rm -f "$PI_TV_PROFILE/SingletonLock" \
        "$PI_TV_PROFILE/SingletonSocket" \
        "$PI_TV_PROFILE/SingletonCookie"
}

# wf-panel-pi owns org.freedesktop.Notifications, so this shows a real toast
# on the desktop. Silently does nothing if libnotify is not installed.
pi_tv_notify() {
  command -v notify-send >/dev/null 2>&1 || return 0
  notify-send --app-name="Pi TV" --expire-time=5000 "$1" "${2:-}" 2>/dev/null || true
}

pi_tv_wait_for_server() {
  local tries="${1:-120}"
  for _ in $(seq 1 "$tries"); do
    if curl -sf -o /dev/null "$PI_TV_URL"; then return 0; fi
    sleep 1
  done
  return 1
}
