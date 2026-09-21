/**
 * Drives the kiosk window over the Chrome DevTools Protocol.
 *
 * Pi TV runs one Chromium window on your normal profile, so navigation cannot
 * be done by spawning or killing processes - there is only ever one process.
 * Synthesising Alt+Left with wtype is unreliable inside --kiosk, which
 * suppresses a number of accelerators, so we ask the browser directly.
 *
 * Usage: bun pi-tv-cdp.ts home|back|forward|open <url>
 */
const PORT = process.env.PI_TV_DEBUG_PORT ?? "9222";
const LAUNCHER = process.env.PI_TV_URL ?? "http://localhost:3000";
const [command, argument] = Bun.argv.slice(2);

type Target = { type: string; url: string; id: string; webSocketDebuggerUrl?: string };

async function targets(): Promise<Target[]> {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  return (await res.json()) as Target[];
}

const isLauncher = (t: Target) => t.url.startsWith(LAUNCHER);

function connect(target: Target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl!);
  let id = 0;
  const pending = new Map<number, (v: unknown) => void>();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg.result);
      pending.delete(msg.id);
    }
  });
  const ready = new Promise<void>((r) => ws.addEventListener("open", () => r()));
  const send = async (method: string, params: Record<string, unknown> = {}) => {
    await ready;
    return new Promise<any>((resolve) => {
      const n = ++id;
      pending.set(n, resolve);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  };
  return { send, close: () => ws.close() };
}

const pages = (await targets()).filter((t) => t.type === "page");
if (pages.length === 0) {
  console.error("pi-tv-cdp: no page target - is the kiosk running?");
  process.exit(1);
}

// Prefer whatever is *not* the launcher: that is the thing the user is looking
// at and wants to act on.
const active = pages.find((t) => !isLauncher(t)) ?? pages[0];

switch (command) {
  case "home": {
    // Close anything extra first (e.g. a window opened by the Browser tile),
    // then point what remains back at the launcher.
    for (const extra of pages.slice(1)) {
      await fetch(`http://127.0.0.1:${PORT}/json/close/${extra.id}`);
    }
    const { send, close } = connect(pages[0]);
    await send("Page.navigate", { url: LAUNCHER });
    close();
    break;
  }
  case "back":
  case "forward": {
    if (isLauncher(active)) break; // already home; nothing to go back to
    const { send, close } = connect(active);
    const history = await send("Page.getNavigationHistory");
    const step = command === "back" ? -1 : 1;
    const next = history.entries?.[history.currentIndex + step];
    if (next) {
      await send("Page.navigateToHistoryEntry", { entryId: next.id });
    } else if (command === "back") {
      // Start of history - the sensible "back" from here is the launcher.
      await send("Page.navigate", { url: LAUNCHER });
    }
    close();
    break;
  }
  case "open": {
    if (!argument) {
      console.error("pi-tv-cdp: open needs a url");
      process.exit(2);
    }
    const { send, close } = connect(pages[0]);
    await send("Page.navigate", { url: argument });
    close();
    break;
  }
  default:
    console.error(`pi-tv-cdp: unknown command '${command}'`);
    process.exit(2);
}
process.exit(0);
