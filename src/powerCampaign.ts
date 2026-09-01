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
import {
  AgrariaSimulation,
  DEFAULT_AGRARIA_CONFIG,
  type AgrariaConfig,
  type AgrariaSnapshot,
} from "./agraria";

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

/**
 * One link in the campaign's causal trail: what happened, in which module,
 * and which earlier events caused it. The trail is how a cross-system
 * shortage stays explainable — every downstream consequence can be walked
 * back to the incident that produced it, by id rather than by narration.
 */
export interface CampaignEvent {
  id: number;
  module: string;
  kind: "supply" | "demand" | "settlement" | "allocation" | "consequence" | "truncation";
  detail: string;
  causes: readonly number[];
}

/** The event queue is bounded, per the bus's rules: overflow is a visible truncation event, not silence. */
export const MAX_CAMPAIGN_EVENTS = 64;

/**
 * AGRARIA adapter, demand side: post the farm's own power draw. The figure
 * comes from the engine's public snapshot, so the adapter cannot drift from
 * what the farm actually pulls.
 */
export function exportAgrariaDemand(
  config: AgrariaConfig,
  state: CivilizationState,
  seed = 811,
): CivilizationState {
  const probe = new AgrariaSimulation(config, seed).snapshot();
  const power = state.ledgers.power;
  return {
    ...state,
    ledgers: {
      ...state.ledgers,
      power: { ...power, demand: { ...power.demand, agraria: probe.facilityPowerMW } },
    },
  };
}

/**
 * AGRARIA adapter, allocation side: translate a curtailed grant into the
 * engine's own language. Grow lights dominate the draw and the engine's
 * facility power is linear in photoperiod, so a grant of half the ask
 * becomes half the light-hours — and the engine, not the adapter, computes
 * what that does to food.
 */
export function importAgrariaAllocation(config: AgrariaConfig, state: CivilizationState): AgrariaConfig {
  const ask = state.ledgers.power.demand.agraria ?? 0;
  const granted = state.ledgers.power.allocations.agraria ?? 0;
  const ratio = ask > 0 ? Math.min(1, granted / ask) : 1;
  return { ...config, photoperiodHours: config.photoperiodHours * ratio };
}

export interface CivilizationCampaignResult {
  state: CivilizationState;
  helios: SimulationSnapshot;
  datacore: DatacoreSnapshot;
  agraria: AgrariaSnapshot;
  /** The same farm under its full ask — the counterfactual the shortage is measured against. */
  agrariaBaseline: AgrariaSnapshot;
  datacoreAskMW: number;
  datacoreGrantMW: number;
  agrariaAskMW: number;
  agrariaGrantMW: number;
  events: readonly CampaignEvent[];
}

export type CivilizationCampaignOutcome =
  { ok: true; result: CivilizationCampaignResult } | { ok: false; errors: string[] };

/**
 * The campaign runner, second slice: HELIOS, DATACORE, and AGRARIA meet over
 * the power ledger, and a causal event trail records how one local failure
 * becomes a cross-system shortage. Deterministic end to end: the same
 * cassette yields the same civilization, the same trail.
 *
 * Priority is declared here, at the settlement, not inside any adapter:
 * survival baseline, then food, then compute. An adapter that could promote
 * its own module would make the policy a race.
 */
export function runCivilizationCampaign(
  cassette: IncidentCassette,
  options: {
    datacoreConfig?: DatacoreConfig;
    datacoreTicks?: number;
    datacoreSeed?: number;
    agrariaConfig?: AgrariaConfig;
    agrariaTicks?: number;
    agrariaSeed?: number;
  } = {},
): CivilizationCampaignOutcome {
  const replayed = runHeliosCassette(cassette);
  if (!replayed.ok) return replayed;
  const heliosSnapshot = replayed.replay.snapshot;

  const datacoreConfig = options.datacoreConfig ?? DEFAULT_DATACORE_CONFIG;
  const agrariaConfig = options.agrariaConfig ?? DEFAULT_AGRARIA_CONFIG;
  const agrariaSeed = options.agrariaSeed ?? 811;
  const agrariaTicks = options.agrariaTicks ?? 30;

  let state = createState(cassette.seed ?? 0, heliosSnapshot.tick);
  state = exportHeliosPower(heliosSnapshot, state);
  state = exportAgrariaDemand(agrariaConfig, state, agrariaSeed);
  state = exportDatacoreDemand(datacoreConfig, state);
  state = {
    ...state,
    ledgers: {
      ...state.ledgers,
      power: { ...state.ledgers.power, priority: ["civilization", "agraria", "datacore"] },
    },
  };
  state = settlePowerLedger(state);

  const power = state.ledgers.power;
  const supplyMW = Object.values(power.supply).reduce((sum, v) => sum + v, 0);
  const demandMW = Object.values(power.demand).reduce((sum, v) => sum + v, 0);
  const datacoreAskMW = power.demand.datacore ?? 0;
  const datacoreGrantMW = power.allocations.datacore ?? 0;
  const agrariaAskMW = power.demand.agraria ?? 0;
  const agrariaGrantMW = power.allocations.agraria ?? 0;

  const datacore = new OrbitalDatacoreSimulation(
    importDatacoreAllocation(datacoreConfig, state),
    options.datacoreSeed ?? 4096,
  );
  let datacoreSnapshot = datacore.snapshot();
  for (let tick = 0; tick < (options.datacoreTicks ?? 30); tick += 1) datacoreSnapshot = datacore.step();

  const runFarm = (config: AgrariaConfig) => {
    const farm = new AgrariaSimulation(config, agrariaSeed);
    let snapshot = farm.snapshot();
    for (let tick = 0; tick < agrariaTicks; tick += 1) snapshot = farm.step();
    return snapshot;
  };
  const agraria = runFarm(importAgrariaAllocation(agrariaConfig, state));
  const agrariaBaseline = runFarm(agrariaConfig);

  const events: CampaignEvent[] = [];
  const post = (
    module: string,
    kind: CampaignEvent["kind"],
    detail: string,
    causes: readonly number[] = [],
  ): number => {
    if (events.length >= MAX_CAMPAIGN_EVENTS) {
      const last = events[MAX_CAMPAIGN_EVENTS - 1];
      if (last.kind !== "truncation")
        events[MAX_CAMPAIGN_EVENTS - 1] = {
          id: last.id,
          module: "bus",
          kind: "truncation",
          detail: `Event queue full at ${MAX_CAMPAIGN_EVENTS}; later events dropped`,
          causes: [],
        };
      return events[MAX_CAMPAIGN_EVENTS - 1].id;
    }
    events.push({ id: events.length, module, kind, detail, causes });
    return events.length - 1;
  };

  const m = heliosSnapshot.metrics;
  const eSupply = post(
    "helios",
    "supply",
    `HELIOS posts ${supplyMW.toFixed(0)} MW capability at T${heliosSnapshot.tick} — ${m.deliveredGW.toFixed(2)} of ${m.demandGW.toFixed(2)} GW delivered, ${m.offlineCount + m.isolatedCount} nodes dark`,
  );
  const eCiv = post(
    "civilization",
    "demand",
    `Survival baseline asks ${(power.demand.civilization ?? 0).toFixed(0)} MW`,
  );
  const eFarm = post("agraria", "demand", `AGRARIA asks ${agrariaAskMW.toFixed(3)} MW for grow lights`);
  const eCore = post("datacore", "demand", `DATACORE asks ${datacoreAskMW.toFixed(2)} MW at full load`);
  const shortageMW = Math.max(0, demandMW - supplyMW);
  const eSettle = post(
    "bus",
    "settlement",
    shortageMW > 1e-6
      ? `Settlement finds ${shortageMW.toFixed(2)} MW of shortage — served in declared order: civilization, agraria, datacore`
      : `Settlement covers every ask with ${(supplyMW - demandMW).toFixed(0)} MW of surplus`,
    [eSupply, eCiv, eFarm, eCore],
  );

  const eFarmGrant = post(
    "agraria",
    "allocation",
    agrariaGrantMW < agrariaAskMW - 1e-9
      ? `AGRARIA granted ${agrariaGrantMW.toFixed(3)} of ${agrariaAskMW.toFixed(3)} MW — photoperiod cut to ${importAgrariaAllocation(agrariaConfig, state).photoperiodHours.toFixed(1)} h`
      : `AGRARIA granted its full ${agrariaAskMW.toFixed(3)} MW`,
    [eSettle],
  );
  const eCoreGrant = post(
    "datacore",
    "allocation",
    datacoreGrantMW < datacoreAskMW - 1e-9
      ? `DATACORE granted ${datacoreGrantMW.toFixed(2)} of ${datacoreAskMW.toFixed(2)} MW`
      : `DATACORE granted its full ${datacoreAskMW.toFixed(2)} MW`,
    [eSettle],
  );
  if (agraria.peopleFed < agrariaBaseline.peopleFed - 1e-9) {
    post(
      "agraria",
      "consequence",
      `Food output falls: ${agraria.peopleFed} fed against ${agrariaBaseline.peopleFed} under the full ask`,
      [eFarmGrant],
    );
  }
  if (datacoreGrantMW < datacoreAskMW - 1e-9 || datacoreSnapshot.mode !== "compute") {
    post(
      "datacore",
      "consequence",
      `Compute sheds: mode ${datacoreSnapshot.mode.toUpperCase()}, ${datacoreSnapshot.availableTiles} of ${datacoreSnapshot.tileStates.length} tiles lit`,
      [eCoreGrant],
    );
  }

  return {
    ok: true,
    result: {
      state,
      helios: heliosSnapshot,
      datacore: datacoreSnapshot,
      agraria,
      agrariaBaseline,
      datacoreAskMW,
      datacoreGrantMW,
      agrariaAskMW,
      agrariaGrantMW,
      events,
    },
  };
}
