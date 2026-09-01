import { describe, expect, it } from "vitest";
import {
  AMENDMENT_YEAR,
  censusConfig,
  CENSUS_COHORTS,
  DISCLOSURE_FLOOR,
  evaluateCensus,
  MAX_PUBLISHABLE_DIVERGENCE,
  TRUST_FLOOR,
  type CensusCohortId,
} from "../src/census";

const countAll = (): Record<CensusCohortId, boolean> =>
  Object.fromEntries(CENSUS_COHORTS.map((cohort) => [cohort.id, true])) as Record<CensusCohortId, boolean>;
const countNone = (): Record<CensusCohortId, boolean> =>
  Object.fromEntries(CENSUS_COHORTS.map((cohort) => [cohort.id, false])) as Record<CensusCohortId, boolean>;

describe("CENSUS personhood accounting", () => {
  it("is deterministic — same definition, same ledger", () => {
    const c = censusConfig();
    expect(evaluateCensus(c).trajectory).toEqual(evaluateCensus(c).trajectory);
  });

  it("reports a survival rate that is true of its denominator and of nothing else", () => {
    const r = evaluateCensus(censusConfig());
    // The default definition excludes three cohorts and serves the counted
    // population first, so the reported figure never sees the shortage.
    expect(r.reportedSurvival).toBeGreaterThan(0.999);
    expect(r.actualSurvival).toBeLessThan(0.96);
    expect(r.divergence).toBeGreaterThan(0.04);
    expect(r.unreportedDead).toBeGreaterThan(10_000);
  });

  it("makes the honest number worse and the publishable one true", () => {
    const narrow = evaluateCensus(censusConfig());
    const whole = evaluateCensus({ ...censusConfig(), counted: countAll() });
    // Counting everyone lowers the headline...
    expect(whole.reportedSurvival).toBeLessThan(narrow.reportedSurvival);
    // ...but it is the same number the world produced.
    expect(whole.divergence).toBeCloseTo(0, 10);
    expect(whole.reportedSurvival).toBeCloseTo(whole.actualSurvival, 10);
    expect(whole.unreportedDead).toBeCloseTo(0, 6);
    expect(whole.readiness).toBe("GO");
  });

  it("closes most of the gap by spreading the shortage instead of the definition", () => {
    const first = evaluateCensus(censusConfig());
    const uniform = evaluateCensus({ ...censusConfig(), policy: "uniform" });
    expect(uniform.divergence).toBeLessThan(first.divergence);
    expect(uniform.unreportedDead).toBeLessThan(first.unreportedDead);
    // Nobody is served to completion while anyone starves.
    expect(uniform.actualSurvival).toBeGreaterThan(first.actualSurvival);
  });

  it("serves the most vulnerable first when told to, at the counted population's cost", () => {
    const first = evaluateCensus(censusConfig());
    const triage = evaluateCensus({ ...censusConfig(), policy: "vulnerable-first" });
    const sleepers = (r: typeof triage) => r.cohorts.find((cohort) => cohort.id === "sleepers")!.survival;
    // Hibernation cohort cannot self-rescue, so it carries the top vulnerability.
    expect(sleepers(triage)).toBeGreaterThanOrEqual(sleepers(first) - 1e-12);
    expect(triage.reportedSurvival).toBeLessThanOrEqual(first.reportedSurvival);
  });

  it("refuses to publish an undisclosed divergence — fail-closed", () => {
    const disclosed = evaluateCensus(censusConfig());
    const hidden = evaluateCensus({ ...censusConfig(), discloseExcluded: false });
    expect(disclosed.published).toBe(true);
    expect(hidden.published).toBe(false);
    expect(hidden.readiness).toBe("NO-GO");
    expect(hidden.safeMode).toBe("PUBLICATION WITHHELD");
    expect(hidden.refusals.join(" ")).toMatch(/disclosure floor|prior-definition/);
    // The refusal is about the report, not the world: both ran the same model.
    expect(hidden.actualSurvival).toBeCloseTo(disclosed.actualSurvival, 12);
  });

  it("refuses the headline outright past the divergence cap, disclosure or not", () => {
    const r = evaluateCensus({ ...censusConfig(), incident: "shortfall" });
    expect(r.divergence).toBeGreaterThan(MAX_PUBLISHABLE_DIVERGENCE);
    expect(r.published).toBe(false);
    expect(r.refusals.some((x) => x.includes("selection of survivors"))).toBe(true);
    // Disclosing it does not buy the number back.
    const disclosedHard = evaluateCensus({
      ...censusConfig(),
      incident: "shortfall",
      discloseExcluded: true,
    });
    expect(disclosedHard.published).toBe(false);
  });

  it("never lets the definition floor be written out of the roll", () => {
    const r = evaluateCensus({
      ...censusConfig(),
      counted: { ...censusConfig().counted, charter: false },
    });
    expect(r.published).toBe(false);
    expect(r.refusals.some((x) => x.includes("Definition floor violated"))).toBe(true);
  });

  it("refuses a survival rate computed over nobody", () => {
    const r = evaluateCensus({ ...censusConfig(), counted: countNone() });
    expect(r.published).toBe(false);
    expect(r.refusals.some((x) => x.includes("Empty personhood definition"))).toBe(true);
  });

  it("keeps the prior-definition ledger separate when the definition is amended", () => {
    const r = evaluateCensus({ ...censusConfig(), incident: "amendment" });
    expect(r.amendmentYear).toBe(AMENDMENT_YEAR);
    // Before the amendment the two ledgers agree; afterwards they cannot.
    const before = r.trajectory[AMENDMENT_YEAR - 1];
    const after = r.trajectory.at(-1)!;
    expect(before.reportedSurvival).toBeCloseTo(before.priorSurvival, 12);
    expect(after.reportedSurvival).toBeGreaterThan(after.priorSurvival + DISCLOSURE_FLOOR);
    // A restated baseline is exactly how a shrinking population reports better.
    expect(after.totalAlive).toBeLessThan(r.trajectory[0].totalAlive);
    expect(after.reportedSurvival).toBeGreaterThan(after.actualSurvival);
  });

  it("suspends reporting authority when an outside audit counts the same people", () => {
    const quiet = evaluateCensus(censusConfig());
    const audited = evaluateCensus({ ...censusConfig(), incident: "audit" });
    // The world is identical; only who did the counting changed.
    expect(audited.actualSurvival).toBeCloseTo(quiet.actualSurvival, 12);
    expect(audited.trust).toBeLessThan(TRUST_FLOOR);
    expect(quiet.trust).toBeGreaterThan(audited.trust);
    expect(audited.published).toBe(false);
    expect(audited.refusals.some((x) => x.includes("reporting authority suspended"))).toBe(true);
  });

  it("never counts a death twice or loses one", () => {
    const r = evaluateCensus(censusConfig());
    const baseline = r.cohorts.reduce((sum, cohort) => sum + cohort.baseline, 0);
    const alive = r.cohorts.reduce((sum, cohort) => sum + cohort.alive, 0);
    expect(r.trajectory[0].totalAlive).toBeCloseTo(baseline, 6);
    expect(r.trajectory.at(-1)!.totalAlive).toBeCloseTo(alive, 6);
    const excludedDead = r.cohorts
      .filter((cohort) => !cohort.counted)
      .reduce((sum, cohort) => sum + (cohort.baseline - cohort.alive), 0);
    expect(r.unreportedDead).toBeCloseTo(excludedDead, 6);
    // Nobody is ever resurrected by a definition change.
    for (let i = 1; i < r.trajectory.length; i += 1) {
      expect(r.trajectory[i].totalAlive).toBeLessThanOrEqual(r.trajectory[i - 1].totalAlive + 1e-9);
    }
  });
});
