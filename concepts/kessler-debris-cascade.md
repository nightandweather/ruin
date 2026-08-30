# KESSLER — orbital-band debris population dynamics

KESSLER makes the collisional cascade an operational experience for the swarm's own band. The central question: with no natural cleaning at 0.4 AU — no drag, no decay, nothing leaves unless removed — does the removal budget close before the band's growth makes it hostile to the swarm that built it?

## Executable contract

A fifty-year expected-value iteration couples tracked and untracked debris populations, a swarm-density encounter term (expanding the constellation raises its own collision rate), a quadratic debris-on-debris feedback (negligible when clean, dominant past the knee), avoidance reliability against tracked conjunctions only, fragmentation yields per catastrophic collision, install traffic with a derelict failure fraction, and an active-removal budget that is the band's only sink.

The operator can reshape every population and budget and inject two incidents:

1. **Catastrophic breakup** seeds the band with one fragmentation at year zero.
2. **Tracking outage** makes every conjunction unavoidable.

**Safety invariant — install moratorium, fail-closed.** Past a density cap the model itself refuses new installs, and the block never silently lifts. In the breakup scenario this is the mechanism that saves the band: freezing growth is what keeps the wounded band cooler than a healthy one that keeps expanding.

## Sourced baseline and speculation

- Kessler & Cour-Palais (1978) supplies the grounded mechanism: collisions create fragments faster than removal, so past a critical density the population grows on its own.
- Observed breakups fragment into thousands of trackable pieces with a larger untrackable-but-lethal population — the shape, not the values, of the yield table.
- Encounter coefficients, yield counts, the density cap, and the runaway threshold are RUIN scenario parameters. This is an expected-value model, not an ephemeris or a conjunction screener.

## Sources

- Kessler, D. J., & Cour-Palais, B. G., _Collision Frequency of Artificial Satellites: The Creation of a Debris Belt_, JGR 83 (1978).
- NASA Orbital Debris Program Office, technical overviews of breakup fragmentation modeling.

## Next layers

1. Split the band into interacting altitude shells with cross-shell flux.
2. Price the avoidance budget in propellant against HELIOS collector reserves.
3. Hand removal demand to MENDER and CORVUS as capture missions.
4. Couple confirmed impacts back into HELIOS's debris-corridor scenario.
