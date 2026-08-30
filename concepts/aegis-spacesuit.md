# AEGIS parametric spacesuit

AEGIS asks a deceptively difficult question: **what suit should a person wear for this particular world and this particular job?** It is a deterministic trade-study and failure-response model, not a fabrication drawing or a human-rated life-support design.

## Executable question

Can one pressure-garment architecture balance life-support duration, mobility, thermal rejection, particulate protection, emergency return, and the very different consequences of mass in orbit, on the Moon, and on Mars?

## Operator decisions

- Mission: orbital maintenance, lunar industry, Mars field work, or emergency rescue.
- Suit pressure, mobility-bearing count, protective layers, cooling capacity, nominal endurance, emergency oxygen, and dust mitigation.
- Whether a design is ready, conditional, or no-go after mass, local weight, mobility, metabolic load, thermal margin, and seal risk are evaluated together.
- How the suit responds to puncture, coolant-loop loss, communications loss, and abrasive dust in a bearing seal.

## Sourced anchors

- NASA reports the latest lunar xEMU configuration at just under 400 lbm (about 181 kg) and warns that the same mass is not feasible for repeated Mars surface EVA under 3/8 gravity.
- NASA's BioBot study used a 187 kg suit assumption—83 kg pressure garment and 103 kg portable life-support system—to investigate offloading that burden.
- Apollo's PLSS combined primary oxygen, ventilation, water cooling, feedwater, communications, and emergency oxygen; modern implementations differ, but those coupled functions remain a useful system boundary.
- Lunar dust can obscure vision, contaminate surfaces, reduce traction, clog mechanisms, abrade surfaces, disturb thermal control, and cause seal failure. NASA is testing electrostatic dust-removal approaches for surfaces including spacesuits, boots, and visors.

## Invented model parameters

All mass coefficients, workload values, protection-layer performance, cooling limits, dust-risk scores, and failure rates in the simulator are scenario parameters. The output cannot certify decompression safety, oxygen compatibility, thermal comfort, radiation protection, micrometeoroid resistance, or human performance.

## Safety invariants

1. A pressure-loss scenario immediately leaves nominal EVA and selects return mode while emergency oxygen remains.
2. A negative cooling margin shortens modeled safe EVA time rather than hiding the thermal deficit.
3. Mass is never treated as irrelevant in zero gravity: local weight can be zero while inertia and metabolic handling penalties remain.
4. A lunar-mass design receives an explicit Mars suitability penalty.
5. The simulator presents no weapon, combat, or hostile-environment optimization.

## Primary references

- [NASA NTRS: Mars Spacesuit Mass Requirements (2026)](https://ntrs.nasa.gov/citations/20260005410)
- [NASA NTRS: BioBot final report (2025)](https://ntrs.nasa.gov/citations/20250006905)
- [NASA NTRS: xEMU ergonomics testing](https://ntrs.nasa.gov/citations/20240013420)
- [NASA: Spacesuits, Volume 2](https://www.nasa.gov/reference/11-0-spacesuits-vol-2/)
- [NASA NTRS: Effects of Lunar Dust](https://ntrs.nasa.gov/citations/20050160460)
- [NASA: Electrodynamic dust shield testing](https://www.nasa.gov/centers-and-facilities/kennedy/nasa-technology-helps-guard-against-lunar-dust/)
