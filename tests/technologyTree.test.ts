import { describe, expect, it } from "vitest";
import { planTechnology, TECHNOLOGY_TREE, validateTechnologyTree } from "../src/technologyTree";

describe("technology tree", () => {
  it("has valid, acyclic dependencies", () => {
    expect(validateTechnologyTree()).toEqual([]);
  });

  it("begins with closed-loop autonomy", () => {
    expect(planTechnology([]).next.map(({ id }) => id)).toEqual(["closed-loop-autonomy"]);
  });

  it("does not unlock a stellar collector grid before its complete supply chain", () => {
    const plan = planTechnology(["closed-loop-autonomy", "in-situ-refining", "machine-replication", "fusion-grid", "beamed-power"]);
    expect(plan.next.some(({ id }) => id === "stellar-collector-grid")).toBe(false);
    expect(plan.blocked.find(({ technology }) => technology.id === "stellar-collector-grid")?.missing).toContain("rare-material-ledger");
  });

  it("keeps every technology tied to an operational failure", () => {
    expect(TECHNOLOGY_TREE.every(({ operationalQuestion, failureMode }) => operationalQuestion.length > 10 && failureMode.length > 10)).toBe(true);
  });
});
