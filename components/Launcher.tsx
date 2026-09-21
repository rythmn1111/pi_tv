"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** How long "Opening …" stays up if the service window never appears. */
const LAUNCH_TIMEOUT_MS = 14_000;

export function Launcher({ services }: { services: Service[] }) {
  const [index, setIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsIndex, setSettingsIndex] = useState(0);
  const [launching, setLaunching] = useState<Service | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const launchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focused = services[index] ?? services[0];
  const now = useNow();
  const greeting = now ? greetingFor(now) : "Tonight";

  const launch = useCallback(
    (service: Service) => {
      if (launching) return;
      setLaunching(service);
      void fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id }),
      }).catch(() => undefined);

      if (launchTimer.current) clearTimeout(launchTimer.current);
      launchTimer.current = setTimeout(() => setLaunching(null), LAUNCH_TIMEOUT_MS);
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

      if (key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, services.length - 1));
      } else if (key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      } else if (key === "Home" || key === "PageUp") {
        setIndex(0);
      } else if (key === "End" || key === "PageDown") {
        setIndex(services.length - 1);
      } else if (key === "Enter" || key === " ") {
        if (focused) launch(focused);
      } else if (key === "ArrowDown" || key === "s" || key === "ContextMenu") {
        setSettingsIndex(0);
        setSettingsOpen(true);
      } else if (/^[1-9]$/.test(key)) {
        const target = services[Number(key) - 1];
        if (target) {
          setIndex(Number(key) - 1);
          launch(target);
        }
      } else {
        return;
      }
      event.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, launch, pickSetting, services, settingsIndex, settingsOpen]);

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

  // ---- Drop the splash once we're back from a service --------------------
  useEffect(() => {
    function clearLaunch() {
      if (document.visibilityState === "visible") setLaunching(null);
    }
    window.addEventListener("focus", clearLaunch);
    document.addEventListener("visibilitychange", clearLaunch);
    return () => {
      window.removeEventListener("focus", clearLaunch);
      document.removeEventListener("visibilitychange", clearLaunch);
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
    <div className="relative flex h-full flex-col px-[clamp(26px,3.4vw,72px)] py-[clamp(14px,2.4vh,38px)]">
      {/* Doodles drawn onto the page itself, filling the space beside the headline. */}
      <div className="pointer-events-none absolute inset-0 text-ink/25" aria-hidden>
        <RetroTV className="absolute right-[5.5vw] top-[22vh] h-[26vh] w-auto -rotate-6" />
        <Popcorn className="absolute right-[22vw] top-[33vh] h-[17vh] w-auto rotate-6" />
        <Bird className="animate-bob absolute right-[31vw] top-[23vh] h-[8vh] w-auto" />
        <Coffee className="absolute right-[34vw] top-[41vh] h-[11vh] w-auto -rotate-3 opacity-80" />
        <Sparkle className="absolute right-[19vw] top-[19vh] h-[3.6vh] w-auto" />
        <Sparkle className="absolute right-[3.4vw] top-[50vh] h-[2.8vh] w-auto opacity-75" />
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
      <section className="relative flex flex-1 flex-col justify-center">
        <p className="display text-[2.1vw] font-semibold leading-tight text-graphite max-[900px]:text-lg">
          {greeting} we&rsquo;re {focused?.verb ?? "watching"}
        </p>
        <div key={focused?.id} className="animate-rise relative mt-[0.6vh] self-start">
          <h2 className="hand text-[6.4vw] font-bold leading-[0.92] text-ink max-[900px]:text-5xl">
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
        <p className="mt-[3.2vh] max-w-[44vw] text-[1.05vw] italic leading-snug text-graphite/70 max-[900px]:text-sm">
          {focused?.tagline}
        </p>
      </section>

      <section className="relative shrink-0">
        <div
          className="grid gap-[clamp(16px,1.8vw,36px)]"
          style={{ gridTemplateColumns: `repeat(${services.length}, minmax(0, 1fr))` }}
        >
          {services.map((service, i) => (
            <ServiceTile
              key={service.id}
              service={service}
              index={i}
              focused={i === index && !settingsOpen}
              onPoint={() => setIndex(i)}
              onActivate={() => launch(service)}
            />
          ))}
        </div>
      </section>

      <footer className="relative flex shrink-0 items-end justify-between pt-[clamp(12px,2.4vh,36px)] text-ink/60">
        <div className="hand flex items-center gap-[clamp(12px,1.5vw,30px)] text-[1.15vw] max-[900px]:text-sm">
          <Hint keys="← →" label="pick one" />
          <Hint keys="OK" label="watch it" />
          <Hint keys="↓" label="housekeeping" />
        </div>
        <p className="hand text-[1.05vw] text-ink/45 max-[900px]:text-xs">
          the <Key>⌂</Key> button — or <Key>super</Key>+<Key>esc</Key> — brings you back here
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
