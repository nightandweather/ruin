# CHRONOS — simultaneity, causal order, and command freshness

Every other laboratory in RUIN uses light-lag as a parameter. THEMIS asks whether a veto can physically arrive; ODYSSEY puts light-time in the navigation budget; WATCHFLOOR subtracts it from the decision window. None of them treats it as the subject, and the subject is not the delay. It is that beyond a certain radius there is no civilization-wide "now" at all: two settlements can disagree about which of two events happened first, and both are right.

## Executable contract

Six sites at real distances share one ledger station: the Moon at 1.28 light-seconds, a HELIOS collector at 0.6 AU, a Jovian waystation, a Kuiper relay at 40 AU, an ODYSSEY cruiser 1.2 light-years out running at its own clock rate, and Proxima Centauri at 4.2465 light-years. Each emits events on a deterministic schedule. The ledger has to write down what happened in what order.

Three recording policies, and only one of them is honest:

| Policy               | Fabricated order | Inverted causality |
| -------------------- | ---------------- | ------------------ |
| Order by receipt     | 124 pairs        | none               |
| Order by local clock | 124 pairs        | 3 pairs            |
| Partial order        | none             | none               |

Ordering by receipt never puts an effect before its cause — a report cannot reach the station ahead of a report of the thing that caused it — but it invents a sequence for every spacelike-separated pair. Ordering by the timestamp each site wrote is worse: a clock running slow reports smaller numbers, so a later event on the cruiser is filed ahead of an earlier one elsewhere, and the ledger records effects before their causes. Set the cruiser's velocity to zero and those inversions vanish; they were relativity, not a defect in the recorder.

Alongside the ledger the module settles three operational consequences. A command answers a state one round trip old, so only sites inside the decision window may receive an irreversible one. Delegated authority that cannot be refreshed inside its validity has to expire closed, which puts the cruiser and Proxima on local autonomy or nothing. And a shared present exists only inside half the synchronisation tolerance — at one minute, that is the Moon and nothing else.

Incidents: a **deep relay outage**, a **frame shift** where the cruiser changes velocity mid-run so its earlier stamps are on another scale, and an **oscillator drift** that takes the last shared present away — a perfect link to a drifting clock buys no agreement about now.

The relay outage is the one worth sitting with. The recording policy does not change; the distant sites simply stop arriving, and with them every pair that exposed the policy. A broken ledger comes back clean because the civilization went deaf.

**Safety invariant — the ledger never lies about order.** Events separated by more space than light crosses in the time between them have no frame-independent sequence, so none is recorded; they are written as concurrent. An effect is never recorded before its cause. A policy producing either is refused by the model, and the ledger is withheld rather than annotated.

## Sourced baseline and speculation

- Relativity of simultaneity is standard physics: for any spacelike-separated pair there exist valid frames in which either event came first, so a frame-independent order does not exist to be recorded. Time dilation by the Lorentz factor γ = 1/√(1−v²/c²) is likewise standard.
- The site distances are real orbital and stellar distances, and the Proxima figure is the same 4.2465 light-years ATLAS carries.
- The model works in one reference frame with distances along a single axis. That is enough to decide spacelike separation exactly, and it is not a relativistic solver: no frame transformations, no curved spacetime, no acceleration profile beyond a single mid-run velocity change.
- The event schedule, drift rate, and every operational threshold are RUIN scenario parameters.

## Next layers

1. Give THEMIS the authority-expiry calculation directly, so a grant that cannot be refreshed is refused at issue rather than reported afterwards.
2. Feed WATCHFLOOR: the decision window it subtracts light-lag from should come from this module rather than from a slider.
3. Version the ledger itself — a partial order is a data structure, and RELIQUARY should be able to archive one without flattening it into a list.
4. Model disagreement as a first-class outcome: two settlements holding incompatible-but-valid orderings of the same events, and what reconciliation costs when neither is wrong.
