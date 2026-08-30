# IGNIS — propulsion engine laboratory

IGNIS turns NAVIS's propulsion choice into an executable engine contract. It asks whether a proposed burn remains possible after thrust, specific impulse, mass flow, electrical or thermal power, propellant, heat rejection, transient heat storage, cluster failures, and technology maturity are evaluated together.

## Executable scope

- Four deliberately separated architecture families: cryogenic chemical, Hall electric, solid-core nuclear thermal, and an unsupported fusion placeholder.
- Equivalent exhaust velocity from `vₑ = Isp × g₀` and mass flow from `ṁ = F / vₑ`.
- Power-limited Hall thrust from `F = 2ηP / vₑ`.
- Ideal vehicle delta-v from the Tsiolkovsky rocket equation.
- Radiator capacity from a gray-body Stefan–Boltzmann approximation plus a finite transient heat sink.
- Cluster engine-out behavior, burn admission, propellant endurance, and fail-closed ignition authority.

## Boundaries

This is a preliminary design model, not computational fluid dynamics, neutronics, plasma simulation, trajectory guidance, engine-control software, or flight certification. Chemical chamber/nozzle losses are compressed into reference specific impulse. Nuclear thermal values are a concept-level operating point. Fusion is always marked `NO-GO` because no verified flight-capable engineering path exists.

The model intentionally contains no guidance, targeting, or weapon behavior.

## Failure contract

IGNIS registers three cross-system fault plans in SENTINEL:

1. propellant feed imbalance → isolate the unit and coast engine-out;
2. thermal overrun → ramp down, enter thermal coast, and require a cooling proof;
3. propulsion power/control loss → revoke ignition, isolate stored energy, and rehearse startup on two independent channels.

## Primary references

- [NASA Glenn — Specific Impulse](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/)
- [NASA Glenn — Rocket Thrust Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/rocket-thrust-equation/)
- [NASA Small Spacecraft State of the Art — In-Space Propulsion](https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/)
- [NASA — Solar Electric Propulsion](https://www.nasa.gov/space-technology-mission-directorate/tdm/solar-electric-propulsion/)
- [NASA NTRS — Fundamental Performance of Nuclear Thermal Propulsion](https://ntrs.nasa.gov/api/citations/20220009141/downloads/NTP1-PPT-22-0206_Rev000.pdf?attachment=true)
