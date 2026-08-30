import { describe, expect, it } from "vitest";
import { CAREER_LIMIT_MSV, evaluateHygeia, hygeiaConfig } from "../src/hygeia";

describe("HYGEIA crew radiation-health operations", () => {
  it("reduces chronic dose monotonically with habitat shielding", () => {
    const c = hygeiaConfig();
    const thin = evaluateHygeia({ ...c, habitatShieldGcm2: 5 });
    const thick = evaluateHygeia({ ...c, habitatShieldGcm2: 60 });
    expect(thick.chronicMSv).toBeLessThan(thin.chronicMSv);
    // GCR cannot be shielded away entirely — the floor survives any mass.
    expect(evaluateHygeia({ ...c, habitatShieldGcm2: 10_000 }).habitatGcrMSvDay).toBeGreaterThan(0);
  });

  it("keeps the shelter strictly better than the hull during a storm", () => {
    const r = evaluateHygeia({ ...hygeiaConfig(), spe: "aug-1972" });
    expect(r.speShelterMSv).toBeLessThan(r.speHabitatMSv);
    expect(r.speHabitatMSv).toBeLessThan(r.speSuitMSv);
  });

  it("fails closed when the career bound is exceeded — assignment refused", () => {
    const r = evaluateHygeia({
      ...hygeiaConfig(),
      priorCareerMSv: 520,
      missionDays: 900,
      habitatShieldGcm2: 5,
    });
    expect(r.careerBoundMSv).toBeGreaterThan(CAREER_LIMIT_MSV);
    expect(r.readiness).toBe("NO-GO");
    expect(r.constraints[0]).toContain("refused");
  });

  it("plans against the widened bound when dosimetry drifts", () => {
    const c = hygeiaConfig();
    const clean = evaluateHygeia(c);
    const drift = evaluateHygeia({ ...c, incident: "dosimeter-drift" });
    expect(drift.missionBoundMSv).toBeGreaterThan(clean.missionBoundMSv);
    expect(drift.missionBestMSv).toBeCloseTo(clean.missionBestMSv);
  });

  it("routes overflow crew to hull exposure when shelter seats run out", () => {
    const c = { ...hygeiaConfig(), spe: "aug-1972" as const };
    const seated = evaluateHygeia({ ...c, shelterCapacity: 20 });
    const overflow = evaluateHygeia({ ...c, shelterCapacity: 4 });
    expect(overflow.shelterDeficit).toBe(overflow.crew - 4);
    expect(overflow.worstStormMSv).toBeGreaterThan(seated.worstStormMSv);
    expect(overflow.safeMode).toBe("SHELTER TRIAGE");
  });

  it("flags EVA crew caught outside when warning cannot cover recall", () => {
    const r = evaluateHygeia({
      ...hygeiaConfig(),
      spe: "oct-2003",
      speWarningMinutes: 5,
      evaRecallMinutes: 40,
    });
    expect(r.caughtOutside).toBe(true);
    expect(r.recallMarginMin).toBeLessThan(0);
    expect(r.stormEvaMSv).toBeGreaterThan(r.speShelterMSv);
    expect(r.constraints.some((x) => x.includes("caught in suit"))).toBe(true);
  });

  it("downgrades the shelter to hull protection on shelter power loss", () => {
    const c = { ...hygeiaConfig(), spe: "aug-1972" as const };
    const lost = evaluateHygeia({ ...c, incident: "shelter-power-loss" });
    expect(lost.worstStormMSv).toBeCloseTo(evaluateHygeia(c).speHabitatMSv);
    expect(lost.safeMode).toBe("SHELTER TRIAGE");
  });
});
