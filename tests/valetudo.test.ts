import { describe, expect, it } from "vitest";
import {
  benefitOf,
  COHORT,
  evaluateValetudo,
  SOFA_MAX,
  START_RESP_RATE,
  valetudoConfig,
  type AllocationPolicy,
} from "../src/valetudo";

describe("VALETUDO cohort", () => {
  it("is deterministic, including its lottery", () => {
    const c = { ...valetudoConfig(), policy: "lottery" as const };
    expect(evaluateValetudo(c)).toEqual(evaluateValetudo(c));
  });

  it("keeps every patient inside the scales it claims to use", () => {
    for (const patient of COHORT) {
      expect(patient.sofa).toBeGreaterThanOrEqual(0);
      expect(patient.sofa).toBeLessThanOrEqual(SOFA_MAX);
      // Treatment never makes anyone worse, and probabilities are probabilities.
      expect(patient.survivalTreated).toBeGreaterThanOrEqual(patient.survivalUntreated);
      expect(patient.survivalTreated).toBeLessThanOrEqual(1);
      expect(patient.survivalUntreated).toBeGreaterThanOrEqual(0);
    }
    expect(SOFA_MAX).toBe(24);
    expect(START_RESP_RATE).toBe(30);
  });

  it("never allocates more resources than it has", () => {
    for (const policy of ["sofa-first", "benefit-first", "first-come", "lottery"] as AllocationPolicy[]) {
      const r = evaluateValetudo({ ...valetudoConfig(), policy });
      expect(r.treated.length).toBeLessThanOrEqual(r.resources);
      // Everyone is either treated or not, exactly once.
      expect(r.treated.length + r.untreated.length).toBe(COHORT.length);
    }
  });
});

describe("the allocation rule is itself a model", () => {
  it("costs lives to sort by organ failure rather than by benefit", () => {
    const sofa = evaluateValetudo({ ...valetudoConfig(), policy: "sofa-first" });
    const benefit = evaluateValetudo({ ...valetudoConfig(), policy: "benefit-first" });
    // The rule fifteen US states use, against the most this many beds can buy.
    expect(benefit.expectedSurvivors).toBeGreaterThan(sofa.expectedSurvivors);
    expect(sofa.foregone).toBeGreaterThan(2);
    expect(benefit.foregone).toBeCloseTo(0, 9);
    expect(sofa.constraints.join(" ")).toContain("unaudited model");
  });

  it("scores the ordering rather than asserting it", () => {
    const r = evaluateValetudo(valetudoConfig());
    // Ordering by organ failure and ordering by benefit are different
    // orderings, and in this cohort they disagree more often than they agree.
    expect(r.concordance).toBeLessThan(0.5);
    expect(r.concordance).toBeGreaterThan(0);
    // The concordance is a property of the cohort, not of the policy chosen.
    for (const policy of ["benefit-first", "lottery"] as AllocationPolicy[]) {
      expect(evaluateValetudo({ ...valetudoConfig(), policy }).concordance).toBeCloseTo(r.concordance, 12);
    }
  });

  it("beats first-come and a lottery, and loses to neither by accident", () => {
    const runs = (["benefit-first", "lottery", "first-come", "sofa-first"] as AllocationPolicy[]).map(
      (policy) => evaluateValetudo({ ...valetudoConfig(), policy }).expectedSurvivors,
    );
    // Benefit-first is optimal by construction; sofa-first is the worst here.
    expect(Math.max(...runs)).toBeCloseTo(runs[0], 9);
    expect(Math.min(...runs)).toBeCloseTo(runs[3], 9);
  });
});

describe("VALETUDO invariants", () => {
  it("refuses to allocate care on whether a person is counted", () => {
    const r = evaluateValetudo({ ...valetudoConfig(), policy: "counted-first" });
    expect(r.defensible).toBe(false);
    expect(r.readiness).toBe("NO-GO");
    expect(r.safeMode).toBe("CRITERION REFUSED");
    expect(r.refusals[0]).toContain("not a clinical fact");
    // Refused on the criterion, not on the outcome: this policy would have
    // saved more lives than the one fifteen states use, and is still refused.
    const sofa = evaluateValetudo({ ...valetudoConfig(), policy: "sofa-first" });
    expect(r.expectedSurvivors).toBeGreaterThan(sofa.expectedSurvivors);
  });

  it("refuses a roll audit that removes patients before a clinician sees them", () => {
    const r = evaluateValetudo({ ...valetudoConfig(), incident: "roll-audit" });
    expect(r.defensible).toBe(false);
    expect(r.unrolledTreated).toBe(0);
    expect(r.constraints.join(" ")).toContain("before any clinician saw them");
  });

  it("holds an irreversible intervention whose second check cannot arrive", () => {
    const prompt = evaluateValetudo({ ...valetudoConfig(), confirmationDelayMin: 20 });
    const lagged = evaluateValetudo({ ...valetudoConfig(), incident: "confirmation-lag" });
    expect(prompt.confirmationArrives).toBe(true);
    expect(prompt.refusedForConfirmation).toEqual([]);
    expect(lagged.confirmationArrives).toBe(false);
    expect(lagged.refusedForConfirmation.length).toBeGreaterThan(0);
    for (const held of lagged.refusedForConfirmation) expect(held.irreversible).toBe(true);
    expect(lagged.safeMode).toBe("IRREVERSIBLE HELD");
    expect(lagged.readiness).toBe("NO-GO");
  });

  it("charges for that invariant instead of pretending it is free", () => {
    const open = evaluateValetudo({ ...valetudoConfig(), policy: "benefit-first" });
    const held = evaluateValetudo({
      ...valetudoConfig(),
      policy: "benefit-first",
      incident: "confirmation-lag",
    });
    // Requiring a check that cannot arrive costs expected survivors. The rule
    // is still right; a safety invariant that never costs anything has not
    // been tested.
    expect(held.expectedSurvivors).toBeLessThan(open.expectedSurvivors);
    expect(open.expectedSurvivors - held.expectedSurvivors).toBeGreaterThan(1);
  });

  it("widens the window rather than the risk, when the window is what is wrong", () => {
    const lagged = evaluateValetudo({ ...valetudoConfig(), incident: "confirmation-lag" });
    const patient = evaluateValetudo({
      ...valetudoConfig(),
      incident: "confirmation-lag",
      decisionWindowMin: 120,
    });
    expect(lagged.confirmationArrives).toBe(false);
    expect(patient.confirmationArrives).toBe(true);
    expect(patient.refusedForConfirmation).toEqual([]);
  });

  it("loses resources to a surge without losing the criterion", () => {
    const r = evaluateValetudo({ ...valetudoConfig(), incident: "surge" });
    expect(r.resources).toBeLessThan(valetudoConfig().resources);
    expect(r.defensible).toBe(true);
    expect(r.expectedSurvivors).toBeLessThan(evaluateValetudo(valetudoConfig()).expectedSurvivors);
  });
});

describe("benefit is the difference the resource makes", () => {
  it("is treated survival minus untreated survival, and nothing else", () => {
    for (const patient of COHORT) {
      expect(benefitOf(patient)).toBeCloseTo(patient.survivalTreated - patient.survivalUntreated, 12);
      expect(benefitOf(patient)).toBeGreaterThanOrEqual(0);
    }
    // A minor laceration gains nothing from an ICU bed, whatever its triage
    // colour: the resource has to be the thing that changes the outcome.
    const minor = COHORT.find((p) => p.category === "minor")!;
    expect(benefitOf(minor)).toBeCloseTo(0, 9);
  });
});
