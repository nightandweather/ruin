# SENTINEL — system-wide fault response

SENTINEL is RUIN's common Fault Detection, Isolation, and Recovery registry. It does not pretend every failure can be repaired. It requires every credible plan to say how the fault is detected, how propagation is stopped, which safe state remains reachable, how the mission degrades, which decision stays human, and what evidence permits recovery.

## Coverage

The executable registry contains three primary plans for each of 11 systems:

| System | Predicted fault families |
| --- | --- |
| HELIOS | relay partition, thermal cascade, debris collision chain |
| FOUNDRY | contaminated feedstock, hidden tool wear, process power interruption |
| COLLECTOR | beam pointing drift, radiator loss, structural breach |
| DATACORE | silent radiation corruption, coolant loss, optical partition |
| AGRARIA | pathogen outbreak, root dryout, lighting-bus loss |
| AEGIS | pressure loss, cooling loss, EVA communications loss |
| PROGENITOR | metrology drift, controller shortage, software-lineage contamination |
| GRAVITAS | rotating mass imbalance, bearing degradation, pressure-sector breach |
| ATLAS | catalog epoch drift, identity crossmatch error, distance bias |
| NAVIS | thermal deficit, propulsion underperformance, high-gain communications loss |
| MENDER | anchor slip, joint jam, relative-perception loss |

## Registry contract

Every plan must provide:

1. Root cause and at least two precursors.
2. A deterministic detection statement.
3. At least two automatic isolation or safing actions.
4. A named safe state and degraded fallback mode.
5. A decision that remains with accountable operators.
6. At least two independent recovery gates.
7. A non-negotiable safety invariant.
8. Direct RUIN dependencies that define the initial blast radius.

Tests reject duplicate plan identifiers, unknown dependencies, incomplete actions, missing recovery evidence, and any executable module with fewer than three plans.

## Boundaries

- Risk priority, blast radius, automation percentage, and response time are scenario indices, not validated reliability predictions.
- The registry covers representative single and coupled faults, not every possible combination, common-cause failure, malicious input, human error, or unknown unknown.
- A safe state preserves the defined safety invariant; it does not guarantee mission completion or recovery.
- Recovery is evidence-gated. Elapsed time or disappearance of an alert never clears a fault by itself.
- Real systems require hazard analysis, FMEA/FMECA, fault trees, probabilistic risk assessment, hardware-in-the-loop tests, independent verification, and accountable operators.

## Sources

- [NASA Systems Engineering Handbook appendix](https://www.nasa.gov/reference/system-engineering-handbook-appendix/) — fault management as containment, prevention, detection, diagnosis, response, and recovery.
- [NASA Software Engineering Handbook: Fault Recovery](https://swehb.nasa.gov/spaces/SWEHBVD/pages/171508207/HR-37%2B-%2BFault%2BRecovery) — isolate faults to the smallest practical containment region and recover where the design permits it.
- [NASA Space Flight System Design and Environmental Test](https://www.nasa.gov/sites/default/files/atoms/files/std8070.1.pdf) — timely deterministic response to credible faults and safe, quiescent, commandable states.
- [NASA Lessons Learned: Improving Fault Management](https://llis.nasa.gov/lesson/2049) — autonomous fault management is essential when light-time prevents timely intervention.
- [NASA NTRS: Orion GN&C fault-management verification](https://ntrs.nasa.gov/citations/20160001200) — bounding and verifying a large, interacting failure space.

## Next layers

1. Link SENTINEL plans directly to each simulator's incident injection and telemetry.
2. Add fault trees, common-cause failures, false-positive/false-negative analysis, and detection persistence.
3. Execute cross-module cascades such as HELIOS curtailment → DATACORE cooling loss → PROGENITOR controller shortage.
4. Store signed incident evidence and recovery approvals as replayable scenario files.
5. Add chaos campaigns that prove each safety invariant under randomized timing and multiple simultaneous faults.
