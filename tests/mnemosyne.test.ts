import { describe, it, expect } from "vitest";
import { evaluateMnemosyne, mnemosyneConfig } from "../src/mnemosyne";
describe("MNEMOSYNE identity evidence", () => {
  it("does not treat a connectome as a complete mind", () => {
    const r = evaluateMnemosyne({
      ...mnemosyneConfig(),
      structuralCoveragePercent: 100,
      synapseResolutionPercent: 100,
    });
    expect(r.evidenceCoverage).toBeLessThan(50);
    expect(r.activationAllowed).toBe(false);
  });
  it("requires verified consent", () => {
    expect(evaluateMnemosyne({ ...mnemosyneConfig(), consentVerified: false }).identityStatus).toBe(
      "CONSENT HOLD",
    );
  });
  it("quarantines corrupted dynamic state", () => {
    const r = evaluateMnemosyne({ ...mnemosyneConfig(), incident: "state-corruption" });
    expect(r.identityStatus).toBe("SNAPSHOT QUARANTINE");
    expect(r.activationAllowed).toBe(false);
  });
  it("treats copies as independent personhood", () => {
    const r = evaluateMnemosyne({ ...mnemosyneConfig(), instances: 2 });
    expect(r.forked).toBe(true);
    expect(r.identityStatus).toBe("FORKED PERSONHOOD");
  });
  it("divergence grows over elapsed time", () => {
    const c = mnemosyneConfig();
    expect(evaluateMnemosyne({ ...c, elapsedYears: 10 }).divergencePercent).toBeGreaterThan(
      evaluateMnemosyne(c).divergencePercent,
    );
  });
  it("sensory loss blocks activation", () => {
    const r = evaluateMnemosyne({
      ...mnemosyneConfig(),
      incident: "sensory-loss",
      memoryAgreementPercent: 99,
      behaviorAgreementPercent: 99,
      dynamicStatePercent: 99,
    });
    expect(r.activationAllowed).toBe(false);
  });
});
