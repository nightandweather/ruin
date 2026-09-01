/**
 * The definition join.
 *
 * CENSUS owns the personhood definition; CONCILIUM and VALETUDO now read it
 * instead of keeping flags of their own. This suite proves the join carries
 * force: amending one line of the definition moves the council's seats and
 * changes who a roll audit removes from the ward — with no vote taken and no
 * clinical fact changed anywhere.
 *
 * This is Season 01's mechanism given a blast radius: the amendment that
 * manufactured a survival rate now also reshapes representation and care.
 */
import { describe, expect, it } from "vitest";
import { censusConfig, type CensusCohortId } from "../src/census";
import { conciliumConfig, defaultRoll, evaluateConcilium, WORLDS } from "../src/concilium";
import { COHORT, evaluateValetudo, valetudoConfig } from "../src/valetudo";

/** The Season 01 amendment: contract labour and sleepers written out. */
const amended = (): Record<CensusCohortId, boolean> => ({
  ...censusConfig().counted,
  contract: false,
  sleepers: false,
});

describe("one definition, three modules", () => {
  it("reads the roll from CENSUS rather than keeping its own", () => {
    // Both modules default to the identical object CENSUS ships.
    expect(conciliumConfig().roll).toEqual(censusConfig().counted);
    expect(valetudoConfig().roll).toEqual(censusConfig().counted);
    expect(defaultRoll()).toEqual(censusConfig().counted);
  });

  it("moves the council's seats when the definition is amended", () => {
    const before = evaluateConcilium({ ...conciliumConfig(), seatBasis: "counted" });
    const after = evaluateConcilium({
      ...conciliumConfig(),
      seatBasis: "counted",
      roll: amended(),
    });
    const seat = (r: typeof before, id: string) => r.standings.find((s) => s.world.id === id)!.seatShare;
    // The convoy is sleepers and forks: writing sleepers out halves the
    // cohorts the definition admits there.
    expect(seat(after, "odyssey")).toBeLessThan(seat(before, "odyssey"));
    // A world of charter citizens gains share without gaining a person.
    expect(seat(after, "terra")).toBeGreaterThan(seat(before, "terra"));
    // Nothing physical moved: production and population are untouched.
    for (const world of WORLDS) {
      const b = before.standings.find((s) => s.world.id === world.id)!;
      const a = after.standings.find((s) => s.world.id === world.id)!;
      expect(a.world.population).toBe(b.world.population);
      expect(a.revenueTWy).toBeCloseTo(b.revenueTWy, 9);
    }
  });

  it("changes who a roll audit removes from the ward", () => {
    const before = evaluateValetudo({ ...valetudoConfig(), incident: "roll-audit" });
    const after = evaluateValetudo({
      ...valetudoConfig(),
      incident: "roll-audit",
      roll: amended(),
    });
    // The amendment reaches the bedside: more patients are outside the roll,
    // so more are removed before a clinician sees them.
    expect(after.rolledIds.length).toBeLessThan(before.rolledIds.length);
    expect(after.unrolledTotal).toBeGreaterThan(before.unrolledTotal);
    // A named person: the contract-labour burn patient was audit-eligible
    // before the amendment and is not after it.
    const burns = COHORT.find((p) => p.id === "p06")!;
    expect(burns.cohort).toBe("contract");
    expect(before.rolledIds).toContain("p06");
    expect(after.rolledIds).not.toContain("p06");
    // The criterion is refused either way — the invariant does not soften
    // because the definition moved.
    expect(before.defensible).toBe(false);
    expect(after.defensible).toBe(false);
  });

  it("keeps clinical allocation blind to the amendment when no roll criterion is in play", () => {
    const before = evaluateValetudo(valetudoConfig());
    const after = evaluateValetudo({ ...valetudoConfig(), roll: amended() });
    // Under a clinical policy with no audit, who is counted changes nothing
    // about who is treated. The definition only bites where someone lets it.
    expect(after.treated.map((p) => p.id)).toEqual(before.treated.map((p) => p.id));
    expect(after.expectedSurvivors).toBeCloseTo(before.expectedSurvivors, 12);
  });
});
