#!/usr/bin/env bash
# One-shot setup on the Raspberry Pi:
#   web server as a systemd user service -> Chromium kiosk on login ->
#   a global hotkey that gets you back to the launcher from inside any service.
#
# Safe to re-run; every step is idempotent.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
PORT="${PI_TV_PORT:-3000}"
UNIT_DIR="$HOME/.config/systemd/user"
LABWC_DIR="$HOME/.config/labwc"
STATE="$HOME/.local/share/pi-tv"

say() { printf '\n\033[1;35m▸ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn(){ printf '  \033[33m!\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------- bun --------
say "Runtime"
if ! command -v bun >/dev/null 2>&1 && [[ ! -x "$HOME/.bun/bin/bun" ]]; then
  ok "installing bun"
  curl -fsSL https://bun.sh/install | bash >/dev/null
fi
BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
[[ -x "$BUN" ]] || { echo "bun install failed"; exit 1; }
ok "bun $("$BUN" --version) at $BUN"

command -v chromium >/dev/null 2>&1 || command -v chromium-browser >/dev/null 2>&1 \
  || { echo "chromium is required: sudo apt install chromium"; exit 1; }
ok "chromium present"

# playerctl drives playback over MPRIS; wob draws the volume bar on the
# layer-shell so it is visible over a fullscreen player. Both optional.
MISSING=()
command -v playerctl >/dev/null 2>&1 || MISSING+=(playerctl)
command -v wob >/dev/null 2>&1 || MISSING+=(wob)
command -v notify-send >/dev/null 2>&1 || MISSING+=(libnotify-bin)
command -v wpctl >/dev/null 2>&1 || MISSING+=(wireplumber)
if (( ${#MISSING[@]} )); then
  if sudo -n true 2>/dev/null; then
    sudo -n apt-get install -y "${MISSING[@]}" >/dev/null 2>&1 \
      && ok "installed ${MISSING[*]}" || warn "could not install ${MISSING[*]}"
  else
    warn "remote media keys need: sudo apt install ${MISSING[*]}"
  fi
else
  ok "playerctl + wob present"
fi

# ---------------------------------------------------------------- build ------
say "Building the launcher"
cd "$REPO"
"$BUN" install --frozen-lockfile 2>/dev/null || "$BUN" install
"$BUN" run build
ok "built"

# ------------------------------------------------------------- profiles ------
say "Browser profiles"
mkdir -p "$STATE/profiles/launcher" "$STATE/profiles/services"
# Reuse the Widevine CDM the system Chromium already fetched, so DRM playback
# works on the very first launch instead of after a component update.
for SRC in "$HOME/.config/chromium/WidevineCdm" /opt/WidevineCdm; do
  if [[ -d "$SRC" && ! -d "$STATE/profiles/services/WidevineCdm" ]]; then
    cp -r "$SRC" "$STATE/profiles/services/WidevineCdm" 2>/dev/null && ok "seeded Widevine from $SRC" && break
  fi
done
[[ -d "$STATE/profiles/services/WidevineCdm" ]] || warn "no Widevine CDM found - DRM services may not play"

# A TV has no business asking about the camera. Seed each profile's content
# settings to "block" so the desktop portal never throws a modal over a film.
python3 "$HERE/seed-profile-prefs.py" "$STATE/profiles/launcher" "$STATE/profiles/services" \
  && ok "camera / mic / notification prompts blocked" \
  || warn "could not seed profile preferences"

# -------------------------------------------------------------- systemd ------
say "Web server service"
mkdir -p "$UNIT_DIR"
cat > "$UNIT_DIR/pi-tv.service" <<UNIT
[Unit]
Description=Pi TV media center launcher
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$REPO
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=0.0.0.0
ExecStart=$BUN run start
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
UNIT

# Lingering lets the server come up at boot rather than waiting for a login,
# which also means it stays reachable over SSH if the display never starts.
loginctl enable-linger "$USER" >/dev/null 2>&1 || warn "could not enable linger"
systemctl --user daemon-reload
systemctl --user enable pi-tv.service >/dev/null
systemctl --user restart pi-tv.service
ok "pi-tv.service enabled on port $PORT"

# ------------------------------------------------------------- autostart -----
say "Kiosk on login"
mkdir -p "$LABWC_DIR"
# A user autostart *replaces* the system one, so start from a copy or the
# desktop, panel and display config all disappear.
if [[ ! -f "$LABWC_DIR/autostart" ]]; then
  cp /etc/xdg/labwc/autostart "$LABWC_DIR/autostart" 2>/dev/null || touch "$LABWC_DIR/autostart"
  ok "seeded autostart from system defaults"
fi
if ! grep -q "pi-tv-kiosk.sh" "$LABWC_DIR/autostart"; then
  printf '\n# Pi TV media center\n%s/scripts/pi-tv-kiosk.sh &\n' "$REPO" >> "$LABWC_DIR/autostart"
fi
if ! grep -q "pi-tv-osd.sh" "$LABWC_DIR/autostart"; then
  printf '%s/scripts/pi-tv-osd.sh &\n' "$REPO" >> "$LABWC_DIR/autostart"
fi
ok "kiosk + volume OSD added to labwc autostart"

# -------------------------------------------------------------- keybinds -----
say "Remote + keyboard hotkeys"
[[ -f "$LABWC_DIR/rc.xml" ]] || cp /etc/xdg/labwc/rc.xml "$LABWC_DIR/rc.xml"
python3 "$HERE/labwc-keybinds.py" "$LABWC_DIR/rc.xml" "$HERE"
ok "hotkeys written to $LABWC_DIR/rc.xml"

# --------------------------------------------------------------- blanking ----
say "Display"
if sudo -n true 2>/dev/null; then
  sudo -n raspi-config nonint do_blanking 1 >/dev/null 2>&1 \
    && ok "screen blanking disabled" || warn "could not change blanking"
else
  warn "skipped blanking (needs sudo); run: sudo raspi-config nonint do_blanking 1"
fi

# ------------------------------------------------------------------ done -----
say "Done"
cat <<DONE
  Launcher      $(hostname -I 2>/dev/null | awk '{print $1}'):$PORT  (also http://localhost:$PORT)
  Service       systemctl --user status pi-tv
  Logs          journalctl --user -u pi-tv -f
  Back home     Super+Escape, or the remote's house button, from anywhere
  Remote keys   volume / mute / play-pause / next / prev all work in-app
  Desktop       the remote's envelope button toggles kiosk <-> desktop
  Unknown key?  ./scripts/pi-tv-remote-keys.sh and press it

  Reload the compositor to pick up the hotkey and autostart:
    kill -HUP \$(pgrep -x labwc)      # hotkeys only
    sudo systemctl restart lightdm    # full restart, takes you to the kiosk
DONE
