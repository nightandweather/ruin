# Lunar mass driver

> An electromagnetic freight railway that ends by handing its cargo to a ballistic trajectory.

## Purpose

Move non-living lunar resources—such as regolith shielding, processed material, or propellant feedstock—from the Moon to an orbital catcher. RUIN models it as civilian freight infrastructure, not a weapon.

NASA studies have examined electromagnetic launchers that accelerate lunar cargo toward low lunar orbit or a libration-point transfer system. The Moon is the more useful starting setting because it has lower gravity and no dense atmosphere, but the economics and engineering remain uncertain.

Primary references:

- [NASA NTRS: A Lunar Electromagnetic Launch System for In-Situ Resource Utilization](https://ntrs.nasa.gov/citations/20110007073)
- [NASA NTRS: Mass Drivers, Part 1 — Electrical Design](https://ntrs.nasa.gov/citations/19790024059)
- [NASA NTRS: A Small Scale Lunar Launcher for Early Lunar Material Utilization](https://ntrs.nasa.gov/citations/19820052082)

## Minimal physics layer

The first model needs only enough physics to expose the tradeoffs:

- Kinetic energy: `E = ½mv²`.
- Constant-acceleration track approximation: `L = v² / 2a`.
- Configurable conversion loss, thermal recovery time, launch-window uncertainty, and catcher error.

These equations do not constitute a construction design. Coil geometry, switching hardware, material limits, and real trajectory guidance remain outside the initial module.

## State model

| Entity | Important state | Decisions |
| --- | --- | --- |
| Cargo capsule | mass, acceleration limit, destination, integrity | accept, reject, repackage |
| Accelerator | stored energy, thermal state, segment availability | charge, launch, cool, isolate |
| Flight corridor | launch window, uncertainty, exclusion zones | clear, delay, cancel |
| Orbital catcher | predicted position, capture capacity, confidence | acknowledge, receive, abort |

## Safety invariants

- No launch without a fresh cryptographic acknowledgement from the intended catcher.
- Every predicted trajectory must remain outside inhabited and protected exclusion zones under the configured uncertainty bound.
- Loss of timing, tracking, or segment health must discharge safely and cancel the launch.
- Human passengers and biological cargo are outside the supported payload class.
- The launcher must fail closed; throughput targets can never override corridor clearance.

## Failure scenarios

1. **Catcher clock drift** — confidence falls below threshold and the launch is cancelled before energizing the track.
2. **Coil segment overheating** — the controller extends cooldown or routes the capsule back to staging.
3. **Unexpected object in corridor** — the exclusion window closes and stored energy is recovered or safely dissipated.
4. **Payload mass mismatch** — acceleration and arrival predictions are invalidated; the capsule is rejected.
5. **Power interruption during charge** — the system enters a bounded discharge state without releasing the capsule.

## Smallest useful simulation

1. Create a cargo request with mass, destination, and deadline.
2. Reserve energy, track time, and a catcher slot.
3. Calculate the scenario-level energy and acceleration envelope.
4. Inject uncertainty into tracking, timing, thermal state, or payload mass.
5. Ask the safety controller to authorize or cancel.
6. Propagate an authorized capsule to the catcher.
7. Record energy cost, delay, miss distance, and the reason for every refusal.

The first useful question is not “how powerful can the launcher be?” but “how often should it refuse to launch when information is incomplete?”
