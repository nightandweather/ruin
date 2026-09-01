# PORTA — the transit gate, and what a violation costs forever

Season 02 runs on a gate this repository never modelled. The manuscript fixed its constants and its final audit checked them against each other; PORTA makes them executable, so the story's central machine can be operated rather than described.

The direction of authority is unusual for RUIN and worth stating plainly: **the manuscript is the specification and this module is the defect.** Where the two disagree, the module is what changes. `tests/porta.test.ts` is written as a continuity check on the chronology, not as a test of whether the chronology is right.

## Executable contract

An opening deposits heat, heat sets a cooldown, and throughput is bounded by quarantine and decompression rather than by the door. Authority to open is a quorum held at both ends.

Canon constants, all reproduced:

| Quantity                           | Canon      | Model                                 |
| ---------------------------------- | ---------- | ------------------------------------- |
| Thermal deposit, 71-minute opening | 9.58 PJ    | 9.58 PJ                               |
| Safe opening ceiling               | 80 min     | enforced, not advised                 |
| Reopening interval, active panels  | 94 days    | 94.0 days                             |
| Reopening interval, 2449           | 211 days   | 211.0 days at 94/211 panel efficiency |
| Nina's opening                     | 43 s       | 43 s                                  |
| Last evacuation manifest           | 66 through | 66 through                            |

The last row is the one the story pins from below. Forty-seven children, nineteen wounded, the third ledger's original, and ARK-2's navigation core do not clear forty-three seconds at under ninety-three people a minute — and they only clear it at all because the violation skips quarantine, which is part of what makes it a violation.

## Safety invariants

Two are the ordinary RUIN kind:

- **No opening past the ceiling.** The model refuses the excess rather than warning about it, and the heat that would have been deposited is never deposited.
- **No automatic opening without quorum at both ends.** Half an authority is not an authority.

The third is a shape this repository has not used before.

**The violation is possible, and permanent.** Binding a hundred and twenty-five discarded ledgers into a temporary causal proof _does_ open the door. The children go through. The module does not forbid it — it prices it: the causal records at both ends fork irreversibly, the two civilizations lose any shared past to agree on, the method cannot be used twice, and the act itself is recorded as `CAUSE UNASSIGNED`, so whoever performed it is in neither official record.

Every other invariant in RUIN refuses. This one lets the act through and charges for it forever, which is what the story needed and what the survivors writing her name by hand are for.

## Sourced baseline and speculation

Nothing here is sourced, and a transit gate is not physics — [the concept brief](transit-gate.md) keeps that boundary and PORTA does not cross it. What is modelled is the operations _around_ one, which is the same move HORIZONS makes with its speculative nodes.

Every constant is from the Season 02 chronology. The station rates, the coolant reserve, and the recovery-panel scaling are the model's own scenario parameters, chosen to reproduce the canon intervals.

## Where it connects

- **CHRONOS.** Nina's temporary quorum produces exactly what CHRONOS calls an inadmissible causal record, which is why the official ledger cannot assign the act a cause. The novel and the module arrived at the same invariant independently.
- **CENSUS.** The third ledger's 1,207 people are an excluded cohort in the CENSUS sense, and the original that goes through the gate is the only copy.
- **CONCILIUM.** Quorum revocation at both ends is a council decision with a physical consequence, and the α Cen landfall is the same world in both registers.

## Next layers

1. Post to the authority ledger: a forked causal record should stop THEMIS the way CHRONOS's already does.
2. Model the two forked ledgers as separate documents rather than a boolean, so the disagreement about the past can be inspected.
3. Cassettes for the openings the story turns on — the first authentication suspension, the seventy-three, and the forty-three seconds.
4. Reconcile the ARK-2 departure with ODYSSEY: the beam-limited cruise is what sets 0.061c, and NAVIS has no beam-driven mission preset to check it against.
