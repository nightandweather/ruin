# Concept name

> One sentence describing the impossible infrastructure as an operational problem.

## Purpose

Who depends on this system, what does it move or protect, and what observable result means it is working?

## Non-goals

State what the model does not claim to prove. Separate a software experiment from a construction plan, scientific prediction, or safety certification.

## Sourced foundations

List primary scientific or engineering sources. Mark each number as:

- **Sourced constant** — measured or defined by a cited source.
- **Derived value** — calculated from sourced values with the equation shown.
- **Scenario parameter** — deliberately invented and configurable.

## State model

| Entity | Important state | Decisions |
| --- | --- | --- |
| Example asset | health, energy, position | continue, derate, isolate |

## Safety invariants

Write rules that automated tests can evaluate. Prefer `must never` over vague goals.

- The system must never energize an unconfirmed route.
- Loss of authority must move the asset toward a bounded safe state.
- Every irreversible command must produce an auditable event.

## Failure scenarios

For each scenario, define detection, containment, degraded operation, recovery, and evidence left behind.

## Smallest useful simulation

Describe the first deterministic loop in fewer than ten steps. It should answer one engineering question without pretending to model the entire universe.

## Interface

List what an operator can observe, decide, and inject. Avoid dashboards that display numbers the model does not actually use.

## Open questions

Record uncertainties instead of hiding them behind fictional precision.
