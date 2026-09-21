# Pi TV

A hand-drawn media center launcher for the Raspberry Pi. The Pi boots straight
into a fullscreen sketchbook page — no desktop, no URL bar, no browser chrome —
and you pick Netflix, Prime Video, JioHotstar or YouTube with the arrow keys.

Built with Bun, Next.js 16 and Tailwind 4.

```
 ┌──────────────────────────────────────────────┐
 │  Pi TV                              8:42 PM  │
 │  ~~~~~                        Sunday, 21 Sep │
 │                                              │
 │  Tonight we're watching                      │
 │  Netflix                          ✦   ┌───┐  │
 │  ~~~~~~~~                             │ TV│  │
 │  Films, series and everything in between     │
 │                                              │
 │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │
 │  │  N  │  │prime│  │  ✦  │  │  ▶  │          │
 │  └─────┘  └─────┘  └─────┘  └─────┘          │
 │                                              │
 │  ←→ pick one   ⏎ watch it   ↓ housekeeping   │
 └──────────────────────────────────────────────┘
```

## How it works

Three moving parts:

| Part | What it does |
| --- | --- |
| `pi-tv.service` | systemd **user** service running the Next.js server on port 3000 |
| `pi-tv-kiosk.sh` | launched from labwc autostart; waits for the server, opens Chromium `--kiosk` on the launcher |
| `pi-tv-launch.sh` | called by the launcher's API; opens the chosen service in a *second* Chromium window with its own profile |

Because the service window is a separate Chromium process with its own
`--user-data-dir`, closing it is a clean `pkill` that can't touch the launcher
sitting underneath. `pi-tv-home.sh` does exactly that, and it's bound to
**Super + Escape** globally — that's your way out of Netflix.

## Install on the Pi

```bash
git clone https://github.com/<you>/pi_tv.git ~/pi_tv
cd ~/pi_tv
./scripts/install.sh
```

The installer is idempotent, and it:

- installs Bun if missing, then `bun install && bun run build`
- writes and enables `~/.config/systemd/user/pi-tv.service`
- enables user lingering so the server starts at boot, before anyone logs in
- appends the kiosk to `~/.config/labwc/autostart` (seeding it from
  `/etc/xdg/labwc/autostart` first, so the desktop and panel survive)
- adds the "back to launcher" hotkeys to `~/.config/labwc/rc.xml`
- copies the system Widevine CDM into the service profile so DRM works on the
  first launch rather than after a component update

Then restart the session:

```bash
sudo systemctl restart lightdm
```

`./scripts/uninstall.sh` reverses all of it.

## Controls

Driven by a cheap Bluetooth media remote (the Rii-style mini keyboard with a
touchpad), or any keyboard.

### On the launcher

| Key | Action |
| --- | --- |
| `←` `→` | move between services |
| `OK` / `Enter` | open the focused service |
| `Home` `End` / `PgUp` `PgDn` | jump to the first / last service |
| `1`–`9` | jump straight to a service |
| `↓` or `S` | housekeeping panel (restart / reboot / shut down) |
| `Esc` / `BACK` | close the panel |

The touchpad works too: the cursor is hidden by default and only appears while
you are actually moving it, then fades out again on the next key press.

### Everywhere, including inside Netflix

These are bound in the compositor, so they work even though the launcher is not
the focused window:

| Button | Action |
| --- | --- |
| **⌂ (house)** | **back to the launcher** |
| `BACK` | back to the launcher |
| `Super`+`Esc`, `Super`+`Home`, `Ctrl`+`Alt`+`H` | back to the launcher |
| `V+` `V−` | volume, with an on-screen bar that draws over fullscreen video |
| mute | toggle mute |
| `▶‖` | play / pause |
| `⏮` `⏭` | previous / next |

Volume goes through `wpctl`, playback through `playerctl` over MPRIS — Chromium
publishes each playing tab as an MPRIS player, so this drives Netflix, YouTube
and the rest without them knowing.

The volume bar is [`wob`](https://github.com/francma/wob), which draws on the
Wayland layer-shell. That matters: the desktop panel's own volume indicator is
*behind* a fullscreen player, which is exactly when you need to see it.

### A different remote?

Remotes disagree about which keysym a button sends. Run:

```bash
./scripts/pi-tv-remote-keys.sh
```

press the button, and put the name it prints into `~/.config/labwc/rc.xml`
(or into `HOME_KEYS` / `MEDIA_KEYS` in `scripts/labwc-keybinds.py` and re-run
the installer).

## Customising

Copy `config/services.json` to `config/services.local.json` and edit that. The
local file wins when present and is gitignored, so your line-up survives a
`git pull`. Either way the page re-reads it on every load — no rebuild.

```jsonc
{
  "services": [
    {
      "id": "netflix",          // netflix | prime | jiohotstar | youtube |
                                // browser each get a drawn mark; anything
                                // else gets a generic hand-drawn tile
      "name": "Netflix",
      "tagline": "Films, series and everything in between",
      "url": "https://www.netflix.com",
      "color": "#E50914",       // focus wash + headline accent
      "colorTo": "#7B0710",
      "enabled": true,
      "verb": "watching",       // "Tonight we're <verb> ..." in the headline
      "kiosk": true,            // false = maximised window with an address
                                // bar, which is how the Browser tile works
      "userAgent": ""           // optional per-service UA override
    }
  ]
}
```

Five tiles fit comfortably; six or seven still lay out, they just get narrower.

### YouTube's 10-foot interface

YouTube has a proper remote-driven TV UI, but it sniffs for a smart-TV user
agent. To use it, set on the YouTube entry:

```json
"url": "https://www.youtube.com/tv",
"userAgent": "Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CrKey/1.54.250320 LargeScreen"
```

### Drawing your own tiles

Brand marks live in `components/Logos.tsx` as inline SVG — an ink outline with
the brand colour dropped in slightly off-register. Doodles are in
`components/Doodles.tsx`. The wobbly pen strokes come from `lib/sketch.ts`,
which is seeded rather than random so the server and browser draw identical
paths.

## A note on DRM

Netflix, Prime Video and JioHotstar all need Widevine. On Linux/ARM Chromium
that's **L3 only**, which those services cap at roughly 720p — this is a
platform limit, not something the launcher can work around. YouTube is
unaffected and plays at full resolution.

## A note on voice control

There isn't any, and it can't be added as things stand: the remote has no
microphone (its HID descriptor advertises no `KEY_VOICECOMMAND`, and PipeWire
reports zero audio sources on the Pi). Adding it would mean a USB microphone
plus a speech-to-text stage. The remote's volume and playback keys are all
wired up instead — see [Controls](#controls).

## Development

```bash
bun install
bun run dev      # http://localhost:3000
```

On macOS, opening a service shells out to `open -na "Google Chrome"` instead of
Chromium, so the launch flow is testable without a Pi.

## Layout

```
app/
  api/launch/     POST { id } -> spawns the service window
  api/services/   GET the configured services
  api/system/     GET temp/uptime, POST reboot | shutdown | restart-app
components/       Launcher, tiles, overlays, doodles, brand marks
config/           services.json - the bit you edit
lib/              config loader, spawn helpers, sketch path generators
scripts/          install, uninstall, kiosk, launch, home, media, OSD,
                  labwc keybinds, remote key discovery
```
