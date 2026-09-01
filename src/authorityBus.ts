/**
 * Authority adapters — the join that makes four laboratories bind.
 *
 * WATCHFLOOR, VERITAS, CENSUS, and CHRONOS each compute, independently, a
 * reason the civilization should not be committing irreversible acts right
 * now. Until this file they only said so on their own pages. THEMIS, which is
 * the module that actually decides what executes, could not hear any of them
 * and read its light-lag off a slider instead.
 *
 * Each adapter turns one module's own result into an `AuthorityClaim` on the
 * bus. The modules still never import each other: they post to the ledger, the
 * ledger settles to its most restrictive claim, and THEMIS reads the envelope.
 *
 * The direction of the coupling is deliberate. A module can only ever narrow
 * authority — bus invariant 4. Adding a healthy module to the bus can never
 * buy the executive more room, because the modules with standing to restrict
 * are exactly the ones that know something is wrong.
 */

import {
  createState,
  settleAuthority,
  type AuthorityClaim,
  type CivilizationState,
} from "./civilizationState";
import type { evaluateWatchfloor } from "./watchfloor";
import type { evaluateVeritas } from "./veritas";
import type { evaluateCensus } from "./census";
import type { evaluateChronos } from "./chronos";
import type { evaluateLex } from "./lex";

type WatchfloorResult = ReturnType<typeof evaluateWatchfloor>;
type VeritasResult = ReturnType<typeof evaluateVeritas>;
type CensusResult = ReturnType<typeof evaluateCensus>;
type ChronosResult = ReturnType<typeof evaluateChronos>;
type LexResult = ReturnType<typeof evaluateLex>;

const NONE: AuthorityClaim = {
  limit: "none",
  reason: "Nothing in this module's state restricts the executive",
};

/**
 * A saturated control room may not commit anything irreversible.
 *
 * WATCHFLOOR already withdraws authority inside its own model; this exports
 * the same decision so it binds the executive rather than only the page. A
 * watch that has already lost an intervention is worse than saturated — the
 * floor has demonstrated it is not tracking the plant, so the restriction
 * escalates past "no irreversible acts" to advisory.
 */
export function watchfloorAuthority(result: WatchfloorResult): AuthorityClaim {
  if (result.missedCriticals >= 0.5) {
    return {
      limit: "advisory-only",
      reason: `Floor lost ${result.missedCriticals.toFixed(1)} critical interventions this watch`,
    };
  }
  if (!result.trajectory.at(-1)!.authority) {
    return {
      limit: "no-irreversible",
      reason: `Unacknowledged queue over the cap; authority withdrawn at minute ${result.withdrawnAt}`,
    };
  }
  return NONE;
}

/**
 * A model outside its validated envelope may advise and nothing more.
 *
 * This is VERITAS's own invariant — certification is scope, not reputation —
 * made binding. A silent divergence is worse still: the model is not merely
 * uncertified, it is wrong while reporting that it is fine, so nothing may be
 * executed on its output at all.
 */
export function veritasAuthority(result: VeritasResult): AuthorityClaim {
  if (result.silentYears > 0) {
    return {
      limit: "hold",
      reason: `Model wrong from year ${result.firstTrueBreach} with residuals still quiet; its output cannot justify an act`,
    };
  }
  if (!result.endCertified) {
    return {
      limit: "advisory-only",
      reason: "Model is stale or outside its validated envelope; advisory only",
    };
  }
  return NONE;
}

/**
 * A survival figure the model refuses to publish cannot justify an act.
 *
 * CENSUS is about reporting rather than action, and that is exactly why this
 * edge matters: irreversible decisions are argued for with the headline
 * number. If the ledger will not publish it, nothing irreversible may lean on
 * it either.
 */
export function censusAuthority(result: CensusResult): AuthorityClaim {
  if (!result.published) {
    return {
      limit: "no-irreversible",
      reason: `Survival figure withheld: ${result.refusals[0] ?? "publication refused"}`,
    };
  }
  if (result.unreportedDead > 0) {
    return {
      limit: "no-irreversible",
      reason: `${Math.round(result.unreportedDead).toLocaleString()} deaths outside the reported population`,
    };
  }
  return NONE;
}

/**
 * An act cannot be justified by a record that lies about order.
 *
 * A ledger that sequences spacelike-separated events, or files an effect ahead
 * of its cause, is not evidence of anything — so CHRONOS holds outright. Short
 * of that, sites that cannot refresh a delegated grant inside light-lag are
 * beyond the executive's reach for irreversible acts.
 */
export function chronosAuthority(result: ChronosResult): AuthorityClaim {
  if (!result.ledgerHonest) {
    return {
      limit: "hold",
      reason: `Causal record inadmissible: ${result.inverted} inverted, ${result.fabricated} fabricated orderings`,
    };
  }
  if (result.autonomousCount > 0) {
    return {
      limit: "no-irreversible",
      reason: `${result.autonomousCount} site(s) cannot refresh delegated authority inside light-lag`,
    };
  }
  return NONE;
}

/**
 * An unlawful act is refused whether or not anyone could stop it.
 *
 * This is the adapter where the asymmetry does the most work. LEX computes
 * impunity — prohibited, and nobody able to act on the breach — and posts the
 * same `hold` either way. An executive that could be talked out of a
 * prohibition by measuring the distance to the nearest court would be exactly
 * the failure the module exists to name.
 *
 * An ungoverned act is not cleared either. Nothing in the register reaches
 * personhood classification, and silence is a finding rather than a licence,
 * so an irreversible act under no instrument at all is still held back from
 * autonomy.
 */
export function lexAuthority(result: LexResult): AuthorityClaim {
  if (!result.lawful) {
    return {
      limit: "hold",
      reason: result.impunity
        ? `Unlawful and unenforceable: ${result.prohibitions} binding prohibition(s), nearest party ${result.roundTripYears.toFixed(2)} yr away`
        : `Unlawful: ${result.prohibitions} binding prohibition(s) against ${result.activity.name.toLowerCase()}`,
    };
  }
  if (result.undetermined && result.activity.irreversible) {
    return {
      limit: "no-irreversible",
      reason: "No instrument reaches this act; silence is not a permission for something irreversible",
    };
  }
  if (result.restrictions > 0 && result.activity.irreversible) {
    return {
      limit: "no-irreversible",
      reason: `${result.restrictions} instrument(s) restrict an irreversible act`,
    };
  }
  return NONE;
}

export interface AuthorityInputs {
  watchfloor?: WatchfloorResult;
  veritas?: VeritasResult;
  census?: CensusResult;
  chronos?: ChronosResult;
  lex?: LexResult;
}

/**
 * Post every available module's claim and settle the envelope.
 *
 * Modules absent from `inputs` post nothing rather than posting `none`: a
 * module that is not running has no opinion, and recording one would let a
 * missing module look like a healthy one.
 */
export function settleModuleAuthority(inputs: AuthorityInputs, seed = 1, tick = 0): CivilizationState {
  const state = createState(seed, tick);
  const claims: Record<string, AuthorityClaim> = {};
  if (inputs.watchfloor) claims.watchfloor = watchfloorAuthority(inputs.watchfloor);
  if (inputs.veritas) claims.veritas = veritasAuthority(inputs.veritas);
  if (inputs.census) claims.census = censusAuthority(inputs.census);
  if (inputs.chronos) claims.chronos = chronosAuthority(inputs.chronos);
  if (inputs.lex) claims.lex = lexAuthority(inputs.lex);
  return settleAuthority({
    ...state,
    ledgers: { ...state.ledgers, authority: { claims, envelope: null } },
  });
}
