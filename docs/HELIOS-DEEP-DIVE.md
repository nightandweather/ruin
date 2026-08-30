# HELIOS deep dive — deterministic fault control at 10,000 nodes

HELIOS is the reference implementation for RUIN. It asks one narrow question: can a distributed energy system keep unsafe nodes de-energized while communication, temperature, demand, manufacturing, and orbital hazards change underneath it?

## Control loop

```text
seeded fleet state
  → environment and incident update
  → local node mode classification
  → fail-closed eligibility filter
  → bounded safe-capacity dispatch
  → logistics and recovery
  → immutable checkpoint evidence
```

Every collector is independently represented with health, orbital band and phase, link quality, temperature, capacity, delivered power, operating mode, and fault horizon. The browser draws a sample; the controller updates all 10,000 nodes.

## FIRST LIGHT commissioned scenario

The dashboard's **RUN FIRST LIGHT** control executes the same fixed seed and action ledger twice:

| Control tick | Event                   | Expected control consequence                      |
| -----------: | ----------------------- | ------------------------------------------------- |
|           10 | Relay blackout          | Isolate uncommandable orbital sectors             |
|           24 | Demand spike            | Dispatch only verified safe capacity              |
|           38 | Replacement order       | Move demand through factory and orbital logistics |
|           55 | Thermal wave            | Derate or trip collectors before thermal redline  |
|           82 | Debris corridor at 315° | Curtail export and perform bounded avoidance      |
|          140 | Recovery checkpoint     | Expired incidents clear without erasing evidence  |

Evidence is sampled on the control tick after each command, not at command receipt. The two executions must produce the same FNV-1a trace hash before the UI reports **REPLAY MATCHED**.

## Executable invariants

1. An offline or isolated collector exports exactly zero power.
2. Dispatch never creates negative delivered power.
3. Aggregate delivery never exceeds modeled aggregate potential.
4. Avoidance maneuvers resolve the majority of modeled debris conjunctions.
5. Operational evidence stays inside the controller's 80-event retention bound.

These are behavioral contracts, not comments. `tests/firstLight.test.ts` evaluates every invariant at every campaign checkpoint and rejects replay divergence.

## Grounded kernel

- Solar irradiance begins at `1361 W/m²` at 1 AU and follows an inverse-square approximation.
- Radiative heat balance uses the Stefan–Boltzmann law.
- The controller is deterministic under an explicit seed.
- Uncommandable, thermally unsafe, and failed nodes are removed before dispatch.

Collector dimensions, conversion efficiency, fault duration, repair throughput, and Dyson-scale deployment are scenario assumptions. Orbital motion is a visualization rather than an N-body propagator; debris probability uses angular corridors rather than ephemeris covariance.

## Why this is full-stack systems work

The simulation engine is browser-independent TypeScript. React is an operator surface over explicit state rather than the source of truth. Vitest checks physics budgets, failure behavior, deterministic replay, and safety invariants. GitHub Actions builds and tests every commit, then publishes the same production artifacts as the public demonstration.

The implementation is intentionally small enough to inspect. The next depth milestone is a versioned adapter protocol that lets HELIOS power, FOUNDRY material, AGRARIA survival load, and MENDER repair orders share one replayable campaign ledger without coupling their internal engines.
