/**
 * Marginalia. Every doodle is plain line art on `currentColor` with a uniform
 * pen weight (~2.2 units on a ~100-unit viewBox) so they read as one hand.
 */

type DoodleProps = { className?: string; "aria-hidden"?: boolean };

const pen = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Sprig({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 130" className={className} aria-hidden>
      <g {...pen}>
        <path d="M50 128 C 50 102, 48 80, 45 54" />
        <path d="M48 106 C 32 104, 20 94, 16 82 C 31 80, 44 91, 48 106 Z" />
        <path d="M48 93 C 64 90, 76 80, 80 68 C 66 66, 52 78, 48 93 Z" />
        <path d="M47 79 C 33 77, 24 66, 22 55 C 35 54, 45 66, 47 79 Z" />
        <path d="M46 65 C 59 62, 68 52, 69 41 C 58 41, 48 53, 46 65 Z" />
        <path d="M45 53 C 43 41, 47 28, 56 21 C 60 32, 55 46, 45 53 Z" />
      </g>
    </svg>
  );
}

export function Bush({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 70" className={className} aria-hidden>
      <g {...pen}>
        <path d="M6 64 C -2 48, 10 34, 22 39 C 24 21, 46 16, 54 30 C 66 20, 84 31, 81 46 C 93 51, 92 64, 82 64 Z" />
        <path d="M28 64 C 30 54, 36 48, 44 45" />
        <path d="M58 64 C 58 54, 64 47, 72 45" />
        <path d="M44 64 C 46 56, 50 50, 56 46" />
      </g>
    </svg>
  );
}

export function Popcorn({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 90 115" className={className} aria-hidden>
      <g {...pen}>
        <path d="M13 46 L 24 108 L 66 108 L 77 46 Z" />
        <path d="M11 46 L 79 46" />
        <path d="M31 47 L 36 108" />
        <path d="M49 47 L 50 108" />
        <path d="M64 47 L 60 108" />
        <path d="M24 45 C 15 43, 15 32, 24 31 C 25 22, 38 21, 40 30 C 48 28, 51 39, 43 44 Z" />
        <path d="M47 44 C 40 37, 46 27, 54 30 C 55 21, 68 23, 67 32 C 75 34, 72 44, 64 44 Z" />
        <path d="M60 18 C 55 15, 58 8, 63 10 C 64 5, 72 6, 71 12 C 76 14, 73 20, 68 19 Z" />
      </g>
    </svg>
  );
}

export function RetroTV({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 112" className={className} aria-hidden>
      <g {...pen}>
        <path d="M6 34 Q 6 26 15 26 L 85 26 Q 94 26 94 34 L 94 88 Q 94 96 85 96 L 15 96 Q 6 96 6 88 Z" />
        <path d="M15 36 Q 15 34 18 34 L 82 34 Q 85 34 85 37 L 85 85 Q 85 88 82 88 L 18 88 Q 15 88 15 85 Z" />
        <path d="M26 66 Q 36 54, 46 66 T 66 66" />
        <path d="M100 26 L 114 26 Q 118 26 118 32 L 118 90 Q 118 96 114 96 L 100 96 Q 96 96 96 90 L 96 32 Q 96 26 100 26 Z" />
        <circle cx="107" cy="44" r="6" />
        <circle cx="107" cy="64" r="6" />
        <path d="M101 82 L 113 82" />
        <path d="M38 26 L 22 6" />
        <path d="M62 26 L 80 4" />
        <circle cx="21" cy="4" r="3" />
        <circle cx="81" cy="3" r="3" />
        <path d="M22 96 L 15 110" />
        <path d="M78 96 L 85 110" />
      </g>
    </svg>
  );
}

export function Bird({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 74 62" className={className} aria-hidden>
      <g {...pen}>
        <path d="M11 40 C 8 22, 22 10, 38 12 C 52 14, 60 26, 56 38 C 52 48, 33 52, 20 48 Z" />
        <path d="M24 30 C 32 26, 44 30, 46 39 C 40 43, 28 40, 24 30" />
        <path d="M56 26 L 69 29 L 56 33" />
        <path d="M11 40 C 4 42, 1 48, 4 53" />
        <path d="M27 50 L 25 59" />
        <path d="M39 51 L 41 59" />
        <circle cx="48" cy="24" r="1.8" fill="currentColor" />
      </g>
    </svg>
  );
}

export function Cloud({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 48" className={className} aria-hidden>
      <g {...pen}>
        <path d="M14 42 C 3 42, 1 28, 12 26 C 9 11, 28 4, 36 15 C 44 3, 64 7, 66 21 C 80 19, 89 30, 80 42 Z" />
      </g>
    </svg>
  );
}

export function Sparkle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        d="M24 2 C 26.4 14.6 33.4 21.6 46 24 C 33.4 26.4 26.4 33.4 24 46 C 21.6 33.4 14.6 26.4 2 24 C 14.6 21.6 21.6 14.6 24 2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Remote({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 46 104" className={className} aria-hidden>
      <g {...pen}>
        <path d="M11 2 L 35 2 Q 44 2 44 12 L 44 92 Q 44 102 35 102 L 11 102 Q 2 102 2 92 L 2 12 Q 2 2 11 2 Z" />
        <circle cx="23" cy="22" r="8" />
        <path d="M23 18 L 23 26" />
        <circle cx="12" cy="45" r="4" />
        <circle cx="34" cy="45" r="4" />
        <circle cx="12" cy="62" r="4" />
        <circle cx="34" cy="62" r="4" />
        <path d="M11 82 L 35 82" />
        <path d="M14 91 L 32 91" />
      </g>
    </svg>
  );
}

export function Moon({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <g {...pen}>
        <path d="M40 4 C 22 8, 10 22, 12 38 C 14 52, 28 58, 42 54 C 26 46, 22 24, 40 4 Z" />
      </g>
    </svg>
  );
}

export function Coffee({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 90 90" className={className} aria-hidden>
      <g {...pen}>
        <path d="M12 34 L 18 76 Q 19 84 28 84 L 52 84 Q 61 84 62 76 L 68 34 Z" />
        <path d="M10 34 L 70 34" />
        <path d="M66 46 C 80 44, 84 58, 70 62" />
        <path d="M30 24 C 26 18, 34 14, 30 6" />
        <path d="M44 24 C 40 18, 48 14, 44 6" />
      </g>
    </svg>
  );
}

export function CurvedArrow({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 90 60" className={className} aria-hidden>
      <g {...pen}>
        <path d="M4 10 C 26 -2, 62 6, 80 40" />
        <path d="M68 34 L 82 43 L 70 51" />
      </g>
    </svg>
  );
}
