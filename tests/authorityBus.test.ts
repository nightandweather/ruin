/**
 * The authority join.
 *
 * Four laboratories independently compute a reason not to be committing
 * irreversible acts. This suite asserts that each of those reasons reaches
 * THEMIS through the bus and actually binds it, and — the part that matters
 * more — that the coupling only ever runs one way. Adding modules to the bus
 * must never buy the executive room it did not already have.
 */
import { describe, expect, it } from "vitest";

import {
  assertAuthorityMonotone,
  authorityRank,
  createState,
  settleAuthority,
  type AuthorityClaim,
  type AuthorityLimit,
} from "../src/civilizationState";
import {
  censusAuthority,
  chronosAuthority,
  lexAuthority,
  settleModuleAuthority,
  veritasAuthority,
  watchfloorAuthority,
  type AuthorityInputs,
} from "../src/authorityBus";
import { evaluateThemis, themisConfig } from "../src/themis";
import { evaluateWatchfloor, watchfloorConfig } from "../src/watchfloor";
import { evaluateVeritas, veritasConfig, withModel } from "../src/veritas";
import { censusConfig, evaluateCensus, CENSUS_COHORTS, type CensusCohortId } from "../src/census";
import { chronosConfig, evaluateChronos } from "../src/chronos";
import { evaluateLex, lexConfig } from "../src/lex";

const withClaims = (claims: Record<string, AuthorityClaim>) => {
  const state = createState(1, 0);
  return settleAuthority({
    ...state,
    ledgers: { ...state.ledgers, authority: { claims, envelope: null } },
  });
};

/** A configuration in which every module is content. */
const healthy = (): AuthorityInputs => ({
  watchfloor: evaluateWatchfloor(watchfloorConfig()),
  veritas: evaluateVeritas(withModel(veritasConfig(), "helios-thermal")),
  census: evaluateCensus({
    ...censusConfig(),
    counted: Object.fromEntries(CENSUS_COHORTS.map((c) => [c.id, true])) as Record<CensusCohortId, boolean>,
  }),
  chronos: evaluateChronos({ ...chronosConfig(), policy: "partial", grantValidityS: 3.2e8 }),
  lex: evaluateLex({ ...lexConfig(), activity: "resource-extraction" }),
});

describe("authority ledger", () => {
  it("settles to the most restrictive claim and names who made it", () => {
    const state = withClaims({
      alpha: { limit: "none", reason: "fine" },
      bravo: { limit: "advisory-only", reason: "stale model" },
      charlie: { limit: "no-irreversible", reason: "saturated" },
    });
    expect(state.ledgers.authority.envelope).toEqual({
      limit: "advisory-only",
      source: "bravo",
      reason: "stale model",
    });
  });

  it("attributes ties deterministically rather than by insertion order", () => {
    const forward = withClaims({
      zulu: { limit: "hold", reason: "z" },
      alpha: { limit: "hold", reason: "a" },
    });
    const reversed = withClaims({
      alpha: { limit: "hold", reason: "a" },
      zulu: { limit: "hold", reason: "z" },
    });
    expect(forward.ledgers.authority.envelope).toEqual(reversed.ledgers.authority.envelope);
    expect(forward.ledgers.authority.envelope!.source).toBe("alpha");
  });

  it("refuses a document whose envelope is wider than a posted restriction", () => {
    const state = createState(1, 0);
    const forged = {
      ...state,
      ledgers: {
        ...state.ledgers,
        authority: {
          claims: { watchfloor: { limit: "hold" as AuthorityLimit, reason: "lost interventions" } },
          envelope: { limit: "none" as AuthorityLimit, source: "bus", reason: "looks fine to me" },
        },
      },
    };
    expect(() => assertAuthorityMonotone(forged)).toThrow(/Authority widened/);
  });

  it("says nothing when nobody is restricting", () => {
    expect(withClaims({}).ledgers.authority.envelope!.limit).toBe("none");
  });
});

describe("module adapters", () => {
  it("keeps quiet while each module is content", () => {
    const inputs = healthy();
    expect(watchfloorAuthority(inputs.watchfloor!).limit).toBe("none");
    expect(veritasAuthority(inputs.veritas!).limit).toBe("none");
    expect(censusAuthority(inputs.census!).limit).toBe("none");
    expect(chronosAuthority(inputs.chronos!).limit).toBe("none");
    expect(lexAuthority(inputs.lex!).limit).toBe("none");
    expect(settleModuleAuthority(inputs).ledgers.authority.envelope!.limit).toBe("none");
  });

  it("escalates a floor that lost an intervention past one that is merely saturated", () => {
    const flooded = watchfloorAuthority(
      evaluateWatchfloor({ ...watchfloorConfig(), incident: "alarm-flood" }),
    );
    const cryWolf = watchfloorAuthority(evaluateWatchfloor({ ...watchfloorConfig(), incident: "cry-wolf" }));
    // The cry-wolf watch never saturates — it loses interventions with a calm
    // board — so it must restrict harder than the visibly flooded one.
    expect(authorityRank(cryWolf.limit)).toBeGreaterThanOrEqual(authorityRank(flooded.limit));
    expect(cryWolf.limit).toBe("advisory-only");
    expect(authorityRank(flooded.limit)).toBeGreaterThan(authorityRank("none"));
  });

  it("holds outright on a model that is wrong while its residuals are quiet", () => {
    const silent = veritasAuthority(evaluateVeritas(withModel(veritasConfig(), "ignis-fusion")));
    expect(silent.limit).toBe("hold");
    const merelyUncertified = veritasAuthority(
      evaluateVeritas({
        ...withModel(veritasConfig(), "helios-thermal"),
        regime: "extrapolation",
        observationRate: 30,
        calibrationCadence: 1,
        autoAcceptance: 0,
      }),
    );
    expect(merelyUncertified.limit).toBe("advisory-only");
  });

  it("refuses to let a withheld survival figure justify an irreversible act", () => {
    const withheld = censusAuthority(evaluateCensus({ ...censusConfig(), discloseExcluded: false }));
    expect(withheld.limit).toBe("no-irreversible");
    expect(withheld.reason).toMatch(/withheld/i);
  });

  it("holds on a causal record that lies about order", () => {
    const dishonest = chronosAuthority(evaluateChronos({ ...chronosConfig(), policy: "arrival" }));
    expect(dishonest.limit).toBe("hold");
    const honest = chronosAuthority(evaluateChronos({ ...chronosConfig(), policy: "partial" }));
    // Honest but still out of reach: sites that cannot refresh a grant.
    expect(honest.limit).toBe("no-irreversible");
  });

  it("lets a module that is not running have no opinion at all", () => {
    const partial = settleModuleAuthority({ watchfloor: healthy().watchfloor });
    expect(Object.keys(partial.ledgers.authority.claims)).toEqual(["watchfloor"]);
    // A missing module must not appear as a healthy one.
    expect(partial.ledgers.authority.claims.veritas).toBeUndefined();
  });
});

describe("LEX on the bus", () => {
  it("holds an unlawful act whether or not anyone could stop it", () => {
    const reachable = lexAuthority(evaluateLex(lexConfig()));
    const unreachable = lexAuthority(
      evaluateLex({ ...lexConfig(), distanceLs: 1.34e8, incident: "enforcement-gap" }),
    );
    // The distance to the nearest court is not an argument.
    expect(reachable.limit).toBe("hold");
    expect(unreachable.limit).toBe("hold");
    expect(unreachable.reason).toMatch(/unenforceable/i);
  });

  it("refuses to clear an irreversible act that no instrument reaches", () => {
    const ungoverned = lexAuthority(evaluateLex({ ...lexConfig(), activity: "personhood-classification" }));
    // Personhood classification is reversible, so silence alone does not
    // restrict; the irreversible ungoverned case is what the rule is for.
    expect(ungoverned.limit).toBe("none");
    const seeding = lexAuthority(evaluateLex({ ...lexConfig(), activity: "biological-seeding" }));
    expect(seeding.limit).toBe("hold");
  });

  it("stops THEMIS from committing the act its own flagship performs", () => {
    const envelope = settleModuleAuthority({
      lex: evaluateLex({ ...lexConfig(), activity: "stellar-collection" }),
    }).ledgers.authority.envelope!;
    const r = evaluateThemis({ ...themisConfig(), actionClass: "irreversible", evidenceScore: 95 }, envelope);
    expect(r.pathway).toBe("HOLD SAFE STATE");
    expect(r.constraints[0]).toMatch(/^LEX restricts to hold/);
  });
});

describe("adding a module can only narrow the envelope", () => {
  it("never widens as inputs are added, in any order", () => {
    const broken: AuthorityInputs = {
      watchfloor: evaluateWatchfloor({ ...watchfloorConfig(), incident: "cry-wolf" }),
      veritas: evaluateVeritas(withModel(veritasConfig(), "helios-thermal")),
      census: evaluateCensus({ ...censusConfig(), discloseExcluded: false }),
      chronos: evaluateChronos({ ...chronosConfig(), policy: "partial" }),
      lex: evaluateLex({ ...lexConfig(), activity: "resource-extraction" }),
    };
    const keys = ["watchfloor", "veritas", "census", "chronos", "lex"] as const;
    // Every subset, compared against every subset that contains it.
    for (let mask = 0; mask < 32; mask += 1) {
      const subset: AuthorityInputs = {};
      keys.forEach((key, i) => {
        if (mask & (1 << i)) (subset as Record<string, unknown>)[key] = broken[key];
      });
      const here = settleModuleAuthority(subset).ledgers.authority.envelope!;
      for (let extra = 0; extra < keys.length; extra += 1) {
        if (mask & (1 << extra)) continue;
        const bigger: AuthorityInputs = { ...subset };
        (bigger as Record<string, unknown>)[keys[extra]] = broken[keys[extra]];
        const there = settleModuleAuthority(bigger).ledgers.authority.envelope!;
        expect(
          authorityRank(there.limit),
          `adding ${keys[extra]} widened ${here.limit} to ${there.limit}`,
        ).toBeGreaterThanOrEqual(authorityRank(here.limit));
      }
    }
  });
});

describe("THEMIS under the bus envelope", () => {
  const acting = { ...themisConfig(), actionClass: "irreversible" as const, evidenceScore: 95 };

  it("acts exactly as before when nothing is restricting", () => {
    const alone = evaluateThemis(acting);
    const withHealthyBus = evaluateThemis(
      acting,
      settleModuleAuthority(healthy()).ledgers.authority.envelope!,
    );
    expect(alone.pathway).toBe("VETO-WINDOW AUTONOMY");
    expect(withHealthyBus.pathway).toBe(alone.pathway);
  });

  it("stops an irreversible act when a withheld survival figure is on the bus", () => {
    const envelope = settleModuleAuthority({
      census: evaluateCensus({ ...censusConfig(), discloseExcluded: false }),
    }).ledgers.authority.envelope!;
    const held = evaluateThemis(acting, envelope);
    expect(held.pathway).toBe("HOLD SAFE STATE");
    expect(held.constraints[0]).toMatch(/^CENSUS restricts to no-irreversible/);
  });

  it("stops even a reversible act on an inadmissible causal record", () => {
    const envelope = settleModuleAuthority({
      chronos: evaluateChronos({ ...chronosConfig(), policy: "arrival" }),
    }).ledgers.authority.envelope!;
    const reversible = evaluateThemis({ ...themisConfig(), actionClass: "reversible" }, envelope);
    expect(reversible.pathway).toBe("HOLD SAFE STATE");
    expect(reversible.constraints[0]).toMatch(/^CHRONOS restricts to hold/);
  });

  it("leaves the human loop reachable under everything short of a hold", () => {
    // A short delay makes the council answerable in time.
    const near = { ...acting, oneWayDelayS: 10, humanDeliberationS: 60, decisionWindowS: 900 };
    for (const limit of ["no-irreversible", "advisory-only"] as const) {
      const r = evaluateThemis(near, { limit, source: "watchfloor", reason: "test" });
      // A restriction removes autonomy, not the humans.
      expect(r.pathway).toBe("HUMAN LOOP");
    }
    const held = evaluateThemis(near, { limit: "hold", source: "chronos", reason: "test" });
    expect(held.pathway).toBe("HOLD SAFE STATE");
  });

  it("never lets an envelope create authority THEMIS did not already have", () => {
    const grid = [
      { ...themisConfig() },
      { ...themisConfig(), actionClass: "irreversible" as const, evidenceScore: 95 },
      { ...themisConfig(), actionClass: "irreversible" as const, evidenceScore: 20 },
      { ...themisConfig(), tier: "advisory" as const },
      { ...themisConfig(), tier: "sovereign-proposal" as const },
      { ...themisConfig(), incident: "partition" as const },
    ];
    const limits: AuthorityLimit[] = ["none", "no-irreversible", "advisory-only", "hold"];
    for (const config of grid) {
      const bare = evaluateThemis(config);
      for (const limit of limits) {
        const bound = evaluateThemis(config, { limit, source: "bus", reason: "test" });
        if (bare.pathway === "HOLD SAFE STATE") {
          expect(bound.pathway, `${limit} unheld a hold`).toBe("HOLD SAFE STATE");
        }
        // An envelope may only ever remove the ability to act.
        if (bound.acts) expect(bare.acts, `${limit} created authority`).toBe(true);
      }
    }
  });
});
