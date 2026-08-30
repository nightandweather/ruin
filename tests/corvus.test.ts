import { describe, expect, it } from "vitest";
import { corvusConfig, evaluateCorvus } from "../src/corvus";
describe("CORVUS autonomous drone swarm", () => {
  it("closes each drone mass budget", () => {
    const c = corvusConfig();
    expect(evaluateCorvus(c).wetMassKg).toBe(c.dryMassKg + c.payloadKg + c.propellantKg);
  });
  it("gains delta-v with more propellant", () => {
    const c = corvusConfig();
    expect(evaluateCorvus({ ...c, propellantKg: c.propellantKg * 2 }).deltaVMS).toBeGreaterThan(
      evaluateCorvus(c).deltaVMS,
    );
  });
  it("applies inverse-square solar flux", () => {
    const c = corvusConfig();
    expect(evaluateCorvus({ ...c, distanceAU: 2 }).solarPowerW).toBeCloseTo(
      evaluateCorvus(c).solarPowerW / 4,
    );
  });
  it("loses useful capacity and quorum as nodes fail", () => {
    const c = corvusConfig();
    const a = evaluateCorvus(c),
      b = evaluateCorvus({ ...c, failedCount: 8 });
    expect(b.productiveFraction).toBeLessThan(a.productiveFraction);
    expect(b.quorumMargin).toBeLessThan(0);
  });
  it("fails closed on an undersized radiator", () => {
    const r = evaluateCorvus({ ...corvusConfig(), radiatorAreaM2: 0.01 });
    expect(r.thermalMarginW).toBeLessThan(0);
    expect(r.readiness).toBe("NO-GO");
  });
  it("requires autonomy when command light-time grows", () => {
    const r = evaluateCorvus({ ...corvusConfig(), oneWayDelayS: 3600, autonomyPercent: 35 });
    expect(r.autonomyMargin).toBeLessThan(0);
    expect(r.constraints.some((x) => x.includes("autonomy"))).toBe(true);
  });
  it("detects formation drift and partitions", () => {
    const c = corvusConfig();
    expect(evaluateCorvus({ ...c, relativeDriftMS: 10 }).readiness).not.toBe("GO");
    expect(evaluateCorvus({ ...c, incident: "partition" }).meshConnected).toBe(false);
  });
});
