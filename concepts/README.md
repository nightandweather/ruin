# RUIN concept registry

RUIN turns speculative infrastructure into software that can be inspected, failed, and argued about. A concept belongs here when it has an operational purpose, explicit assumptions, measurable state, safety invariants, and a simulation small enough to build.

| Concept | Purpose | Current state | First executable question |
| --- | --- | --- | --- |
| [HELIOS](../README.md) | Operate and repair a 10,000-node Dyson swarm | Interactive simulator | Can safe power delivery survive partitions, heat, and debris? |
| FOUNDRY | Mine, refine, machine, and assemble lunar resources autonomously | Interactive simulator | Which local failure becomes a civilization-wide manufacturing bottleneck? |
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
