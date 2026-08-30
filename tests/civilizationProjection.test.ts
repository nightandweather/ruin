import { describe, expect, it } from "vitest";
import { PROJECTION_BASIS, projectCivilization } from "../src/civilizationProjection";
import { DysonSwarmSimulation } from "../src/simulation";

describe("civilization consequence projection", () => {
  it("labels its own provenance so the HUD cannot present it as measured fact", () => {
    const projection = projectCivilization(new DysonSwarmSimulation().snapshot());
    expect(projection.basis).toBe(PROJECTION_BASIS);
    expect(projection.basis).toContain("ASSUMED");
    expect(projection.basis).not.toMatch(/confidence/i);
  });

  it("keeps the nominal long horizon inside the verified envelope", () => {
    const projection = projectCivilization(new DysonSwarmSimulation().snapshot());
    expect(projection.horizons.every((point) => point.tone === "nominal")).toBe(true);
    expect(projection.horizons.at(-1)!.population).toBeGreaterThan(projection.population);
  });

  it("turns a compound power and communications decision into a visible long-term risk", () => {
    const simulation = new DysonSwarmSimulation();
    simulation.inject("communications-blackout");
    simulation.inject("demand-spike");
    const projection = projectCivilization(simulation.step());
    const longHorizon = projection.horizons.at(-1)!;

    expect(longHorizon.tone).toBe("irreversible");
    expect(longHorizon.population).toBeLessThan(5.5);
    expect(longHorizon.trust).toBeLessThan(32);
  });

  it("returns to a nominal projection after temporary incidents clear", () => {
    const simulation = new DysonSwarmSimulation();
    simulation.inject("communications-blackout");
    simulation.inject("demand-spike");
    const projection = projectCivilization(simulation.step(100));

    expect(projection.stress).toBe(0);
    expect(projection.horizons.at(-1)!.tone).toBe("nominal");
  });
});
