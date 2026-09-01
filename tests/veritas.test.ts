import { describe, expect, it } from "vitest";
import {
  ACTION_ERROR_LIMIT,
  ALARM_THRESHOLD,
  evaluateVeritas,
  MAX_VALIDATION_AGE,
  REGIME_SHIFT_YEAR,
  SENSOR_BIAS_YEAR,
  veritasConfig,
  veritasPortfolio,
  withModel,
} from "../src/veritas";

describe("VERITAS model-reality divergence", () => {
  it("is deterministic — same programme, same divergence record", () => {
    const c = veritasConfig();
    expect(evaluateVeritas(c).trajectory).toEqual(evaluateVeritas(c).trajectory);
  });

  it("never reports more error than the world actually holds", () => {
    for (const model of veritasPortfolio()) {
      const r = evaluateVeritas(withModel(veritasConfig(), model.id));
      for (const year of r.trajectory) {
        expect(year.reportedError).toBeLessThanOrEqual(year.trueError + 1e-12);
        expect(year.blindGap).toBeGreaterThanOrEqual(-1e-12);
        expect(year.trueError).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("opens a silent window where the model is wrong and the residuals are quiet", () => {
    const r = evaluateVeritas(veritasConfig());
    expect(r.firstTrueBreach).not.toBeNull();
    expect(r.silentYears).toBeGreaterThan(0);
    expect(r.silentWindowYears).toBeGreaterThan(0);
    expect(r.readiness).toBe("NO-GO");
    const silent = r.trajectory.find((y) => y.silent)!;
    expect(silent.trueError).toBeGreaterThan(ACTION_ERROR_LIMIT);
    expect(silent.reportedError).toBeLessThanOrEqual(ALARM_THRESHOLD);
    // The certificate says nothing is wrong while it is wrong.
    expect(silent.certified).toBe(true);
  });

  it("closes the window when anomalies stop being written off", () => {
    const dismissive = evaluateVeritas(veritasConfig());
    const honest = evaluateVeritas({ ...veritasConfig(), autoAcceptance: 0 });
    // The world is identical — only what the programme does with what it sees.
    expect(honest.endTrueError).toBeCloseTo(dismissive.endTrueError, 12);
    expect(honest.endReportedError).toBeGreaterThan(dismissive.endReportedError);
    expect(honest.silentYears).toBe(0);
  });

  it("buys real error reduction with observation, not with confidence", () => {
    const thin = evaluateVeritas({ ...veritasConfig(), observationRate: 1 });
    const rich = evaluateVeritas({ ...veritasConfig(), observationRate: 24 });
    expect(rich.endTrueError).toBeLessThan(thin.endTrueError);
    expect(rich.maxBlindGap).toBeLessThan(thin.maxBlindGap);
    // With no observations at all, calibration cannot happen.
    const blind = evaluateVeritas({ ...veritasConfig(), observationRate: 0 });
    expect(blind.calibrations).toBe(0);
    expect(blind.endReportedError).toBeCloseTo(0, 12);
    expect(blind.endTrueError).toBeGreaterThan(ACTION_ERROR_LIMIT);
  });

  it("refuses irreversible authority outside the validated envelope — fail-closed", () => {
    const inside = evaluateVeritas({ ...veritasConfig(), regime: "edge" });
    const outside = evaluateVeritas({ ...veritasConfig(), regime: "extrapolation" });
    expect(inside.trajectory.every((y) => y.certified)).toBe(true);
    expect(outside.trajectory.every((y) => !y.certified)).toBe(true);
    expect(outside.decertifiedYears).toBe(outside.trajectory.length);
    expect(outside.constraints.some((x) => x.includes("outside the validated envelope"))).toBe(true);
  });

  it("lapses certification when validation goes stale, and never quietly renews it", () => {
    const r = evaluateVeritas({ ...veritasConfig(), incident: "validation-lapse" });
    expect(r.certificationLapseYear).not.toBeNull();
    const lapse = r.trajectory[r.certificationLapseYear!];
    expect(lapse.validationAge).toBeGreaterThan(MAX_VALIDATION_AGE);
    // Once the programme stops, nothing in the model restores the certificate.
    expect(r.trajectory.slice(r.certificationLapseYear!).every((y) => !y.certified)).toBe(true);
    expect(r.safeMode).not.toBe("CERTIFIED IN ENVELOPE");
  });

  it("makes a systematic sensor bias quieter than the truth it hides", () => {
    const clean = evaluateVeritas(veritasConfig());
    const biased = evaluateVeritas({ ...veritasConfig(), incident: "sensor-bias" });
    // Identical world, quieter instruments: the reported error falls while
    // the real error does not move at all.
    expect(biased.endTrueError).toBeCloseTo(clean.endTrueError, 12);
    expect(biased.endReportedError).toBeLessThan(clean.endReportedError);
    expect(biased.maxBlindGap).toBeGreaterThan(clean.maxBlindGap);
    const after = biased.trajectory[SENSOR_BIAS_YEAR];
    const before = biased.trajectory[SENSOR_BIAS_YEAR - 1];
    expect(after.reportedError).toBeLessThan(before.reportedError);
    expect(after.trueError).toBeGreaterThan(before.trueError);
  });

  it("treats a world that moves as an envelope exit, not a modelling error", () => {
    const r = evaluateVeritas({ ...veritasConfig(), incident: "regime-shift" });
    expect(r.certificationLapseYear).toBe(REGIME_SHIFT_YEAR);
    expect(r.endTrueError).toBeGreaterThan(evaluateVeritas(veritasConfig()).endTrueError);
    expect(r.trajectory.slice(0, REGIME_SHIFT_YEAR).every((y) => y.certified)).toBe(true);
  });

  it("rates the laboratory's own least-grounded models as its least trustworthy", () => {
    const scored = veritasPortfolio().map((model) => ({
      model,
      result: evaluateVeritas(withModel(veritasConfig(), model.id)),
    }));
    const sourced = scored.find((s) => s.model.id === "helios-thermal")!;
    const invented = scored.find((s) => s.model.id === "ignis-fusion")!;
    expect(sourced.result.endTrueError).toBeLessThan(invented.result.endTrueError);
    expect(sourced.result.readiness).toBe("GO");
    expect(invented.result.readiness).toBe("NO-GO");
    // A model of a machine nobody has built cannot be validated by observing it.
    expect(invented.result.silentYears).toBeGreaterThan(0);
  });

  it("earns a clean verdict only with a programme that pays for it", () => {
    const r = evaluateVeritas({
      ...veritasConfig(),
      observationRate: 20,
      calibrationCadence: 3,
      regime: "interpolation",
      autoAcceptance: 0.05,
    });
    expect(r.silentYears).toBe(0);
    expect(r.endTrueError).toBeLessThan(ACTION_ERROR_LIMIT);
    expect(r.readiness).toBe("GO");
    expect(r.safeMode).toBe("CERTIFIED IN ENVELOPE");
  });
});

describe("VERITAS portfolio grounding", () => {
  it("reads the IGNIS conventional rating from the engine table rather than a literal", async () => {
    const { enginesGroundedFraction } = await import("../src/ignis");
    const entry = veritasPortfolio().find((model) => model.id === "ignis-conventional")!;
    expect(entry.groundedFraction).toBeCloseTo(enginesGroundedFraction(), 12);
    // Grounding the engine table has to move the audit, or the loop is fake.
    expect(entry.groundedFraction).toBeGreaterThan(
      veritasPortfolio().find((model) => model.id === "ignis-fusion")!.groundedFraction,
    );
  });

  it("rates a table-read branch better than the invented one it sits beside", () => {
    const conventional = evaluateVeritas(withModel(veritasConfig(), "ignis-conventional"));
    const fusion = evaluateVeritas(withModel(veritasConfig(), "ignis-fusion"));
    expect(conventional.endTrueError).toBeLessThan(fusion.endTrueError);
    expect(conventional.silentYears).toBeLessThan(fusion.silentYears);
  });
});
