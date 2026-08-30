import { CASSETTE_FORMAT, type CassetteAction, type IncidentCassette } from "./cassette";
import { DysonSwarmSimulation } from "./simulation";
import type { ScenarioType, SimulationConfig, SimulationSnapshot } from "./types";

/**
 * HELIOS's cassette dialect.
 *
 * Actions:
 * - "inject"     params: { scenario, bearingDeg? }
 * - "production" params: { units }
 *
 * Replay is deterministic: the same cassette always yields the same final
 * snapshot, so a cassette attached to an issue or a fiction episode is a
 * complete reproduction of the incident it describes.
 */

const SCENARIOS: readonly ScenarioType[] = [
  "communications-blackout",
  "thermal-wave",
  "cascade-failure",
  "demand-spike",
  "debris-corridor",
];

export interface HeliosReplay {
  snapshot: SimulationSnapshot;
  applied: string[];
}

export type HeliosReplayResult = { ok: true; replay: HeliosReplay } | { ok: false; errors: string[] };

export function runHeliosCassette(cassette: IncidentCassette): HeliosReplayResult {
  if (cassette.module !== "helios")
    return { ok: false, errors: [`This cassette targets "${cassette.module}", not HELIOS`] };

  const errors: string[] = [];
  for (const [index, entry] of cassette.timeline.entries()) {
    if (entry.action === "inject") {
      const scenario = entry.params?.scenario;
      if (!SCENARIOS.includes(scenario as ScenarioType))
        errors.push(`timeline[${index}]: unknown scenario ${JSON.stringify(scenario)}`);
    } else if (entry.action === "production") {
      const units = entry.params?.units;
      if (typeof units !== "number" || !Number.isInteger(units) || units <= 0)
        errors.push(`timeline[${index}]: production units must be a positive integer`);
    } else {
      errors.push(`timeline[${index}]: HELIOS does not define action "${entry.action}"`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const overrides: Partial<SimulationConfig> = {
    ...(cassette.config as Partial<SimulationConfig> | undefined),
    ...(cassette.seed !== undefined ? { seed: cassette.seed } : {}),
  };
  const simulation = new DysonSwarmSimulation(overrides);
  const applied: string[] = [];

  for (const entry of cassette.timeline) {
    const now = simulation.snapshot().tick;
    if (entry.atTick > now) simulation.step(entry.atTick - now);
    if (entry.action === "inject") {
      const scenario = entry.params!.scenario as ScenarioType;
      const bearingDeg = entry.params?.bearingDeg;
      simulation.inject(scenario, typeof bearingDeg === "number" ? { bearingDeg } : {});
      applied.push(`T${entry.atTick} inject ${scenario}`);
    } else {
      simulation.requestProduction(entry.params!.units as number);
      applied.push(`T${entry.atTick} production ${entry.params!.units}`);
    }
  }

  const lastTick = cassette.timeline.at(-1)?.atTick ?? 0;
  const target = Math.max(cassette.runToTick ?? lastTick, lastTick);
  const now = simulation.snapshot().tick;
  const snapshot = target > now ? simulation.step(target - now) : simulation.snapshot();
  return { ok: true, replay: { snapshot, applied } };
}

/** Build a HELIOS cassette from a recorded operator session. */
export function heliosCassette(
  title: string,
  timeline: CassetteAction[],
  options: { seed?: number; runToTick?: number; notes?: string } = {},
): IncidentCassette {
  return {
    format: CASSETTE_FORMAT,
    module: "helios",
    title,
    ...(options.notes ? { notes: options.notes } : {}),
    ...(options.seed !== undefined ? { seed: options.seed } : {}),
    timeline,
    ...(options.runToTick !== undefined ? { runToTick: options.runToTick } : {}),
  };
}
