# Pi TV

A hand-drawn media center launcher for the Raspberry Pi. The Pi boots straight
into a fullscreen sketchbook page — no desktop, no URL bar, no browser chrome —
and you pick Netflix, Prime Video, JioHotstar or YouTube with a remote.

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
 │  ┌─────┐                                     │
 │  │  ⊕  │   ← row 2 for utilities             │
 │  └─────┘                                     │
 │  ←→ pick one   OK watch it   ↓ housekeeping  │
 └──────────────────────────────────────────────┘
```

## How it works

Three moving parts:

| Part | What it does |
| --- | --- |
| `pi-tv.service` | systemd **user** service running the Next.js server on port 3000 |
| `pi-tv-kiosk.sh` | launched from labwc autostart; waits for the server, opens Chromium `--kiosk` |
| `pi-tv-cdp.ts` | steers that window over the DevTools protocol for the home and back keys |

### One window, one profile

Pi TV runs on your **ordinary `~/.config/chromium` profile**, deliberately.
Every extension you already have applies to everything it opens — on this Pi
that means h264ify (so YouTube hardware-decodes instead of chewing CPU on VP9),
uBlock Origin Lite, and the JioHotstar ad blocker.

That choice rules out managing windows as processes, because a shared profile
means Chromium funnels everything into **one process**. So there is one window,
and opening a service is a plain navigation. Getting back is done by asking the
browser directly over the DevTools protocol, bound to `127.0.0.1`:

- `--kiosk` suppresses `Alt+Left` and `Alt+Home`, so synthesising keys is out
- a second window **inherits kiosk mode**, so it gets no address bar either

Both of those were measured on the hardware, not assumed.

## Install on the Pi

```bash
git clone https://github.com/<you>/pi_tv.git ~/pi_tv
cd ~/pi_tv
./scripts/install.sh
sudo systemctl restart lightdm
```

The installer is idempotent, and it:

- installs Bun if missing, then `bun install && bun run build`
- installs `playerctl`, `wob` and `libnotify-bin` for the remote
- writes and enables `~/.config/systemd/user/pi-tv.service`
- enables user lingering, so the server starts at boot before anyone logs in
- appends the kiosk and the volume OSD to `~/.config/labwc/autostart`, seeding
  it from `/etc/xdg/labwc/autostart` first so the desktop and panel survive
- merges the hotkeys into `~/.config/labwc/rc.xml`

`./scripts/uninstall.sh` reverses all of it.

## Controls

Driven by a cheap Bluetooth media remote (the Rii-style mini keyboard with a
touchpad), or any keyboard.

### On the launcher

| Key | Action |
| --- | --- |
| `←` `→` | move along a row |
| `↑` `↓` | move between rows |
| `OK` / `Enter` | open the focused service |
| `Home` `End` / `PgUp` `PgDn` | jump to the first / last tile |
| `1`–`9` | jump straight to a service |
| `↓` from the last row, or `S` | housekeeping panel |
| `Esc` / `BACK` | close the panel |

The touchpad works too: the cursor is hidden by default and only appears while
you are actually moving it, then hides again on the next key press.

### Everywhere, including mid-film

Bound in the compositor, so they work even though the launcher is not the
focused window:

| Button | Action |
| --- | --- |
| **⌂ (house)** | back to the launcher |
| **e** | **one step back** — out of a video, not all the way to the menu |
| `Super`+`Esc`, `Super`+`Home`, `Ctrl`+`Alt`+`H` | back to the launcher |
| `V+` `V−`, mute | volume, with an on-screen bar that draws over fullscreen video |
| `▶‖` `⏮` `⏭` | play / pause, previous, next |
| **✉ (envelope)** | drop to the normal Pi desktop; press again to come back |
| `Super`+`D` | same desktop toggle, from a keyboard |

**e** is a genuine history step, so inside a YouTube video it returns you to the
page you came from. Only at the start of history does it fall back to the
launcher, so the button is never a dead end.

Volume goes through `wpctl`, playback through `playerctl` over MPRIS — Chromium
publishes each playing tab as an MPRIS player, so this drives Netflix, YouTube
and the rest without them cooperating.

The volume bar is [`wob`](https://github.com/francma/wob), on the Wayland
layer-shell. That matters: the desktop panel's own indicator is *behind* a
fullscreen player, which is exactly when you need to see it.

### Escaping to the desktop

The Pi desktop and taskbar run underneath the kiosk the whole time — the kiosk
is just a fullscreen window on top. So ✉ doesn't start anything, it moves our
window aside, and pressing it again puts it back. A toast tells you which mode
you're in, and there's an **Exit to the desktop** item in the housekeeping panel.

While you're on the desktop the home and back keys are left alone, so they
behave normally in whatever you're using. A reboot always returns to kiosk mode.

Because it's the same profile, launching Chromium from the taskbar there gives
you a normal window **with an address bar** — that's the way to type an
arbitrary URL.

### A different remote?

Remotes disagree about which keysym a button sends. Run:

```bash
./scripts/pi-tv-remote-keys.sh
```

press the button, and put the name it prints into `HOME_KEYS`, `BACK_KEYS`,
`DESKTOP_KEYS` or `MEDIA_KEYS` in `scripts/labwc-keybinds.py`, then re-run the
installer.

## Customising

Copy `config/services.json` to `config/services.local.json` and edit that. The
local file wins when present and is gitignored, so your line-up survives a
`git pull`. The page re-reads it on every load — no rebuild.

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
      "verb": "watching",       // "Tonight we're <verb> ..." in the headline
      "row": 1,                 // 2 puts the tile on the second line
      "enabled": true,
      "userAgent": ""           // optional per-service UA override
    }
  ]
}
```

Five tiles fit comfortably on row 1; move the rest to row 2.

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

## Cloudflare WARP

Installed from Cloudflare's `trixie` arm64 repo and connected:

```bash
warp-cli --accept-tos status      # Connected / Network: healthy
curl https://www.cloudflare.com/cdn-cgi/trace | grep warp   # warp=on
```

`warp-svc.service` is enabled by the package and the connection state persists,
so it comes back on its own after a reboot — no extra unit needed. This Pi exits
via Mumbai (`colo=BOM`, `loc=IN`), so the apparent location stays Indian.

Turn it off with `warp-cli --accept-tos disconnect`, back on with `connect`.

**Caveat:** streaming services actively block VPN and proxy egress. All four
sites still load with WARP on, but that only proves they load — whether Netflix
will *play* through it can't be confirmed without signing in. If playback starts
failing with a proxy error, `warp-cli --accept-tos disconnect` is the first
thing to try.

## A note on DRM

Netflix, Prime Video and JioHotstar all need Widevine. On Linux/ARM Chromium
that's **L3 only**, which those services cap at roughly 720p — a platform limit,
not something the launcher can work around. YouTube is unaffected.

## A note on voice control

There isn't any, and it can't be added as things stand: the remote has no
microphone (its HID descriptor advertises no voice key) and PipeWire reports
zero audio sources on the Pi. Adding it would need a USB microphone plus a
speech-to-text stage. The remote's volume and playback keys are wired up
instead.

## Development

```bash
bun install
bun run dev      # http://localhost:3000
```

The launcher is a normal web page, so most of it can be built on a laptop. The
home and back keys need the Pi, since they talk to a kiosk Chromium.

## Layout

```
app/
  api/services/   GET the configured services
  api/system/     GET temp/uptime, POST reboot | shutdown | restart-app | desktop
components/       Launcher, tiles, overlays, doodles, brand marks
config/           services.json and the wob OSD theme
lib/              config loader, system actions, sketch path generators
scripts/          install, uninstall, kiosk, home, back, media, OSD, desktop
                  toggle, CDP driver, labwc keybinds, remote key discovery
```
