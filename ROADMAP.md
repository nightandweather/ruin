# RUIN development roadmap

The near-term goal is to turn a collection of strong digital twins into one playable, inspectable civilization supply chain. GitHub issues are the execution backlog; this file explains why they are ordered this way.

## Release 0.2 — connect the machines

### P0 · [LUMEN beamed-power network](https://github.com/nightandweather/ruin/issues/1)

HELIOS currently ends at safe aggregate delivery. LUMEN should create explicit sources, relay apertures, exclusion corridors, storage, receivers, transmission loss, pointing confidence, and customer contracts for FOUNDRY, DATACORE, AGRARIA, habitats, and propulsion.

First executable question: **who loses power when generation exists but geometry, heat, pointing confidence, or a relay fails?**

Definition of done:

- Deterministic source → relay → receiver dispatch graph.
- Distance, aperture, conversion loss, receiver thermal limit, and storage state.
- Fail-closed beam authorization and exclusion corridors.
- At least four incidents: pointing uncertainty, relay loss, receiver overheat, and demand surge.
- Importable power contracts for existing modules.

### P0 · [unified campaign state](https://github.com/nightandweather/ruin/issues/3)

Create a versioned scenario file and shared tick contract. Existing engines remain independently testable, but a campaign runner can exchange power, material, food, compute, crew exposure, and repair orders.

Foundation delivered: the FIRST LIGHT commissioned HELIOS scenario now provides a fixed action ledger, control-tick checkpoints, executable invariants, and replay-hash verification — and the incident-cassette format (`ruin-cassette/1`, `src/cassette.ts`) now makes any HELIOS session an exportable, hand-editable, deterministic replay. The [civilization state bus](concepts/civilization-state-bus.md) now has its first executable slice: the `ruin-state/1` document with a settling, conservation-checked power ledger (`src/civilizationState.ts`), HELIOS and DATACORE adapters, and a cassette-driven campaign runner (`src/powerCampaign.ts`) under which a relay blackout demonstrably load-sheds compute. Further ledgers (material, crew dose, debris, authority, archive) and adapters remain open.

First executable question: **can one local failure become a legible cross-system shortage without creating an untestable monolith?**

Definition of done:

- Versioned JSON scenario and snapshot schemas.
- Explicit units and bounded message/event queues.
- Adapter layer rather than direct imports between every engine.
- Replay of the same seed produces the same cross-module outcome.
- A campaign dashboard identifies the first causal bottleneck.

### P1 · [ASCENT orbital logistics](https://github.com/nightandweather/ruin/issues/2)

Promote the elevator state machine from HELIOS into a full transport module and add non-living bulk-cargo mass-driver routes. Model manifests, transfer windows, catcher confidence, depot capacity, and rescue/recovery paths.

Definition of done:

- Surface order → certified manifest → transit → orbital custody state machine.
- Elevator weather/tether/traffic constraints and mass-driver launch windows.
- No launch without a validated corridor and receiver confidence.
- FOUNDRY output and C-01 replacement demand use the same cargo ledger.

### P1 · [WAYSTATION orbital port](https://github.com/nightandweather/ruin/issues/6)

Turn the handoff between ASCENT logistics and a future civilian fleet into an executable port: traffic corridors, compatible berths, propellant and power service, radiator capacity, cargo quarantine, repair cells, emergency tugs, and departure windows.

First executable question: **which vessel misses a safe departure window when every shared service has a different queue and failure state?**

## Release 0.3 — sustain people and industry

### P1 · PROSPECT resource geography

Replace generic material income with surveyed deposits, uncertainty, extraction energy, beneficiation yield, tool wear, tailings, and provenance. Rare materials should become a planning constraint rather than a magical inventory counter.

### P1 · ARK closed-loop habitat

Connect crew health, atmosphere, water, waste, shielding, AGRARIA output, DATACORE support, and AEGIS excursions. The model should reveal which loops can recover and which failures silently compound.

### P2 · WATCHTOWER environment and navigation

Add solar-weather forecasts, ephemeris uncertainty, conjunction covariance, navigation beacons, communications delay, and observation confidence. Other modules consume forecasts rather than omniscient truth.

## Release 0.4 — build and move a civilization

### P2 · NAVIS shipyard and civilian fleet

Connect material bills, assembly berths, propulsion energy, radiators, spares, cargo, rescue capacity, and delayed fleet command. Start with tugs, survey craft, habitat transports, and repair vessels—not weapon systems.

### P2 · replication economy

Model which machines can reproduce which components, the bootstrapping gap for electronics and precision tooling, quality drift across generations, and the governance of design updates.

### P3 · stellar campaign

Use the real-star survey as the map for probes and settlements. Add multi-year signal delay, divergent local policies, data reconciliation, and settlements that cannot wait for Earth to approve every action.

## Delivered alongside — the human and epistemic layer

Three laboratories now sit underneath the physical ones. They were built out of order because RUIN's stated subject is silent failure, and none of the modules that preceded them could produce one: every fault-response plan assumed an operator who decides, every model assumed a model that still describes the world, and every survival figure assumed a settled definition of who is counted.

- **WATCHFLOOR** prices the operator step SENTINEL leaves free — alarm flooding, attention saturation, handover context loss, and criticals lost either by volume or by a crew that stopped believing the alarms. Its invariant withdraws irreversible authority from a saturated floor.
- **VERITAS** audits the laboratory's own models for the years between becoming wrong and anyone being able to say so. Run against this repository's portfolio it fails the repository's own least-grounded modules, which is the result it was built to be able to produce.
- **CENSUS** settles the ledger every survival metric is divided by, and refuses to publish a headline that diverges from the actual rate without its prior-definition ledger. It reproduces the Season 01 figure from its default configuration.

CHRONOS joined them: simultaneity, causal order, and command freshness, where order-by-receipt invents 124 sequences the universe does not have and a shared present at one-minute tolerance covers the Moon and nothing else.

**These are no longer isolated.** The state bus gained an authority ledger, and all four now post restrictions that THEMIS reads as a ceiling — a saturated floor, an uncertified model, a withheld survival figure, and an inadmissible causal record each stop the executive from acting, rather than only reporting that they should. See the [state bus brief](concepts/civilization-state-bus.md) for the second slice.

Still open on the bus: material, crew-dose, debris, and archive ledgers; adapters from HELIOS, FOUNDRY, and HYGEIA onto the authority ledger; and a campaign runner that advances both ledgers together across ticks.

## Speculative frontier

These remain research briefs until the lower infrastructure exists:

- Transit gates with destination beacons, causality checks, and exactly-once identity semantics.
- Deep-time computation and storage under stellar evolution and entropy budgets.
- Post-Kardashev governance where no civilization-wide “now” exists.
- Metric engineering framed as consistency and safety problems, not construction claims.

## Parallel project: Learn My Code 1.0

Learn My Code should remain a separate repository. Its next work is empirical rather than feature-heavy:

1. A fixture matrix across languages, monorepos, generated code, and large diffs.
2. Lesson-quality evaluation: grounding, difficulty calibration, hint usefulness, and concept retention.
3. Opt-in local progress memory with inspectable, deletable learner state.
4. A real GitHub Pages export theme and verified Notion/Slack connector adapters.
5. “Study this RUIN commit” examples that turn this repository into its own learning curriculum.

The first executable tasks are [cross-language lesson evaluation](https://github.com/nightandweather/learn-my-code/issues/2), [opt-in local progress memory](https://github.com/nightandweather/learn-my-code/issues/1), and [verified publishing adapters](https://github.com/nightandweather/learn-my-code/issues/3).

## Work selection rule

Choose the next issue by this order:

1. It connects two or more existing modules.
2. It makes an invisible resource or safety constraint visible.
3. It can be deterministic and testable in isolation.
4. It has at least one trustworthy physical or operational reference.
5. It creates a meaningful operator decision within a one-screen prototype.

By that rule, **LUMEN is next**, followed by the unified campaign state and ASCENT. WATCHFLOOR, VERITAS, CENSUS, and CHRONOS have now satisfied rule 1 as well, through the authority ledger.
