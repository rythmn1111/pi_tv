#!/usr/bin/env python3
"""Install Pi TV's global hotkeys into a labwc rc.xml.

labwc reads one rc.xml, so a user file has to be a *copy* of the system one
with our bindings merged in - otherwise the desktop loses every default.
Idempotent: re-running replaces our bindings instead of stacking them.

Usage: labwc-keybinds.py <rc.xml> <scripts-dir>
"""
import sys
import xml.etree.ElementTree as ET

NS = "http://openbox.org/3.4/rc"
ET.register_namespace("", NS)  # keep the default xmlns when writing back


def q(tag: str) -> str:
    return f"{{{NS}}}{tag}"


# Every way back to the launcher. XF86HomePage is the remote's house button;
# XF86Back is its BACK key. Super+Escape is the one for a plain keyboard.
HOME_KEYS = ["W-Escape", "W-Home", "C-A-h", "XF86HomePage", "XF86Back"]

# The envelope button drops to the ordinary desktop, and brings the kiosk
# back when pressed again.
DESKTOP_KEYS = ["XF86Mail", "W-d"]

# Bound here rather than left to Chromium so they work regardless of which
# window has focus, and so volume can drive the on-screen bar.
MEDIA_KEYS = {
    "XF86AudioRaiseVolume": "volume-up",
    "XF86AudioLowerVolume": "volume-down",
    "XF86AudioMute": "mute",
    "XF86AudioPlay": "play-pause",
    "XF86AudioPause": "play-pause",
    "XF86AudioNext": "next",
    "XF86AudioPrev": "previous",
    "XF86AudioStop": "stop",
    "XF86AudioForward": "forward",
    "XF86AudioRewind": "rewind",
}


def commands_of(keybind: ET.Element) -> list[str]:
    """labwc accepts the command as a child element or an attribute; Pi OS
    ships the attribute form, our own bindings use the child form."""
    found = [(c.text or "").strip() for c in keybind.iter(q("command"))]
    found += [
        a.get("command", "").strip()
        for a in keybind.iter(q("action"))
        if a.get("command")
    ]
    return [c for c in found if c]


def bind(keyboard: ET.Element, key: str, command: str) -> None:
    keybind = ET.SubElement(keyboard, q("keybind"), {"key": key})
    action = ET.SubElement(keybind, q("action"), {"name": "Execute"})
    ET.SubElement(action, q("command")).text = command


def main() -> int:
    rc_path, scripts_dir = sys.argv[1], sys.argv[2].rstrip("/")
    home_script = f"{scripts_dir}/pi-tv-home.sh"
    media_script = f"{scripts_dir}/pi-tv-media.sh"
    desktop_script = f"{scripts_dir}/pi-tv-desktop.sh"

    tree = ET.parse(rc_path)
    root = tree.getroot()
    keyboard = root.find(q("keyboard"))
    if keyboard is None:
        keyboard = ET.SubElement(root, q("keyboard"))

    managed = set(HOME_KEYS) | set(DESKTOP_KEYS) | set(MEDIA_KEYS)
    removed = 0
    for keybind in list(keyboard.findall(q("keybind"))):
        ours = any("pi-tv-" in c for c in commands_of(keybind))
        # Volume keys already belong to the desktop panel, whose indicator is
        # hidden behind a fullscreen player - take them over.
        if ours or keybind.get("key") in managed:
            keyboard.remove(keybind)
            removed += 1

    for key in HOME_KEYS:
        bind(keyboard, key, home_script)
    for key in DESKTOP_KEYS:
        bind(keyboard, key, desktop_script)
    for key, action in MEDIA_KEYS.items():
        bind(keyboard, key, f"{media_script} {action}")

    ET.indent(tree, space="  ")
    tree.write(rc_path, encoding="UTF-8", xml_declaration=True)

    print(
        f"  replaced {removed}, bound {len(HOME_KEYS)} home"
        f" + {len(DESKTOP_KEYS)} desktop + {len(MEDIA_KEYS)} media keys"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
