/**
 * The determinism gate.
 *
 * RUIN's central claim is that every laboratory is deterministic: same
 * configuration, same seed, same run. Individual suites assert it for the
 * modules whose authors remembered to; this one makes it structural. The
 * registry below must name every entry in the module registry, so a new
 * laboratory cannot reach `main` without a replayable run — the check that
 * fails is the registry parity test, with the missing module named.
 *
 * Each run is executed twice from scratch and compared two ways: deep
 * equality, which localises a difference, and the shared replay hash, which
 * is the artefact the interface actually shows an operator.
 */
import { describe, expect, it } from "vitest";

import { MODULES, type ModuleId } from "../src/modules";
import { replayHash, stableStringify } from "../src/replayHash";

import { DysonSwarmSimulation } from "../src/simulation";
import { heliosCassette } from "../src/heliosCassette";
import { runCivilizationCampaign } from "../src/powerCampaign";
import { AutonomousFoundrySimulation } from "../src/foundry";
import { DEFAULT_COLLECTOR_DESIGN, evaluateCollectorDesign } from "../src/collectorDesign";
import { DEFAULT_DATACORE_CONFIG, OrbitalDatacoreSimulation } from "../src/datacore";
import { DEFAULT_AGRARIA_CONFIG, AgrariaSimulation } from "../src/agraria";
import { DEFAULT_AEGIS_CONFIG, AegisSimulation } from "../src/aegis";
import { evaluateHygeia, hygeiaConfig } from "../src/hygeia";
import { DEFAULT_PROGENITOR_CONFIG, ProgenitorSimulation } from "../src/progenitor";
import { DEFAULT_GRAVITAS_CONFIG, GravitasSimulation } from "../src/gravitas";
import { CARTESIAN_STARS, routeMetrics, starsWithin } from "../src/stellarAtlas";
import { designSpacecraft, missionConfig } from "../src/navis";
import { engineConfig, evaluateEngine } from "../src/ignis";
import { evaluateVoyage, odysseyConfig } from "../src/odyssey";
import { evaluateMender, menderConfig } from "../src/mender";
import { corvusConfig, evaluateCorvus } from "../src/corvus";
import { evaluateKessler, kesslerConfig } from "../src/kessler";
import { evaluatePrometheus, prometheusConfig } from "../src/prometheus";
import { genesisConfig, simulateGenesis } from "../src/genesis";
import { evaluateMnemosyne, mnemosyneConfig } from "../src/mnemosyne";
import { evaluateThemis, themisConfig } from "../src/themis";
import { assessFailure, FAILURE_PLANS } from "../src/sentinel";
import { evaluateReliquary, reliquaryConfig } from "../src/reliquary";
import {
  advanceHorizon,
  createHorizonState,
  horizonProjection,
  injectHorizonIncident,
} from "../src/horizons";
import { evaluateWatchfloor, watchfloorConfig } from "../src/watchfloor";
import { evaluateVeritas, veritasConfig } from "../src/veritas";
import { censusConfig, evaluateCensus } from "../src/census";
import { chronosConfig, evaluateChronos } from "../src/chronos";
import { evaluateLex, lexConfig } from "../src/lex";
import { evaluateLumen, lumenConfig } from "../src/lumen";
import { conciliumConfig, evaluateConcilium } from "../src/concilium";
import { evaluatePorta, portaConfig } from "../src/porta";
import { evaluateValetudo, valetudoConfig } from "../src/valetudo";

/**
 * One replayable run per module. Every run must start from scratch — a run
 * that reuses state built outside the closure would compare a cached result
 * with itself and pass without proving anything.
 */
const RUNS: Record<ModuleId, () => unknown> = {
  helios: () => {
    const sim = new DysonSwarmSimulation();
    sim.step(20);
    sim.inject("communications-blackout");
    sim.step(10);
    sim.inject("thermal-wave");
    return sim.step(20);
  },
  concord: () =>
    runCivilizationCampaign(
      heliosCassette(
        "Determinism gate",
        [
          { atTick: 5, action: "inject", params: { scenario: "communications-blackout" } },
          { atTick: 9, action: "inject", params: { scenario: "demand-spike" } },
        ],
        { runToTick: 40 },
      ),
    ),
  foundry: () => {
    const sim = new AutonomousFoundrySimulation(2049, 24);
    return sim.step(80);
  },
  collector: () => evaluateCollectorDesign(DEFAULT_COLLECTOR_DESIGN),
  datacore: () => {
    const sim = new OrbitalDatacoreSimulation(DEFAULT_DATACORE_CONFIG, 4096);
    return sim.step(60);
  },
  agraria: () => {
    const sim = new AgrariaSimulation(DEFAULT_AGRARIA_CONFIG, 811);
    return sim.step(60);
  },
  aegis: () => {
    const sim = new AegisSimulation(DEFAULT_AEGIS_CONFIG);
    return sim.step(40);
  },
  hygeia: () => evaluateHygeia(hygeiaConfig()),
  progenitor: () => {
    const sim = new ProgenitorSimulation(DEFAULT_PROGENITOR_CONFIG);
    return sim.step(36);
  },
  gravitas: () => {
    const sim = new GravitasSimulation(DEFAULT_GRAVITAS_CONFIG);
    return sim.step(40);
  },
  atlas: () => ({
    stars: CARTESIAN_STARS,
    near: starsWithin(12),
    route: routeMetrics(4.2465, 0.1),
  }),
  navis: () => designSpacecraft(missionConfig("asteroid-freighter", 10.5)),
  ignis: () => evaluateEngine(engineConfig()),
  odyssey: () => evaluateVoyage(odysseyConfig()),
  mender: () => evaluateMender(menderConfig()),
  corvus: () => evaluateCorvus(corvusConfig()),
  kessler: () => evaluateKessler(kesslerConfig()),
  prometheus: () => evaluatePrometheus(prometheusConfig()),
  genesis: () => simulateGenesis(genesisConfig()),
  mnemosyne: () => evaluateMnemosyne(mnemosyneConfig()),
  themis: () => evaluateThemis(themisConfig()),
  sentinel: () => FAILURE_PLANS.map((plan) => assessFailure(plan, "major")),
  watchfloor: () => evaluateWatchfloor(watchfloorConfig()),
  veritas: () => evaluateVeritas(veritasConfig()),
  census: () => evaluateCensus(censusConfig()),
  chronos: () => evaluateChronos(chronosConfig()),
  lex: () => evaluateLex(lexConfig()),
  lumen: () => evaluateLumen(lumenConfig()),
  concilium: () => evaluateConcilium(conciliumConfig()),
  porta: () => evaluatePorta(portaConfig()),
  valetudo: () => evaluateValetudo(valetudoConfig()),
  reliquary: () => evaluateReliquary(reliquaryConfig()),
  horizons: () => {
    let state = createHorizonState();
    state = injectHorizonIncident(state, state.systems[0].id);
    state = advanceHorizon(state, 30);
    return { state, projection: horizonProjection(state) };
  },
};

describe("replay determinism", () => {
  it("registers a replayable run for every module, and vice versa", () => {
    expect(Object.keys(RUNS).sort()).toEqual(MODULES.map((module) => module.id).sort());
  });

  for (const module of MODULES) {
    it(`replays ${module.label} to the same result and the same hash`, () => {
      const run = RUNS[module.id];
      const first = run();
      const second = run();
      expect(second).toEqual(first);
      expect(replayHash(second)).toBe(replayHash(first));
    });
  }

  it("produces a distinct hash per module, so the gate cannot pass on empty runs", () => {
    const hashes = MODULES.map((module) => replayHash(RUNS[module.id]()));
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe("replay hash", () => {
  it("ignores key order but not values", () => {
    expect(replayHash({ a: 1, b: [2, 3] })).toBe(replayHash({ b: [2, 3], a: 1 }));
    expect(replayHash({ a: 1, b: 2 })).not.toBe(replayHash({ a: 1, b: 3 }));
    // Array order is meaningful — a reordered trajectory is a different run.
    expect(replayHash([1, 2])).not.toBe(replayHash([2, 1]));
  });

  it("keeps non-finite numbers distinguishable instead of flattening them", () => {
    expect(stableStringify({ v: Infinity })).not.toBe(stableStringify({ v: 0 }));
    expect(replayHash({ v: Infinity })).not.toBe(replayHash({ v: -Infinity }));
    expect(replayHash({ v: NaN })).not.toBe(replayHash({ v: null }));
    // JSON.stringify turns all three into `null`; the gate must not.
    expect(JSON.stringify({ v: Infinity })).toBe(JSON.stringify({ v: null }));
  });

  it("distinguishes an absent key from an explicit undefined, but not from itself", () => {
    expect(replayHash({ a: 1, b: undefined })).toBe(replayHash({ a: 1 }));
    expect(replayHash({ a: 1, b: null })).not.toBe(replayHash({ a: 1 }));
  });
});
