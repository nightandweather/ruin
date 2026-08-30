# GRAVITAS artificial gravity architecture

GRAVITAS separates physically understood artificial gravity from fictional gravity-field generation. Rotation and sustained linear acceleration can create an experienced body force. No experimentally supported compact machine is known to generate a useful static gravitational field on demand.

## Executable question

How large must a rotating habitat become before its target floor gravity stops imposing unacceptable rotation rate, Coriolis acceleration, head-to-foot gravity gradient, structural load, docking complexity, and angular-momentum management?

## Implemented architectures

- **Continuous ring** — a rotating pressure ring around a non-rotating docking and zero-g hub.
- **Tether pair** — two masses rotating about a common center, reducing rigid structure while adding deployment and tether risk.
- **Short-arm centrifuge** — intermittent crew exposure or exercise with severe gravity gradient and high RPM.
- **Field core** — an explicit unsupported boundary. It produces no invented performance output or energy estimate.

## Physical model

For the rotational architectures:

```text
floor acceleration  a = ω²r
rotation rate       rpm = 60ω / 2π
head acceleration   a_head = ω²(r - deck height)
Coriolis magnitude  a_c = 2ωv_radial
spin energy         E = ½Iω²
```

The interface reports foot and head gravity, RPM, rim speed, gravity gradient, Coriolis acceleration for radial walking, spin energy, average spin-up power, a simplified rotating-structure stress estimate, and residual angular momentum after counter-rotation.

## Physical layout

- A non-rotating axial hub handles docking and preserves a microgravity laboratory.
- Pressure doors divide the rim into independent sectors.
- Counter-rotating mass reduces the attitude-control burden of the main ring.
- Crew traffic is primarily parallel to the spin axis; radial travel and crossing the axis are minimized.
- Cargo is balanced before spin admission rather than corrected after a large oscillation appears.

## Failure scenarios

- Cargo mass imbalance triggers controlled despin.
- Rotary bearing loss isolates axial traffic.
- A pressure-sector leak closes independent rim doors.
- Spin-drive failure leaves the habitat coasting rather than removing gravity instantly.
- A vestibular event restricts radial movement and head motion.

## Model limits

The structural calculation is an order-of-magnitude thin rotating-system estimate. It omits detailed pressure-vessel stress, spokes, joints, fatigue, crack growth, bearing life, deployment, control-structure interaction, radiation shielding, and launch assembly. Human comfort categories are scenario screening bands, not medical certification.

## Primary references

- [NASA Human Integration Design Handbook, Revision 1](https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-handbook-revision-1.pdf)
- [NASA NTRS: Development and Comparison of an Artificial Gravity Concept for Human Spaceflight](https://ntrs.nasa.gov/citations/20205004959)
- [NASA technology: Spacecraft with Artificial Gravity Modules](https://technology.nasa.gov/patent/TOP2-311)
- [NASA: Artificial Gravity](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artificial-gravity/)
- [ESA short-arm human centrifuge](https://www.esa.int/ESA_Multimedia/Images/2013/08/Short-arm_human_centrifuge)
