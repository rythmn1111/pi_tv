"use client";

import { sketchRect } from "@/lib/sketch";

export type SettingsAction = {
  id: "close" | "restart-app" | "reboot" | "shutdown";
  label: string;
  hint: string;
};

export const SETTINGS_ACTIONS: SettingsAction[] = [
  { id: "close", label: "Never mind", hint: "Back to the page" },
  { id: "restart-app", label: "Restart media center", hint: "Reload the launcher" },
  { id: "reboot", label: "Reboot the Pi", hint: "Full system restart" },
  { id: "shutdown", label: "Shut down the Pi", hint: "Power off safely" },
];

export function SettingsOverlay({
  open,
  focusIndex,
  status,
  onPick,
  onFocusItem,
}: {
  open: boolean;
  focusIndex: number;
  status: { host: string; cpuTemp: number | null } | null;
  onPick: (action: SettingsAction) => void;
  onFocusItem: (index: number) => void;
}) {
  return (
    <div
      className={[
        "absolute inset-0 z-40 flex items-center justify-center",
        "bg-paper/80 backdrop-blur-[3px] transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      {/* An index card pinned over the page, slightly crooked. */}
      <div
        className={[
          "relative w-[min(44vw,620px)] -rotate-[0.7deg] p-[clamp(26px,2.6vw,48px)]",
          "transition-transform duration-300",
          open ? "scale-100" : "scale-95",
        ].join(" ")}
      >
        <svg
          viewBox="-8 -8 416 316"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-ink"
          aria-hidden
        >
          <path
            d={sketchRect(400, 300, 16, 4242, 3.4)}
            fill="#F7F0E3"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={sketchRect(400, 300, 16, 9119, 4.6)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity="0.45"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative">
          <header className="mb-[clamp(14px,1.6vh,26px)] flex items-baseline justify-between">
            <h2 className="hand text-[2.3vw] font-bold leading-none text-ink max-[900px]:text-2xl">
              Housekeeping
            </h2>
            {status && (
              <span className="tabular text-[0.8vw] italic text-ink/50 max-[900px]:text-[10px]">
                {status.host}
                {status.cpuTemp !== null && ` · ${status.cpuTemp}°C`}
              </span>
            )}
          </header>

          <ul className="flex flex-col gap-[clamp(6px,0.7vh,12px)]">
            {SETTINGS_ACTIONS.map((action, i) => {
              const focused = open && i === focusIndex;
              return (
                <li key={action.id}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onPick(action)}
                    onMouseEnter={() => onFocusItem(i)}
                    className={[
                      "flex w-full items-baseline gap-3 rounded-lg px-4 py-[clamp(7px,0.9vh,14px)]",
                      "text-left transition-all duration-200",
                      focused ? "translate-x-1.5 bg-ink/10" : "bg-transparent",
                    ].join(" ")}
                  >
                    {/* A pen-stroke bullet that only the focused row gets. */}
                    <span
                      className={[
                        "hand shrink-0 text-[1.5vw] font-bold leading-none text-ink transition-opacity duration-200 max-[900px]:text-base",
                        focused ? "opacity-100" : "opacity-0",
                      ].join(" ")}
                      aria-hidden
                    >
                      ➜
                    </span>
                    <span className="min-w-0">
                      <span className="hand block text-[1.5vw] font-semibold leading-tight text-ink max-[900px]:text-lg">
                        {action.label}
                      </span>
                      <span className="block text-[0.82vw] italic leading-tight text-ink/50 max-[900px]:text-xs">
                        {action.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
