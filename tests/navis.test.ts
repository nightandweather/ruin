import { describe, expect, it } from "vitest";
import { designSpacecraft, missionConfig } from "../src/navis";

describe("NAVIS spacecraft architect", () => {
  it("conserves the wet-mass budget", () => { const c=missionConfig("orbital-tug"); const r=designSpacecraft(c); expect(r.wetMassT).toBeCloseTo(c.dryMassT+c.payloadT+c.propellantT+c.dryMassT*c.redundancyPercent/100); });
  it("gains delta-v when propellant increases", () => { const c=missionConfig("asteroid-freighter"); expect(designSpacecraft({...c,propellantT:c.propellantT*2}).deltaVkmS).toBeGreaterThan(designSpacecraft(c).deltaVkmS); });
  it("uses the ideal rocket equation", () => { const r=designSpacecraft(missionConfig("orbital-tug")); expect(r.deltaVkmS).toBeGreaterThan(3); expect(r.deltaVkmS).toBeLessThan(6); });
  it("rejects an undersized radiator", () => { const c=missionConfig("asteroid-freighter"); const r=designSpacecraft({...c,radiatorAreaM2:1}); expect(r.thermalMarginMW).toBeLessThan(0); expect(r.readiness).toBe("NO-GO"); });
  it("rejects an undersized power plant", () => { const c=missionConfig("atlas-probe"); const r=designSpacecraft({...c,powerPlantMW:1}); expect(r.powerMarginMW).toBeLessThan(0); expect(r.readiness).toBe("NO-GO"); });
  it("weakens a direct link with distance squared", () => { const c=missionConfig("atlas-probe"); const near=designSpacecraft({...c,targetDistanceLy:20}); const far=designSpacecraft({...c,targetDistanceLy:40}); expect(near.linkIndex/far.linkIndex).toBeCloseTo(4); });
  it("doubles one-way light time for a reply", () => { const r=designSpacecraft({...missionConfig("atlas-probe"),targetDistanceLy:40.54}); expect(r.roundTripSignalYears).toBeCloseTo(81.08); });
  it("marks fusion propulsion as unsupported", () => { const r=designSpacecraft(missionConfig("seedship")); expect(r.maturity).toBe(0); expect(r.readiness).toBe("NO-GO"); expect(r.constraints).toContain("Propulsion has no verified engineering path"); });
});
