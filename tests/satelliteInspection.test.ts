import { describe, expect, it } from "vitest";
import { inspectSatellite } from "../src/satelliteInspection";
import { DysonSwarmSimulation } from "../src/simulation";

describe("satellite inspection", () => {
  it("returns a bounded same-band neighborhood ordered by angular distance", () => {
    const snapshot = new DysonSwarmSimulation({ satelliteCount: 400 }).snapshot();
    const inspection = inspectSatellite(snapshot, 120)!;

    expect(inspection.neighbors).toHaveLength(6);
    expect(inspection.neighbors.every((neighbor) => neighbor.band === inspection.satellite.band)).toBe(true);
    expect(inspection.localNodes.length).toBeGreaterThan(1);
  });

  it("explains fail-closed behavior for an isolated collector", () => {
    const simulation = new DysonSwarmSimulation({ satelliteCount: 400 });
    simulation.inject("communications-blackout");
    const snapshot = simulation.step();
    const isolated = snapshot.satellites.find((satellite) => satellite.mode === "isolated")!;
    const inspection = inspectSatellite(snapshot, isolated.id)!;

    expect(inspection.satellite.deliveredMW).toBe(0);
    expect(inspection.recommendation).toContain("reacquire authenticated mesh quorum");
    expect(inspection.activeHazards).toContain("communications-blackout");
  });

  it("tracks the selected node against later live snapshots", () => {
    const simulation = new DysonSwarmSimulation({ satelliteCount: 400 });
    const before = inspectSatellite(simulation.snapshot(), 10)!;
    const beforeTemperature = before.satellite.temperatureK;
    const after = inspectSatellite(simulation.step(20), 10)!;

    expect(after.satellite.id).toBe(before.satellite.id);
    expect(after.satellite.phase).toBe(before.satellite.phase);
    expect(after.satellite.temperatureK).not.toBe(beforeTemperature);
  });
});
