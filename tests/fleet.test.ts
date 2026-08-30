import { describe, expect, it } from "vitest";
import { FleetOperationsSimulation } from "../src/fleet";

describe("fleet operations", () => {
  it("moves to rescue posture after a debris strike", () => {
    const fleet = new FleetOperationsSimulation();
    fleet.inject("debris-strike");
    expect(fleet.step().posture).toBe("rescue");
  });

  it("fails closed during a communications blackout", () => {
    const fleet = new FleetOperationsSimulation();
    fleet.inject("comms-blackout");
    const snapshot = fleet.step();
    expect(snapshot.posture).toBe("hold");
    expect(snapshot.communicationDelayMinutes).toBe(999);
  });

  it("is deterministic for the same seed", () => {
    const left = new FleetOperationsSimulation(17);
    const right = new FleetOperationsSimulation(17);
    left.inject("debris-strike");
    right.inject("debris-strike");
    expect(left.step(8)).toEqual(right.step(8));
  });
});
