# RUIN HUD art direction

RUIN is an operations interface for civilization-scale systems, not a collection of dark SaaS dashboards and not a game HUD. Its visual target is:

> NASA mission control × nuclear-submarine CIC × a forgotten civilization's oracle machine

![RUIN HUD art-direction reference](assets/ruin-hud-direction-v1.png)

The concept image fixes the composition and visual language. The shipped interface remains code-native HTML, canvas, SVG, and CSS driven by simulation state; the bitmap is not used as a decorative background.

## Composition

- The central star system and civilization network own most of the visual field.
- The left ledger reports civilization-scale conditions before local equipment detail.
- The right ledger preserves event provenance, logistics, institutional status, and safety authority.
- The lower causal horizon connects a present operator state to projected outcomes at now, +1 year, +10 years, and +50 years.
- Large areas of disciplined darkness establish scale. Extra panels do not.

## Signal semantics

| Signal                     | Meaning                                   | Usage rule                                                       |
| -------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Bone white / oxidized gray | archival structure and unverified context | default typography, borders, orbital records                     |
| Teal                       | verified nominal state                    | safe dispatch, validated institutions, connected nodes           |
| Amber                      | uncertainty or bounded degradation        | isolated links, thermal load, incomplete confidence              |
| Red                        | irreversible or physically lost state     | confirmed loss, critical status, terminal causal projection only |

Purple neon, glassmorphism, rounded consumer cards, bloom-heavy holograms, and decorative targeting reticles are explicitly excluded.

## Civilization consequence projection

`src/civilizationProjection.ts` converts the current HELIOS power deficit, isolation ratio, offline fraction, and thermal fraction into a transparent scenario-stress proxy. That proxy drives population and institutional-trust projections across four horizons.

These figures are scenario outputs, not demographic forecasts. Their purpose is to make delayed operational consequence legible. Normal state stays quiet; compound communication and demand failures can cross an irreversible display threshold; clearing temporary incidents returns the projection to its nominal envelope. Automated tests cover all three behaviors.

## Interaction discipline

- Routine motion is slow orbital drift and low-amplitude telemetry change.
- Warnings do not pulse or glow unless operator attention is required.
- Red is never used for branding or decoration.
- FIRST LIGHT remains the primary commissioned scenario and evidence surface.
- Every projected consequence must trace back to visible current state rather than an arbitrary score.
- The orbital map supports direct collector selection, while the three named civilization sites provide keyboard-accessible inspection entry points.
- A selected collector remains bound to live control ticks. Its local record exposes health, link and thermal margins, power, nearby mode composition, active hazards, and the controller's recommended action.
- Selecting an authenticated neighbor moves the inspection context through the mesh; closing the record returns to the unchanged civilization-scale view.

### Local-system inspection

![Collector and authenticated-neighbor inspection](assets/ruin-satellite-inspection.png)

## Reference states

### Nominal civilization envelope

![Nominal RUIN HUD](assets/ruin-hud-nominal.png)

### Compound communication and demand failure

![Compound-failure RUIN HUD](assets/ruin-hud-compound.png)
