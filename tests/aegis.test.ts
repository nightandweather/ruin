import { describe, expect, it } from "vitest";
import { AegisSimulation, DEFAULT_AEGIS_CONFIG } from "../src/aegis";

describe("AEGIS spacesuit digital twin", () => {
  it("is deterministic for the same configuration", () => {
    expect(new AegisSimulation().step(4)).toEqual(new AegisSimulation().step(4));
  });

  it("adds mass and useful EVA time with endurance consumables", () => {
    const short = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, enduranceHours: 3 }).snapshot();
    const long = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, enduranceHours: 9 }).snapshot();
    expect(long.massKg).toBeGreaterThan(short.massKg);
    expect(long.evaMinutes).toBeGreaterThan(short.evaMinutes);
  });

  it("shows the mobility cost of higher suit pressure", () => {
    const low = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, pressureKpa: 27 }).snapshot();
    const high = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, pressureKpa: 50 }).snapshot();
    expect(high.mobilityScore).toBeLessThan(low.mobilityScore);
  });

  it("penalizes a lunar-mass design more strongly on Mars", () => {
    const lunar = new AegisSimulation(DEFAULT_AEGIS_CONFIG).snapshot();
    const mars = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, mission: "mars-field" }).snapshot();
    expect(mars.localWeightKg).toBeGreaterThan(lunar.localWeightKg);
    expect(mars.mobilityScore).toBeLessThan(lunar.mobilityScore);
  });

  it("forces return mode and consumes emergency oxygen after a puncture", () => {
    const sim = new AegisSimulation();
    const initial = sim.inject("puncture");
    const later = sim.step(3);
    expect(initial.mode).toBe("return");
    expect(later.emergencyMinutesRemaining).toBeLessThan(initial.emergencyMinutesRemaining);
    expect(later.pressureKpa).toBeLessThan(initial.pressureKpa);
  });

  it("models dust damage and mitigation", () => {
    const weak = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, dustMitigation: 10 });
    weak.inject("dust-seal");
    const damaged = weak.step(10);
    const protectedSuit = new AegisSimulation({ ...DEFAULT_AEGIS_CONFIG, dustMitigation: 95 });
    protectedSuit.inject("dust-seal");
    const protectedState = protectedSuit.step(10);
    expect(damaged.sealIntegrity).toBeLessThan(protectedState.sealIntegrity);
    expect(damaged.dustRisk).toBeGreaterThan(protectedState.dustRisk);
  });
});
