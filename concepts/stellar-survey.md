# Stellar survey: where should a swarm bootstrap?

This is a prioritization model, not a claim that a Dyson swarm is currently feasible. It asks which observed system best fits a chosen civilization strategy.

## Initial result

The Solar System wins because it has no interstellar bootstrap delay. Among external systems, **Epsilon Eridani** is the material-rich frontier candidate, **Tau Ceti** is the quiet-star candidate, and **Proxima Centauri** is the shortest-latency candidate. TRAPPIST-1 is scientifically fascinating but operationally remote and compact.

Scores are reproducible in `src/starSurvey.ts` and can be reweighted across proximity, stellar stability, collector energy, material signals, and orbital simplicity. They are RUIN planning scores, not scientific rankings.

## Data cautions

- NASA catalog values change as measurements improve.
- A debris disk is evidence of material, but also a collision environment.
- A confirmed planet count is not a complete resource inventory.
- Tau Ceti's planet signals are disputed; RUIN treats them as uncertain.
- Red dwarfs live for a long time, but flares and close-in swarm geometry create difficult operating conditions.

## Sources

- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
- [NASA: Epsilon Eridani system](https://science.nasa.gov/universe/exoplanets/sofia-confirms-nearby-planetary-system-is-similar-to-our-own/)
- [NASA: Tau Ceti signal uncertainty](https://science.nasa.gov/the-science-behind-project-hail-mary/)
- [NASA: target star catalog](https://science.nasa.gov/exoplanets/target-star-catalog/)
