/**
 * Deterministic pseudo-randomness. Server and client must produce byte-identical
 * path data or React will scream about a hydration mismatch, so nothing here is
 * allowed to touch Math.random().
 */
export function rng(seed: number): () => number {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000;
  };
}

const f = (n: number) => Math.round(n * 100) / 100;

/**
 * A rounded rectangle whose edges bow and wander like a pen stroke.
 * Draw it twice with different seeds to get the "sketched over" double line.
 */
export function sketchRect(
  w: number,
  h: number,
  r: number,
  seed: number,
  amp = 2.4,
): string {
  const rand = rng(seed);
  const j = () => (rand() - 0.5) * 2 * amp;

  // Bow each edge outward or inward by a little, then round the corners.
  const top = `M ${f(r + j())} ${f(j())} C ${f(w * 0.35 + j())} ${f(j() - amp * 0.6)}, ${f(w * 0.68 + j())} ${f(j() + amp * 0.5)}, ${f(w - r + j())} ${f(j())}`;
  const tr = `Q ${f(w + j())} ${f(j())}, ${f(w + j())} ${f(r + j())}`;
  const right = `C ${f(w + j() + amp * 0.5)} ${f(h * 0.36 + j())}, ${f(w + j() - amp * 0.6)} ${f(h * 0.7 + j())}, ${f(w + j())} ${f(h - r + j())}`;
  const br = `Q ${f(w + j())} ${f(h + j())}, ${f(w - r + j())} ${f(h + j())}`;
  const bottom = `C ${f(w * 0.66 + j())} ${f(h + j() + amp * 0.6)}, ${f(w * 0.33 + j())} ${f(h + j() - amp * 0.5)}, ${f(r + j())} ${f(h + j())}`;
  const bl = `Q ${f(j())} ${f(h + j())}, ${f(j())} ${f(h - r + j())}`;
  const left = `C ${f(j() - amp * 0.5)} ${f(h * 0.68 + j())}, ${f(j() + amp * 0.6)} ${f(h * 0.32 + j())}, ${f(j())} ${f(r + j())}`;
  const tl = `Q ${f(j())} ${f(j())}, ${f(r + j())} ${f(j())}`;

  return [top, tr, right, br, bottom, bl, left, tl, "Z"].join(" ");
}

/** A wavy underline, the kind you scrawl under a word you like. */
export function squiggle(w: number, amp = 5, waves = 5, seed = 7): string {
  const rand = rng(seed);
  const step = w / waves;
  let d = `M 0 ${f(amp)}`;
  for (let i = 0; i < waves; i += 1) {
    const dir = i % 2 === 0 ? -1 : 1;
    const wobble = (rand() - 0.5) * amp * 0.5;
    d += ` Q ${f(step * (i + 0.5))} ${f(amp + dir * amp + wobble)}, ${f(step * (i + 1))} ${f(amp + wobble * 0.3)}`;
  }
  return d;
}

/** A loose marker swipe - a fat pill drawn in one wobbly pass. */
export function highlight(w: number, h: number, seed = 3): string {
  return sketchRect(w, h, Math.min(w, h) / 2.1, seed, 4.5);
}
