/**
 * Season 02 as a regression suite.
 *
 * Every scene cassette in `fiction/season-02` is loaded, validated, and run,
 * and the figures the manuscript commits to are asserted against what the
 * modules actually return. A change to a laboratory that would contradict a
 * published chapter fails here rather than being found by a reader.
 *
 * The manuscript is the specification. A failure in this file means a module
 * drifted from the canon, not that the canon is wrong.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseCassette, type IncidentCassette } from "../src/cassette";
import { runScene, SCENE_MODULES } from "../src/sceneRunner";
import type { evaluateCensus } from "../src/census";
import type { evaluateChronos } from "../src/chronos";
import type { evaluateLex } from "../src/lex";
import type { evaluatePorta } from "../src/porta";
import type { evaluateValetudo } from "../src/valetudo";

const DIR = "fiction/season-02";

const scenes = readdirSync(DIR)
  .filter((name) => name.endsWith(".cassette.json"))
  .sort();

const load = (name: string): IncidentCassette => {
  const parsed = parseCassette(readFileSync(`${DIR}/${name}`, "utf8"));
  if (!parsed.ok) throw new Error(`${name}: ${parsed.errors.join("; ")}`);
  return parsed.cassette;
};

const run = <T>(name: string): T => {
  const outcome = runScene(load(name));
  if (!outcome.ok) throw new Error(`${name}: ${outcome.errors.join("; ")}`);
  return outcome.result as T;
};

describe("the season's scenes are loadable and runnable", () => {
  it("ships scenes at all", () => {
    expect(scenes.length).toBeGreaterThanOrEqual(6);
  });

  for (const name of scenes) {
    it(`${name} validates, names a runnable module, and carries its scene note`, () => {
      const cassette = load(name);
      expect(SCENE_MODULES).toContain(cassette.module);
      // A cassette without a note is a configuration, not a scene.
      expect(cassette.notes?.length ?? 0).toBeGreaterThan(80);
      expect(cassette.title).toMatch(/^C\.E\. 2\d{3}\.\d{3} — /);
      const outcome = runScene(cassette);
      expect(outcome.ok).toBe(true);
    });
  }

  it("replays every scene to the same result", () => {
    for (const name of scenes) {
      expect(runScene(load(name))).toEqual(runScene(load(name)));
    }
  });
});

describe("2471.031 — the first shot is a certification refusal", () => {
  it("finds nothing in space law that reaches who counts as a person", () => {
    const r = run<ReturnType<typeof evaluateLex>>("2471-031-authentication-suspension.cassette.json");
    expect(r.verdict).toBe("UNGOVERNED");
    expect(r.undetermined).toBe(true);
    expect(r.prohibitions).toBe(0);
    // Ungoverned is not cleared: the register says so in as many words.
    expect(r.readiness).not.toBe("GO");
    expect(r.constraints.join(" ")).toContain("silence is the finding");
  });
});

describe("2471.049 — the first death, with no shot fired", () => {
  it("kills people who never enter a report as war dead", () => {
    const r = run<ReturnType<typeof evaluateCensus>>("2471-049-first-death.cassette.json");
    expect(r.unreportedDead).toBeGreaterThan(10_000);
    expect(r.excludedCohorts.length).toBeGreaterThan(0);
    // The reported rate stays almost perfect while the actual rate does not.
    expect(r.reportedSurvival).toBeGreaterThan(0.999);
    expect(r.actualSurvival).toBeLessThan(0.96);
    expect(r.constraints.join(" ")).toContain("never entered a report");
  });
});

describe("2471.099 — seventy-three", () => {
  it("lets both ledgers record the other as first, with neither lying", () => {
    const r = run<ReturnType<typeof evaluateChronos>>("2471-099-seventy-three.cassette.json");
    // Effects filed ahead of their causes, from clock rates alone.
    expect(r.inverted).toBeGreaterThan(0);
    expect(r.faults.some((fault) => fault.kind === "inverted")).toBe(true);
    expect(r.ledgerHonest).toBe(false);
    expect(r.safeMode).toBe("LEDGER REFUSED");
  });
});

describe("2471.166 — forty-three seconds", () => {
  it("opens a gate both ends had sealed, and charges for it permanently", () => {
    const r = run<ReturnType<typeof evaluatePorta>>("2471-166-forty-three-seconds.cassette.json");
    // The lawful path was closed: quorum revoked at both ends.
    expect(r.authorized).toBe(false);
    // It opens anyway, and everyone on the manifest gets through.
    expect(r.opens).toBe(true);
    expect(r.openingSeconds).toBeCloseTo(43, 6);
    expect(r.passed).toBe(66);
    expect(r.leftBehind).toBe(0);
    // And the price is a past the two civilizations can no longer share.
    expect(r.causalLedgerIntact).toBe(false);
    expect(r.attribution).toBe("CAUSE UNASSIGNED");
    expect(r.safeMode).toBe("LEDGERS FORKED");
  });
});

describe("2471.031 — seventeen hours", () => {
  it("applies one rule to everyone, defensibly, and still forgoes survivors", () => {
    const r = run<ReturnType<typeof evaluateValetudo>>("2471-031-seventeen-hours.cassette.json");
    // Emma is right about the criterion: nothing here is refused.
    expect(r.defensible).toBe(true);
    expect(r.refusals).toEqual([]);
    // And the even-handed rule still costs lives against what the beds could buy.
    expect(r.foregone).toBeGreaterThan(1);
    expect(r.expectedSurvivors).toBeLessThan(r.bestPossible);
    // The seventeen-hour clock is not the binding constraint; the check returns.
    expect(r.confirmationArrives).toBe(true);
  });
});

describe("2471.049 — the denial reaches the ward", () => {
  it("removes the unrolled before any clinician sees them, and refuses the criterion", () => {
    const r = run<ReturnType<typeof evaluateValetudo>>("2471-049-oxygen-renewal.cassette.json");
    expect(r.defensible).toBe(false);
    expect(r.readiness).toBe("NO-GO");
    expect(r.unrolledTreated).toBe(0);
    expect(r.unrolledTotal).toBeGreaterThan(0);
    expect(r.constraints.join(" ")).toContain("before any clinician saw them");
    expect(r.refusals[0]).toContain("not a clinical fact");
  });
});
