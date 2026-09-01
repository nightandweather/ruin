import { DEFAULT_CONFIG, DysonSwarmSimulation } from "./simulation";
import type { ScenarioType, SimulationSnapshot } from "./types";
import { replayHash } from "./replayHash";

export type FirstLightAction =
  | { tick: number; kind: "inject"; scenario: ScenarioType; bearingDeg?: number; label: string }
  | { tick: number; kind: "production"; units: number; label: string };

export const FIRST_LIGHT_ACTIONS: readonly FirstLightAction[] = [
  {
    tick: 10,
    kind: "inject",
    scenario: "communications-blackout",
    label: "Relay blackout splits orbital sectors",
  },
  { tick: 24, kind: "inject", scenario: "demand-spike", label: "Critical outer-system load requests power" },
  { tick: 38, kind: "production", units: 50, label: "FOUNDRY replacement order accepted" },
  { tick: 55, kind: "inject", scenario: "thermal-wave", label: "Solar thermal wave crosses the swarm" },
  {
    tick: 82,
    kind: "inject",
    scenario: "debris-corridor",
    bearingDeg: 315,
    label: "Debris corridor triggers bounded avoidance",
  },
];

export interface InvariantEvidence {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}
export interface CampaignCheckpoint {
  tick: number;
  label: string;
  availabilityPercent: number;
  deliveredGW: number;
  offline: number;
  isolated: number;
  invariants: readonly InvariantEvidence[];
}
export interface FirstLightReport {
  seed: number;
  actions: readonly FirstLightAction[];
  checkpoints: readonly CampaignCheckpoint[];
  finalSnapshot: SimulationSnapshot;
  traceHash: string;
  replayHash: string;
  replayVerified: boolean;
  allInvariantsPass: boolean;
}

function evidence(snapshot: SimulationSnapshot): InvariantEvidence[] {
  const unsafeExports = snapshot.satellites.filter(
    (s) => (s.mode === "offline" || s.mode === "isolated") && s.deliveredMW > 1e-9,
  ).length;
  const negativeDelivery = snapshot.satellites.filter((s) => s.deliveredMW < 0).length;
  const demandBound = snapshot.metrics.deliveredGW <= snapshot.metrics.potentialGW + 0.01;
  const collisionReserve = snapshot.metrics.confirmedImpacts <= snapshot.metrics.avoidanceManeuvers;
  const boundedLog = snapshot.events.length <= 80;
  return [
    {
      id: "fail-closed-export",
      label: "Uncommandable nodes export zero power",
      passed: unsafeExports === 0,
      detail: `${unsafeExports} unsafe exporters`,
    },
    {
      id: "non-negative-dispatch",
      label: "Dispatch never creates negative power",
      passed: negativeDelivery === 0,
      detail: `${negativeDelivery} negative nodes`,
    },
    {
      id: "physical-capacity",
      label: "Delivery stays below modeled potential",
      passed: demandBound,
      detail: `${snapshot.metrics.deliveredGW.toFixed(2)} / ${snapshot.metrics.potentialGW.toFixed(2)} GW`,
    },
    {
      id: "collision-resolution",
      label: "Avoidance resolves the majority of conjunctions",
      passed: collisionReserve,
      detail: `${snapshot.metrics.avoidanceManeuvers} burns / ${snapshot.metrics.confirmedImpacts} impacts`,
    },
    {
      id: "bounded-evidence",
      label: "Operational evidence remains bounded",
      passed: boundedLog,
      detail: `${snapshot.events.length} retained events`,
    },
  ];
}
const hashReport = (checkpoints: readonly CampaignCheckpoint[]) =>
  replayHash(
    checkpoints.map((c) => [
      c.tick,
      c.label,
      c.availabilityPercent,
      c.deliveredGW,
      c.offline,
      c.isolated,
      c.invariants.map((i) => i.passed),
    ]),
  );
function execute() {
  const sim = new DysonSwarmSimulation(),
    checkpoints: CampaignCheckpoint[] = [];
  for (const action of FIRST_LIGHT_ACTIONS) {
    const now = sim.snapshot().tick;
    if (action.tick > now) sim.step(action.tick - now);
    if (action.kind === "inject") sim.inject(action.scenario, { bearingDeg: action.bearingDeg });
    else sim.requestProduction(action.units);
    const snapshot = sim.step(1);
    checkpoints.push({
      tick: snapshot.tick,
      label: action.label,
      availabilityPercent: snapshot.metrics.availabilityPercent,
      deliveredGW: snapshot.metrics.deliveredGW,
      offline: snapshot.metrics.offlineCount,
      isolated: snapshot.metrics.isolatedCount,
      invariants: evidence(snapshot),
    });
  }
  const finalSnapshot = sim.step(140 - sim.snapshot().tick);
  checkpoints.push({
    tick: finalSnapshot.tick,
    label: "Autonomous recovery checkpoint",
    availabilityPercent: finalSnapshot.metrics.availabilityPercent,
    deliveredGW: finalSnapshot.metrics.deliveredGW,
    offline: finalSnapshot.metrics.offlineCount,
    isolated: finalSnapshot.metrics.isolatedCount,
    invariants: evidence(finalSnapshot),
  });
  return { checkpoints, finalSnapshot, traceHash: hashReport(checkpoints) };
}
export function runFirstLight(): FirstLightReport {
  const first = execute(),
    replay = execute();
  return {
    seed: DEFAULT_CONFIG.seed,
    actions: FIRST_LIGHT_ACTIONS,
    checkpoints: first.checkpoints,
    finalSnapshot: first.finalSnapshot,
    traceHash: first.traceHash,
    replayHash: replay.traceHash,
    replayVerified: first.traceHash === replay.traceHash,
    allInvariantsPass: first.checkpoints.every((c) => c.invariants.every((i) => i.passed)),
  };
}
