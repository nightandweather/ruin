# RUIN // HELIOS

> Mission control for a star-sized distributed system.

RUIN is a speculative civilization-operations laboratory. **HELIOS**, its first module, is a deterministic browser simulation of an autonomous Dyson swarm: 10,000 independent solar collectors operating at 0.4 AU, balancing power demand against communication partitions, thermal limits, and cascading failures.

This is science-fiction software built from real engineering ideas. It is not a claim that a Dyson swarm can be built with present technology.

## The RUIN laboratory

RUIN is a home for executable science-fiction infrastructure. Each concept begins as a sourced engineering brief, defines what must never happen, and grows into a deterministic simulation that lets an operator experience the tradeoffs.

- [Concept registry](concepts/README.md) — current and proposed infrastructure modules.
- [Orbital elevator](concepts/orbital-elevator.md) — factory queues, climbers, tether safety, and orbital depots.
- [Lunar mass driver](concepts/mass-driver.md) — electromagnetic cargo launch with fail-closed corridor authorization.
- [Transit Gate](concepts/transit-gate.md) — quantum-state transfer, speculative wormholes, and exactly-once identity reconstruction.
- [Stellar survey](concepts/stellar-survey.md) — source-backed ranking of nearby systems for an industrial swarm bootstrap.
- [Fleet operations](concepts/fleet-operations.md) — convoy protection, rescue, logistics, and damage control under delayed command.
- [Technology tree](concepts/technology-tree.md) — a tested path from autonomous foothold to system-scale and speculative infrastructure.
- [Concept template](concepts/template.md) — a repeatable path from a wild idea to testable software.

HELIOS is the first executable module rather than the limit of the repository.

## Run it

```bash
npm install
npm run dev
```

Open the displayed local URL. `/` runs HELIOS, `/foundry.html` runs the autonomous lunar factory, and `/collector.html` opens the C-01 parametric machine designer. The simulations begin immediately.

- **HELIOS** — inject a relay blackout, thermal wave, manufacturing cascade, demand spike, or directional debris corridor and watch the controller redistribute safe capacity.
- **FOUNDRY** — order repair kits and watch robotic excavation, grading, molten-regolith refining, machining, and assembly propagate material and bottlenecks through the factory.
- **COLLECTOR** — resize a seed collector's wings, radiators, shielding, propellant, and orbit while power, heat, mass, geometry, and factory burden update together.

```bash
npm test
npm run build
```

## What is simulated

- 10,000 individually modeled collectors across eight orbital bands.
- Seeded pseudo-random initial conditions and fault selection for reproducible runs.
- Per-node health, link quality, thermal state, capacity, delivery, and operating mode.
- Safe dispatch under demand changes, thermal derating, offline nodes, and network partitions.
- Recovery windows and a bounded event stream.
- Directional debris conjunctions, pre-impact power derating, avoidance burns, and residual impacts.
- Surface factory orders, replacement production, orbital-elevator cargo cycles, orbital inventory, and automatic installation.
- A second executable FOUNDRY module with autonomous excavation, beneficiation, refining, trace-metal inventory, machine tooling, assembly, wear, and cascading production faults.
- Reweightable nearby-star scoring with explicit catalog sources and uncertainty notes.
- A non-weaponized fleet-survival core for debris, thermal, contact, and communications incidents.
- A parametric C-01 collector digital twin with a live schematic, thermal articulation, fail-closed beam control, and a FOUNDRY material bill.
- Downloadable JSON snapshots for later replay or analysis.

The browser draws a representative orbital sample but the controller updates all 10,000 nodes every tick.

## Physical assumptions

HELIOS separates sourced physical constants from invented system parameters:

- Solar irradiance starts at `1361 W/m²` at 1 AU and follows an inverse-square approximation. NASA reports approximately this value for total solar irradiance near Earth.
- Waste heat uses a simplified radiative-equilibrium calculation based on the Stefan–Boltzmann law.
- Collector area, 42% conversion efficiency, radiator area, temperature limits, fault rates, repair times, beam delivery, and control policy are speculative scenario parameters.
- Orbital positions are visualized, not propagated with an N-body integrator. Collisions, station keeping, diffraction, transmission losses, material degradation, and signal travel time are future model layers.
- Debris corridors use angular proximity in the visualization plane rather than a high-fidelity ephemeris and covariance model. The detect–assess–mitigate workflow is inspired by real conjunction assessment, while its outcomes are speculative.
- The space elevator is a logistics state machine, not a structural dynamics model. Factory throughput, batch size, transit time, and installation rate are deliberately accelerated scenario parameters.

Sources:

- [NASA GSFC: Radiative Transfer](https://science.gsfc.nasa.gov/earth/climate/researchareas/159/)
- [NASA Passive Thermal Control Engineering Guidebook](https://ntrs.nasa.gov/citations/20230013900)
- [NASA: Conjunction Assessment and Collision Avoidance](https://www.nasa.gov/cara/)
- [NASA NTRS: Technology Development and Demonstration Concepts for the Space Elevator](https://ntrs.nasa.gov/citations/20040161582)
- [NASA: Lunar Surface Technology and ISRU](https://www.nasa.gov/lunar-surface-technology/)
- [NASA NTRS: System Modeling of a Lunar Molten Regolith Electrolysis Plant](https://ntrs.nasa.gov/citations/20240012420)
- [NASA NTRS: Manufacturing and Metal Extraction Lunar Technology](https://ntrs.nasa.gov/citations/20230009049)
- [Freeman Dyson, “Search for Artificial Stellar Sources of Infrared Radiation” (1960)](https://doi.org/10.1126/science.131.3414.1667)

## Architecture

```text
seed + configuration
        ↓
10,000 collector digital twins
        ↓
fault and environment scenarios
        ↓
safety filter → capacity dispatcher
        ↓
snapshot + event log + control dashboard

damage report → factory order → GEO climber → orbital depot → replacement
```

The simulation engine in `src/simulation.ts` has no browser dependency. That keeps deterministic scenarios testable and leaves room for a future CLI, server, or distributed implementation.

## Next missions

- Event replay and scenario files.
- Signal propagation delay and local consensus between orbital sectors.
- Ephemeris and covariance-based conjunction probability instead of the current angular corridor model.
- Power-beam destinations, exclusion corridors, and transmission loss.
- Elevator tether health, climber energy budgets, launch windows, and debris avoidance.
- Infrared waste-heat signature and observability from distant systems.
- A campaign mode in which the swarm grows from hundreds to billions of collectors.

## Beyond Kardashev II

HELIOS begins with the operating problems of a civilization using a meaningful fraction of one star. The next scales are less about finding more energy and more about governing systems that can no longer share a present moment.

| Scale | Operational problem | Candidate simulation |
| --- | --- | --- |
| Planetary | Climate, orbital debris, and globally coupled infrastructure | Multi-objective planetary control with hard safety limits |
| Stellar | Heat rejection, beam safety, solar weather, and swarm autonomy | The current HELIOS mission |
| Interstellar | Years of communication delay and colonies with diverging goals | Policy replication without a global leader |
| Galactic | Stellar lifecycles, relativistic travel, and million-year plans | Eventually consistent governance across causal horizons |
| Post-galactic | Entropy budgets, black-hole energy, and survival across cosmological change | Deep-time resource allocation with irreversible decisions |

These are storytelling frames, not settled extensions to the Kardashev scale. Each future module should turn one frame into explicit state, constraints, failure modes, and testable policies.

## License

MIT
