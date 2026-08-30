import { describe, expect, it } from "vitest";
import { AutonomousFoundrySimulation } from "../src/foundry";

describe("AutonomousFoundrySimulation", () => {
  it("is deterministic for the same seed", () => {
    const first = new AutonomousFoundrySimulation(42);
    const second = new AutonomousFoundrySimulation(42);
    first.requestKits(20);
    second.requestKits(20);
    expect(first.step(60)).toEqual(second.step(60));
  });

  it("turns mined material into completed repair-kit orders", () => {
    const simulation = new AutonomousFoundrySimulation();
    simulation.requestKits(10);
    const snapshot = simulation.step(80);
    expect(snapshot.orderBacklog).toBe(0);
    expect(snapshot.totalKitsShipped).toBeGreaterThanOrEqual(10);
    expect(snapshot.inventory.oxygenKg).toBeGreaterThan(0);
  });

  it("fails the crusher closed during an obstruction", () => {
    const simulation = new AutonomousFoundrySimulation();
    simulation.step(3);
    simulation.inject("crusher-jam");
    const snapshot = simulation.step();
    const crusher = snapshot.stages.find((stage) => stage.id === "crushing");
    expect(crusher?.status).toBe("fault");
    expect(crusher?.utilizationPercent).toBe(0);
  });

  it("never creates negative inventory under combined faults", () => {
    const simulation = new AutonomousFoundrySimulation(9);
    simulation.requestKits(100);
    simulation.inject("dust-front");
    simulation.inject("power-ration");
    simulation.inject("cutter-wear");
    const snapshot = simulation.step(300);
    for (const value of Object.values(snapshot.inventory)) expect(value).toBeGreaterThanOrEqual(0);
  });
});
