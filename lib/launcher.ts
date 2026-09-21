import { spawn } from "node:child_process";
import path from "node:path";

const DESKTOP_SCRIPT =
  process.env.PI_TV_DESKTOP_SCRIPT ??
  path.join(process.cwd(), "scripts", "pi-tv-desktop.sh");

/**
 * The web server runs as a systemd *user* service, which may start before the
 * Wayland session exists. Pin the compositor socket so spawned windows always
 * land on the attached display.
 */
function sessionEnv(): NodeJS.ProcessEnv {
  const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
  return {
    ...process.env,
    XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR ?? `/run/user/${uid}`,
    WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY ?? "wayland-0",
  };
}

function runDetached(script: string, args: string[]) {
  const child = spawn(/* turbopackIgnore: true */ "/bin/bash", [script, ...args], {
    detached: true,
    stdio: "ignore",
    env: sessionEnv(),
  });
  child.unref();
}

export type SystemAction = "reboot" | "shutdown" | "restart-app" | "desktop";

export function runSystemAction(action: SystemAction) {
  if (action === "desktop") {
    runDetached(DESKTOP_SCRIPT, []);
    return;
  }

  // systemctl reboot/poweroff are permitted for the local active session via
  // polkit, so no sudo is needed here.
  const commands: Record<Exclude<SystemAction, "desktop">, [string, string[]]> = {
    reboot: ["systemctl", ["reboot"]],
    shutdown: ["systemctl", ["poweroff"]],
    "restart-app": ["systemctl", ["--user", "restart", "pi-tv.service"]],
  };
  const [cmd, args] = commands[action];
  const child = spawn(/* turbopackIgnore: true */ cmd, args, {
    detached: true,
    stdio: "ignore",
    env: sessionEnv(),
  });
  child.unref();
}
