"use client";

import { ServiceMark } from "@/components/Logos";
import { alpha } from "@/lib/color";
import { highlight, sketchRect } from "@/lib/sketch";
import type { Service } from "@/lib/services";

const VB_W = 300;
const VB_H = 215;

/** Unfocused cards sit slightly askew, like photos taped into a scrapbook. */
const TILTS = [-2.1, 1.4, -1.2, 2.2, -1.7, 1.9];

export function ServiceTile({
  service,
  focused,
  index,
  onActivate,
  onFocus,
}: {
  service: Service;
  focused: boolean;
  index: number;
  onActivate: () => void;
  onFocus: () => void;
}) {
  const seed = index * 3301 + 17;
  const frame = sketchRect(VB_W, VB_H, 20, seed, 3);
  const frameOver = sketchRect(VB_W, VB_H, 20, seed + 977, 4.2);
  const wash = highlight(VB_W - 26, VB_H - 48, seed + 51);
  const tilt = TILTS[index % TILTS.length];

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onActivate}
      onMouseEnter={onFocus}
      aria-label={service.name}
      style={
        {
          "--tilt": focused ? "0deg" : `${tilt}deg`,
          animationDelay: `${index * 80}ms`,
        } as React.CSSProperties
      }
      className={[
        "animate-rise group relative flex aspect-[300/215] w-full items-center justify-center",
        "text-ink transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        focused ? "z-10 scale-[1.06]" : "scale-[0.95] opacity-60",
      ].join(" ")}
    >
      <svg
        viewBox={`-6 -6 ${VB_W + 12} ${VB_H + 12}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* Marker wash that blooms behind the focused card. */}
        <path
          d={wash}
          transform="translate(13 24)"
          fill={service.color}
          opacity={focused ? 0.15 : 0}
          className="transition-opacity duration-500"
        />
        <path
          d={frame}
          fill={alpha("#C4452E", focused ? 0.07 : 0.03)}
          stroke="currentColor"
          strokeWidth={focused ? 3.4 : 2.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Second pass over the outline - the "I mean this one" scribble. */}
        <path
          d={frameOver}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={focused ? 0.55 : 0}
          className="transition-opacity duration-300"
        />
      </svg>

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-[5%] px-[10%] py-[8%]">
        <ServiceMark id={service.id} className="h-[46%] w-auto" />
        <span className="hand text-[1.9vw] font-semibold leading-none text-ink max-[900px]:text-xl">
          {service.name}
        </span>
      </div>
    </button>
  );
}
