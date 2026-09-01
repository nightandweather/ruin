import { describe, expect, it } from "vitest";
import { MANIFEST, evaluateWaystation, waystationConfig, type WaystationIncident } from "../src/waystation";

const INCIDENTS: WaystationIncident[] = [
  "none",
  "collar-fault",
  "boiloff",
  "radiator-outage",
  "unidentified-cargo",
  "debris-corridor",
  "disabled-vessel",
];

const sweep = () => INCIDENTS.map((incident) => ({ ...waystationConfig(), incident }));

describe("WAYSTATION port", () => {
  it("is deterministic across every incident", () => {
    for (const config of sweep()) expect(evaluateWaystation(config)).toEqual(evaluateWaystation(config));
  });

  it("runs the nominal shift without a missed window", () => {
    const r = evaluateWaystation(waystationConfig());
    expect(r.missedCount).toBe(0);
    expect(r.heldCount).toBe(0);
    expect(r.readiness).toBe("GO");
    expect(r.safeMode).toBe("PORT NOMINAL");
  });

  it("never departs a vessel before it is ready, in any scenario", () => {
    for (const config of sweep()) {
      for (const v of evaluateWaystation(config).vessels) {
        if (v.departureH === null || v.readyH === null) continue;
        // INVARIANT 5: departure waits for readiness and a window; a missed
        // window becomes holding, never a forced departure.
        expect(v.departureH).toBeGreaterThanOrEqual(v.readyH - 1e-9);
      }
    }
  });
});

describe("INVARIANT — no clearance without identity, confidence, and a berth", () => {
  it("routes the unidentified hold to quarantine, and nowhere else", () => {
    const r = evaluateWaystation(waystationConfig());
    const sealed = r.vessels.find((v) => v.vessel.id === "v5")!;
    expect(sealed.cleared).toBe(true);
    expect(sealed.vessel.identityConfirmed).toBe(false);
    // With no quarantine berth, the same vessel is held outside the sphere.
    const noQuarantine = evaluateWaystation({ ...waystationConfig(), quarantineBerths: 0 });
    const heldSealed = noQuarantine.vessels.find((v) => v.vessel.id === "v5")!;
    expect(heldSealed.cleared).toBe(false);
    expect(heldSealed.holdReason).toContain("quarantine");
    expect(noQuarantine.readiness).toBe("NO-GO");
  });

  it("holds a vessel below the confidence floor at the keep-out sphere", () => {
    const r = evaluateWaystation({ ...waystationConfig(), confidenceFloor: 0.993 });
    const held = r.vessels.filter((v) => !v.cleared);
    expect(held.length).toBeGreaterThan(0);
    for (const v of held) {
      expect(v.vessel.relStateConfidence).toBeLessThan(0.993);
      expect(v.dockH).toBeNull();
      expect(v.holdReason).toContain("confidence");
    }
  });
});

describe("INVARIANT — the emergency path is never sold", () => {
  it("keeps one standard berth out of every schedule", () => {
    // Cutting the pool to the reserve alone leaves nothing schedulable:
    // standard-berth traffic holds rather than borrowing the reserve.
    const r = evaluateWaystation({ ...waystationConfig(), standardBerths: 1 });
    for (const v of r.vessels.filter((x) => x.vessel.berth === "standard")) {
      expect(v.cleared).toBe(false);
      expect(v.holdReason).toContain("no standard berth");
    }
  });

  it("declares NO-GO when the disabled vessel consumes the reserve", () => {
    const r = evaluateWaystation({ ...waystationConfig(), incident: "disabled-vessel" });
    expect(r.reservePreserved).toBe(false);
    expect(r.readiness).toBe("NO-GO");
    expect(r.safeMode).toBe("EMERGENCY RESERVE COMMITTED");
    expect(r.constraints.join(" ")).toContain("next casualty has no port");
  });
});

describe("the finding — the ship that misses is not the ship that broke", () => {
  it("propagates a collar fault on the tanker to vessels with nothing wrong", () => {
    const nominal = evaluateWaystation(waystationConfig());
    const faulted = evaluateWaystation({ ...waystationConfig(), incident: "collar-fault" });
    expect(nominal.faultlessMissed).toEqual([]);
    // The fault is on v3; the missed windows include ships that carry no
    // fault at all, delayed purely by the shared queues behind her.
    expect(faulted.missedCount).toBeGreaterThan(0);
    expect(faulted.faultlessMissed.length).toBeGreaterThan(0);
    expect(faulted.faultlessMissed).not.toContain("v3");
    // And each missed vessel can name the exact queue that did it.
    for (const v of faulted.vessels.filter((x) => x.missedWindow && x.cleared)) {
      expect(v.bottleneck).not.toBe("none");
    }
  });

  it("prices a boiloff in departures racing the tank", () => {
    const r = evaluateWaystation({ ...waystationConfig(), incident: "boiloff" });
    const nominal = evaluateWaystation(waystationConfig());
    expect(r.missedCount).toBeGreaterThan(nominal.missedCount);
    // The tanker's bottleneck is the farm itself: dry until ASCENT delivers.
    const tanker = r.vessels.find((v) => v.vessel.id === "v3")!;
    expect(tanker.bottleneck).toBe("propellant farm");
    expect(r.constraints.join(" ")).toContain("race the tank");
  });

  it("reroutes cargo that fails provenance to quarantine, and the screen costs the window", () => {
    const r = evaluateWaystation({ ...waystationConfig(), incident: "unidentified-cargo" });
    const sparrow = r.vessels.find((v) => v.vessel.id === "v8")!;
    expect(sparrow.cleared).toBe(true);
    expect(sparrow.missedWindow).toBe(true);
    expect(r.constraints.join(" ")).toContain("quarantine");
  });

  it("slides every arrival when debris closes the corridor", () => {
    const nominal = evaluateWaystation(waystationConfig());
    const closed = evaluateWaystation({ ...waystationConfig(), incident: "debris-corridor" });
    for (const v of closed.vessels) {
      const base = nominal.vessels.find((x) => x.vessel.id === v.vessel.id)!;
      if (v.dockH === null || base.dockH === null) continue;
      expect(v.dockH).toBeGreaterThanOrEqual(base.dockH);
    }
    expect(closed.constraints.join(" ")).toContain("Debris corridor closed");
  });

  it("halves the port's hands under a radiator outage and shows who pays", () => {
    const nominal = evaluateWaystation(waystationConfig());
    const outage = evaluateWaystation({ ...waystationConfig(), incident: "radiator-outage" });
    expect(outage.missedCount).toBeGreaterThanOrEqual(nominal.missedCount);
    const totalWait = (r: typeof nominal) =>
      r.vessels.reduce((sum, v) => sum + (Number.isFinite(v.waitH) ? v.waitH : 0), 0);
    expect(totalWait(outage)).toBeGreaterThan(totalWait(nominal));
  });
});

describe("the manifest holds its shape", () => {
  it("keeps provenance and windows well-formed", () => {
    for (const vessel of MANIFEST) {
      expect(vessel.windowCloseH).toBeGreaterThan(vessel.windowOpenH);
      expect(vessel.windowPeriodH).toBeGreaterThan(0);
      expect(vessel.relStateConfidence).toBeGreaterThan(0);
      expect(vessel.relStateConfidence).toBeLessThanOrEqual(1);
    }
    // The tight-window runner the cascade is aimed at carries no fault.
    const meridian = MANIFEST.find((v) => v.id === "v6")!;
    expect(meridian.repairH).toBe(0);
    expect(meridian.identityConfirmed).toBe(true);
  });
});
