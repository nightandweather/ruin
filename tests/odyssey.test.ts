import { describe, it, expect } from "vitest";
import { buildRelays, evaluateVoyage, odysseyConfig } from "../src/odyssey";
describe("ODYSSEY beamed-energy navigation", () => {
  it("builds evenly spaced chain relays", () => {
    const c = odysseyConfig();
    const r = buildRelays({ ...c, relayCount: 5 });
    expect(r.map((x) => x.positionPercent)).toEqual([0, 25, 50, 75, 100]);
  });
  it("loses received power with distance squared outside the aperture", () => {
    const c = { ...odysseyConfig(), topology: "origin" as const, positionPercent: 10 };
    const near = evaluateVoyage(c);
    const far = evaluateVoyage({ ...c, positionPercent: 20 });
    expect(near.receivedPowerMW / far.receivedPowerMW).toBeCloseTo(4, 4);
  });
  it("improves the link with a larger receiver", () => {
    const c = odysseyConfig();
    expect(evaluateVoyage({ ...c, receiverDiameterM: 2000 }).receivedPowerMW).toBeGreaterThan(
      evaluateVoyage({ ...c, receiverDiameterM: 1000 }).receivedPowerMW,
    );
  });
  it("reacquires a healthy relay after an outage", () => {
    const c = { ...odysseyConfig(), positionPercent: 50, relayOutage: true };
    const r = evaluateVoyage(c);
    expect(r.nearestRelay.active).toBe(true);
    expect(r.constraints.some((x) => x.includes("offline"))).toBe(true);
  });
  it("blocks propulsion before survival power", () => {
    const c = { ...odysseyConfig(), transmitterPowerPW: 0 };
    const r = evaluateVoyage(c);
    expect(r.propulsionPowerMW).toBe(0);
    expect(r.status).toBe("BLACKOUT");
  });
  it("detects receiver thermal overload", () => {
    const c = { ...odysseyConfig(), positionPercent: 25, radiatorAreaM2: 1, transmitterPowerPW: 100 };
    expect(evaluateVoyage(c).status).toBe("THERMAL-LIMIT");
  });
  it("shortens relay latency with a denser chain", () => {
    const c = { ...odysseyConfig(), positionPercent: 37 };
    expect(evaluateVoyage({ ...c, relayCount: 9 }).commandDelayYears).toBeLessThan(
      evaluateVoyage({ ...c, relayCount: 3 }).commandDelayYears,
    );
  });
});
