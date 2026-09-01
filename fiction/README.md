# RUIN fiction

This directory contains narrative prototypes derived from the executable RUIN laboratories.

## Status

- The project brief supplied on 2026-08-30 remains the creative authority.
- These drafts are **canon candidates**, not finalized canon.
- Unresolved questions—who built RUIN, whether simulated people are conscious, and whether recurring people share an identity—remain deliberately unresolved.

## Season 01 — 99.97%의 구원

The first season follows a junior civilization-simulation verifier who discovers that a perfect survival report was produced by changing who counts as a person.

- [Episode 01 — 제외된 사람들](season-01/episode-01.md) · [incident cassette](season-01/episode-01.cassette.json)

Each episode can carry an **incident cassette** — a deterministic replay file
(`ruin-cassette/1`) reproducing the operational event the chapter describes.
Load one from the HELIOS footer (**CASSETTE ↑**) to fly the incident yourself:
same seed, same commands, same result the characters verify on the page. The
format lives in `src/cassette.ts` and is validated on load, so cassettes can be
hand-edited, attached to issues, and exchanged like sheet music.

## Season 02 — 우리 사이의 거리 / The Distance Between Us

Two civilizations that share the same technology go to war over one gate and two different survival rolls. The season is complete at 48 episodes and its manuscript lives outside this repository; what lives here is the machinery underneath it.

**The scenes are executable.** `season-02/*.cassette.json` records the module and configuration each turning point occurs in, `src/sceneRunner.ts` runs them, and `tests/season02.test.ts` asserts the figures the manuscript commits to. A change to a laboratory that would contradict a published chapter fails CI rather than being found by a reader.

| Scene                              | Module  | What the model returns                                                                                                             |
| ---------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2471.031 — a certification refusal | LEX     | `UNGOVERNED`: no instrument in the register reaches who counts as a person, which is why classifying someone out works as a weapon |
| 2471.049 — the first death         | CENSUS  | Twenty thousand deaths outside the roll while the reported rate stays above 99.9%                                                  |
| 2471.099 — seventy-three           | CHRONOS | Effects filed ahead of their causes from clock rates alone; both ledgers record the other as first and neither is lying            |
| 2471.166 — forty-three seconds     | PORTA   | The gate opens with quorum revoked at both ends, all sixty-six get through, and the causal record forks permanently                |

The direction of authority is deliberate and stated in both the runner and the tests: **the manuscript is the specification, and a failing test means a module drifted.**

[PORTA](../concepts/porta-transit-gate-operations.md) exists because of this season — it reproduces every constant the chronology fixes, including the sixty-six through in forty-three seconds, which the story pins from below rather than from above.

Worth recording: the novel and [CHRONOS](../concepts/chronos-simultaneity.md) arrived at the same invariant independently. A temporary quorum assembled from discarded ledgers produces exactly what CHRONOS calls an inadmissible causal record, which is why the official ledger cannot assign the act a cause. Nina's death being filed as _cause unassigned_ is a computed result, not a narrative choice.

### Existing RUIN systems used in Episode 01

- **HELIOS / FIRST LIGHT:** relay blackout, fail-closed collectors, demand spike, deterministic replay, and safety invariants.
- **Collector 07940 / Outer Settlements:** live local inspection, zero-export isolation, and nearby mesh degradation.
- **AGRARIA:** food, oxygen-equivalent exchange, and water recovery as survival loads.
- **DATACORE:** power and thermal admission of compute workloads.
- **MENDER:** repair work performed under delayed command and physical access constraints.
- **MNEMOSYNE:** partial neural evidence, consent limits, memory archives, and refusal to equate copied data with a person.
- **HORIZONS:** long-term population, institutional trust, causal isolation, and the absence of a shared present.

The narrative may simplify user-interface timing, institutional roles, and settlement scale. It must not turn speculative technology into a present-day engineering claim.
