"use client";

import { useMemo, useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  // Nothing on screen shows seconds, so tick lazily and let the Pi idle.
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

// Bucketed to the minute so the snapshot stays referentially stable between
// reads - returning a fresh Date here would re-render forever.
const getSnapshot = () => Math.floor(Date.now() / MINUTE);
const getServerSnapshot = () => null;

/** The current time, or null until the client has hydrated. */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (minute === null ? null : new Date(minute * MINUTE)), [minute]);
}

export function Clock() {
  const now = useNow();

  // Rendered empty on the server so the markup matches before hydration.
  if (!now) return <div className="h-[9vh]" aria-hidden />;

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="text-right text-ink">
      <div className="hand tabular text-[3.4vw] font-bold leading-[0.95] max-[900px]:text-4xl">
        {time}
      </div>
      <div className="mt-1 text-[0.95vw] italic text-ink/60 max-[900px]:text-xs">
        {date}
      </div>
    </div>
  );
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "This morning";
  if (h < 17) return "This afternoon";
  if (h < 21) return "Tonight";
  return "Late tonight";
}
