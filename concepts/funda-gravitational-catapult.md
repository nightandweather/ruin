# FUNDA — the gravitational catapult

> A sling that spends no propellant, aimed by arithmetic done hours before anyone can see whether the corridor is clear.

Named for the Latin _funda_, a sling: the machine does not make gravity, it borrows momentum from masses that already have it. A payload falls toward a body, is turned by it, and leaves on a different vector at a different speed — and the energy comes out of that body's orbital momentum, which is how a spacecraft gains kilometres per second without a gram of reaction mass.

## Purpose

Move bulk cargo between orbits, and eventually out of the system, on a budget that is mostly patience. RUIN's propulsion story is currently all IGNIS and PROMETHEUS: burn something, reject the heat, carry the propellant. FUNDA is the branch where the delta-v is free and the scarce resources are **timing, geometry, and the willingness to aim a mass at something**.

## Non-goals

This is not a weapon, and the distinction is structural rather than a disclaimer. RUIN's fleet and propulsion modules are already scoped to tugs, survey craft, transports, and repair vessels; FUNDA inherits that boundary and adds its own, because a catapult and an artillery piece differ only in where the exit corridor points. Every invariant below exists to keep that difference enforceable in the model rather than assumed in the prose.

It is also not a gravity generator. GRAVITAS already draws the no-go line at fabricated gravity fields, and FUNDA does not cross it: it uses gravity that exists. There is no beam, no projector, no attractor.

## Sourced foundations

- **Gravity assist is flight-proven.** Voyager, Galileo, Cassini, MESSENGER, and Parker Solar Probe all fly trajectories that would be unreachable on their own propellant. The velocity change in the heliocentric frame comes from the assisting body's orbital motion; the body loses exactly as much momentum as the spacecraft gains, which for a planet is unmeasurable.
- **The turning angle is set by the periapsis.** How much the trajectory bends depends on how close the pass is and how fast the approach is — a slower approach and a lower periapsis both bend more. This is the sourced kernel, and it is ordinary two-body mechanics.
- **The Oberth effect.** A burn made deep in a gravity well converts propellant into kinetic energy far more effectively than the same burn made far away. A catapult pass is therefore also the cheapest place to spend what little propellant you brought — and the most dangerous.
- **Dyson's gravitational machines (1963).** At the speculative end, a close pass around a compact binary can extract energy up to a bound set by the binary's own orbital velocity, which for a neutron-star pair is a substantial fraction of _c_. This is a legitimate published idea and remains far outside anything constructible. It belongs in the model as an explicitly unsupported branch, in the same way IGNIS carries its fusion branch.
- **Scenario parameters:** payload structural limits, corridor certification times, catcher confidence, window cadence, and the tidal and thermal margins are all invented and configurable.

## State model

| Entity        | Important state                                                           | Decisions                                 |
| ------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| Assist body   | ephemeris, mass, orbital velocity, minimum safe periapsis                 | offer window, withdraw window             |
| Payload       | mass, structural limit, thermal limit, crewed flag, abort propellant      | commit, abort, downgrade to a weaker pass |
| Pass          | periapsis, approach velocity, turning angle, delta-v gained, tidal stress | execute, raise periapsis, wave off        |
| Exit corridor | aim vector, certified-clear interval, occupancy, catcher confidence       | certify, refuse, re-aim                   |
| Window        | opening, closing, next recurrence                                         | take, wait                                |

## Safety invariants

- **A payload is never released on a corridor that is not certified clear for its whole transit, and the certification must still be valid at the release point, not merely at the time of planning.** An aimed mass in a dragless band is a KESSLER problem with a name attached to it.
- **The abort option must still exist at the commit point.** Once a pass is past the point where a wave-off is possible, the decision was made earlier than it looked, and the model must locate that earlier moment and gate it.
- **Tidal and thermal limits fail closed to a higher, weaker pass.** Never to a faster one.
- **A missed window is a wait, never a forced burn.** The whole point of the machine is the propellant that was not spent; a schedule that converts a missed window into a burn has bought nothing.
- **No living payload above the acceleration limit.** This is where crew and cargo stop sharing a trajectory, and the model should make an operator confront the split rather than average it away.

## Failure scenarios

1. **Late arrival.** The payload reaches periapsis forty seconds behind plan. The exit vector moves; the model must decide whether the corridor is still the certified one, and fail closed if it is not.
2. **Corridor contested.** Certification lapses between commit and release because something else entered the volume. There is no propellant to change the answer.
3. **Tidal overrun.** A periapsis low enough for the required turn exceeds the payload's structural limit. The only safe answers are a weaker pass or no pass.
4. **Catcher loss.** The receiving end degrades mid-transit on a trajectory with no correction budget — the ASCENT and WAYSTATION problem, arriving at relativistic patience.
5. **Stale aim.** The release decision has to be made before anyone can see whether the corridor is clear, because the corridor is light-minutes away. This is CHRONOS's problem wearing a different hat, and it is the most interesting one in the module.

## Smallest useful simulation

1. Choose an assist body and a payload.
2. Compute the window: when is the body where the geometry needs it?
3. Choose a periapsis; derive turning angle, delta-v gained, tidal stress, and peak thermal load.
4. Derive the exit vector and the corridor it sweeps.
5. Ask when the corridor was last certified, and how old that certification will be at release.
6. Locate the last moment an abort was still possible.
7. Admit, downgrade, or refuse.
8. Report the propellant not spent, and the years of waiting it cost.

## Interface

The operator picks a body, a payload, and a periapsis, and watches four things move together: the delta-v gained, the tidal stress on the payload, the age of the corridor certification at the moment of release, and the width of the abort window. The verdict is admitted, downgraded, or refused, with the binding constraint named.

## Open questions

- Who certifies a corridor that crosses another polity's volume, and on whose clock does that certification expire? CHRONOS says there is no shared now to expire it on.
- Does the abort point belong to the operator or to the machine? The honest answer is probably the machine, and that is a THEMIS argument.
- At what payload mass does an assist stop being logistics and start being a hazard the rest of the system has to plan around?
- The Dyson branch needs its own non-negotiable framing before it is modelled at all, in the way IGNIS frames fusion as explicitly unsupported.
