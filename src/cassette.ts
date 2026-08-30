/**
 * Incident cassettes — a shareable, deterministic replay format.
 *
 * A cassette is everything needed to reproduce an operational incident
 * exactly: the module it belongs to, the seed, configuration overrides, and
 * a timeline of operator actions at specific control ticks. Attach one to a
 * bug report and anyone can run the same incident; attach one to a fiction
 * episode and the reader can fly the event the chapter describes.
 *
 * The format is deliberately plain JSON with strict validation, because
 * cassettes are meant to travel — through issues, pull requests, and story
 * files — and be hand-edited without tooling.
 */

export interface CassetteAction {
  /** Control tick at which the action is applied (non-negative integer). */
  atTick: number;
  /** Module-defined action identifier, e.g. "inject" or "production". */
  action: string;
  /** Action parameters; numbers and strings only, so cassettes stay diffable. */
  params?: Record<string, number | string>;
  /** Optional narrative label shown while replaying. */
  label?: string;
}

export interface IncidentCassette {
  format: typeof CASSETTE_FORMAT;
  /** Module id from the registry in modules.ts. */
  module: string;
  title: string;
  notes?: string;
  /** Deterministic seed; the module's default when omitted. */
  seed?: number;
  /** Partial configuration overrides applied before the first tick. */
  config?: Record<string, unknown>;
  /** Operator actions in ascending tick order. */
  timeline: CassetteAction[];
  /** Tick to run to after the last action; defaults to the last action's tick. */
  runToTick?: number;
}

export const CASSETTE_FORMAT = "ruin-cassette/1" as const;

export type CassetteParseResult = { ok: true; cassette: IncidentCassette } | { ok: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateCassette(value: unknown): CassetteParseResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Cassette must be a JSON object"] };

  if (value.format !== CASSETTE_FORMAT)
    errors.push(`format must be "${CASSETTE_FORMAT}", got ${JSON.stringify(value.format)}`);
  if (typeof value.module !== "string" || value.module.length === 0)
    errors.push("module must be a non-empty string");
  if (typeof value.title !== "string" || value.title.length === 0)
    errors.push("title must be a non-empty string");
  if (value.seed !== undefined && !Number.isInteger(value.seed))
    errors.push("seed must be an integer when present");
  if (value.config !== undefined && !isRecord(value.config))
    errors.push("config must be an object when present");
  if (value.runToTick !== undefined && (!Number.isInteger(value.runToTick) || Number(value.runToTick) < 0))
    errors.push("runToTick must be a non-negative integer when present");

  if (!Array.isArray(value.timeline)) {
    errors.push("timeline must be an array");
  } else {
    let previousTick = -1;
    value.timeline.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`timeline[${index}] must be an object`);
        return;
      }
      if (!Number.isInteger(entry.atTick) || Number(entry.atTick) < 0)
        errors.push(`timeline[${index}].atTick must be a non-negative integer`);
      else if (Number(entry.atTick) < previousTick)
        errors.push(`timeline[${index}] is out of order; ticks must ascend`);
      else previousTick = Number(entry.atTick);
      if (typeof entry.action !== "string" || entry.action.length === 0)
        errors.push(`timeline[${index}].action must be a non-empty string`);
      if (entry.params !== undefined) {
        if (!isRecord(entry.params)) {
          errors.push(`timeline[${index}].params must be an object`);
        } else {
          for (const [key, parameter] of Object.entries(entry.params)) {
            if (typeof parameter !== "number" && typeof parameter !== "string")
              errors.push(`timeline[${index}].params.${key} must be a number or string`);
          }
        }
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, cassette: value as unknown as IncidentCassette };
}

export function parseCassette(text: string): CassetteParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, errors: [`Not valid JSON: ${(error as Error).message}`] };
  }
  return validateCassette(parsed);
}

/** Stable, human-diffable serialization. */
export function serializeCassette(cassette: IncidentCassette): string {
  return JSON.stringify(cassette, null, 2) + "\n";
}
