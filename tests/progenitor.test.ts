import { describe, expect, it } from "vitest";
import { DEFAULT_PROGENITOR_CONFIG, ProgenitorSimulation } from "../src/progenitor";

describe("PROGENITOR guided self-production", () => {
  it("is deterministic", () => {
    expect(new ProgenitorSimulation().step(18)).toEqual(new ProgenitorSimulation().step(18));
  });

  it("treats imported controllers as a real replication bottleneck", () => {
    const scarce = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, electronicsImportKgMonth: 1_000 }).snapshot();
    const supplied = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, electronicsImportKgMonth: 30_000 }).snapshot();
    expect(scarce.estimatedDoublingMonths!).toBeGreaterThan(supplied.estimatedDoublingMonths!);
  });

  it("increases production closure when electronics can be made locally", () => {
    const low = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, localElectronicsPercent: 5 }).snapshot();
    const high = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, localElectronicsPercent: 80 }).snapshot();
    expect(high.closurePercent).toBeGreaterThan(low.closurePercent);
    expect(high.externalDependencyTonnes).toBeLessThan(low.externalDependencyTonnes);
  });

  it("quarantines offspring when metrology loses its reference", () => {
    const sim = new ProgenitorSimulation();
    const before = sim.snapshot().copyProgressPercent;
    expect(sim.inject("metrology-drift").mode).toBe("quarantine");
    expect(sim.step(6).copyProgressPercent).toBe(before);
  });

  it("will not replicate past the human-set ceiling", () => {
    const sim = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, maxFactories: 2, electronicsImportKgMonth: 100_000 });
    const result = sim.step(60);
    expect(result.factoryCount).toBe(2);
    expect(result.mode).toBe("halted");
  });

  it("shows the quality cost of an exponential replication policy", () => {
    const conservative = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, policy: "conservative" }).snapshot();
    const exponential = new ProgenitorSimulation({ ...DEFAULT_PROGENITOR_CONFIG, policy: "exponential" }).snapshot();
    expect(exponential.reproductionSharePercent).toBeGreaterThan(conservative.reproductionSharePercent);
    expect(exponential.qualityScore).toBeLessThan(conservative.qualityScore);
    expect(exponential.usefulOutputTonnesMonth).toBeLessThan(conservative.usefulOutputTonnesMonth);
  });
});
