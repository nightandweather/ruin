import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLLECTOR_DESIGN,
  evaluateCollectorDesign,
  MAX_RADIATOR_TEMPERATURE_K,
  safeDeploymentFraction,
} from "../src/collectorDesign";
import { CollectorSimulation } from "../src/collectorSimulation";

describe("C-01 collector design", () => {
  it("follows inverse-square solar flux", () => {
    const inner = evaluateCollectorDesign({ ...DEFAULT_COLLECTOR_DESIGN, orbitAu: 0.5 });
    const outer = evaluateCollectorDesign({ ...DEFAULT_COLLECTOR_DESIGN, orbitAu: 1 });
    expect(inner.solarFluxWm2 / outer.solarFluxWm2).toBeCloseTo(4, 1);
  });

  it("deploys only the area its radiator can safely reject during a flare", () => {
    const deployment = safeDeploymentFraction(DEFAULT_COLLECTOR_DESIGN, 1.55);
    const performance = evaluateCollectorDesign(DEFAULT_COLLECTOR_DESIGN, 1.55, deployment);
    expect(deployment).toBeLessThan(1);
    expect(performance.radiatorTemperatureK).toBeLessThanOrEqual(MAX_RADIATOR_TEMPERATURE_K + 0.1);
  });

  it("fails closed when communications are lost", () => {
    const simulation = new CollectorSimulation(DEFAULT_COLLECTOR_DESIGN);
    simulation.inject("communications-loss");
    const snapshot = simulation.step();
    expect(snapshot.mode).toBe("isolated");
    expect(snapshot.performance.deliveredPowerMW).toBe(0);
  });

  it("retracts and burns propellant during a debris corridor", () => {
    const simulation = new CollectorSimulation(DEFAULT_COLLECTOR_DESIGN);
    const before = simulation.snapshot();
    simulation.inject("debris-corridor");
    const after = simulation.step(3);
    expect(after.deploymentPercent).toBeLessThan(30);
    expect(after.propellantRemainingKg).toBeLessThan(before.propellantRemainingKg);
    expect(after.mode).toBe("evasive");
  });
});
