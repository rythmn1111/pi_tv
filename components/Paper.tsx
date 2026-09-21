import { Bush, Sprig } from "@/components/Doodles";

/**
 * The desk: a warm charcoal surface with a little marginalia on it, holding one
 * big terracotta-bound sketchbook open to a page of graph paper.
 */
export function Desk({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-desk">
      {/* Tucked behind the notebook, so they read as growing out from underneath.
          The desk margin is only a sliver, so anything smaller than this is
          simply hidden by the cover. */}
      <div className="pointer-events-none absolute inset-0 z-0 text-ink/55" aria-hidden>
        <Sprig className="absolute -left-[1vw] bottom-[0.5vh] h-[17vh] w-auto" />
        <Bush className="absolute -right-[1.5vw] bottom-[1vh] h-[11vh] w-auto" />
        <Sprig className="absolute -right-[1vw] -top-[2vh] h-[13vh] w-auto rotate-180" />
      </div>

      <div className="relative z-10 h-full p-[clamp(16px,1.9vw,36px)]">
        <div
          className={[
            "relative h-full rounded-[clamp(22px,2.4vw,44px)]",
            "border-[clamp(9px,1vw,19px)] border-ink bg-paper",
            "shadow-[0_28px_70px_-20px_rgba(0,0,0,0.75)]",
          ].join(" ")}
        >
          <div className="paper-grid relative h-full w-full overflow-hidden rounded-[clamp(12px,1.3vw,24px)]">
            {children}
          </div>

          {/* Binding ribbon poking out of the bottom edge. */}
          <div
            className="absolute -bottom-[clamp(14px,1.5vw,28px)] left-1/2 h-[clamp(20px,2.1vw,38px)] w-[clamp(52px,5.4vw,96px)] -translate-x-1/2 rounded-b-[6px] bg-ink"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)" }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
