# WATCHFLOOR — the control room as a modelled system

Every SENTINEL fault-response plan in this repository ends the same way: _the operator decides._ That step has always been free. WATCHFLOOR prices it. The physics of the plant is not the subject here; the humans holding it are.

## Executable contract

A watch runs minute by minute against a bursty alarm stream — faults are correlated, so alarms arrive in waves rather than at a flat rate. Crew throughput is capacity times attention, and attention is the product of three decays: fatigue across the shift, task saturation as the queue deepens, and a warm-up penalty on every incoming shift. Handover moves work in the wrong direction: part of the open queue loses the context that made it tractable and returns as fresh, unowned load, and a share of open criticals is orphaned outright — nobody on the incoming shift knows the item was ever urgent.

Two distinct ways to lose a critical alarm are modelled separately. It can **age out**: buried by volume, because finding the critical item in a deep queue is itself work, and a flooded floor is worked first-come. Or it can be **dismissed**: below a confidence threshold set by accumulated false-alarm exposure, a real critical is written off as another spurious one and never worked at all. The cry-wolf incident produces missed interventions with a completely calm board — nothing on the display looks wrong.

The decision window is twenty minutes minus the one-way signal delay. A command that cannot arrive in time was never available, which is where THEMIS's light-lag envelope becomes a staffing problem.

Incidents: **alarm flood** (six-fold arrivals for seventy minutes), **console loss** (half the crew off station), **cry wolf** (false-alarm exposure teaches deferral), and **handover collision** (the shift change lands on a burst peak).

**Safety invariant — a saturated floor takes no irreversible action.** While unacknowledged alarms exceed forty, authority for irreversible commands is withdrawn by the model and returns only after the queue is genuinely drained. A saturated crew may still safe, isolate, and observe.

## Sourced baseline and speculation

- Alarm flooding and operator overload are documented process-control failure modes; industrial alarm-management guidance exists precisely because unmanaged alarm rates defeat crews.
- Shift handover is a recognised defect source in both clinical and industrial operations, and the cry-wolf effect on alarm response is an established human-factors finding.
- Every rate, coefficient, fatigue curve, and threshold in the model is a RUIN scenario parameter. This is not a staffing standard and must never be read as one.

## Next layers

1. Drive the alarm stream from real SENTINEL fault-response plans rather than a synthetic rate, so each alarm carries its own window and safing action.
2. Let CENSUS and THEMIS consume the authority state directly: a saturated floor should block irreversible action across the whole laboratory, not only inside this module.
3. Model expertise as distinct from headcount — a crew of one who knows the plant against three who do not.
4. Add the operator's own record: what a crew is told after a missed intervention, and how that changes the next watch.
