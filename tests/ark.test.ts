import { describe, expect, it } from "vitest";
import { arkConfig, evaluateArk, O2_KG_PER_PERSON_DAY, type ArkIncident } from "../src/ark";

const INCIDENTS: ArkIncident[] = [
  "none",
  "curing-structure",
  "scrubber-fault",
  "crop-collapse",
  "leak-growth",
  "water-processor-down",
];

const sweep = () => INCIDENTS.map((incident) => ({ ...arkConfig(), incident }));
const loopOf = (r: ReturnType<typeof evaluateArk>, loop: string) => r.loops.find((l) => l.loop === loop)!;

describe("ARK habitat", () => {
  it("is deterministic across every incident", () => {
    for (const config of sweep()) expect(evaluateArk(config)).toEqual(evaluateArk(config));
  });

  it("survives a nominal year with every loop recoverable", () => {
    const r = evaluateArk(arkConfig());
    expect(r.failedLoops).toEqual([]);
    expect(r.compoundingLoops).toEqual([]);
    expect(r.o2Injections).toBe(0);
    // Closure is high and still not 100: the resupply calls are the point.
    expect(r.closurePercent).toBeGreaterThan(90);
    expect(r.resupplies).toBeGreaterThan(0);
    expect(r.constraints.join(" ")).toContain("not a number anyone has ever made 100");
    expect(O2_KG_PER_PERSON_DAY).toBeCloseTo(0.84, 9);
  });
});

describe("INVARIANT — every loop's ledger closes", () => {
  it("moves each store by exactly its named flows, in every scenario", () => {
    for (const config of sweep()) {
      expect(evaluateArk(config).ledgerResidueKg).toBeLessThan(1e-6);
    }
  });
});

describe("the Biosphere 2 incident — a decline that reads as nominal", () => {
  it("keeps the CO₂ telemetry silent while the oxygen falls", () => {
    const r = evaluateArk({ ...arkConfig(), incident: "curing-structure" });
    const oxygen = loopOf(r, "oxygen");
    const carbon = loopOf(r, "carbon");
    expect(oxygen.compounding).toBe(true);
    // The alarm that would have flagged the loss never fires: the curing
    // structure ate the signal along with the CO₂.
    expect(carbon.thresholdAlarmDay).toBeNull();
    expect(carbon.trendAlarmDay).toBeNull();
    expect(r.constraints.join(" ")).toContain("reads nominal");
  });

  it("measures the silent window as a property of the alarm, not the failure", () => {
    const r = evaluateArk({ ...arkConfig(), incident: "curing-structure" });
    const oxygen = loopOf(r, "oxygen");
    expect(oxygen.trendAlarmDay).toBe(arkConfig().trendAlarmDays);
    expect(oxygen.thresholdAlarmDay).toBeGreaterThan(100);
    expect(r.silentWindowDays).toBeGreaterThan(100);
    expect(r.safeMode).toBe("MASKED DECLINE — TREND CAUGHT IT");
  });

  it("pays for the year in counted injections, like Biosphere 2 paid", () => {
    const r = evaluateArk({ ...arkConfig(), incident: "curing-structure" });
    expect(r.o2Injections).toBeGreaterThanOrEqual(2);
    expect(loopOf(r, "oxygen").failureDay).toBeNull();
    expect(r.constraints.join(" ")).toContain("Biosphere 2 needed two");
  });
});

describe("loud failures stay loud", () => {
  it("raises the CO₂ threshold alarm under a scrubber fault", () => {
    const r = evaluateArk({ ...arkConfig(), incident: "scrubber-fault" });
    const carbon = loopOf(r, "carbon");
    expect(carbon.compounding).toBe(true);
    expect(carbon.thresholdAlarmDay).not.toBeNull();
    // The trend alarm still beats the threshold alarm.
    expect(carbon.trendAlarmDay!).toBeLessThan(carbon.thresholdAlarmDay!);
  });

  it("compounds three loops at once when the crops collapse", () => {
    const r = evaluateArk({ ...arkConfig(), incident: "crop-collapse" });
    expect(r.compoundingLoops).toContain("oxygen");
    expect(r.compoundingLoops).toContain("carbon");
    expect(r.compoundingLoops).toContain("food");
    expect(r.readiness).toBe("NO-GO");
    expect(loopOf(r, "food").failureDay).not.toBeNull();
  });

  it("turns a seal failure into an atmosphere problem, not a plumbing note", () => {
    const r = evaluateArk({ ...arkConfig(), incident: "leak-growth" });
    expect(loopOf(r, "oxygen").compounding).toBe(true);
    expect(r.o2Injections).toBeGreaterThan(0);
    // Water is hit too, but the resupply schedule covers it.
    expect(loopOf(r, "water").compounding).toBe(false);
    expect(loopOf(r, "water").failureDay).toBeNull();
  });

  it("prices a degraded water processor in resupply dependence, not failure", () => {
    const nominal = evaluateArk(arkConfig());
    const degraded = evaluateArk({ ...arkConfig(), incident: "water-processor-down" });
    expect(Math.abs(degraded.waterNetKgPerDay)).toBeGreaterThan(3 * Math.abs(nominal.waterNetKgPerDay));
    expect(degraded.failedLoops).toEqual([]);
    expect(degraded.closurePercent).toBeLessThan(nominal.closurePercent);
    expect(degraded.constraints.join(" ")).toContain("leans on ASCENT");
  });
});

describe("makeup is finite and counted", () => {
  it("keeps the food loop honest about leaning on stores", () => {
    const r = evaluateArk(arkConfig());
    expect(r.peopleFed).toBeLessThan(arkConfig().crew);
    expect(r.constraints.join(" ")).toContain("by design");
    // With fewer mouths than the farm feeds, the lean disappears.
    const small = evaluateArk({ ...arkConfig(), crew: 20 });
    expect(small.foodNetCrewDaysPerDay).toBeCloseTo(0, 9);
  });
});
