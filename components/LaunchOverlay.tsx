"use client";

import { ServiceMark } from "@/components/Logos";
import { squiggle } from "@/lib/sketch";
import type { Service } from "@/lib/services";

export function LaunchOverlay({ service }: { service: Service | null }) {
  return (
    <div
      className={[
        "absolute inset-0 z-50 flex flex-col items-center justify-center gap-[4vh]",
        "paper-grid transition-opacity duration-400",
        service ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-live="polite"
    >
      {service && (
        <>
          <ServiceMark id={service.id} className="animate-rise h-[22vh] w-auto text-ink" />

          <p className="hand animate-rise text-[2.6vw] font-semibold text-ink max-[900px]:text-2xl">
            Opening {service.name}…
          </p>

          {/* A pen scribbling its way across the page while we wait. */}
          <svg
            viewBox="0 0 400 24"
            className="h-[3vh] w-[22vw] min-w-48 text-ink/70"
            aria-hidden
          >
            <path
              d={squiggle(400, 8, 9, 31)}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="420"
              style={{ animation: "scribble 1.5s ease-in-out infinite" }}
            />
          </svg>
        </>
      )}

      <style>{`
        @keyframes scribble {
          0%   { stroke-dashoffset: 420; }
          55%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -420; }
        }
      `}</style>
    </div>
  );
}
