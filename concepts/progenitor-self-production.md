# PROGENITOR guided self-production

PROGENITOR models a robotic factory that can manufacture much—but deliberately not all—of the machinery required to expand itself. The useful variable is not a magical “self-replicating” switch. It is **production closure**: the fraction of a certified offspring factory that can be produced from local material, energy, machines, and process knowledge.

## Executable question

How quickly can one seed factory expand without allowing missing controllers, precision references, tool wear, material contamination, or generational quality drift to become an exponential defect cascade?

## Physical architecture

The reference layout uses a one-way material flow across a nominal 520 × 280 m seed footprint:

1. **Open extraction zone** — excavators and haulers remain outside the precision plant because they are the dominant dust and vibration sources.
2. **Crush and sort** — bulk feedstock is graded before high-energy processing; rejected material does not enter the furnace stream.
3. **Hot cell** — refining and casting share short bulk-material paths and a dedicated radiator and power corridor.
4. **Machine hall** — subtractive tools, forming, and finishing convert stock into dimensioned parts. It is separated from furnace vibration and thermal cycling.
5. **Clean vault** — assembly and metrology occupy a sealed zone with independent contamination control. Imported controllers and reference artifacts arrive through a separate dock.
6. **Certification apron** — a new machine or factory copy enters the production graph only after dimensional, electrical, and lineage verification.

The arrangement is a conceptual process layout, not a civil, thermal, structural, or hazard-certified design. Its dimensions and capacities are scenario parameters.

## Why full closure is difficult

Bulk structure can plausibly reach high local content before precision components do. A replicating industrial chain may still depend on externally supplied:

- radiation-tolerant controllers and high-density electronics;
- sensors, optical elements, and calibration artifacts;
- bearings, seals, lubricants, and precision cutting materials;
- dopants, process gases, polymers, and complex chemical feedstocks;
- software updates and independent design verification.

PROGENITOR therefore tracks local content separately for structure, motion and tooling, electronics, and metrology. Imported mass is a hard bottleneck on certified copies.

## Operator decisions

- Lunar, asteroid, or Mars seed site.
- Power, ore grade, automation, metrology trust, local electronics capability, and controller imports.
- A human-set maximum factory population.
- Assured, balanced, or surge allocation between useful civil output and reproduction.

## Failure scenarios

- Metrology drift quarantines all offspring certification.
- Controller shortage permits local subassembly work but blocks complete replication.
- Machine-tool wear reduces throughput and quality.
- Power brownout sheds nonessential production.
- Feedstock contamination reduces refining yield and product confidence.

## Safety invariants

1. Replication stops at the configured factory ceiling.
2. A lost metrology reference prevents offspring admission to the production graph.
3. Imported critical components cannot be replaced by an unexplained efficiency multiplier.
4. Faster reproduction visibly reduces useful output and quality margin.
5. Every admitted factory has a lineage record; drift accumulates rather than resetting between generations.
6. The module models civilian industry and excludes autonomous weapon production.

## Primary references

- [NASA NTRS: Replicating Systems Concepts—Self-Replicating Lunar Factory and Demonstration (1982)](https://ntrs.nasa.gov/citations/19830007081)
- [NASA: Lunar Surface Technology](https://www.nasa.gov/lunar-surface-technology/)
- [MIT Center for Bits and Atoms: Hierarchical Assembly of a Self-Replicating Spacecraft](https://cba.mit.edu/docs/papers/17.04.11.SelfAssemSpacecraft.pdf)
- [MIT TESSERAE self-assembling space architecture](https://www.media.mit.edu/projects/tesserae-self-assembling-space-architecture/overview/)
- [Shubov: Guided Self-Replicating Factory for Colonization of the Solar System](https://arxiv.org/abs/2110.15198) — a speculative preprint used for system decomposition, not treated as demonstrated feasibility.
