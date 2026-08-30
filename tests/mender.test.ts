import { describe, it, expect } from "vitest";
import { evaluateMender, menderConfig } from "../src/mender";
describe("MENDER repair robot", () => {
  it("balances total carried mass", () => {
    const c = menderConfig();
    expect(evaluateMender(c).totalMassKg).toBeCloseTo(
      c.chassisKg + c.payloadKg + c.propellantKg + c.toolCount * 3.5,
    );
  });
  it("requires two-point contact", () => {
    const c = menderConfig();
    const r = evaluateMender({ ...c, armCount: 1 });
    expect(r.constraints).toContain("Two-point contact cannot be maintained");
    expect(r.readiness).toBe("NO-GO");
  });
  it("penalizes a tool reaction above anchor capacity", () => {
    const c = menderConfig("micro-swarm", "machine-bearing");
    expect(evaluateMender(c).stabilityMargin).toBeLessThan(1);
  });
  it("rejects a component beyond payload rating", () => {
    const c = menderConfig("micro-swarm", "fluid-valve");
    expect(evaluateMender(c).manipulationMarginKg).toBeLessThan(0);
  });
  it("detects battery and thermal shortfalls", () => {
    const c = menderConfig();
    const r = evaluateMender({ ...c, batteryKWh: 1, radiatorAreaM2: 0.01 });
    expect(r.constraints).toContain("Battery cannot finish one repair cycle");
    expect(r.constraints).toContain("Radiator cannot reject active waste heat");
  });
  it("increases required autonomy with signal delay", () => {
    const c = menderConfig();
    expect(evaluateMender({ ...c, signalDelayS: 3600 }).requiredAutonomy).toBeGreaterThan(
      evaluateMender({ ...c, signalDelayS: 1 }).requiredAutonomy,
    );
  });
  it("gives propulsive delta-v only to the free flyer", () => {
    expect(evaluateMender(menderConfig("free-flyer")).deltaVMS).toBeGreaterThan(0);
    expect(evaluateMender(menderConfig("rail-walker")).deltaVMS).toBe(0);
  });
});
