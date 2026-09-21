"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, greetingFor, useNow } from "@/components/Clock";
import { Bird, Coffee, Popcorn, RetroTV, Sparkle } from "@/components/Doodles";
import { LaunchOverlay } from "@/components/LaunchOverlay";
import { ServiceTile } from "@/components/ServiceTile";
import {
  SETTINGS_ACTIONS,
  SettingsOverlay,
  type SettingsAction,
} from "@/components/SettingsOverlay";
import { squiggle } from "@/lib/sketch";
import type { Service } from "@/lib/services";

type Status = { host: string; cpuTemp: number | null };

export function Launcher({ services }: { services: Service[] }) {
  // Row 2 keeps utilities off the main strip, so a long line-up does not
  // squash everything into one thin band.
  const rows = useMemo(() => {
    const first = services.filter((s) => (s.row ?? 1) !== 2);
    const second = services.filter((s) => s.row === 2);
    return second.length > 0 ? [first, second] : [first];
  }, [services]);

  const [focus, setFocus] = useState({ r: 0, c: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsIndex, setSettingsIndex] = useState(0);
  const [launching, setLaunching] = useState<Service | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const now = useNow();
  const greeting = now ? greetingFor(now) : "Tonight";
  const focused = rows[focus.r]?.[focus.c] ?? rows[0][0];
  const columns = rows[0].length;

  /**
   * One Chromium window on one profile means "opening" a service is just a
   * navigation - no process to spawn. The remote's back and home keys steer
   * this same window back again over the DevTools protocol.
   */
  const launch = useCallback(
    (service: Service) => {
      if (launching) return;
      setLaunching(service);
      // Let the splash paint before the browser tears this page down.
      setTimeout(() => {
        window.location.href = service.url;
      }, 140);
    },
    [launching],
  );

  const pickSetting = useCallback((action: SettingsAction) => {
    setSettingsOpen(false);
    if (action.id === "close") return;
    void fetch("/api/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action.id }),
    }).catch(() => undefined);
  }, []);

  // ---- Remote / keyboard navigation -------------------------------------
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const key = event.key;

      if (settingsOpen) {
        if (key === "ArrowDown") {
          setSettingsIndex((i) => Math.min(i + 1, SETTINGS_ACTIONS.length - 1));
        } else if (key === "ArrowUp") {
          setSettingsIndex((i) => Math.max(i - 1, 0));
        } else if (key === "Enter" || key === " ") {
          pickSetting(SETTINGS_ACTIONS[settingsIndex]);
        } else if (key === "Escape" || key === "Backspace" || key === "s") {
          setSettingsOpen(false);
        } else {
          return;
        }
        event.preventDefault();
        return;
      }

      const openSettings = () => {
        setSettingsIndex(0);
        setSettingsOpen(true);
      };

      if (key === "ArrowRight") {
        setFocus((f) => ({ ...f, c: Math.min(f.c + 1, rows[f.r].length - 1) }));
      } else if (key === "ArrowLeft") {
        setFocus((f) => ({ ...f, c: Math.max(f.c - 1, 0) }));
      } else if (key === "ArrowDown") {
        // Past the last row, down opens housekeeping.
        if (focus.r + 1 < rows.length) {
          setFocus((f) => ({
            r: f.r + 1,
            c: Math.min(f.c, rows[f.r + 1].length - 1),
          }));
        } else {
          openSettings();
        }
      } else if (key === "ArrowUp") {
        setFocus((f) =>
          f.r === 0 ? f : { r: f.r - 1, c: Math.min(f.c, rows[f.r - 1].length - 1) },
        );
      } else if (key === "Home" || key === "PageUp") {
        setFocus({ r: 0, c: 0 });
      } else if (key === "End" || key === "PageDown") {
        setFocus({ r: rows.length - 1, c: rows[rows.length - 1].length - 1 });
      } else if (key === "Enter" || key === " ") {
        if (focused) launch(focused);
      } else if (key === "s" || key === "ContextMenu") {
        openSettings();
      } else if (/^[1-9]$/.test(key)) {
        const target = services[Number(key) - 1];
        if (target) launch(target);
      } else {
        return;
      }
      event.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus.r, focused, launch, pickSetting, rows, services, settingsIndex, settingsOpen]);

  // ---- Show the cursor only while the touchpad is actually moving --------
  useEffect(() => {
    const root = document.documentElement;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const reveal = () => {
      root.dataset.pointer = "active";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => delete root.dataset.pointer, 2500);
    };
    const hide = () => {
      clearTimeout(hideTimer);
      delete root.dataset.pointer;
    };

    window.addEventListener("pointermove", reveal);
    window.addEventListener("keydown", hide);
    return () => {
      window.removeEventListener("pointermove", reveal);
      window.removeEventListener("keydown", hide);
      clearTimeout(hideTimer);
      delete root.dataset.pointer;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/system");
        if (alive) setStatus((await res.json()) as Status);
      } catch {
        /* decorative only */
      }
    };
    void load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col px-[clamp(26px,3.4vw,72px)] py-[clamp(14px,2.2vh,34px)]">
      {/* Doodles drawn onto the page itself, filling the space beside the headline. */}
      <div className="pointer-events-none absolute inset-0 text-ink/25" aria-hidden>
        <RetroTV className="absolute right-[5.5vw] top-[20vh] h-[22vh] w-auto -rotate-6" />
        <Popcorn className="absolute right-[21vw] top-[29vh] h-[14vh] w-auto rotate-6" />
        <Bird className="animate-bob absolute right-[29vw] top-[20vh] h-[7vh] w-auto" />
        <Coffee className="absolute right-[32vw] top-[35vh] h-[10vh] w-auto -rotate-3 opacity-80" />
        <Sparkle className="absolute right-[18vw] top-[17vh] h-[3.2vh] w-auto" />
        <Sparkle className="absolute right-[3.4vw] top-[44vh] h-[2.6vh] w-auto opacity-75" />
      </div>

      <header className="relative flex shrink-0 items-start justify-between">
        <div>
          <div className="relative inline-block">
            <h1 className="hand text-[3vw] font-bold leading-none text-ink max-[900px]:text-3xl">
              Pi TV
            </h1>
            <svg
              viewBox="0 0 200 18"
              className="absolute -bottom-[0.9vh] left-0 h-[1.4vh] w-full text-ink/70"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d={squiggle(200, 6, 6, 88)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <p className="mt-[1.8vh] text-[0.92vw] italic text-ink/55 max-[900px]:text-xs">
            Living room · Raspberry Pi 5
          </p>
        </div>
        <Clock />
      </header>

      {/* Headline grows to absorb whatever height is left over. */}
      <section className="relative flex min-h-0 flex-1 flex-col justify-center">
        <p className="display text-[2.1vw] font-semibold leading-tight text-graphite max-[900px]:text-lg">
          {greeting} we&rsquo;re {focused?.verb ?? "watching"}
        </p>
        <div key={focused?.id} className="animate-rise relative mt-[0.6vh] self-start">
          <h2 className="hand text-[5vw] font-bold leading-[0.92] text-ink max-[900px]:text-5xl">
            {focused?.name}
          </h2>
          <svg
            viewBox="0 0 300 20"
            className="absolute -bottom-[1.2vh] left-0 h-[1.8vh] w-full text-ink/60"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={squiggle(300, 7, 7, 404)}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <p className="mt-[2.2vh] max-w-[44vw] text-[1.05vw] italic leading-snug text-graphite/70 max-[900px]:text-sm">
          {focused?.tagline}
        </p>
      </section>

      <section className="relative flex shrink-0 flex-col gap-[clamp(12px,1.5vw,28px)]">
        {rows.map((row, r) => (
          <div
            key={r}
            className="grid gap-[clamp(16px,1.8vw,36px)]"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {row.map((service, c) => (
              <ServiceTile
                key={service.id}
                service={service}
                index={r * columns + c}
                focused={r === focus.r && c === focus.c && !settingsOpen}
                onPoint={() => setFocus({ r, c })}
                onActivate={() => launch(service)}
              />
            ))}
          </div>
        ))}
      </section>

      <footer className="relative flex shrink-0 items-end justify-between pt-[clamp(12px,2vh,30px)] text-ink/60">
        <div className="hand flex items-center gap-[clamp(12px,1.5vw,30px)] text-[1.15vw] max-[900px]:text-sm">
          <Hint keys="← →" label="pick one" />
          <Hint keys="OK" label="watch it" />
          <Hint keys="↓" label="housekeeping" />
        </div>
        <p className="hand text-[1.05vw] text-ink/45 max-[900px]:text-xs">
          <Key>home</Key> comes back here · <Key>e</Key> steps back
        </p>
      </footer>

      <SettingsOverlay
        open={settingsOpen}
        focusIndex={settingsIndex}
        status={status}
        onPick={pickSetting}
        onPointItem={setSettingsIndex}
      />
      <LaunchOverlay service={launching} />
    </div>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <Key>{keys}</Key>
      <span>{label}</span>
    </span>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hand rounded-[7px] border-[1.5px] border-ink/40 px-2 py-[1px] text-[0.95em] font-semibold text-ink/75">
      {children}
    </kbd>
  );
}
