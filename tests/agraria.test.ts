import { describe, expect, it } from "vitest";
import { AgrariaSimulation, DEFAULT_AGRARIA_CONFIG } from "../src/agraria";
describe("AGRARIA", () => {
  it("turns a 50 square meter crop allocation into roughly one modeled diet", () => {
    const s = new AgrariaSimulation({ ...DEFAULT_AGRARIA_CONFIG, areaM2: 50, crew: 1 }).snapshot();
    expect(s.peopleFed).toBeGreaterThan(0.7);
    expect(s.peopleFed).toBeLessThan(1.2);
  });
  it("uses more power when photon flux rises", () => {
    const low = new AgrariaSimulation({ ...DEFAULT_AGRARIA_CONFIG, ppfd: 350 }).snapshot();
    const high = new AgrariaSimulation({ ...DEFAULT_AGRARIA_CONFIG, ppfd: 800 }).snapshot();
    expect(high.facilityPowerMW).toBeGreaterThan(low.facilityPowerMW);
  });
  it("quarantines a crop sector instead of claiming full production", () => {
    const sim = new AgrariaSimulation();
    sim.inject("fungal-outbreak");
    const s = sim.step();
    expect(s.mode).toBe("quarantine");
    expect(s.productiveAreaPercent).toBeLessThan(100);
    expect(s.beds.some((b) => b.status === "quarantine")).toBe(true);
  });
  it("reports make-up water after recovery", () => {
    const s = new AgrariaSimulation().snapshot();
    expect(s.waterRecoveredLDay).toBeGreaterThan(s.waterMakeupLDay);
    expect(s.waterMakeupLDay).toBeGreaterThan(0);
  });
});
