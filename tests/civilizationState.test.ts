import { describe, expect, it } from "vitest";
import {
  assertPowerConservation,
  createState,
  settlePowerLedger,
  STATE_FORMAT,
  validateState,
} from "../src/civilizationState";
import { heliosCassette } from "../src/heliosCassette";
import { runPowerCampaign } from "../src/powerCampaign";
import { DEFAULT_DATACORE_CONFIG } from "../src/datacore";

const quietCassette = () => heliosCassette("Quiet grid", [], { runToTick: 60 });
const blackoutCassette = () =>
  heliosCassette(
    "Blackout plus surge",
    [
      { atTick: 5, action: "inject", params: { scenario: "communications-blackout" } },
      { atTick: 6, action: "inject", params: { scenario: "demand-spike" } },
    ],
    { runToTick: 12 },
  );

describe("civilization state document", () => {
  it("creates a valid empty world and rejects malformed ones", () => {
    expect(validateState(createState(1977, 0)).ok).toBe(true);
    const bad = validateState({
      format: "ruin-state/999",
      seed: 1.5,
      tick: -1,
      ledgers: { power: { unit: "GW", supply: { helios: -4 }, demand: {}, allocations: {}, priority: [] } },
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.join("\n")).toContain(STATE_FORMAT);
      expect(bad.errors.some((e) => e.includes("unit"))).toBe(true);
      expect(bad.errors.some((e) => e.includes("non-negative"))).toBe(true);
    }
  });

  it("never allocates more than the grid supplies — conservation invariant", () => {
    const state = createState(1, 0);
    state.ledgers.power.supply.helios = 10;
    state.ledgers.power.demand.a = 8;
    state.ledgers.power.demand.b = 8;
    state.ledgers.power.priority = ["a", "b"];
    const settled = settlePowerLedger(state);
    expect(settled.ledgers.power.allocations.a).toBe(8);
    expect(settled.ledgers.power.allocations.b).toBe(2);
    const total = Object.values(settled.ledgers.power.allocations).reduce((sum, v) => sum + v, 0);
    expect(total).toBeLessThanOrEqual(10);
    // A hand-built document that mints power is rejected outright.
    const forged = createState(1, 0);
    forged.ledgers.power.supply.helios = 1;
    forged.ledgers.power.demand.a = 5;
    forged.ledgers.power.allocations.a = 5;
    expect(() => assertPowerConservation(forged)).toThrow(/conservation/i);
  });

  it("serves survival load before discretionary load", () => {
    const state = createState(1, 0);
    state.ledgers.power.supply.helios = 100;
    state.ledgers.power.demand.civilization = 95;
    state.ledgers.power.demand.datacore = 20;
    state.ledgers.power.priority = ["civilization"];
    const settled = settlePowerLedger(state);
    expect(settled.ledgers.power.allocations.civilization).toBe(95);
    expect(settled.ledgers.power.allocations.datacore).toBe(5);
  });

  it("settles without mutating its input", () => {
    const state = createState(1, 0);
    state.ledgers.power.supply.helios = 10;
    state.ledgers.power.demand.a = 4;
    settlePowerLedger(state);
    expect(state.ledgers.power.allocations).toEqual({});
  });
});

describe("HELIOS ↔ DATACORE power campaign", () => {
  it("is deterministic end to end — same cassette, same civilization", () => {
    const first = runPowerCampaign(blackoutCassette());
    const second = runPowerCampaign(blackoutCassette());
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.result.state).toEqual(second.result.state);
      expect(first.result.datacore.availableTiles).toBe(second.result.datacore.availableTiles);
    }
  });

  it("grants DATACORE its full draw while the grid holds surplus", () => {
    const outcome = runPowerCampaign(quietCassette());
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.grantedMW).toBeCloseTo(outcome.result.requestedMW, 3);
      expect(outcome.result.datacore.availableTiles).toBe(DEFAULT_DATACORE_CONFIG.gpuTiles);
      expect(outcome.result.datacore.mode).not.toBe("power-cap");
    }
  });

  it("propagates a relay blackout into load-shed compute — the slice's point", () => {
    const quiet = runPowerCampaign(quietCassette());
    const dark = runPowerCampaign(blackoutCassette());
    expect(quiet.ok && dark.ok).toBe(true);
    if (quiet.ok && dark.ok) {
      // Survival demand outranks compute, so the vanished surplus lands
      // entirely on DATACORE: a computed consequence, not a narrated one.
      expect(dark.result.grantedMW).toBeLessThan(dark.result.requestedMW);
      expect(dark.result.datacore.mode).toBe("power-cap");
      expect(dark.result.datacore.availableTiles).toBeLessThan(quiet.result.datacore.availableTiles);
      expect(dark.result.datacore.verifiedComputePflops).toBeLessThan(
        quiet.result.datacore.verifiedComputePflops,
      );
    }
  });

  it("keeps the settled document conserving power under both scenarios", () => {
    for (const cassette of [quietCassette(), blackoutCassette()]) {
      const outcome = runPowerCampaign(cassette);
      expect(outcome.ok).toBe(true);
      if (outcome.ok) expect(() => assertPowerConservation(outcome.result.state)).not.toThrow();
    }
  });

  it("refuses cassettes that fail HELIOS validation", () => {
    const outcome = runPowerCampaign(heliosCassette("bad", [{ atTick: 0, action: "explode" }]));
    expect(outcome.ok).toBe(false);
  });
});

/**
 * Regression: the ledger is keyed by strings that come from module ids,
 * cassettes, and hand-edited documents, so it must not read anything off
 * Object.prototype. The property suite found this by generating the consumer
 * name "constructor"; these are the shrunk counterexample and its neighbours,
 * pinned so the failure cannot come back as an occasional red run.
 */
describe("the power ledger does not trust its own keys", () => {
  const withLedger = (supply: Record<string, number>, demand: Record<string, number>, priority: string[]) => {
    const state = createState(1, 0);
    return {
      ...state,
      ledgers: { ...state.ledgers, power: { ...state.ledgers.power, supply, demand, priority } },
    };
  };

  it("never admits a consumer that only exists on Object.prototype", () => {
    // The exact fast-check counterexample: empty supply, empty demand, and a
    // priority list naming a prototype member. `"constructor" in {}` is true.
    const settled = settlePowerLedger(withLedger({}, {}, ["constructor"]));
    expect(Object.keys(settled.ledgers.power.allocations)).toEqual([]);
    for (const value of Object.values(settled.ledgers.power.allocations)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("survives every prototype member a document might name", () => {
    for (const name of ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__"]) {
      const settled = settlePowerLedger(withLedger({ helios: 10 }, { datacore: 4 }, [name, "datacore"]));
      const allocations = settled.ledgers.power.allocations;
      expect(allocations.datacore).toBeCloseTo(4, 9);
      expect(Object.keys(allocations)).toEqual(["datacore"]);
    }
  });

  it("allocates to a real consumer actually named after a prototype member", () => {
    // If a document genuinely posts demand under that key, it is a consumer
    // like any other and must be served — the rule is own-property, not
    // name-blocking.
    const settled = settlePowerLedger(withLedger({ helios: 6 }, { constructor: 4 }, ["constructor"]));
    expect(settled.ledgers.power.allocations.constructor).toBeCloseTo(4, 9);
  });

  it("refuses a ledger whose arithmetic is not finite, instead of passing it", () => {
    // Every comparison against NaN is false, so a conservation check without
    // this guard would report success on a poisoned ledger.
    const state = createState(1, 0);
    const poisoned = {
      ...state,
      ledgers: {
        ...state.ledgers,
        power: { ...state.ledgers.power, supply: { helios: 10 }, allocations: { datacore: NaN } },
      },
    };
    expect(() => assertPowerConservation(poisoned)).toThrow(/not finite/);
  });
});
