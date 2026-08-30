import { describe, expect, it } from "vitest";
import { engineConfig, evaluateEngine } from "../src/ignis";

describe("IGNIS propulsion engine", () => {
  it("derives mass flow from thrust and specific impulse", () => {
    const result = evaluateEngine(engineConfig("cryo-chemical"));
    expect(result.massFlowKgS).toBeCloseTo(result.thrustN / (result.effectiveIspS * 9.80665), 8);
  });

  it("scales a Hall array with available electrical power", () => {
    const one = evaluateEngine({ ...engineConfig("hall-electric"), units: 1 });
    const four = evaluateEngine({ ...engineConfig("hall-electric"), units: 4 });
    expect(four.thrustN / one.thrustN).toBeCloseTo(4);
    expect(four.sourcePowerMW / one.sourcePowerMW).toBeCloseTo(4);
  });

  it("raises ideal specific impulse with core temperature", () => {
    const base = engineConfig("nuclear-thermal");
    const hot = evaluateEngine({ ...base, coreTemperatureK: base.coreTemperatureK * 1.1 });
    expect(hot.effectiveIspS).toBeGreaterThan(evaluateEngine(base).effectiveIspS);
  });

  it("conserves propellant across the admitted burn", () => {
    const result = evaluateEngine(engineConfig("hall-electric"));
    expect(result.propellantUsedT).toBeCloseTo(result.massFlowKgS * result.allowedBurnHours * 3.6, 8);
  });

  it("limits a burn when the thermal sink saturates", () => {
    const config = { ...engineConfig("cryo-chemical"), radiatorAreaM2: 0, thermalSinkGJ: 1, requestedBurnHours: 2 };
    const result = evaluateEngine(config);
    expect(result.allowedBurnHours).toBeLessThan(config.requestedBurnHours);
    expect(result.readiness).toBe("NO-GO");
  });

  it("retains reduced thrust after one clustered unit fails", () => {
    const result = evaluateEngine({ ...engineConfig("nuclear-thermal"), units: 3, failedUnits: 1 });
    expect(result.engineOutThrustPercent).toBeCloseTo(200 / 3);
    expect(result.constraints.some(item => item.includes("isolated"))).toBe(true);
  });

  it("never marks an unsupported fusion drive ready", () => {
    const result = evaluateEngine(engineConfig("fusion-concept"));
    expect(result.readiness).toBe("NO-GO");
    expect(result.constraints).toContain("Engine has no verified engineering path");
  });
});
