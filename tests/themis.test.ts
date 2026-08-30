import { describe, expect, it } from "vitest";
import { evaluateThemis, themisConfig } from "../src/themis";

describe("THEMIS bounded autonomous executive", () => {
  it("defers to the human loop while it can physically answer in time", () => {
    const r = evaluateThemis({ ...themisConfig(), oneWayDelayS: 2, decisionWindowS: 3600 });
    expect(r.pathway).toBe("HUMAN LOOP");
    expect(r.authorityHolder).toBe("COUNCIL");
  });

  it("takes the bounded envelope when light-lag makes the human answer stale", () => {
    const r = evaluateThemis({ ...themisConfig(), oneWayDelayS: 4900, decisionWindowS: 900 });
    expect(r.humanViable).toBe(false);
    expect(r.pathway).toBe("AUTONOMOUS ENVELOPE");
    expect(r.authorityHolder).toBe("THEMIS (BOUNDED)");
  });

  it("never executes an irreversible action without verified evidence — invariant 1", () => {
    const r = evaluateThemis({
      ...themisConfig(),
      oneWayDelayS: 4900,
      decisionWindowS: 900,
      actionClass: "irreversible",
      evidenceScore: 70,
      vetoWindowS: 12_000,
    });
    expect(r.pathway).toBe("HOLD SAFE STATE");
    expect(r.readiness).toBe("NO-GO");
    expect(r.constraints.some((x) => x.includes("evidence"))).toBe(true);
  });

  it("requires the veto pause to be physically receivable, not decorative", () => {
    const base = {
      ...themisConfig(),
      oneWayDelayS: 1000,
      decisionWindowS: 60_000,
      humanDeliberationS: 100_000,
      actionClass: "irreversible" as const,
      evidenceScore: 95,
    };
    const tooShort = evaluateThemis({ ...base, vetoWindowS: 500 });
    expect(tooShort.pathway).toBe("HOLD SAFE STATE");
    const receivable = evaluateThemis({ ...base, vetoWindowS: 2500 });
    expect(receivable.pathway).toBe("VETO-WINDOW AUTONOMY");
    expect(receivable.readiness).toBe("CONDITIONAL");
  });

  it("caps its trust in its own model under drift and holds", () => {
    const r = evaluateThemis({
      ...themisConfig(),
      oneWayDelayS: 4900,
      decisionWindowS: 900,
      incident: "model-drift",
      evidenceScore: 95,
    });
    expect(r.effectiveEvidence).toBeLessThan(r.requiredEvidence);
    expect(r.pathway).toBe("HOLD SAFE STATE");
  });

  it("engages the envelope when a partition removes council quorum", () => {
    const r = evaluateThemis({ ...themisConfig(), oneWayDelayS: 2, incident: "partition" });
    expect(r.quorumAvailable).toBe(false);
    expect(r.pathway).toBe("AUTONOMOUS ENVELOPE");
  });

  it("quarantines stale crossing orders instead of guessing intent — invariant 3", () => {
    const crossed = evaluateThemis({ ...themisConfig(), incident: "command-cross" });
    expect(crossed.pathway).toBe("HOLD SAFE STATE");
    const reversibleOnly = evaluateThemis({
      ...themisConfig(),
      incident: "command-cross",
      actionClass: "reversible",
    });
    expect(reversibleOnly.pathway).not.toBe("HOLD SAFE STATE");
    expect(reversibleOnly.constraints.some((x) => x.includes("quarantined"))).toBe(true);
  });

  it("refuses the sovereign tier categorically", () => {
    const r = evaluateThemis({ ...themisConfig(), tier: "sovereign-proposal", evidenceScore: 100 });
    expect(r.pathway).toBe("HOLD SAFE STATE");
    expect(r.readiness).toBe("NO-GO");
  });

  it("keeps an advisory executive from ever acting alone", () => {
    const r = evaluateThemis({
      ...themisConfig(),
      tier: "advisory",
      oneWayDelayS: 4900,
      decisionWindowS: 900,
    });
    expect(r.pathway).toBe("HOLD SAFE STATE");
  });
});
