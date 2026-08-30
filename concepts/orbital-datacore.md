# DC-01 Orbital Datacore

DC-01 tests whether a GPU server can become useful space infrastructure rather than merely a terrestrial datacenter placed in orbit. It consumes a C-01 power contract, rejects heat through radiators, receives observation data over optical links, and accepts results only after configurable replicated verification.

## Best-fit workloads

- Telescope and sensor preprocessing where raw data already originates in space.
- HELIOS ephemeris, conjunction, and distributed-control calculations.
- FOUNDRY digital twins and maintenance scheduling.
- Long-running physics and climate ensembles whose results are much smaller than their intermediate data.

Latency-sensitive consumer services are intentionally a poor fit. The model makes optical link loss and data locality visible rather than assuming that orbit removes network delay.

## Reliability policy

- Radiation events move one quarter of compute tiles into ECC scrub.
- Corrected errors and rejected result quorums are counted separately.
- No result affected by disagreement is silently accepted.
- Cooling loss caps active tiles before the coolant boundary is crossed.
- Power curtailment sheds low-priority capacity instead of over-drawing the C-01 contract.
- Optical link loss retains results locally and blocks new telescope ingress.

## Model boundary

GPU throughput, tile power, optical data rate, shielding response, job size, facility overhead, and incident rates are fictional RUIN parameters. The radiator uses a simplified Stefan–Boltzmann equilibrium. This is not a launch, cost, radiation-qualification, or detailed cooling-loop design.

## Sources

- [NASA: radiation threats to spacecraft electronics](https://www.nasa.gov/reference/jsc-radiation/)
- [NASA: mitigating single-event effects](https://ntrs.nasa.gov/citations/20210024100)
- [NASA: Deep Space Optical Communications](https://www.nasa.gov/mission/deep-space-optical-communications-dsoc/)
- [NASA NTRS: spacecraft radiator fundamentals](https://ntrs.nasa.gov/api/citations/20010091676/downloads/20010091676.pdf)
