/**
 * Brand marks redrawn by hand: an ink outline with the brand colour dropped in
 * slightly off-register, the way a riso print or a rushed colouring-in misses
 * the lines. Everything is inline SVG so the launcher needs no network.
 */

const INK_STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type MarkProps = { className?: string };

function NetflixMark({ className }: MarkProps) {
  const n = "M3 97 L2 4 L17 3 L40 63 L39 3 L54 4 L53 97 L39 98 L16 39 L17 97 Z";
  return (
    <svg viewBox="-4 -4 64 108" className={className} aria-hidden>
      <path d={n} fill="#E50914" opacity="0.9" transform="translate(3 3)" />
      <path d={n} {...INK_STROKE} />
    </svg>
  );
}

function PrimeVideoMark({ className }: MarkProps) {
  const box =
    "M14 9 L86 7 Q93 7 93 15 L94 85 Q94 93 86 93 L15 94 Q7 94 7 86 L8 15 Q8 8 14 9 Z";
  return (
    <svg viewBox="-4 -4 106 106" className={className} aria-hidden>
      <path d={box} fill="#1FA2FF" opacity="0.9" transform="translate(3 3)" />
      <path d={box} {...INK_STROKE} />
      {/* Play head, knocked out of the blue. */}
      <path
        d="M41 30 L70 47 L41 63 Z"
        fill="#F7F0E3"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* The Amazon smile, with its little upward flick. */}
      <path
        d="M25 72 Q 50 85 76 70"
        fill="none"
        stroke="#F7F0E3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M69 66 L 77 69 L 73 77"
        fill="none"
        stroke="#F7F0E3"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JioHotstarMark({ className }: MarkProps) {
  const star =
    "M50 3 C 55 30, 70 45, 97 50 C 70 55, 55 70, 50 97 C 45 70, 30 55, 3 50 C 30 45, 45 30, 50 3 Z";
  return (
    <svg viewBox="-6 -6 112 112" className={className} aria-hidden>
      <defs>
        <linearGradient id="jhs-ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB13C" />
          <stop offset="55%" stopColor="#E8318A" />
          <stop offset="100%" stopColor="#6D2BE0" />
        </linearGradient>
      </defs>
      <path d={star} fill="url(#jhs-ink)" opacity="0.92" transform="translate(3 3)" />
      <path d={star} {...INK_STROKE} />
      <path
        d="M14 12 C 16 19, 20 23, 27 25 C 20 27, 16 31, 14 38 C 12 31, 8 27, 1 25 C 8 23, 12 19, 14 12 Z"
        fill="#FFB13C"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        transform="translate(62 -2) scale(0.62)"
      />
    </svg>
  );
}

function YouTubeMark({ className }: MarkProps) {
  const box =
    "M13 4 L98 2 Q107 2 107 12 L108 68 Q108 77 98 77 L14 78 Q5 78 5 68 L4 12 Q4 4 13 4 Z";
  return (
    <svg viewBox="-4 -6 118 92" className={className} aria-hidden>
      <path d={box} fill="#FF0033" opacity="0.9" transform="translate(3 3)" />
      <path d={box} {...INK_STROKE} />
      <path
        d="M45 25 L72 40 L45 56 Z"
        fill="#F7F0E3"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GenericMark({ className }: MarkProps) {
  const box =
    "M10 8 L90 6 Q97 6 97 14 L98 74 Q98 82 90 82 L11 83 Q3 83 3 75 L4 14 Q4 7 10 8 Z";
  return (
    <svg viewBox="-4 -4 108 94" className={className} aria-hidden>
      <path d={box} fill="#C4452E" opacity="0.28" transform="translate(3 3)" />
      <path d={box} {...INK_STROKE} />
      <path
        d="M40 28 L68 44 L40 60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MARKS: Record<string, (p: MarkProps) => React.ReactElement> = {
  netflix: NetflixMark,
  prime: PrimeVideoMark,
  jiohotstar: JioHotstarMark,
  youtube: YouTubeMark,
};

export function ServiceMark({ id, className }: { id: string; className?: string }) {
  const Mark = MARKS[id] ?? GenericMark;
  return <Mark className={className} />;
}
