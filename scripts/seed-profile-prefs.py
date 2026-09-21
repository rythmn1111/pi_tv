#!/usr/bin/env python3
"""Pre-set Chromium content settings for the kiosk profiles.

A media center should never interrupt playback with a permission modal, and on
Wayland a camera request goes all the way out to xdg-desktop-portal, which
draws a dialog on top of whatever is playing. Blocking these up front in the
profile is enough to stop the request ever being made.
"""
import json
import pathlib
import sys

BLOCK = 2  # Chromium content-setting enum: 1 = allow, 2 = block


def seed(profile: str) -> None:
    default = pathlib.Path(profile) / "Default"
    default.mkdir(parents=True, exist_ok=True)
    prefs_file = default / "Preferences"

    try:
        prefs = json.loads(prefs_file.read_text())
    except (OSError, ValueError):
        prefs = {}

    profile_prefs = prefs.setdefault("profile", {})
    profile_prefs.setdefault("default_content_setting_values", {}).update(
        {
            "media_stream_camera": BLOCK,
            "media_stream_mic": BLOCK,
            "notifications": BLOCK,
            "geolocation": BLOCK,
        }
    )
    # Service windows are closed with SIGTERM, so declare a clean exit and skip
    # the "Chromium didn't shut down correctly" bar on the next launch.
    profile_prefs["exit_type"] = "Normal"
    profile_prefs["exited_cleanly"] = True

    prefs_file.write_text(json.dumps(prefs))


if __name__ == "__main__":
    for path in sys.argv[1:]:
        seed(path)
