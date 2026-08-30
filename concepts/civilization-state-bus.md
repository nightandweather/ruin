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

## First slice

HELIOS ↔ DATACORE over the power ledger only: HELIOS exports delivered GW, DATACORE imports it as its admission budget, and one cassette demonstrates a blackout propagating into rejected compute workloads. Two adapters, one runner, one test.
