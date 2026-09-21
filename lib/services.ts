import { readFile } from "node:fs/promises";
import path from "node:path";

export type Service = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  /** Primary brand colour, used for the focus glow and gradients. */
  color: string;
  /** Second stop of the tile gradient. */
  colorTo: string;
  /** Verb for the headline: "Tonight we're <verb> ...". */
  verb?: string;
  /** Optional per-service user agent override. */
  userAgent?: string;
  /**
   * Kiosk (the default) is fullscreen with no browser UI at all. Set false
   * for the general browser tile, which needs a visible address bar.
   */
  kiosk?: boolean;
  enabled?: boolean;
};

/** Shipped defaults - used when config/services.json is missing or unreadable. */
export const DEFAULT_SERVICES: Service[] = [
  {
    id: "netflix",
    name: "Netflix",
    tagline: "Films, series and everything in between",
    url: "https://www.netflix.com",
    color: "#E50914",
    colorTo: "#7B0710",
  },
  {
    id: "prime",
    name: "Prime Video",
    tagline: "Included with your Amazon Prime membership",
    url: "https://www.primevideo.com",
    color: "#1FA2FF",
    colorTo: "#0B5C9E",
  },
  {
    id: "jiohotstar",
    name: "JioHotstar",
    tagline: "Live sport, Indian cinema and originals",
    url: "https://www.hotstar.com/in",
    color: "#E8318A",
    colorTo: "#6D2BE0",
  },
  {
    id: "youtube",
    name: "YouTube",
    tagline: "Everything the internet has to offer",
    url: "https://www.youtube.com",
    color: "#FF0033",
    colorTo: "#A3000F",
  },
  {
    id: "browser",
    name: "Browser",
    tagline: "Everywhere else on the web",
    url: "https://www.google.com",
    color: "#D98324",
    colorTo: "#8C4A12",
    verb: "browsing",
    kiosk: false,
  },
];

const CONFIG_PATH =
  process.env.PI_TV_CONFIG ?? path.join(process.cwd(), "config", "services.json");

function isService(value: unknown): value is Service {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.url === "string" &&
    /^https?:\/\//.test(v.url)
  );
}

/**
 * Reads the on-disk service list so the config can be edited on the Pi
 * without rebuilding. Falls back to DEFAULT_SERVICES on any problem.
 */
export async function getServices(): Promise<Service[]> {
  try {
    const raw = await readFile(/* turbopackIgnore: true */ CONFIG_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const list = (parsed as { services?: unknown }).services;
    if (!Array.isArray(list)) return DEFAULT_SERVICES;

    const services = list.filter(isService).map((s) => ({
      ...s,
      tagline: s.tagline ?? "",
      color: s.color ?? "#6366F1",
      colorTo: s.colorTo ?? s.color ?? "#312E81",
    }));

    const usable = services.filter((s) => s.enabled !== false);
    return usable.length > 0 ? usable : DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}
