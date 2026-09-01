# RUIN

> **Executable science fiction.** Thirty deterministic simulations of infrastructure that does not exist yet — and of the ways such infrastructure fails without anyone noticing.

[![CI](https://github.com/nightandweather/ruin/actions/workflows/ci.yml/badge.svg)](https://github.com/nightandweather/ruin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-60c5ba.svg)](CONTRIBUTING.md)
[![Live demo](https://img.shields.io/badge/live-demo-ffb456.svg)](https://nightandweather.github.io/ruin/)

---

## A civilization reports 99.97% survival. The real rate is 94.98%. Nobody lied.

**[Open CENSUS and see for yourself →](https://nightandweather.github.io/ruin/census.html)**

A survival rate is a fraction, and its denominator is a definition of who counts as a person. Change the definition and the headline moves without a single life improving. CENSUS ships six cohorts and a life-support budget that does not cover them; its default policy serves the counted population first, so the people on the roll never experience the shortage at all. Twenty thousand deaths never enter a report.

Count everyone instead and the headline falls to **96.37%** — while 5,648 more people are alive. The honest number is worse, and it is the only one the model will publish. Switch off the dual ledger and it publishes nothing at all: [the same run with disclosure disabled](https://nightandweather.github.io/ruin/census.html?disclose=off) returns `PUBLICATION WITHHELD`, refused by the model rather than flagged for an operator to overrule at three in the morning.

Two more, each one link away — these are the running models, not screenshots of them.

### A verification audit that fails this repository's own models

**[Open VERITAS](https://nightandweather.github.io/ruin/veritas.html)**

VERITAS measures the years between a model becoming wrong enough to invalidate decisions and anyone being able to say so. Run against RUIN's own portfolio, rated by the sourced fraction its [engineering notes](docs/ENGINEERING-NOTES.md) declare, it does not spare the repository that contains it:

| Model                                                                                              | Sourced | Silent window |
| -------------------------------------------------------------------------------------------------- | ------- | ------------- |
| [HELIOS thermal derate](https://nightandweather.github.io/ruin/veritas.html?model=helios-thermal)  | 80%     | none          |
| [ODYSSEY link budget](https://nightandweather.github.io/ruin/veritas.html?model=odyssey-beam)      | 65%     | none          |
| [AGRARIA crop yield](https://nightandweather.github.io/ruin/veritas.html?model=agraria-yield)      | 50%     | none          |
| [KESSLER cascade](https://nightandweather.github.io/ruin/veritas.html?model=kessler-cascade)       | 35%     | 12 years      |
| [MNEMOSYNE evidence](https://nightandweather.github.io/ruin/veritas.html?model=mnemosyne-identity) | 15%     | 11 years      |
| [IGNIS fusion branch](https://nightandweather.github.io/ruin/veritas.html?model=ignis-fusion)      | 5%      | 4 years       |

Three of this repository's modules open a window in which their own certificate says nothing is wrong while the answer is already unusable.

### A watch that loses interventions with nothing on the board looking wrong

**[Open WATCHFLOOR on the cry-wolf watch](https://nightandweather.github.io/ruin/watchfloor.html?incident=cry-wolf)**

Every fault-response plan in this repository ends with _the operator decides_. WATCHFLOOR prices that step. On the cry-wolf watch the queue peaks at 17 against a cap of 40, authority is never withdrawn, and every display stays calm — while 1.43 real critical alarms are written off as spurious by a crew that has learned not to believe them.

---

## What this is

Thirty browser laboratories, each a deterministic model of one piece of infrastructure that does not exist yet. **HELIOS**, the first, operates an autonomous Dyson swarm: 10,000 independent solar collectors at 0.4 AU balancing power demand against communication partitions, thermal limits, and cascading failures. Twenty-nine have grown around it — factories, habitats, propulsion, archives, law, and governance, plus the handful that model the people and the paperwork, where the quiet failures actually live.

Every module declares what must never happen and enforces it in the model rather than warning about it. Every module separates the physics it sources from the parameters it invents, and [one of them audits the rest](https://nightandweather.github.io/ruin/veritas.html) — including itself. Reading down [the list of what fiction assumes and what the models return](docs/WHAT-FICTION-ASSUMES.md), the same failure appears in twelve costumes: **the instrument says everything is fine.**

This is science fiction built from real engineering ideas. It is not a claim that any of it can be built.

> I build mission-critical operational systems in domains where silent failure is unacceptable—first in radiotherapy, then as an open simulation laboratory for autonomous space infrastructure.

**[Open the laboratory](https://nightandweather.github.io/ruin/)** · [What fiction assumes](docs/WHAT-FICTION-ASSUMES.md) · [The HELIOS deep dive](docs/HELIOS-DEEP-DIVE.md) · In [HELIOS](https://nightandweather.github.io/ruin/helios.html), choose **RUN FIRST LIGHT** to execute and replay the commissioned failure campaign.

[![Watch the 72-second RUIN // HELIOS walkthrough](docs/assets/helios-first-light.png)](https://nightandweather.github.io/ruin/ruin-first-light-72s.mp4)

**[Watch the 72-second walkthrough](https://nightandweather.github.io/ruin/ruin-first-light-72s.mp4)** · [Read the portfolio brief and 100-word application answer](docs/PORTFOLIO.md)

## Civilization-operations interface

[![RUIN civilization-operations HUD](docs/assets/ruin-hud-nominal.png)](https://nightandweather.github.io/ruin/helios.html)

The main situation room follows a deliberately restrained visual language: **NASA mission control × nuclear-submarine CIC × a forgotten civilization's oracle machine**. The star system dominates the screen; civilization vitals and event provenance sit at its edges; and a causal horizon shows how present power and communication failures can change population and institutional trust over 1, 10, and 50 years. Teal is reserved for verified state, amber for uncertainty, and red for irreversible outcomes. See the [HUD art direction and signal semantics](docs/HUD-DESIGN.md).

The orbital map is inspectable rather than decorative. Click a sampled collector or one of the labeled civilization sites to open its live local-system record: control mode, health, link and thermal margins, delivered power, nearby operating-state composition, six authenticated neighbors, active system hazards, and the current autonomy recommendation. Neighbor controls move through the mesh without leaving the situation room.

[![Live collector and neighborhood inspection](docs/assets/ruin-satellite-inspection.png)](https://nightandweather.github.io/ruin/helios.html)

This is science-fiction software built from real engineering ideas. It is not a claim that a Dyson swarm can be built with present technology.

The [session origin note](docs/SESSION-2026-08-30.md) records how the project grew from a developer-learning idea into executable civilization infrastructure. The [engineering notes](docs/ENGINEERING-NOTES.md) separate grounded kernels, scenario assumptions, and next validation work for every executable module.

## Fiction prototype

RUIN is also being tested as a human-scale science-fiction narrative. **Season 01 — 99.97%의 구원** follows a junior simulation verifier who discovers that a perfect civilization-survival report was produced by changing who counts as a person. The fiction uses executable laboratory incidents as causal machinery while keeping unresolved questions—simulation consciousness, recurring identity, and RUIN's creator—open.

Every episode ships an **incident cassette** — a deterministic replay file reproducing the operational event the chapter describes. Load `episode-01.cassette.json` from the HELIOS footer and fly the incident yourself: same seed, same commands, same result the characters verify on the page. The episode's central mechanism is executable too — **CENSUS** reproduces the 99.97% figure from its default configuration and refuses to publish it once the divergence is disclosed.

**[Read Episode 01 — 제외된 사람들](fiction/season-01/episode-01.md)** (Korean) · [Narrative continuity and status](fiction/README.md) (English) · [the episode's cassette](fiction/season-01/episode-01.cassette.json)

## The RUIN laboratory

RUIN is a home for executable science-fiction infrastructure. Each concept begins as a sourced engineering brief, defines what must never happen, and grows into a deterministic simulation that lets an operator experience the tradeoffs.

- [Concept registry](concepts/README.md) — current and proposed infrastructure modules.
- [Orbital elevator](concepts/orbital-elevator.md) — factory queues, climbers, tether safety, and orbital depots.
- [Lunar mass driver](concepts/mass-driver.md) — electromagnetic cargo launch with fail-closed corridor authorization.
- [Transit Gate](concepts/transit-gate.md) — quantum-state transfer, speculative wormholes, and exactly-once identity reconstruction.
- [Stellar survey](concepts/stellar-survey.md) — source-backed ranking of nearby systems for an industrial swarm bootstrap.
- [Fleet operations](concepts/fleet-operations.md) — convoy protection, rescue, logistics, and damage control under delayed command.
- [Technology tree](concepts/technology-tree.md) — a tested path from autonomous foothold to system-scale and speculative infrastructure.
- [Personhood accounting](concepts/census-personhood-accounting.md) — the definition a survival rate is divided by, and what a restated baseline hides.
- [Operator loading](concepts/watchfloor-operator-loading.md) — alarm flooding, handover context loss, and the crew every safety plan assumes.
- [Model divergence](concepts/veritas-model-divergence.md) — drift, envelope exits, and certificates that outlive their evidence.
- [Councils and budgets](concepts/concilium-councils-and-budgets.md) — what each system costs, which worlds can hold it, and how seats are drawn.
- [Space law](concepts/lex-space-law.md) — which instruments bind an act, which can still be enforced, and why the gap is not a permission.
- [Simultaneity](concepts/chronos-simultaneity.md) — causal order, command freshness, and the radius inside which a shared present exists.
- [Gravitational catapult](concepts/funda-gravitational-catapult.md) — cargo moved on borrowed orbital momentum, and the corridor nobody can see in time.
- [Concept template](concepts/template.md) — a repeatable path from a wild idea to testable software.

HELIOS is the first executable module rather than the limit of the repository.

## Run it

```bash
npm install
npm run dev
```

Open the displayed local URL. `/` is the gateway — three findings and the whole roster on shelves — and every laboratory carries a module bar reaching all the others. If you are looking for somewhere to start contributing, [there is a list](#contributing).

```bash
npm test
npm run build
```

`npm test` includes two structural gates. `tests/determinism.test.ts` replays every module twice and compares both the result and its hash, and its registry must name every module — a new laboratory cannot land without a replayable run. `tests/signalEncoding.test.ts` derives the list of state selectors from the stylesheets themselves, so a state expressed in colour alone fails CI the moment it is written.

## The executable modules

A laboratory's opening state can be named in the query string — `census.html?policy=uniform`, `veritas.html?model=ignis-fusion`, `watchfloor.html?incident=cry-wolf` — so a link can point at a specific claim rather than at a control panel. An unknown value falls back to the module's own default.

- **HELIOS** — inject a relay blackout, thermal wave, manufacturing cascade, demand spike, or directional debris corridor and watch the controller redistribute safe capacity.
- **CONCORD** — replay any incident cassette through the civilization state bus and watch the power ledger settle survival-first, down to the compute tiles that go dark to pay for the shortfall.
- **FOUNDRY** — order repair kits and watch robotic excavation, grading, molten-regolith refining, machining, and assembly propagate material and bottlenecks through the factory.
- **COLLECTOR** — resize a seed collector's wings, radiators, shielding, propellant, and orbit while power, heat, mass, geometry, and factory burden update together.
- **DATACORE** — schedule verified GPU workloads against collector power, radiator capacity, radiation scrubbing, and optical-link availability.
- **AGRARIA** — tune crop area, light, carbon, water, nutrients, and crop strategy while food, oxygen support, and power demand update together.
- **AEGIS** — design a mission-specific pressure suit and expose its mass, mobility, life-support, thermal, dust, and emergency-return tradeoffs.
- **HYGEIA** — manage crew radiation exposure across storm shelters, hull shielding, EVA recall timing, and a fail-closed career-dose allowance that refuses over-limit assignments outright.
- **PROGENITOR** — grow a robotic industrial seed while production closure, imported controllers, metrology, lineage drift, and a human-set replication ceiling remain explicit.
- **GRAVITAS** — trade rotating-habitat radius, RPM, gravity level, Coriolis effects, deck gradient, structure, spin energy, and angular-momentum cancellation.
- **ATLAS** — rotate and filter a heliocentric 3D map of 30 curated real stars, inspect catalog coordinates and planet counts, and expose interstellar communication and hypothetical cruise latency.
- **NAVIS** — couple spacecraft mass, propulsion, power, waste heat, radiator area, communications, autonomy, and ATLAS route distance while exposing model maturity and no-go boundaries.
- **IGNIS** — design chemical, Hall-electric, nuclear-thermal, and explicitly unsupported fusion engines while thrust, specific impulse, power, mass flow, propellant, heat rejection, transient heat storage, cluster failures, and burn authorization remain coupled.
- **ODYSSEY** — fly between curated ATLAS stars while HELIOS and deep relays beam power and navigation references through diffraction, pointing error, receiver capture, light-time, thermal, autonomy, and relay-outage constraints.
- **MENDER** — configure orbital and surface repair robots while reaction torque, anchoring, reach, payload, tools, energy, heat rejection, and delayed-command autonomy remain coupled.
- **CORVUS** — design autonomous civilian space-drone swarms whose propulsion, solar power, battery survival, heat rejection, crosslinks, relative separation, quorum, and delayed-command autonomy remain coupled.
- **KESSLER** — run fifty years of debris population dynamics in a dragless band where the cascade feeds on itself, removal is the only sink, and a fail-closed moratorium halts installation past the density cap.
- **PROMETHEUS** — connect fission heat, power conversion, survival and factory loads, radiation separation, radiators, and low-thrust nuclear-electric propulsion without reactor-construction or weapon detail.
- **GENESIS** — run a century-scale seed campaign from first resource survey through certified factory replication, stellar-power independence, habitation, and local self-sufficiency.
- **MNEMOSYNE** — test structural, synaptic, dynamic, glial, molecular, memory, behavioral, embodiment, consent, and fork evidence without claiming that a mind or consciousness has been transferred.
- **THEMIS** — operate the autonomous civilization executive: light-lag against decision windows, evidence floors by action class, physically receivable veto pauses, and irreversible actions that never execute unproven.
- **SENTINEL** — inspect 63 failure-response plans across every executable module, from early indicators and deterministic safing to fallback operation, human decisions, recovery evidence, and non-negotiable safety invariants.
- **WATCHFLOOR** — price the step every fault-response plan leaves free: run one watch minute by minute while alarms burst, attention decays, handover destroys context, and a crew that stopped believing the alarms writes off a real one.
- **VERITAS** — audit the laboratory's own models for the years between becoming wrong and anyone being able to say so, and watch its least-grounded modules fail their own truth audit.
- **CENSUS** — settle the ledger every survival metric is divided by: change who counts as a person and watch a 99.97% survival report appear without a single life improving.
- **CHRONOS** — record a civilization's events when no two sites share a present: watch order-by-receipt invent 124 sequences the universe does not have, and order-by-local-clock file effects ahead of their causes.
- **LEX** — read RUIN's own activities against the Outer Space Treaty, the Liability Convention, the Moon Agreement, and the national statutes that contradict them, and watch the flagship come out prima facie unlawful under Article II.
- **CONCILIUM** — price every RUIN system in terawatt-years, give seven worlds different economies, and watch the same proposal carry at 95% by revenue and fail at 0% by population.
- **RELIQUARY** — steward a century archive against media decay, format death, and institutional forgetting, where a backup never restored in rehearsal counts as zero copies.
- **HORIZONS** — operate fourteen connected post-stellar systems—WORMWAY, CHRONOS, STELLAR FORGE, ARK, EXODUS, ORACLE, DARKLIGHT, MNEMOSYNE, TERRAFORM, WORLD ENGINE, NECROPOLIS, FIRST CONTACT, MATRIOSHKA BRAIN, and SEED—on one causal map. Inject a failure, inspect its dependency blast radius, execute evidence-gated recovery, choose a civilization priority, and resolve the consequences across 10, 50, and 100 years.

## What is simulated

- 10,000 individually modeled collectors across eight orbital bands.
- A commissioned FIRST LIGHT incident sequence with checkpoint evidence, five executable safety invariants, and a second-run deterministic replay hash.
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
- A radiation-aware orbital GPU fabric with replicated results, thermal and power admission control, optical data locality, and space-native job queues.
- A bioregenerative crop-deck model linking food, oxygen-equivalent exchange, recovered water, nutrient makeup, quarantine, and collector power.
- A parametric EVA suit digital twin spanning orbit, lunar industry, Mars field work, and rescue, with coupled PLSS, mobility, mass, dust, and fault-response constraints.
- A guided robotic self-production model with a physically zoned factory layout, partial production closure, certified lineage, import bottlenecks, and fail-closed offspring quarantine.
- A physics-grounded artificial-gravity architect for rings, tether pairs, and short-arm centrifuges, with an explicit no-go boundary for unsupported gravity-field generators.
- A real-coordinate nearby-star atlas that converts ICRS right ascension, declination, and distance into heliocentric XYZ positions while keeping curated coverage distinct from the full Gaia catalog.
- A mission-configurable spacecraft architect using the ideal rocket equation, thrust-derived acceleration and burn time, radiative heat rejection, distance-squared link scoring, light-time, and explicit propulsion maturity.
- A propulsion engine laboratory coupling equivalent exhaust velocity, mass flow, power-limited electric thrust, cluster engine-out behavior, transient heat storage, radiator capacity, propellant endurance, and evidence-based ignition authority.
- A Dyson-powered interstellar corridor linking real nearby-star distances to optical diffraction, pointing jitter, relay light-time, receiver capture, electric thrust, heat rejection, navigation uncertainty, and stored-energy survival.
- A task-grounded robotic repair architect with two-point contact, reaction-moment stability, seven-DOF servicing arms, tool and payload contracts, battery endurance, recharge, heat rejection, and signal-delay autonomy.
- An autonomous civilian drone-swarm architect coupling per-node mass, delta-v, solar power, battery hold, and heat rejection to formation spacing, crosslink range, distributed quorum, collision reserve, and light-time autonomy.
- A civilian fission and NEP architect coupling thermal power, conversion, electrical loads, radiators, radiation separation, propellant, thrust, and degraded safe states.
- A cross-module stellar bootstrap campaign linking PROMETHEUS, CORVUS, FOUNDRY, PROGENITOR, HELIOS, AGRARIA, and GRAVITAS into evidence-gated milestones.
- A minute-resolved control-room model coupling bursty alarm arrivals, fatigue, task saturation, handover context loss, and cry-wolf response decay to two distinct ways of losing a critical alarm — buried by volume, or written off as spurious.
- A verification audit of RUIN's own model portfolio, separating the error the world holds from the error any observation programme can report, and measuring the silent window between them.
- A personhood ledger in which the reported survival rate, the prior definition's rate, and the actual rate are computed side by side, and publication is refused when they diverge.
- A neural identity-evidence laboratory that refuses to equate a connectome, behavioral imitation, or copied memory with demonstrated continuity and treats every fork as independent personhood.
- A cross-system FDIR registry covering 21 executable modules with 63 detected, isolated, safed, fallback-capable, evidence-gated recovery plans and explicit dependency blast radius.
- A deterministic post-stellar causal network linking fourteen speculative systems through explicit resources, dependencies, catastrophic failures, safety invariants, recovery policies, and century-scale civilization projections.
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

| Scale         | Operational problem                                                         | Candidate simulation                                      |
| ------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Planetary     | Climate, orbital debris, and globally coupled infrastructure                | Multi-objective planetary control with hard safety limits |
| Stellar       | Heat rejection, beam safety, solar weather, and swarm autonomy              | The current HELIOS mission                                |
| Interstellar  | Years of communication delay and colonies with diverging goals              | Policy replication without a global leader                |
| Galactic      | Stellar lifecycles, relativistic travel, and million-year plans             | Eventually consistent governance across causal horizons   |
| Post-galactic | Entropy budgets, black-hole energy, and survival across cosmological change | Deep-time resource allocation with irreversible decisions |

These are storytelling frames, not settled extensions to the Kardashev scale. Each future module should turn one frame into explicit state, constraints, failure modes, and testable policies.

## Help design what comes after Kardashev

**카르다쇼프 척도 다음 단계로 가기 위한 아이디어를 모집합니다.**

RUIN is looking for strange, serious questions about civilizations that do not exist yet. Propose an orbital machine, interstellar institution, deep-time failure, impossible transport system, post-biological habitat, or an entirely new category we have not imagined.

A strong proposal does not need to know how to build the technology. It only needs to give us something that can become executable:

- What is the system trying to accomplish?
- What resources, energy, information, and prior technologies does it require?
- What must never happen?
- How does it fail when communication is late or nobody is in charge?
- Which assumptions come from observed science, and which are deliberately speculative?
- What would an operator be able to change and observe in a simulation?

[Open an idea proposal](https://github.com/nightandweather/ruin/issues/new) or use the [concept template](concepts/template.md). Wild ideas are welcome; falsifiable assumptions, safety invariants, and interesting failure modes make them buildable.

## Contributing

RUIN is public, MIT-licensed open source. If you want somewhere concrete to start, these are real, scoped, and already specified:

- **Build FUNDA.** [The concept brief](concepts/funda-gravitational-catapult.md) is finished — state model, safety invariants, five failure scenarios, and the smallest useful simulation — and nothing implements it. A gravitational catapult where the delta-v is free and the scarce resources are timing, geometry, and responsibility for where an aimed mass ends up.
- **Ground one module's constants.** [IGNIS and NAVIS](src/ignis.ts) now tag every propulsion row `sourced`, `derived`, or `scenario` and cite the article behind it, and `tests/grounding.test.ts` checks the cited rows are internally consistent. Five modules still carry hand-entered ratings — HELIOS thermal, ODYSSEY link, AGRARIA yield, KESSLER coefficients, MNEMOSYNE thresholds. Each is an afternoon, and each one makes [VERITAS](https://nightandweather.github.io/ruin/veritas.html) honest about one more of its own models.
- **Add an instrument to LEX.** The [register](src/lex.ts) holds six real instruments with their provisions quoted. The Registration Convention, the IADC debris guidelines, ITU spectrum coordination, and COSPAR planetary protection are missing. One treaty per pull request.
- **Argue with a reading.** LEX's mapping of activities onto instruments is a reading, and a lawyer would dispute it. So would an astrodynamicist with the propulsion table. Disputes belong in issues, with a source.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, modeling rules, module structure, and safety boundaries; use [GitHub Discussions](https://github.com/nightandweather/ruin/discussions) for early ideas and the [issue forms](https://github.com/nightandweather/ruin/issues/new/choose) for scoped work.

Community participation follows the [code of conduct](CODE_OF_CONDUCT.md). Potential vulnerabilities should be reported privately according to [SECURITY.md](SECURITY.md).

## License

MIT
