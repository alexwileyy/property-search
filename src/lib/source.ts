import type { PropertySource } from "@/db/schema";

export function detectSource(url: string): PropertySource | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();

  if (/(^|\.)rightmove\.co\.uk$/.test(host)) return "rightmove";
  if (/(^|\.)zoopla\.co\.uk$/.test(host)) return "zoopla";
  return "other";
}

export function canServerFetch(source: PropertySource): boolean {
  return source === "rightmove";
}
