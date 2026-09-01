/**
 * Opening state from the query string.
 *
 * A laboratory whose interesting result is four clicks deep is a laboratory
 * nobody sees the interesting result of. These helpers let a link name the
 * state a page should open in — `census.html?policy=uniform`,
 * `veritas.html?model=ignis-fusion` — so a README, an issue, or an incident
 * report can point at a specific claim rather than at a control panel.
 *
 * The value is read once, when the page mounts. Nothing writes back to the
 * URL: an operator moving controls is exploring, not publishing, and a
 * location that rewrote itself under them would break the browser's back
 * button for no gain.
 *
 * An unknown or absent value falls back silently. A deep link is a
 * convenience, and a stale one must never leave a page unable to render.
 */

/** The page's own query string, or none outside a browser (tests, SSR). */
function currentSearch(): string {
  const location = (globalThis as { location?: { search?: string } }).location;
  return location?.search ?? "";
}

/**
 * One value from `allowed`, chosen by the `key` query parameter.
 * Matching is case-insensitive so a link survives being retyped.
 */
export function readDeepLink<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
  search: string = currentSearch(),
): T {
  let raw: string | null = null;
  try {
    raw = new URLSearchParams(search).get(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;
  const wanted = raw.trim().toLowerCase();
  return allowed.find((option) => option.toLowerCase() === wanted) ?? fallback;
}

/** A boolean switch: `?key=off` / `false` / `0` reads as false. */
export function readDeepLinkFlag(key: string, fallback: boolean, search: string = currentSearch()): boolean {
  const value = readDeepLink(key, ["on", "off", "true", "false", "1", "0"] as const, "", search);
  if (value === "") return fallback;
  return value === "on" || value === "true" || value === "1";
}
