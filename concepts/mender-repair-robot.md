# MENDER — robotic repair architect

MENDER designs maintenance robots around a procedure rather than a humanoid silhouette. It joins HELIOS repair demand, NAVIS spacecraft service, and PROGENITOR manufacturing into one physical contract: reach the fault, anchor safely, carry the component and tools, finish before energy runs out, reject the heat, and continue when commands arrive late.

## Operational question

Can the robot remain attached and stable while applying the force and precision needed to repair its client?

## Current executable model

- Free-flyer, hull rail-walker, lunar crawler, and cooperative micro-robot frames.
- Collector-tile replacement, radiator-loop patching, cryogenic-valve service, and factory-bearing replacement contracts.
- Two-point contact, arm count, seven-degree-of-freedom baseline, reach, payload, grip force, and tool count.
- Tool reaction moment versus anchored resisting moment.
- Battery endurance, solar recharge, active waste heat, and radiator capacity.
- Free-flyer propellant delta-v and distance-dependent autonomy requirements.
- Explicit `GO`, `CONDITIONAL`, and `NO-GO` constraints.

## Boundaries

- This is a trade-study model, not manipulator dynamics, contact simulation, structural certification, or flight software.
- Grip force and lever arms are simplified scalar envelopes; real servicing requires six-axis force/torque control, compliance, contact geometry, client dynamics, and verified procedures.
- Solar recharge assumes 1 AU illumination and ignores attitude, eclipse, degradation, and conversion-chain losses beyond a fixed efficiency.
- Task duration and tool requirements are scenario parameters rather than measured maintenance procedures.
- Autonomy is a policy score, not a verified perception or planning system.
- MENDER is maintenance-only and includes no weapon, breaching, targeting, or adversarial manipulation capability.

## Sources

- [NASA Goddard ISAM capabilities](https://etd.gsfc.nasa.gov/capabilities/in-space-servicing-assembly-and-manufacturing/) — seven-DOF servicing arms, six-axis force/torque sensing, prepared interfaces, simulation, and cooperative servicing.
- [NASA OSAM-1](https://www.nasa.gov/mission/on-orbit-servicing-assembly-and-manufacturing-1/) — relative navigation, dexterous arms, advanced tools, servicing avionics, propellant transfer, and SPIDER's five-meter arm.
- [NASA Fly Foundational Robots](https://www.nasa.gov/centers-and-facilities/goddard/nasas-fly-foundational-robots-demo-to-bolster-in-space-infrastructure/) — mobile arms capable of walking across spacecraft surfaces for inspection, repair, refueling, and assembly.
- [NASA Astrobee free-flyer design](https://ntrs.nasa.gov/citations/20150018250) — battery-powered free flight and handrail gripping to hold position without consuming propulsion power.
- [NASA Robotic Refueling Missions](https://www.nasa.gov/isam/rrm-1-2/) — robotic tools and procedures for servicing spacecraft not originally designed for repair.

## Next layers

1. Six-axis contact dynamics, joint torque, compliance, collision envelopes, and client-spacecraft momentum exchange.
2. Machine-readable service interfaces shared by COLLECTOR, NAVIS, DATACORE, and WAYSTATION.
3. Procedure graphs with inspection, isolation, removal, replacement, leak check, and recertification steps.
4. PROGENITOR bills of materials and imported actuator, sensor, controller, seal, and lubricant bottlenecks.
5. Multi-robot task allocation with tool handoff, rescue, and delayed-command consensus.
