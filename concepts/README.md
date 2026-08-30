# RUIN concept registry

RUIN turns speculative infrastructure into software that can be inspected, failed, and argued about. A concept belongs here when it has an operational purpose, explicit assumptions, measurable state, safety invariants, and a simulation small enough to build.

| Concept | Purpose | Current state | First executable question |
| --- | --- | --- | --- |
| [HELIOS](../README.md) | Operate and repair a 10,000-node Dyson swarm | Interactive simulator | Can safe power delivery survive partitions, heat, and debris? |
| [C-01 Seed Collector](seed-collector.md) | Design the machine represented by one HELIOS node | Interactive parametric simulator | Which geometry maximizes safe power without making replication impossible? |
| [DC-01 Orbital Datacore](orbital-datacore.md) | Turn collector power and space-native data into verified computation | Interactive simulator | Can useful compute survive heat, radiation errors, power caps, and link loss? |
| [AG-01 Orbital Agraria](orbital-agraria.md) | Convert power and recycled habitat streams into food and life support | Interactive simulator | Which crop and resource policy maximizes edible output without hiding biological risk? |
| FOUNDRY | Mine, refine, machine, and assemble lunar resources autonomously | Interactive simulator | Which local failure becomes a civilization-wide manufacturing bottleneck? |
| [Stellar survey](stellar-survey.md) | Rank real nearby systems for a swarm bootstrap | Deterministic scoring model | Which target wins when proximity, stability, energy, and materials conflict? |
| [Fleet operations](fleet-operations.md) | Protect civilian and industrial convoys under delayed command | Tested simulation core | Can escorts fail closed and prioritize rescue without real-time orders? |
| [Technology tree](technology-tree.md) | Connect energy, industry, mobility, communications, survival, and logistics | Tested dependency graph | Which missing capability blocks the next civilization horizon? |
| [Orbital elevator](orbital-elevator.md) | Move manufactured cargo from a surface factory to an orbital depot | Logistics model inside HELIOS | What happens when production outruns climber capacity? |
| [Lunar mass driver](mass-driver.md) | Launch non-living bulk cargo from the Moon to an orbital catcher | Design brief | Can a launch be fail-closed when timing or catcher confidence degrades? |
| [Transit Gate](transit-gate.md) | Move quantum state, matter, or reconstructed identity under distinct rules | Design brief | How can two endpoints prove that transit completed exactly once? |

## Graduation rule

A concept begins as one document using [the concept template](template.md). It becomes an executable RUIN module after it has:

1. A deterministic state model.
2. At least three failure scenarios.
3. Safety invariants that tests can assert.
4. A visible decision or tradeoff for the operator.
5. A clear boundary between sourced physics and invented parameters.

Only split a module into its own repository when it has an independent audience, release cycle, and test suite.
