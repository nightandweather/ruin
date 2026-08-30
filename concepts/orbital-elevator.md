# Orbital elevator

> A continuously operating surface-to-orbit railway whose hardest problem is safe throughput, not spectacle.

## Purpose

Move replacement collectors and bulk industrial cargo from a planetary factory to a geostationary transfer depot without spending a chemical launch vehicle on every shipment.

HELIOS currently implements the first logistics abstraction: production orders become ground inventory, climbers carry bounded batches, orbital inventory arrives after a transit delay, and damaged collectors consume that stock.

## What is real and what is fictional

NASA concept studies describe an Earth elevator as a tether extending from the surface through geostationary orbit, with climbers transporting cargo. They also identify ultra-high-strength tether material, power transmission, deployment and control, and object avoidance as critical technologies. RUIN treats the elevator as speculative infrastructure; it does not assert that a buildable Earth tether material exists.

Primary references:

- [NASA NTRS: Technology Development and Demonstration Concepts for the Space Elevator](https://ntrs.nasa.gov/citations/20040161582)
- [NASA NTRS: Critical Technologies for the Development of Future Space Elevator Systems](https://ntrs.nasa.gov/citations/20060000015)
- [NASA NTRS: Tether Impact Rate Simulation and Prediction with Orbiting Satellites](https://ntrs.nasa.gov/citations/20020033946)

## State model

| Entity | Important state | Decisions |
| --- | --- | --- |
| Surface factory | backlog, throughput, ground inventory, energy | accept, prioritize, pause |
| Tether | segment integrity, oscillation envelope, debris corridor, thermal load | operate, derate, evacuate |
| Climber | cargo, position, velocity, power reserve, brake state | ascend, hold, return |
| GEO depot | free berths, inventory, transfer craft queue | receive, quarantine, dispatch |

## Safety invariants

- A climber must not depart without a reserved depot berth and a valid full-route clearance window.
- Loss of command must never release a payload or disable passive braking.
- Tether risk above the configured bound must stop new departures before affecting climbers already in motion.
- Cargo identity, mass, and destination must remain traceable from factory order to orbital installation.
- Power allocation must preserve braking and tether-control reserves before cargo throughput.

## Failure scenarios

1. **Debris crossing** — stop departures, place climbers at bounded hold points, model tether displacement or local repair.
2. **Grid brownout** — reduce climb rate while reserving energy for braking and active tether control.
3. **Climber obstruction** — isolate a tether lane, reroute when possible, and prevent queue pressure from bypassing clearance.
4. **Depot saturation** — stop loading on the ground instead of accumulating uncontrolled cargo in transit.
5. **Factory contamination** — quarantine the batch without blocking safety-critical replacement stock.

## Next executable module

Extend the existing HELIOS logistics state machine with tether health, two independently moving climbers, depot berth reservations, and a debris window. The first test should prove that a factory backlog cannot force departure while the route is unsafe.

## Open questions

- Should RUIN model an Earth elevator, a lower-gravity lunar elevator, or both as different configurations?
- How should tether oscillation and avoidance be simplified without implying structural accuracy?
- When should a mass driver or reusable rocket become the automatic fallback route?
