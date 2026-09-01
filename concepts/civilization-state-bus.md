# Civilization state bus — one deterministic world, many laboratories

Nineteen-plus modules currently simulate in isolation: FOUNDRY's repair kits never reach MENDER, DATACORE's power draw never loads the HELIOS grid, and HORIZONS approximates cross-system causality with its own private state. The state bus is the architectural step that turns a collection of digital twins into one operable civilization: a versioned, deterministic `CivilizationState` document that every module can read from and write to without importing each other's engines.

## Shape

```jsonc
{
  "format": "ruin-state/1",
  "seed": 1977,
  "tick": 140,
  "ledgers": {
    "power":    { "unit": "MW",   "supply": {...}, "demand": {...} },
    "material": { "unit": "kg",   "stocks": {...}, "orders": [...] },
    "crewDose": { "unit": "mSv",  "perCrew": {...} },          // HYGEIA
    "debris":   { "unit": "count","tracked": 0, "untracked": 0 }, // KESSLER
    "authority":{ "holder": "COUNCIL", "envelope": "bounded" }, // THEMIS
    "archive":  { "survival": 1.0, "countedCopies": 3 }         // RELIQUARY
  },
  "snapshots": { "helios": {...}, "foundry": {...} }
}
```

Modules never call each other. Each exposes `importLedgers(state)` / `exportLedgers(state)` adapters; a campaign runner advances the shared tick and moves ledger deltas between them. Existing engines stay independently testable — the bus is an adapter layer, exactly as the roadmap's unified-campaign-state issue specifies.

## Why it is the next multiplier

- **Cross-system causality becomes real.** Inject a relay blackout in HELIOS, carry the state into DATACORE, and watch the GPU schedule actually collapse — not a narrated consequence but a computed one.
- **Incident cassettes compose.** A cassette already replays one module deterministically; against a shared state document, one cassette can replay a civilization-wide event.
- **HORIZONS gets a foundation.** Its causal map can read real module snapshots instead of maintaining a parallel fiction.
- **Fiction gains a save format.** An episode can pin the exact world-state its scene occurs in.

## Invariants the bus itself must keep

1. **Conservation.** No ledger delta creates power, mass, or dose from nothing; the runner rejects unbalanced exchanges.
2. **Determinism.** Same seed + same cassette timeline → byte-identical state at every tick.
3. **Bounded queues.** Order and event ledgers carry explicit caps; overflow is a visible failure, not silent truncation.
4. **Schema versioning.** `ruin-state/1` documents remain replayable forever; migrations are explicit and tested.
5. **Authority is monotone.** The authority ledger only ever narrows. A module can post a restriction; nothing on the bus can widen one. `assertAuthorityMonotone` rejects any document whose settled envelope is wider than a claim posted into it.

## First slice — implemented

HELIOS ↔ DATACORE over the power ledger only, in `src/civilizationState.ts` (document, validation, conservation, settlement) and `src/powerCampaign.ts` (both adapters plus the campaign runner). HELIOS posts its safe generating capability — `potentialGW`, not the demand-tracking `deliveredGW`, which would hide every surplus — and the civilization's survival demand; DATACORE posts its facility draw; settlement serves survival load first and hands DATACORE the residual, which reaches the engine as `allocatedPowerMW`.

`tests/civilizationState.test.ts` proves the slice: settlement conserves power and rejects forged documents, the pipeline is deterministic end to end, a quiet grid grants DATACORE its full draw, and a relay-blackout-plus-demand-spike cassette arrives at DATACORE as `power-cap` mode with fewer lit tiles and less verified compute — a computed consequence, not a narrated one.

## Second slice — the authority ledger

The power ledger made one module's failure a shortage somewhere else. The authority ledger makes it a _prohibition_ somewhere else, which is the harder and more useful direction.

Four laboratories independently compute a reason the civilization should not be committing irreversible acts, and until this slice each of them only said so on its own page:

| Module     | What it knows                                                      | What it posts                                    |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| WATCHFLOOR | the control room is saturated, or has already lost an intervention | `no-irreversible`, escalating to `advisory-only` |
| VERITAS    | the model is uncertified, or wrong while its residuals stay quiet  | `advisory-only`, escalating to `hold`            |
| CENSUS     | the survival figure is one the ledger refuses to publish           | `no-irreversible`                                |
| CHRONOS    | the causal record invents sequence or inverts cause and effect     | `no-irreversible`, escalating to `hold`          |

`src/authorityBus.ts` holds the adapters; the modules still never import each other. Settlement takes the most restrictive claim and names the module that made it, and THEMIS reads that envelope as a ceiling on a decision it has already reached on its own. `evaluateThemis` takes the envelope as an optional second argument, so a module running alone is unchanged.

The asymmetry is the design. A module can only ever narrow authority, so adding a healthy laboratory to the bus can never buy the executive more room — the modules with standing to restrict are exactly the ones that know something is wrong. `tests/authorityBus.test.ts` asserts it over every subset of the four feeds, and asserts separately that no envelope, at any limit, ever lets THEMIS act where it would not have acted alone.

The THEMIS page carries the four feeds as switches, so the coupling is playable: turn CENSUS to a withheld figure and an irreversible act that was proceeding under a receivable veto pause holds instead, naming CENSUS as the reason.

Open: material, crew-dose, debris, and archive ledgers; HELIOS, FOUNDRY, and HYGEIA adapters onto the authority ledger; and a campaign runner that advances both ledgers together across ticks.
