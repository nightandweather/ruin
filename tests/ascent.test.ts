import { describe, expect, it } from "vitest";
import {
  ascentConfig,
  CLIMBER_MASS_T,
  DRIVER_ACCEL_G,
  evaluateAscent,
  type AscentConfig,
  type AscentIncident,
} from "../src/ascent";

const INCIDENTS: AscentIncident[] = [
  "none",
  "tether-hold",
  "missed-window",
  "depot-saturation",
  "receiver-uncertainty",
];

const sweep = (): AscentConfig[] => INCIDENTS.map((incident) => ({ ...ascentConfig(), incident }));

describe("ASCENT custody chain", () => {
  it("is deterministic across every incident", () => {
    for (const config of sweep()) expect(evaluateAscent(config)).toEqual(evaluateAscent(config));
  });

  it("keeps its anchors: Edwards' climber, and a driver nothing alive can ride", () => {
    expect(CLIMBER_MASS_T).toBe(20);
    // 2.4 km/s in one kilometre — the exclusion of living cargo is physics.
    expect(DRIVER_ACCEL_G).toBeGreaterThan(250);
  });

  it("moves the nominal day whole: no backlog, no waiting crew, spares banking", () => {
    const r = evaluateAscent(ascentConfig());
    expect(r.backlogGrowth).toBeCloseTo(0, 9);
    expect(r.crewWaiting).toBeCloseTo(0, 9);
    expect(r.driverAuthorized).toBe(true);
    expect(r.depotNet).toBeGreaterThan(0);
    expect(r.runwayDays).toBe(Infinity);
  });
});

describe("INVARIANT — the cargo ledger closes", () => {
  it("accounts for every tonne, in every incident", () => {
    for (const config of sweep()) {
      const r = evaluateAscent(config);
      expect(r.ledgerResidueT).toBeLessThan(1e-9);
      // Surface: produced = moved + launched + waiting/backlog.
      expect(r.crewMoved + r.elevatorBulk + r.driverLaunched + r.backlogGrowth).toBeCloseTo(r.produced, 9);
      // Flight: launched = caught + debris.
      expect(r.driverCaptured + r.missesTPerDay).toBeCloseTo(r.driverLaunched, 9);
    }
  });
});

describe("INVARIANT — no launch without corridor, manifest, and receiver", () => {
  it("refuses the driver when the catcher drops below its floor", () => {
    const r = evaluateAscent({ ...ascentConfig(), incident: "receiver-uncertainty" });
    expect(r.receiverAuthorized).toBe(false);
    expect(r.driverLaunched).toBeCloseTo(0, 9);
    expect(r.missesTPerDay).toBeCloseTo(0, 9);
    expect(r.refusals.join(" ")).toContain("below the");
    // The refusal has a price, and the module states it: the depot drains.
    expect(r.installShortfall).toBeGreaterThan(0);
    expect(r.runwayDays).toBeLessThan(10);
    expect(r.readiness).toBe("NO-GO");
    expect(r.safeMode).toBe("SPARES RUNWAY CRITICAL");
  });

  it("treats a full depot as no receiver at all", () => {
    const r = evaluateAscent({ ...ascentConfig(), incident: "depot-saturation" });
    expect(r.depotAccepting).toBe(false);
    expect(r.driverLaunched).toBeCloseTo(0, 9);
    expect(r.refusals.join(" ")).toContain("no custody to offer");
    // Full of spares, so the shortfall is survivable — for a while.
    expect(r.runwayDays).toBeGreaterThan(10);
    expect(r.readiness).toBe("CONDITIONAL");
  });

  it("holds uncertified mass on the ground, on either road", () => {
    const r = evaluateAscent({ ...ascentConfig(), certificationTPerDay: 100 });
    expect(r.uncertified).toBeCloseTo(92, 9);
    expect(r.refusals.join(" ")).toContain("no manifest, no launch");
    expect(r.crewMoved + r.elevatorBulk + r.driverLaunched).toBeLessThanOrEqual(r.manifested + 1e-9);
  });
});

describe("INVARIANT — living cargo never boards the driver", () => {
  it("leaves crew waiting when the tether holds, with driver capacity to spare", () => {
    const r = evaluateAscent({ ...ascentConfig(), incident: "tether-hold" });
    expect(r.crewMoved).toBeCloseTo(0, 9);
    expect(r.crewWaiting).toBeCloseTo(ascentConfig().crewTPerDay, 9);
    // The finding: bulk reroutes when a road closes, people do not.
    expect(r.driverLaunched).toBeGreaterThan(evaluateAscent(ascentConfig()).driverLaunched);
    expect(r.driverCapacity - r.driverLaunched).toBeGreaterThan(0);
    expect(r.constraints.join(" ")).toContain("cannot take one of them");
    expect(r.safeMode).toBe("CREW HOLDING — ONE ROAD");
  });

  it("never launches more on the driver than the certified bulk", () => {
    for (const config of sweep()) {
      const r = evaluateAscent(config);
      expect(r.driverLaunched).toBeLessThanOrEqual(r.manifested - r.crewMoved - r.crewWaiting + 1e-9);
    }
  });
});

describe("the bottleneck is legible", () => {
  it("prices a missed window in runway days, not adjectives", () => {
    const r = evaluateAscent({ ...ascentConfig(), incident: "missed-window" });
    expect(r.driverLaunched).toBeLessThan(evaluateAscent(ascentConfig()).driverLaunched);
    expect(r.installShortfall).toBeGreaterThan(0);
    expect(r.runwayDays).toBeGreaterThan(10);
    expect(r.runwayDays).toBeLessThan(30);
    expect(r.constraints.join(" ")).toContain("days of spares runway");
  });

  it("counts missed buckets as debris, not as rounding", () => {
    const r = evaluateAscent(ascentConfig());
    expect(r.missesTPerDay).toBeGreaterThan(0);
    expect(r.constraints.join(" ")).toContain("KESSLER");
    expect(r.driverCaptured).toBeLessThan(r.driverLaunched);
  });

  it("grows a surface backlog when production outruns both roads", () => {
    const r = evaluateAscent({ ...ascentConfig(), foundryOutputTPerDay: 400 });
    expect(r.backlogGrowth).toBeGreaterThan(0);
    expect(r.constraints.join(" ")).toContain("production outruns safe transport");
    // The over-production never becomes an unsafe launch.
    expect(r.driverLaunched).toBeLessThanOrEqual(r.driverCapacity + 1e-9);
  });
});
