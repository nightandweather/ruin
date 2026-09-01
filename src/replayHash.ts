/**
 * One canonical replay hash for the laboratory.
 *
 * RUIN's central claim is that every module is deterministic: the same
 * configuration and the same seed produce the same run, so an incident can be
 * replayed, argued about, and checked by someone else. A claim that is only
 * asserted in prose decays; this hash is how it is checked, and
 * tests/determinism.test.ts applies it to every registered module.
 *
 * FNV-1a over a key-ordered JSON encoding. It is a checksum for detecting
 * drift between two runs of the same code, not a cryptographic digest.
 */

/**
 * JSON with object keys emitted in sorted order, so two structurally equal
 * results hash alike regardless of the order their fields were assigned.
 * Non-finite numbers are encoded explicitly rather than becoming `null`,
 * because an `Infinity` that silently turns into a `0` is exactly the kind of
 * difference this hash exists to catch.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) return `"#${String(value)}"`;
    if (typeof value === "bigint") return `"#${value}n"`;
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value instanceof Map) {
    return `{"#map":[${[...value.entries()]
      .map(([k, v]) => `[${stableStringify(k)},${stableStringify(v)}]`)
      .join(",")}]}`;
  }
  if (value instanceof Set) return `{"#set":[${[...value].map(stableStringify).join(",")}]}`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/** Eight-hex-digit FNV-1a checksum of any JSON-encodable run result. */
export function replayHash(value: unknown): string {
  const text = stableStringify(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
