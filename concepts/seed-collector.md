# C-01 Seed Collector

C-01 turns one abstract HELIOS node into a parametric stellar machine. Four articulated collection wings feed a central power bus, two radiators reject waste heat, electric thrusters provide station keeping and avoidance, and two service robots replace standardized FOUNDRY modules.

## Executable decisions

The operator can change orbital radius, collection area, radiator area, conversion efficiency, debris shielding, and propellant. Geometry and performance update together. Larger wings collect more energy but add mass and waste heat; more shielding improves the design envelope but slows replication; more radiator area costs material while preserving full deployment near the star.

The simulation includes:

- Inverse-square solar flux from a `1361 W/m²` reference at 1 AU.
- Simplified Stefan–Boltzmann radiator equilibrium.
- Fail-closed power transmission during communications or beam-steering faults.
- Automatic array articulation during a flux surge.
- Partial retraction and propellant use during a debris corridor.
- Service-robot consumption of FOUNDRY maintenance kits.

## Model boundary

This is a systems trade study, not flight hardware. Conversion efficiency, component areal density, shielding mass, transmission efficiency, material composition, FOUNDRY throughput, debris damage, and control timing are RUIN scenario parameters. It does not yet model structural modes, detailed photovoltaic temperature response, orbital perturbations, beam propagation, plume impingement, or component-level radiation degradation.

## Sources

- [NASA: Solar Electric Propulsion](https://www.nasa.gov/space-technology-mission-directorate/tdm/solar-electric-propulsion/)
- [NASA Science: spacecraft thermal control and micrometeoroid protection](https://science.nasa.gov/learn/basics-of-space-flight/chapter11-4/)
- [NASA GSFC: radiative transfer and solar irradiance](https://science.gsfc.nasa.gov/earth/climate/researchareas/159/)
- [NASA JPL: Psyche spacecraft and solar-electric propulsion](https://www.jpl.nasa.gov/press-kits/psyche/mission/spacecraft/)
