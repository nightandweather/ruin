# CORVUS — autonomous civilian space-drone swarm

CORVUS is a deterministic design twin for small, cooperative spacecraft assigned to survey, communications relay, resource prospecting, and repair support. It deliberately excludes weapons and targeting. The central question is not whether one drone can fly, but whether the group can remain useful and safe after delay, link loss, navigation drift, heat, and node failure.

## Executable contract

Each node closes a wet-mass and ideal-rocket-equation budget, a distance-squared solar budget, stored-energy hold time, and Stefan–Boltzmann radiator budget. The formation then couples those node limits to circumference-based spacing, relative-drift collision reserve, crosslink range, healthy-node quorum, delayed-command autonomy, and mission-specific minimum team size.

The operator can choose micro, utility, or heavy frames; assign multipoint survey, mesh relay, resource prospecting, or MENDER support; change fleet size and failed nodes; move outward from the Sun; and inject three incidents:

1. A mesh partition enters **LOCAL QUORUM** and rejects minority fleet maneuvers.
2. Relative-navigation divergence enters **FORMATION FREEZE** and forbids convergence.
3. Power or thermal loss enters **NODE HIBERNATE** and sheds payload work.

## Sourced baseline and speculation

- NASA Starling demonstrates four CubeSats coordinating swarm maneuvering, networking, relative navigation, and distributed autonomous data collection without continuous ground control.
- NASA/JPL CADRE provides the cooperative task-allocation analogy: small agents share data and autonomously make group decisions.
- Astrobee demonstrates free-flying robotic inspection and payload work in a crewed microgravity environment.
- Solar flux, the ideal rocket equation, light-time, and radiative heat rejection are physical approximations. Frames, efficiencies, mission thresholds, quorum policy, autonomy score, and productivity factors are RUIN scenario parameters, not qualified hardware.
- Formation geometry is a design-level reserve model, not an ephemeris, covariance propagator, or flight dynamics system.

## Sources

- [NASA: What is Starling?](https://www.nasa.gov/smallspacecraft/what-is-starling/)
- [NASA/JPL: Cooperative Autonomous Distributed Robotic Exploration](https://robotics.jpl.nasa.gov/what-we-do/flight-projects/cooperative-autonomous-distributed-robotic-exploration-cadre/)
- [NASA: Astrobee](https://www.nasa.gov/astrobee/)
- [NASA 2026 State-of-the-Art Small Spacecraft Technology](https://www.nasa.gov/smallsat-institute/sst-soa/)

## Next layers

1. Propagate real orbits and relative-state covariance rather than a circular spacing proxy.
2. Add sensor field-of-view, cooperative coverage, and onboard task auctions.
3. Hand inspection findings to MENDER and manufacturing demand to PROGENITOR.
4. Let ODYSSEY deploy relay drones along energy and navigation corridors.
5. Replay signed swarm ledgers through SENTINEL fault campaigns.
