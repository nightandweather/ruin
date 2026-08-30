# HYGEIA — crew radiation-health operations

HYGEIA is a deterministic design twin for the radiation side of keeping people alive in deep space. The central question is operational, not dosimetric: when the storm alarm sounds, who reaches which refuge, who is caught outside, and does anyone's conservative dose bound cross a career allowance that must never be crossed?

## Executable contract

The model couples a chronic galactic-cosmic-ray rate (attenuated by hull areal density toward an irreducible floor), a solar-particle-event dose ladder across three refuges (storm shelter, bare hull, EVA suit), shelter seat capacity against crew count, and storm-warning lead time against EVA recall time. The mission number that decides anything is a conservative upper bound: suspect dosimetry widens it and never narrows it.

The operator can move crew size, mission length, EVA schedule, shielding masses, shelter seats, warning and recall times, and prior career dose; select a quiet sun, a moderate storm, or the October-2003 and August-1972 analogues; and inject two incidents:

1. **Dosimeter drift** makes the measurement itself suspect; planning continues against a widened bound.
2. **Shelter power loss** downgrades the refuge to hull-only protection and forces triage.

**Safety invariant — fail-closed assignment.** A mission whose bound would push any crew member past the career allowance is refused outright. The system never proposes it for a human to argue back in.

## Sourced baseline and speculation

- MSL/RAD measured ≈1.8 mSv/day of GCR during its shielded interplanetary cruise — the anchor for the chronic rate.
- The August 1972 and October 2003 proton events are the canonical storm magnitudes shelter design is argued against.
- NASA-STD-3001 sets a 600 mSv career effective-dose standard — the hard allowance the invariant defends.
- Exponential attenuation lengths, the GCR shielding floor, suit factors, EVA multipliers, and the free-space storm-dose table are RUIN scenario coefficients, not radiation-transport results. Nothing here is medical guidance.

## Sources

- Zeitlin et al., _Measurements of Energetic Particle Radiation in Transit to Mars_, Science 340 (2013).
- NASA-STD-3001 Volume 1, crew health standards.
- NCRP Report 132, radiation protection guidance for low-Earth orbit.

## Next layers

1. Replace the exponential ladder with tissue-weighted transport lookup tables.
2. Drive storm timing from a heliophysics event catalog instead of a selector.
3. Feed HELIOS thermal-wave campaigns in as coincident storm + power incidents.
4. Let SENTINEL register the shelter-triage plan as a failure-response entry.
