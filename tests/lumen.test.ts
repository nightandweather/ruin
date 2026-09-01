import { describe, expect, it } from "vitest";
import { MODULES } from "../src/modules";
import {
  evaluateLumen,
  lumenConfig,
  LUMEN_CONTRACTS,
  RECTENNA_RECORD,
  WAVELENGTH_M,
  type DispatchPolicy,
  type LumenConfig,
  type LumenIncident,
} from "../src/lumen";

const POLICIES: DispatchPolicy[] = ["survival-first", "price-first", "contract-share"];
const INCIDENTS: LumenIncident[] = [
  "none",
  "pointing-fog",
  "relay-loss",
  "receiver-overheat",
  "demand-surge",
];

const sweep = (): LumenConfig[] =>
  POLICIES.flatMap((policy) => INCIDENTS.map((incident) => ({ ...lumenConfig(), policy, incident })));

describe("LUMEN grid", () => {
  it("is deterministic: the same scenario produces the same allocation", () => {
    for (const config of sweep()) expect(evaluateLumen(config)).toEqual(evaluateLumen(config));
  });

  it("keeps its physics inside the record it cites", () => {
    expect(WAVELENGTH_M).toBeCloseTo(0.0517, 4);
    for (const contract of LUMEN_CONTRACTS) {
      // Brown's 1975 rectenna is the ceiling, not a number to quietly beat.
      expect(contract.conversion).toBeLessThan(RECTENNA_RECORD);
      expect(contract.conversion).toBeGreaterThan(0);
    }
  });

  it("meets every contract on a nominal day, with margin, and says GO", () => {
    const r = evaluateLumen(lumenConfig());
    expect(r.shortfallGW).toBeCloseTo(0, 9);
    expect(r.heldCount).toBe(0);
    for (const customer of r.customers) expect(customer.reason).toBe("NONE");
    // Corridor holds are a standing constraint, so a nominal day is
    // CONDITIONAL with a note rather than a spotless GO.
    expect(r.readiness).toBe("CONDITIONAL");
    const quiet = evaluateLumen({ ...lumenConfig(), corridorTransitsPerDay: 0 });
    expect(quiet.readiness).toBe("GO");
    expect(quiet.safeMode).toBe("GRID NOMINAL");
  });
});

describe("INVARIANT — the ledger closes", () => {
  it("attributes every gigawatt of source across the whole sweep", () => {
    for (const config of sweep()) {
      const r = evaluateLumen(config);
      expect(Math.abs(r.balanceGW)).toBeLessThan(1e-9);
      const named =
        r.curtailedGW +
        r.corridorCurtailGW +
        r.relayLossGW +
        r.spillLossGW +
        r.conversionLossGW +
        r.deliveredGW;
      expect(named).toBeCloseTo(config.sourceGW, 9);
    }
  });
});

describe("INVARIANT — a receiver is never sent more than it can accept", () => {
  it("holds delivered power at or below every thermal limit, in every scenario", () => {
    for (const config of sweep()) {
      for (const r of evaluateLumen(config).customers) {
        const limit =
          r.contract.thermalLimitGW *
          (config.incident === "receiver-overheat" && r.contract.id === "habitat" ? 0.4 : 1);
        expect(r.deliveredGW).toBeLessThanOrEqual(limit + 1e-9);
      }
    }
  });

  it("caps the surged foundry at its receiver, not at its appetite", () => {
    const r = evaluateLumen({ ...lumenConfig(), incident: "demand-surge" });
    const foundry = r.customers.find((c) => c.contract.id === "foundry")!;
    expect(foundry.demandGW).toBeCloseTo(7 * 1.8, 9);
    expect(foundry.targetGW).toBeCloseTo(foundry.contract.thermalLimitGW, 9);
    expect(foundry.reason).toBe("THERMAL LIMIT");
  });
});

describe("INVARIANT — no pilot lock, no beam", () => {
  it("fails closed on the links whose wander exceeds their keep-out", () => {
    const r = evaluateLumen({ ...lumenConfig(), incident: "pointing-fog" });
    const byId = new Map(r.customers.map((c) => [c.contract.id, c]));
    expect(byId.get("habitat")!.authorized).toBe(false);
    expect(byId.get("foundry")!.authorized).toBe(false);
    expect(byId.get("agraria")!.authorized).toBe(true);
    expect(byId.get("datacore")!.authorized).toBe(true);
    expect(byId.get("propulsion")!.authorized).toBe(true);
    for (const held of [byId.get("habitat")!, byId.get("foundry")!]) {
      expect(held.deliveredGW).toBeCloseTo(0, 9);
      expect(held.grantGW).toBeCloseTo(0, 9);
      expect(held.reason).toBe("BEAM HELD");
    }
  });

  it("does not read the merit order: the survival-rank-one customer goes dark", () => {
    // The finding. Habitat is shed last by every dispatch policy, and loses
    // power anyway, under every policy, because geometry outranks dispatch.
    for (const policy of POLICIES) {
      const r = evaluateLumen({ ...lumenConfig(), policy, incident: "pointing-fog" });
      const habitat = r.customers.find((c) => c.contract.id === "habitat")!;
      const depot = r.customers.find((c) => c.contract.id === "propulsion")!;
      expect(habitat.contract.survivalRank).toBe(1);
      expect(habitat.deliveredGW).toBeCloseTo(0, 9);
      expect(depot.deliveredGW).toBeGreaterThan(0);
    }
  });

  it("prices the invariant: storage carries the habitat for hours, not days", () => {
    const r = evaluateLumen({ ...lumenConfig(), incident: "pointing-fog" });
    const habitat = r.customers.find((c) => c.contract.id === "habitat")!;
    expect(habitat.autonomyH).toBeCloseTo(40 / 8, 6);
    expect(r.readiness).toBe("NO-GO");
    expect(r.safeMode).toBe("SURVIVAL LOAD UNMET");
  });

  it("recovers when the operator buys back margin instead of overriding the lock", () => {
    const fogged = { ...lumenConfig(), incident: "pointing-fog" as const };
    // Halving jitter halves the wander; the habitat's keep-out holds again.
    const steadied = evaluateLumen({ ...fogged, jitterUrad: 1 });
    const habitat = steadied.customers.find((c) => c.contract.id === "habitat")!;
    expect(habitat.authorized).toBe(true);
    expect(habitat.unmetGW).toBeCloseTo(0, 9);
  });
});

describe("N-1 and the dispatch rule", () => {
  it("keeps survival load whole through a relay casualty under survival-first", () => {
    const r = evaluateLumen({ ...lumenConfig(), incident: "relay-loss" });
    expect(r.hubCapacityGW).toBeCloseTo(30, 9);
    expect(r.strandedGW).toBeGreaterThan(0);
    expect(r.survivalUnmetGW).toBeCloseTo(0, 9);
    expect(r.readiness).toBe("CONDITIONAL");
    // Someone still pays: the shed customers are the low-ranked ones.
    for (const c of r.customers.filter((c) => c.unmetGW > 1e-9)) {
      expect(c.contract.survivalRank).toBeGreaterThan(3);
      expect(["OUTRANKED", "THERMAL LIMIT"]).toContain(c.reason);
    }
  });

  it("starves the farm under price-first, through the same casualty", () => {
    const r = evaluateLumen({ ...lumenConfig(), policy: "price-first", incident: "relay-loss" });
    const agraria = r.customers.find((c) => c.contract.id === "agraria")!;
    expect(agraria.unmetGW).toBeGreaterThan(1);
    expect(r.readiness).toBe("NO-GO");
    // The same gigawatts, the same casualty: only the rule changed, and the
    // rule chose who eats.
    const survival = evaluateLumen({ ...lumenConfig(), incident: "relay-loss" });
    expect(survival.survivalUnmetGW).toBeCloseTo(0, 9);
  });

  it("makes a single-string grid a blackout, not a curtailment", () => {
    const r = evaluateLumen({ ...lumenConfig(), relayStrings: 1, incident: "relay-loss" });
    expect(r.hubCapacityGW).toBeCloseTo(0, 9);
    expect(r.deliveredGW).toBeCloseTo(0, 9);
    expect(r.readiness).toBe("NO-GO");
  });
});

describe("every shortfall is explained", () => {
  it("gives each unmet customer a reason, in every scenario", () => {
    for (const config of sweep()) {
      for (const r of evaluateLumen(config).customers) {
        if (r.shortfallGW > 1e-9) expect(r.reason).not.toBe("NONE");
        else expect(r.reason).toBe("NONE");
      }
    }
  });

  it("shaves everyone under pro-rata instead of ranking anyone", () => {
    const r = evaluateLumen({ ...lumenConfig(), policy: "contract-share", incident: "relay-loss" });
    const short = r.customers.filter((c) => c.shortfallGW > 1e-9);
    expect(short.length).toBe(r.customers.length);
    for (const c of short) expect(c.reason).toBe("PRO-RATA");
  });

  it("exports contracts whose module ids exist, for the customers that are modules", () => {
    const ids = MODULES.map((m) => m.id);
    for (const contract of LUMEN_CONTRACTS) {
      if (contract.moduleId !== null) expect(ids).toContain(contract.moduleId);
    }
  });
});
