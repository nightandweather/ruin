# VALETUDO — who gets the bed, and what makes that defensible

This repository's first line says its author learned that silent failure is unacceptable in radiotherapy, and until now it contained no medicine at all. HYGEIA counts dose, AGRARIA counts calories, CONCILIUM counts money; nothing decided who is treated. That was the largest omission in the laboratory.

## The finding this exists for

The sorting rule is itself a model, and nobody audits it at the bedside.

Twenty-six US states hold crisis-standards allocation guidelines and fifteen of them allocate by SOFA — a score of six organ systems, 0 to 4 each, from the worst values of the previous twenty-four hours. In a cohort of more than fifteen thousand ventilated patients, SOFA predicted short-term mortality poorly, worse than age alone.

That is a scoring system in official use, in fifteen jurisdictions, as the rule for who receives a ventilator, whose accuracy is not checked where it is applied. VERITAS has been making the same argument about models generally since it was written. VALETUDO makes it about this one.

Against an invented cohort of sixteen admissions and six beds:

| Rule                  | Expected survivors | Lives foregone |
| --------------------- | ------------------ | -------------- |
| Greatest benefit      | 9.04               | 0              |
| Lottery               | 7.96               | 1.08           |
| First come            | 7.82               | 1.22           |
| **Lowest SOFA first** | **6.87**           | **2.17**       |

Ordering by organ failure and ordering by benefit are different orderings, and where the sickest are still salvageable they point opposite ways. In this cohort a lower SOFA predicts more benefit only 36% of the time — worse than a coin. **That figure is a property of an invented cohort, not a measurement of the world**; the published finding is narrower, and the cohort is built to make the divergence legible rather than to quantify it.

## Safety invariants

**No irreversible act without a check that could have arrived.** An independent second calculation whose round trip exceeds the decision window did not happen, whatever the record says. The Therac-25's defect was that hardware interlocks were replaced by a single software path to the dose; the lesson is redundancy that is genuinely independent, and across light-lag that means a check has to be physically able to return. This is THEMIS's veto window wearing a dosimetry badge.

The invariant costs expected survivors — about one in this cohort — and is still right. A safety rule that never costs anything has not been tested.

**Care is never allocated on who is counted.** Roll membership is not a clinical fact and cannot be written in a record anyone would sign. The model refuses the criterion before it refuses the outcome, and refuses it even though allocating on the roll would have saved more people here than the rule fifteen states use. That is the point: the objection is to the criterion, not to the arithmetic.

## Sourced baseline and speculation

Sourced: the START field sort — respiratory rate over thirty, absent radial pulse or delayed capillary refill, inability to obey commands, into immediate, delayed, minor, and expectant. SOFA's structure and its 0–24 range. The count of states allocating by it. Its poor predictive accuracy for short-term mortality. The Therac-25 sequence, and secondary dose calculation as a standard safety step.

Invented: every patient, every survival probability, the resource counts, and the confirmation timings. This is not a triage protocol and must never be read as one.

## Where it connects

- **CENSUS.** The unrolled cohorts arrive at the bedside, where being uncounted stops being an accounting question. The roll audit removes them before a clinician sees them.
- **VERITAS.** The allocation rule is a model with an accuracy, and this is the first module to score its own rule instead of applying it.
- **THEMIS and CHRONOS.** The second check is a veto window, and light-lag decides whether it exists.
- **WATCHFLOOR.** The clinician is an operator, and saturates.

## Next layers

1. Post to the authority ledger: an indefensible criterion should stop the executive, not only the ward.
2. Read the roll from CENSUS rather than a per-patient flag, so a definition amendment changes who is eligible.
3. Model the clinician's own load through WATCHFLOOR, so the second check competes for the same attention as everything else.
4. Separate the score's calibration from its discrimination — a rule can rank well and still be wrong about how many will die.
