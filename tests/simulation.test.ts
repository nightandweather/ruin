import { describe, expect, it } from "vitest";
import { DysonSwarmSimulation } from "../src/simulation";

describe("DysonSwarmSimulation", () => {
  it("produces identical snapshots for the same seed", () => {
    const first = new DysonSwarmSimulation({ satelliteCount: 200, seed: 42 });
    const second = new DysonSwarmSimulation({ satelliteCount: 200, seed: 42 });
    expect(first.step(40).metrics).toEqual(second.step(40).metrics);
  });

  it("isolates exactly 30 percent of nodes during a communications blackout", () => {
    const simulation = new DysonSwarmSimulation({ satelliteCount: 1_000 });
    simulation.inject("communications-blackout");
    const snapshot = simulation.step();
    expect(snapshot.metrics.isolatedCount).toBe(300);
    expect(snapshot.metrics.availabilityPercent).toBe(70);
    expect(snapshot.metrics.deliveredGW).toBeLessThan(snapshot.metrics.demandGW);
  });

  it("recovers failed collectors after the repair window", () => {
    const simulation = new DysonSwarmSimulation({ satelliteCount: 1_000 });
    simulation.inject("cascade-failure");
    expect(simulation.step().metrics.offlineCount).toBe(50);
    expect(simulation.step(180).metrics.offlineCount).toBe(0);
  });

  it("never delivers more power than the safe fleet can provide", () => {
    const simulation = new DysonSwarmSimulation({ satelliteCount: 1_000 });
    simulation.inject("thermal-wave");
    simulation.inject("demand-spike");
    const { metrics } = simulation.step(20);
    expect(metrics.deliveredGW).toBeLessThanOrEqual(metrics.potentialGW);
    expect(metrics.deliveredGW).toBeGreaterThanOrEqual(0);
  });
});
