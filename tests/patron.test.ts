import { describe, expect, it } from "vitest";
import { evaluatePatron, patronConfig, type PatronIncident } from "../src/patron";

const INCIDENTS: PatronIncident[] = [
  "none",
  "outcome-contingent",
  "registered-reports",
  "replication-collapse",
  "independent-audit",
];

const sweep = () => INCIDENTS.map((incident) => ({ ...patronConfig(), incident }));

describe("PATRON consortium", () => {
  it("is deterministic across every incident", () => {
    for (const config of sweep()) expect(evaluatePatron(config)).toEqual(evaluatePatron(config));
  });

  it("measures the same world under every funding structure", () => {
    // Measurements are drawn before publication decisions, so the funding
    // mix can only select among them, never change them.
    const nominal = evaluatePatron(patronConfig());
    const pure = evaluatePatron({ ...patronConfig(), consortiumShare: 0 });
    for (let i = 0; i < nominal.studies.length; i += 1) {
      expect(nominal.studies[i].estimateHarm).toBeCloseTo(pure.studies[i].estimateHarm, 12);
    }
  });
});

describe("INVARIANT — no published number is ever altered", () => {
  it("publishes measurements verbatim or not at all, in every scenario", () => {
    for (const config of sweep()) {
      const r = evaluatePatron(config);
      const byId = new Map(r.studies.map((s) => [s.id, s.estimateHarm]));
      for (const p of r.published.filter((s) => s.id.startsWith("s"))) {
        expect(p.estimateHarm).toBe(byId.get(p.id));
      }
    }
  });

  it("counts the drawer instead of hiding it", () => {
    for (const config of sweep()) {
      const r = evaluatePatron(config);
      const surfaced = r.published.filter((s) => s.id.startsWith("s")).length;
      expect(surfaced + r.fileDrawerCount).toBe(r.studies.length);
    }
  });
});

describe("INVARIANT — provenance survives publication", () => {
  it("decomposes the consensus by funder, and the parts rebuild the whole", () => {
    const r = evaluatePatron(patronConfig());
    const { independent, consortium } = r.decomposition;
    const rebuilt =
      (independent.mean * independent.count + consortium.mean * consortium.count) /
      (independent.count + consortium.count);
    expect(rebuilt).toBeCloseTo(r.publishedConsensus, 12);
    // The decomposition is the tell: the consortium's published mean sits
    // below the independents' published mean, and both are honest numbers.
    expect(consortium.mean).toBeLessThan(independent.mean);
  });
});

describe("the finding — selection alone moves the answer", () => {
  it("biases the literature with every researcher honest", () => {
    const r = evaluatePatron(patronConfig());
    expect(r.fileDrawerCount).toBeGreaterThan(0);
    expect(r.biasPp).toBeGreaterThan(0.5);
    expect(r.publishedConsensus).toBeLessThan(r.fullConsensus);
    // But the nominal drawer is not yet enough to clear deployment.
    expect(r.deployed).toBe(false);
    expect(r.readiness).toBe("CONDITIONAL");
    expect(r.safeMode).toBe("LITERATURE SELECTED");
  });

  it("flips the deployment decision when the funding turns outcome-contingent", () => {
    const r = evaluatePatron({ ...patronConfig(), incident: "outcome-contingent" });
    expect(r.deployed).toBe(true);
    expect(r.wrongDeployment).toBe(true);
    expect(r.excessCases).toBeGreaterThan(0);
    expect(r.readiness).toBe("NO-GO");
    // Same seed, same measurements: only the money changed.
    const nominal = evaluatePatron(patronConfig());
    expect(r.studies.map((s) => s.estimateHarm)).toEqual(nominal.studies.map((s) => s.estimateHarm));
  });

  it("reads true with no consortium money, and true again with registered reports", () => {
    const pure = evaluatePatron({ ...patronConfig(), consortiumShare: 0 });
    expect(pure.biasPp).toBeCloseTo(0, 9);
    expect(pure.fileDrawerCount).toBe(0);
    // The cheap fix: same funding mix, but acceptance precedes results.
    const registered = evaluatePatron({ ...patronConfig(), incident: "registered-reports" });
    expect(registered.biasPp).toBeCloseTo(0, 9);
    expect(registered.fileDrawerCount).toBe(0);
    expect(registered.deployed).toBe(false);
    expect(registered.safeMode).toBe("DRAWER ABOLISHED");
  });

  it("loses its pull toward the world when replication money collapses", () => {
    const nominal = evaluatePatron(patronConfig());
    const collapsed = evaluatePatron({ ...patronConfig(), incident: "replication-collapse" });
    expect(collapsed.replications).toEqual([]);
    expect(collapsed.biasPp).toBeGreaterThanOrEqual(nominal.biasPp - 1e-9);
    expect(collapsed.constraints.join(" ")).toContain("Replication funding collapsed");
  });

  it("lets the audit correct the record only after the decision", () => {
    const r = evaluatePatron({ ...patronConfig(), incident: "independent-audit" });
    expect(r.constraints.join(" ")).toContain("after the decision was already made");
  });
});
