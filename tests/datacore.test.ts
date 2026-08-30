import { describe, expect, it } from "vitest";
import { DEFAULT_DATACORE_CONFIG, OrbitalDatacoreSimulation } from "../src/datacore";

describe("orbital datacore", () => {
  it("trades raw throughput for verified throughput", () => {
    const snapshot = new OrbitalDatacoreSimulation().snapshot();
    expect(snapshot.verifiedComputePflops).toBeCloseTo(snapshot.rawComputePflops / 3, 1);
  });

  it("caps tiles before exceeding the coolant limit", () => {
    const simulation = new OrbitalDatacoreSimulation({ ...DEFAULT_DATACORE_CONFIG, radiatorAreaM2: 350 });
    const snapshot = simulation.snapshot();
    expect(snapshot.mode).toBe("thermal-cap");
    expect(snapshot.radiatorTemperatureK).toBeLessThanOrEqual(420.1);
    expect(snapshot.availableTiles).toBeLessThan(snapshot.totalTiles);
  });

  it("retains data and blocks telescope ingress during link loss", () => {
    const simulation = new OrbitalDatacoreSimulation();
    simulation.inject("optical-link-loss");
    const snapshot = simulation.step();
    expect(snapshot.downlinkMbps).toBe(0);
    expect(snapshot.queue.find(({ kind }) => kind === "telescope-ingest")?.status).toBe("blocked");
  });

  it("corrects or rejects radiation-affected work instead of accepting it silently", () => {
    const simulation = new OrbitalDatacoreSimulation(DEFAULT_DATACORE_CONFIG, 7);
    simulation.inject("radiation-storm");
    const snapshot = simulation.step(12);
    expect(snapshot.correctedErrors).toBeGreaterThan(0);
    expect(snapshot.availableTiles).toBeLessThan(snapshot.totalTiles);
    expect(snapshot.tileStates.some((state) => state === "scrub")).toBe(true);
  });
});
