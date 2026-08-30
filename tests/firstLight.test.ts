import { describe, it, expect } from "vitest";
import { runFirstLight, FIRST_LIGHT_ACTIONS } from "../src/firstLight";
describe("FIRST LIGHT campaign", () => {
  it("executes the commissioned cross-system sequence", () => {
    const r = runFirstLight();
    expect(r.checkpoints).toHaveLength(FIRST_LIGHT_ACTIONS.length + 1);
    expect(r.checkpoints.map((c) => c.tick)).toEqual([11, 25, 39, 56, 83, 140]);
  });
  it("replays to the same evidence hash", () => {
    const r = runFirstLight();
    expect(r.replayVerified).toBe(true);
    expect(r.traceHash).toBe(r.replayHash);
  });
  it("preserves every safety invariant at every checkpoint", () => {
    const r = runFirstLight();
    expect(r.allInvariantsPass).toBe(true);
    for (const c of r.checkpoints) expect(c.invariants.every((i) => i.passed)).toBe(true);
  });
  it("recovers availability after the incident sequence", () => {
    const r = runFirstLight();
    expect(r.checkpoints.at(-1)!.availabilityPercent).toBeGreaterThan(r.checkpoints[0].availabilityPercent);
  });
  it("produces replacements through the logistics chain", () => {
    expect(runFirstLight().finalSnapshot.logistics.totalManufactured).toBeGreaterThan(0);
  });
});
