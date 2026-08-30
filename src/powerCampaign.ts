import { runHeliosCassette } from "./heliosCassette";
import type { IncidentCassette } from "./cassette";
import type { SimulationSnapshot } from "./types";
import { createState, settlePowerLedger, type CivilizationState } from "./civilizationState";
import {
  DEFAULT_DATACORE_CONFIG,
  OrbitalDatacoreSimulation,
  type DatacoreConfig,
  type DatacoreSnapshot,
} from "./datacore";

/**
 * The state bus's first executable slice: HELIOS and DATACORE meet over the
 * power ledger, and nothing else. Each side has one adapter; the campaign
 * runner replays a HELIOS cassette, settles the ledger, and hands DATACORE
 * whatever the settlement granted.
 *
 * The policy the settlement encodes is survival-first: the civilization's
 * baseline demand is served before discretionary compute. A relay blackout
 * that erases the grid's surplus therefore reaches DATACORE as a shrunken
 * allocation — a computed consequence, not a narrated one.
 */

/**
 * HELIOS adapter: post grid supply and the civilization's survival demand.
 * Supply is the swarm's safe generating capability (potentialGW), not its
 * curtailed dispatch — deliveredGW already tracks demand, so posting it
 * would hide every surplus the settlement exists to distribute.
 */
export function exportHeliosPower(snapshot: SimulationSnapshot, state: CivilizationState): CivilizationState {
  const power = state.ledgers.power;
  return {
    ...state,
    tick: snapshot.tick,
    ledgers: {
      ...state.ledgers,
      power: {
        ...power,
        supply: { ...power.supply, helios: snapshot.metrics.potentialGW * 1000 },
        demand: { ...power.demand, civilization: snapshot.metrics.demandGW * 1000 },
        priority: power.priority.includes("civilization")
          ? power.priority
          : ["civilization", ...power.priority],
      },
    },
    snapshots: { ...state.snapshots, helios: { tick: snapshot.tick, metrics: snapshot.metrics } },
  };
}

/** DATACORE adapter, demand side: post the facility's full-load draw. */
export function exportDatacoreDemand(config: DatacoreConfig, state: CivilizationState): CivilizationState {
  const facilityMW = (config.gpuTiles * config.tilePowerKw * 1.24) / 1000;
  const power = state.ledgers.power;
  return {
    ...state,
    ledgers: {
      ...state.ledgers,
      power: { ...power, demand: { ...power.demand, datacore: Number(facilityMW.toFixed(6)) } },
    },
  };
}

/** DATACORE adapter, allocation side: read what settlement granted. */
export function importDatacoreAllocation(config: DatacoreConfig, state: CivilizationState): DatacoreConfig {
  return { ...config, allocatedPowerMW: state.ledgers.power.allocations.datacore ?? 0 };
}

export interface PowerCampaignResult {
  state: CivilizationState;
  helios: SimulationSnapshot;
  datacore: DatacoreSnapshot;
  /** MW the settlement granted DATACORE, against what it asked for. */
  grantedMW: number;
  requestedMW: number;
}

export type PowerCampaignOutcome =
  { ok: true; result: PowerCampaignResult } | { ok: false; errors: string[] };

/**
 * Replay a HELIOS cassette, settle the shared power ledger, and run DATACORE
 * for `datacoreTicks` under the granted allocation. Fully deterministic:
 * the same cassette yields the same civilization outcome.
 */
export function runPowerCampaign(
  cassette: IncidentCassette,
  options: { datacoreConfig?: DatacoreConfig; datacoreTicks?: number; datacoreSeed?: number } = {},
): PowerCampaignOutcome {
  const replayed = runHeliosCassette(cassette);
  if (!replayed.ok) return replayed;
  const heliosSnapshot = replayed.replay.snapshot;

  const datacoreConfig = options.datacoreConfig ?? DEFAULT_DATACORE_CONFIG;
  let state = createState(cassette.seed ?? 0, heliosSnapshot.tick);
  state = exportHeliosPower(heliosSnapshot, state);
  state = exportDatacoreDemand(datacoreConfig, state);
  state = settlePowerLedger(state);

  const datacore = new OrbitalDatacoreSimulation(
    importDatacoreAllocation(datacoreConfig, state),
    options.datacoreSeed ?? 4096,
  );
  let datacoreSnapshot = datacore.snapshot();
  for (let tick = 0; tick < (options.datacoreTicks ?? 30); tick += 1) datacoreSnapshot = datacore.step();

  return {
    ok: true,
    result: {
      state,
      helios: heliosSnapshot,
      datacore: datacoreSnapshot,
      grantedMW: state.ledgers.power.allocations.datacore ?? 0,
      requestedMW: state.ledgers.power.demand.datacore ?? 0,
    },
  };
}
