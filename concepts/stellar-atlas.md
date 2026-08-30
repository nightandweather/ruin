# ATLAS — local stellar operations map

ATLAS gives RUIN a real place to operate. It converts catalog right ascension, declination, and distance into a heliocentric Cartesian map, then connects those positions to causal delay and the existing stellar-survey model.

## First executable question

How does the real geometry of the nearby stellar neighborhood change communication, travel, and swarm-bootstrap decisions?

## Current executable model

- 30 curated objects within roughly 50 light-years, including nearby landmarks, confirmed planet hosts, and the five RUIN stellar-survey systems.
- ICRS right ascension and declination with parallax-derived distance for SIMBAD landmarks.
- NASA Exoplanet Archive distance and confirmed planet counts for selected planet hosts.
- A heliocentric equatorial conversion: `x = d cos(dec) cos(ra)`, `y = d cos(dec) sin(ra)`, `z = d sin(dec)`.
- 10, 20, and 50 light-year volumes, catalog-layer filters, rotatable projection, selectable routes, light-time, and a deliberately simplified constant-speed cruise estimate.

The embedded data is a reproducible snapshot queried on 2026-08-30. It is not a live catalog and must not be described as a complete map of nearby stars.

## Physics and data boundary

- The map shows catalog positions relative to Sol; it does not propagate proper motion to a common epoch.
- Distance is radial and does not include uncertainty ellipsoids.
- Signal time uses one light-year per year in vacuum.
- Cruise time is only distance divided by a chosen fraction of light speed. It omits acceleration, braking, propulsion energy, relativistic time dilation, hazards, and infrastructure bootstrap.
- Catalog presence, confirmed planets, and the RUIN survey score are different claims. None establishes habitability or constructability.

## Sources

- [ESA Gaia EDR3 Catalogue of Nearby Stars](https://www.cosmos.esa.int/web/gaia/edr3-gcns) — the homogeneous 100 parsec reference catalog that defines the larger neighborhood ATLAS does not yet load.
- [SIMBAD astronomical database](https://simbad.cds.unistra.fr/simbad/) — ICRS coordinates, parallaxes, identifiers, and spectral classifications for curated landmarks.
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) — confirmed host distances and planet counts.
- [NASA Exoplanet Archive TAP documentation](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) — reproducible catalog-query interface.

## Next layers

1. Import Gaia GCNS subsets with catalog identifiers, uncertainty, and proper motion.
2. Propagate every position to a selected epoch and visualize its uncertainty volume.
3. Draw routes as time-dependent transfer problems instead of straight lines.
4. Add stellar luminosity, activity, debris-disk, and resource-evidence layers without collapsing them into one certainty score.
5. Model autonomous probes whose commands and observations cross years-long causal horizons.
