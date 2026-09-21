#!/usr/bin/env bash
# Undo install.sh. Leaves the repo and your browser profiles in place.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
LABWC_DIR="$HOME/.config/labwc"

systemctl --user disable --now pi-tv.service 2>/dev/null
rm -f "$HOME/.config/systemd/user/pi-tv.service"
systemctl --user daemon-reload

if [[ -f "$LABWC_DIR/autostart" ]]; then
  grep -v "pi-tv-kiosk.sh" "$LABWC_DIR/autostart" | grep -v "^# Pi TV media center$" \
    > "$LABWC_DIR/autostart.tmp" && mv "$LABWC_DIR/autostart.tmp" "$LABWC_DIR/autostart"
fi

if [[ -f "$LABWC_DIR/rc.xml" ]]; then
  python3 - "$LABWC_DIR/rc.xml" <<'PY'
import sys
import xml.etree.ElementTree as ET
NS = "http://openbox.org/3.4/rc"
ET.register_namespace("", NS)
q = lambda t: f"{{{NS}}}{t}"
tree = ET.parse(sys.argv[1]); root = tree.getroot()
kb = root.find(q("keyboard"))
if kb is not None:
    for bind in list(kb.findall(q("keybind"))):
        if any((c.text or "").strip().endswith("pi-tv-home.sh") for c in bind.iter(q("command"))):
            kb.remove(bind)
    ET.indent(tree, space="  ")
    tree.write(sys.argv[1], encoding="UTF-8", xml_declaration=True)
PY
fi

pkill -f "pi-tv-kiosk.sh" 2>/dev/null
pkill -f -- "--class=pi-tv-launcher" 2>/dev/null
pkill -f -- "--class=pi-tv-service" 2>/dev/null

echo "Pi TV removed. Repo left at $REPO"
echo "Profiles left at $HOME/.local/share/pi-tv (delete by hand if you want them gone)"
