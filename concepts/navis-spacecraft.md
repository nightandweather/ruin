# NAVIS — spacecraft systems architect

NAVIS connects RUIN's real stellar map to a vehicle that must pay for every tonne, newton, watt, kelvin, and delayed command. Its first purpose is industrial and exploratory spacecraft design, not weapon design.

## Operational question

Which coupled subsystem invalidates a spacecraft mission before departure: mass ratio, thrust, power, heat rejection, communications, autonomy, or an unsupported propulsion assumption?

## Current executable model

- Orbital tug, asteroid freighter, autonomous ATLAS probe, and industrial seedship mission presets.
- Chemical, solar-electric, nuclear-electric, and explicitly unsupported fusion-concept propulsion families.
- Ideal Tsiolkovsky delta-v from wet and final mass, specific impulse, and standard gravity.
- Initial thrust-to-mass acceleration and propellant-limited continuous burn duration.
- Coupled hotel/propulsion power and gray-body radiator capacity using the Stefan–Boltzmann law.
- A distance-squared communications index, one-way and round-trip light time, and required autonomy class.
- ATLAS survey targets as route destinations.
- Model maturity labels inspired by NASA CML's explicit separation of runnable, verified, and independently validated models.

## Important boundaries

- This is preliminary trade-study software, not flight dynamics or vehicle certification.
- Delta-v is ideal and excludes gravity loss, steering loss, staging, boiloff, finite burns, trajectory geometry, and reserve policy.
- Interstellar transit is only a non-relativistic distance estimate using total delta-v split between acceleration and braking. It is not a feasible trajectory.
- The fusion preset has maturity `M0` and always produces a no-go verdict. No verified flight-capable fusion propulsion system exists.
- The link index is relative; it does not calculate a real data rate or include frequency, transmitter power, receiver noise, pointing, coding, or intervening media.
- Crew survival, shielding, closed-loop life support, launch, landing, docking loads, and detailed structural dynamics remain outside the model.
- NAVIS includes no weapons, targeting, or munition effects.

## Sources and design influences

- [NASA Glenn: Ideal Rocket Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/) — mass ratio, equivalent exhaust velocity, specific impulse, and ideal delta-v.
- [NASA Glenn: Specific Impulse](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/) — thrust, mass flow, and propulsion-efficiency definitions.
- [NASA: Solar Electric Propulsion](https://www.nasa.gov/space-technology-mission-directorate/tdm/solar-electric-propulsion/) — high-specific-impulse, power-limited Hall thruster operations and AEPS context.
- [NASA Systems Engineering Handbook appendix](https://www.nasa.gov/reference/system-engineering-handbook-appendix/) — technical margins, verification, and qualification thinking.
- [NASA Common Model Library](https://github.com/nasa/cml) — explicit model maturity and verification levels.
- [Terminal Space Program](https://github.com/jasonfen/terminal-space-program) — data-driven vehicles and visible orbital tradeoffs.
- [LEOPath](https://github.com/Fundacio-i2CAT/LEOPath) — delayed, changing communication topology as a first-class operational constraint.
- [Ground Station](https://github.com/sgoudelis/ground-station) — operational integration of tracking, communications, telemetry, scheduling, and hardware state.

## Next executable layers

1. Patched-conic and low-thrust trajectory propagation with finite burns.
2. Modular tanks, drives, payloads, radiators, avionics, habitats, and docking interfaces with a machine-readable bill of materials.
3. FOUNDRY manufacturability and WAYSTATION servicing contracts.
4. Radiation, micrometeoroid, reliability-block, and repair-access models.
5. Delay-tolerant command policies linked to LEOPath-style network topology and the existing fleet-survival core.
