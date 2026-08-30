import { describe, it, expect } from "vitest";
import { genesisConfig, simulateGenesis } from "../src/genesis";
describe("GENESIS", () => {
  it("builds a deterministic milestone ledger", () => {
    const a = simulateGenesis(genesisConfig()),
      b = simulateGenesis(genesisConfig());
    expect(a.events).toEqual(b.events);
  });
  it("starts from nuclear bootstrap power", () => {
    const r = simulateGenesis(genesisConfig());
    expect(r.powerKW).toBeGreaterThanOrEqual(r.reactor.bootstrapPowerKW);
  });
  it("poor ore delays or prevents autonomy", () => {
    const c = genesisConfig(),
      a = simulateGenesis(c),
      b = simulateGenesis({ ...c, incident: "ore-poor" });
    expect(b.factories).toBeLessThanOrEqual(a.factories);
  });
  it("low production closure blocks self sufficiency", () => {
    const r = simulateGenesis({ ...genesisConfig(), factoryClosurePercent: 45 });
    expect(r.selfSufficient).toBeNull();
    expect(r.bottlenecks.some((x) => x.includes("Precision"))).toBe(true);
  });
});
