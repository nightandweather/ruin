import { describe, expect, it } from "vitest";
import { ATLAS_STARS, CARTESIAN_STARS, routeMetrics, starsWithin, toCartesian } from "../src/stellarAtlas";

describe("ATLAS real stellar map", () => {
  it("preserves catalogue distance under Cartesian conversion", () => {
    for (const star of CARTESIAN_STARS)
      expect(Math.hypot(star.xLy, star.yLy, star.zLy)).toBeCloseTo(star.distanceLy, 8);
  });

  it("maps RA 0 and declination 0 onto the positive X axis", () => {
    const point = toCartesian({
      id: "test",
      name: "Test",
      raDeg: 0,
      decDeg: 0,
      distancePc: 1,
      spectralType: "G",
      planetCount: 0,
      kind: "landmark",
      source: "SIMBAD",
    });
    expect(point.xLy).toBeCloseTo(3.26156, 5);
    expect(point.yLy).toBeCloseTo(0, 8);
    expect(point.zLy).toBeCloseTo(0, 8);
  });

  it("contains only the declared curated catalogue snapshot", () => {
    expect(ATLAS_STARS).toHaveLength(30);
    expect(new Set(ATLAS_STARS.map((star) => star.id)).size).toBe(30);
  });

  it("filters by real distance and classification", () => {
    expect(starsWithin(5).every((star) => star.distanceLy <= 5)).toBe(true);
    expect(starsWithin(50, "planet-host").every((star) => star.kind === "planet-host")).toBe(true);
  });

  it("keeps light time separate from hypothetical cruise time", () => {
    expect(routeMetrics(10, 0.1)).toEqual({
      oneWaySignalYears: 10,
      roundTripSignalYears: 20,
      cruiseYears: 100,
    });
  });
});
