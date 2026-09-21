#!/usr/bin/env bash
# Copy your everyday Chromium profile into Pi TV's service profile, so the
# extensions and sign-ins you already have apply to Netflix, YouTube and the
# rest.
#
# Pi TV runs its services in a separate --user-data-dir so that closing one
# with the home button cannot take the launcher down with it. The cost of that
# isolation is that it starts out empty; this fills it in.
#
# Usage: pi-tv-import-profile.sh [source-profile]   (default ~/.config/chromium)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-tv-env.sh
source "$HERE/pi-tv-env.sh"

SRC="${1:-$HOME/.config/chromium}"
DEST="$PI_TV_SERVICE_PROFILE"

die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$*"; }

[[ -d "$SRC" ]] || die "no profile at $SRC"

# Copying a live profile catches half-written databases. SingletonLock is a
# symlink to host-PID, so check the PID rather than trusting a stale link.
if [[ -L "$SRC/SingletonLock" ]]; then
  target="$(readlink "$SRC/SingletonLock")"
  pid="${target##*-}"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    die "Chromium is running with $SRC (pid $pid). Close that window and retry."
  fi
fi

# Our own service window has the destination open.
pkill -f -- "--user-data-dir=$DEST" 2>/dev/null && sleep 1

if [[ -d "$DEST" ]]; then
  BACKUP="$DEST.bak-$(date +%Y%m%d-%H%M%S)"
  mv "$DEST" "$BACKUP"
  ok "existing profile moved to $BACKUP"
fi

mkdir -p "$(dirname "$DEST")"
cp -a "$SRC" "$DEST" || die "copy failed"
# These reference the old path and PID; leaving them makes Chromium think
# another instance owns the profile.
rm -f "$DEST/SingletonLock" "$DEST/SingletonSocket" "$DEST/SingletonCookie"
ok "copied $(du -sh "$DEST" | cut -f1) from $SRC"

# The copy brought the source profile's permission settings with it; put ours
# back so a film is never interrupted by a camera prompt.
python3 "$HERE/seed-profile-prefs.py" "$DEST" && ok "permission prompts re-blocked"

echo
echo "Extensions now in the service profile:"
python3 - "$DEST" <<'PY'
import json, pathlib, sys

root = pathlib.Path(sys.argv[1]) / "Default" / "Extensions"
if not root.is_dir():
    print("  (none)")
    raise SystemExit

for ext in sorted(root.iterdir()):
    manifests = sorted(ext.glob("*/manifest.json"))
    if not manifests:
        continue
    m = json.load(open(manifests[0]))
    name = m.get("name", "?")
    if name.startswith("__MSG_"):
        key = name[6:-2]
        for loc in (m.get("default_locale", "en"), "en", "en_US"):
            f = manifests[0].parent / "_locales" / loc / "messages.json"
            if f.exists():
                entry = json.load(open(f)).get(key) or json.load(open(f)).get(key.lower())
                if entry:
                    name = entry.get("message", name)
                    break
    print(f"  {name} v{m.get('version')}")
PY

echo
echo "Note: this is a snapshot, not a sync. Install extensions from the"
echo "Browser tile afterwards and they land in the service profile directly."
