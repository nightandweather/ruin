# Transit Gate

> A transportation network in which arrival is easy to imagine and safe departure is the real systems problem.

“Teleportation” describes at least three different ideas. RUIN keeps them separate so a real quantum protocol is not presented as evidence for fictional human transport.

| Mode | What moves | Current scientific status | RUIN problem |
| --- | --- | --- | --- |
| Quantum teleportation | An unknown quantum state | Real protocol; requires shared entanglement and classical communication | Entanglement inventory, noise, fidelity, and delayed completion |
| Traversable wormhole | Matter through a spacetime shortcut | Theoretical and highly speculative; physical creation and stability are unknown | Gate stability, causality, traffic control, and safe shutdown |
| Reconstruction transit | A measured description used to reconstruct matter | Fictional for people and macroscopic objects | Identity, destructive commit, verification, and duplicate prevention |

## Sourced foundations

The 1993 quantum teleportation protocol transfers quantum information using a shared entangled state and classical communication. It does not transport matter and cannot be used to communicate faster than light. Traversable-wormhole work explores mathematical spacetime models, but whether such structures can exist or be maintained is unresolved and connected to difficult energy and causality questions.

Primary references:

- [Bennett et al., “Teleporting an Unknown Quantum State via Dual Classical and EPR Channels”](https://research.ibm.com/publications/teleporting-an-unknown-quantum-state-via-dual-classical-and-einstein-podolsky-rosen-channels)
- [IBM Quantum Learning: Quantum Teleportation](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/quantum-teleportation)
- [Morris, Thorne, and Yurtsever, “Wormholes, Time Machines, and the Weak Energy Condition”](https://doi.org/10.1103/PhysRevLett.61.1446)

## State model

| Entity | Important state | Decisions |
| --- | --- | --- |
| Gate endpoint | peer identity, synchronization, capacity, quarantine state | pair, open, hold, sever |
| Transit manifest | payload identity, consent, destination, integrity digest | accept, reject, expire |
| Quantum link | entangled pairs, measured fidelity, classical acknowledgement | reserve, consume, regenerate |
| Wormhole model | throat stability, tidal bound, mouth clock offset, energy reserve | stabilize, derate, close |
| Reconstruction transaction | source lock, destination readiness, verification, commit record | prepare, commit, abort |
| Causality ledger | event order, clock uncertainty, forbidden cycles | authorize, delay, isolate |

## Safety invariants

- A gate must never accept entry without a fresh acknowledgement from the exact destination endpoint.
- Quantum mode must never report completion before the required classical information arrives.
- A reconstruction transaction must never permit two active instances of one identity.
- Failure before commit must leave the source recoverable; failure after commit must leave one authoritative audit record.
- A wormhole route whose clock offset could create a forbidden causal cycle must remain closed.
- Throughput, political priority, or emergency demand must not bypass integrity and destination checks.

## Failure scenarios

1. **Destination disappears after preparation** — abort without destroying or releasing the source.
2. **Identity digest mismatch** — quarantine the reconstruction and preserve evidence without activating it.
3. **Entanglement exhaustion** — queue quantum-state transfers while classical traffic continues normally.
4. **Gate clock divergence** — stop new transit and reconcile the causality ledger.
5. **Wormhole stability decay** — drain the route, prevent new entry, and isolate both mouths.
6. **Conflicting commit records** — freeze both endpoints and require an explicit continuity ruling.

## Smallest useful simulation

Build three gates with finite capacity and imperfect clocks. A traveler or cargo manifest requests transit. The controller then:

1. Resolves the destination and reserves capacity.
2. Selects quantum-information, wormhole, or reconstruction rules.
3. Checks synchronization, integrity, and causality constraints.
4. Runs a prepare phase at both endpoints.
5. Injects one failure before or during commit.
6. Produces exactly one of `arrived`, `aborted safely`, or `quarantined`.
7. Leaves an event chain explaining why.

The first interface should visualize the two endpoints and the transaction state rather than show a decorative portal. The interesting question is: **what evidence would convince two distant systems that one transit completed exactly once?**

## Interview and learning value

Under the SF surface, this module teaches distributed transactions, idempotency, consensus limits, logical clocks, identity models, fault containment, and safety-critical state machines.
