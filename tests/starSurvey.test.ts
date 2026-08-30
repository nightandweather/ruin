import { describe, expect, it } from "vitest";
import { DEFAULT_SURVEY_WEIGHTS, rankStarSystems } from "../src/starSurvey";

describe("stellar survey", () => {
  it("always returns bounded scenario scores", () => {
    expect(rankStarSystems().every(({ score }) => score >= 0 && score <= 100)).toBe(true);
  });

  it("keeps the Solar System first under default bootstrap priorities", () => {
    expect(rankStarSystems(DEFAULT_SURVEY_WEIGHTS)[0].id).toBe("sol");
  });

  it("can surface Proxima when proximity dominates", () => {
    const ranked = rankStarSystems({
      proximity: 100,
      stability: 0,
      energy: 0,
      materials: 0,
      orbitalSimplicity: 0,
    });
    expect(ranked[1].id).toBe("proxima-centauri");
  });
});
