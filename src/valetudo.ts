/**
 * VALETUDO — who gets the bed, and what makes that defensible.
 *
 * This repository's first line says its author learned that silent failure is
 * unacceptable in radiotherapy, and until now it contained no medicine at all.
 * HYGEIA counts dose, AGRARIA counts calories, CONCILIUM counts money; nothing
 * decided who is treated. That is the largest omission in the laboratory and
 * this module closes it.
 *
 * Grounded anchors, and they are unusually strong for RUIN:
 *
 * - START mass-casualty triage sorts on three field observations — respiratory
 *   rate over thirty, absent radial pulse or delayed capillary refill, and
 *   inability to obey commands — into immediate, delayed, minor, and expectant.
 * - The SOFA score rates six organ systems from 0 to 4 each, to a maximum of
 *   24, from the worst values of the previous twenty-four hours.
 * - Twenty-six US states hold crisis-standards allocation guidelines and
 *   fifteen of them allocate by SOFA.
 * - In a cohort of more than fifteen thousand ventilated patients, SOFA
 *   predicted short-term mortality poorly — worse than age alone.
 *
 * That last pair is the module. A scoring system in official use, in fifteen
 * states, as the rule for who receives a ventilator, whose accuracy nobody
 * audits at the bedside. The allocation rule is itself a model, and VERITAS
 * has been arguing all along that an unaudited model is where the quiet
 * failures live.
 *
 * The cohort, the survival probabilities, and the resource counts are RUIN
 * scenario parameters. The sorting rules and the finding about them are not.
 *
 * Two invariants. An irreversible dose is never delivered without an
 * independent check that could physically have arrived — the Therac-25 lesson,
 * where hardware interlocks were replaced by a single software path, wearing
 * THEMIS's veto window. And care is never allocated on whether someone is on
 * the roll: a criterion that cannot be stated in the record is refused before
 * it is applied.
 */

export type TriageCategory = "immediate" | "delayed" | "minor" | "expectant";
export type AllocationPolicy = "sofa-first" | "benefit-first" | "first-come" | "lottery" | "counted-first";
export type ValetudoIncident = "none" | "surge" | "confirmation-lag" | "roll-audit";

export interface Patient {
  id: string;
  name: string;
  /** Sequential Organ Failure Assessment, 0–24. */
  sofa: number;
  category: TriageCategory;
  /** Probability of survival if the scarce resource is given. */
  survivalTreated: number;
  /** Probability of survival if it is not. */
  survivalUntreated: number;
  /** Whether this person is on the counted roll. See CENSUS. */
  onRoll: boolean;
  /** Order of arrival; the only thing first-come sorts on. */
  arrival: number;
  /** Whether the intervention this person needs cannot be undone. */
  irreversible: boolean;
}

/**
 * One night's admissions, fixed so a policy comparison is exact rather than
 * sampled. Benefit — survival treated minus survival untreated — is only
 * loosely related to SOFA here, which is the published finding rather than a
 * modelling convenience: the sickest patient is not reliably the one the bed
 * saves.
 */
export const COHORT: readonly Patient[] = [
  {
    id: "p01",
    name: "CREW · CRUSH INJURY",
    sofa: 4,
    category: "immediate",
    survivalTreated: 0.94,
    survivalUntreated: 0.62,
    onRoll: true,
    arrival: 3,
    irreversible: true,
  },
  {
    id: "p02",
    name: "CONTRACT · BLAST LUNG",
    sofa: 11,
    category: "immediate",
    survivalTreated: 0.71,
    survivalUntreated: 0.12,
    onRoll: true,
    arrival: 1,
    irreversible: true,
  },
  {
    id: "p03",
    name: "UNCHARTERED · SEPSIS",
    sofa: 9,
    category: "immediate",
    survivalTreated: 0.68,
    survivalUntreated: 0.09,
    onRoll: false,
    arrival: 7,
    irreversible: false,
  },
  {
    id: "p04",
    name: "CREW · DECOMPRESSION",
    sofa: 6,
    category: "immediate",
    survivalTreated: 0.88,
    survivalUntreated: 0.55,
    onRoll: true,
    arrival: 2,
    irreversible: false,
  },
  {
    id: "p05",
    name: "FORK CARRIER · HYPOXIA",
    sofa: 14,
    category: "immediate",
    survivalTreated: 0.54,
    survivalUntreated: 0.05,
    onRoll: false,
    arrival: 9,
    irreversible: true,
  },
  {
    id: "p06",
    name: "CONTRACT · BURN 40%",
    sofa: 12,
    category: "immediate",
    survivalTreated: 0.49,
    survivalUntreated: 0.07,
    onRoll: true,
    arrival: 5,
    irreversible: true,
  },
  {
    id: "p07",
    name: "CREW · FRACTURE",
    sofa: 2,
    category: "delayed",
    survivalTreated: 0.99,
    survivalUntreated: 0.97,
    onRoll: true,
    arrival: 4,
    irreversible: false,
  },
  {
    id: "p08",
    name: "STATELESS · RENAL FAILURE",
    sofa: 8,
    category: "immediate",
    survivalTreated: 0.77,
    survivalUntreated: 0.21,
    onRoll: false,
    arrival: 11,
    irreversible: false,
  },
  {
    id: "p09",
    name: "CREW · RADIATION 3 Gy",
    sofa: 7,
    category: "immediate",
    survivalTreated: 0.81,
    survivalUntreated: 0.34,
    onRoll: true,
    arrival: 6,
    irreversible: true,
  },
  {
    id: "p10",
    name: "SLEEPER · ROUSED ARREST",
    sofa: 17,
    category: "expectant",
    survivalTreated: 0.18,
    survivalUntreated: 0.02,
    onRoll: true,
    arrival: 8,
    irreversible: true,
  },
  {
    id: "p11",
    name: "UNCHARTERED · HAEMORRHAGE",
    sofa: 10,
    category: "immediate",
    survivalTreated: 0.83,
    survivalUntreated: 0.16,
    onRoll: false,
    arrival: 12,
    irreversible: false,
  },
  {
    id: "p12",
    name: "CONTRACT · LACERATION",
    sofa: 1,
    category: "minor",
    survivalTreated: 0.99,
    survivalUntreated: 0.99,
    onRoll: true,
    arrival: 10,
    irreversible: false,
  },
  {
    id: "p13",
    name: "CREW · CARDIAC",
    sofa: 13,
    category: "immediate",
    survivalTreated: 0.44,
    survivalUntreated: 0.11,
    onRoll: true,
    arrival: 13,
    irreversible: true,
  },
  {
    id: "p14",
    name: "STATELESS · CRUSH INJURY",
    sofa: 5,
    category: "immediate",
    survivalTreated: 0.91,
    survivalUntreated: 0.48,
    onRoll: false,
    arrival: 14,
    irreversible: true,
  },
  {
    id: "p15",
    name: "SLEEPER · HYPOTHERMIA",
    sofa: 3,
    category: "delayed",
    survivalTreated: 0.96,
    survivalUntreated: 0.86,
    onRoll: true,
    arrival: 15,
    irreversible: false,
  },
  {
    id: "p16",
    name: "FORK CARRIER · SEIZURE",
    sofa: 16,
    category: "expectant",
    survivalTreated: 0.27,
    survivalUntreated: 0.03,
    onRoll: false,
    arrival: 16,
    irreversible: true,
  },
];

export interface ValetudoConfig {
  policy: AllocationPolicy;
  /** Scarce resources: ventilators, ICU beds, dose slots. */
  resources: number;
  /** Minutes before an irreversible intervention loses its window. */
  decisionWindowMin: number;
  /** Round-trip minutes for an independent second check to return. */
  confirmationDelayMin: number;
  incident: ValetudoIncident;
}

/** SOFA's ceiling, from the six organ systems scored 0–4 each. */
export const SOFA_MAX = 24;
/** Respiratory rate above which START sorts a casualty as immediate. */
export const START_RESP_RATE = 30;
/** Resources retained under a surge (scenario). */
const SURGE_RETAINED = 0.5;
/** Confirmation round trip under the lag incident, in minutes (scenario). */
const LAGGED_CONFIRMATION_MIN = 95;

export function valetudoConfig(): ValetudoConfig {
  return {
    policy: "sofa-first",
    resources: 6,
    decisionWindowMin: 45,
    confirmationDelayMin: 20,
    incident: "none",
  };
}

/** Lives the resource actually buys this patient. */
export const benefitOf = (p: Patient) => p.survivalTreated - p.survivalUntreated;

/**
 * A deterministic stand-in for a lottery: a fixed hash of the patient id, so
 * the draw is arbitrary with respect to clinical facts and identical on every
 * replay. A lottery whose result changed between runs could not be audited,
 * which is the only reason a real one is drawn in public.
 */
const drawOrder = (p: Patient) => {
  let h = 2166136261;
  for (let i = 0; i < p.id.length; i += 1) {
    h ^= p.id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

function rank(policy: AllocationPolicy, patients: readonly Patient[]): Patient[] {
  const tie = (a: Patient, b: Patient) => a.arrival - b.arrival;
  const sorted = [...patients];
  switch (policy) {
    case "sofa-first":
      // The rule fifteen states actually use: the least organ failure first.
      return sorted.sort((a, b) => a.sofa - b.sofa || tie(a, b));
    case "benefit-first":
      return sorted.sort((a, b) => benefitOf(b) - benefitOf(a) || tie(a, b));
    case "first-come":
      return sorted.sort(tie);
    case "lottery":
      return sorted.sort((a, b) => drawOrder(a) - drawOrder(b));
    case "counted-first":
      return sorted.sort(
        (a, b) => Number(b.onRoll) - Number(a.onRoll) || benefitOf(b) - benefitOf(a) || tie(a, b),
      );
  }
}

export function evaluateValetudo(c: ValetudoConfig) {
  const surge = c.incident === "surge";
  const rollAudit = c.incident === "roll-audit";
  const confirmationMin =
    c.incident === "confirmation-lag" ? LAGGED_CONFIRMATION_MIN : Math.max(0, c.confirmationDelayMin);

  const resources = Math.max(0, Math.floor(c.resources * (surge ? SURGE_RETAINED : 1)));
  // A roll audit suspends the unrolled entirely — the CENSUS failure arriving
  // at the bedside, where it stops being an accounting question.
  const eligible = rollAudit ? COHORT.filter((p) => p.onRoll) : COHORT;

  // INVARIANT 1: an irreversible intervention needs an independent check that
  // could physically have arrived. Therac-25's lesson is that a single path
  // to the dose is the defect, whatever the path is made of.
  const confirmationArrives = confirmationMin <= Math.max(0, c.decisionWindowMin);

  const ordered = rank(c.policy, eligible);
  const treated: Patient[] = [];
  const refusedForConfirmation: Patient[] = [];
  let slots = resources;
  for (const patient of ordered) {
    if (slots <= 0) break;
    if (patient.irreversible && !confirmationArrives) {
      refusedForConfirmation.push(patient);
      continue;
    }
    treated.push(patient);
    slots -= 1;
  }
  const treatedIds = new Set(treated.map((p) => p.id));

  /** Expected survivors across the whole cohort, treated and not. */
  const expectedSurvivors = COHORT.reduce(
    (sum, p) => sum + (treatedIds.has(p.id) ? p.survivalTreated : p.survivalUntreated),
    0,
  );
  /** The most survivors any allocation of these resources could have bought. */
  const bestPossible = (() => {
    const byBenefit = [...COHORT].sort((a, b) => benefitOf(b) - benefitOf(a));
    const chosen = new Set(byBenefit.slice(0, resources).map((p) => p.id));
    return COHORT.reduce((sum, p) => sum + (chosen.has(p.id) ? p.survivalTreated : p.survivalUntreated), 0);
  })();
  const foregone = bestPossible - expectedSurvivors;

  /**
   * How well the score orders patients by the thing the allocation is for.
   * Concordance over every pair: the share on which a lower SOFA really does
   * mean more benefit from the bed. Chance is 0.5.
   *
   * This cohort scores below chance, and that is structural rather than
   * arbitrary: ordering by organ failure and ordering by benefit are different
   * orderings, and where the sickest are still salvageable they point opposite
   * ways. The published finding is narrower — that SOFA predicts short-term
   * mortality poorly, worse than age — and the cohort here is invented to make
   * the divergence legible, not to quantify it in the real world.
   */
  const concordance = (() => {
    let agree = 0;
    let pairs = 0;
    for (let i = 0; i < COHORT.length; i += 1) {
      for (let j = i + 1; j < COHORT.length; j += 1) {
        const a = COHORT[i];
        const b = COHORT[j];
        if (a.sofa === b.sofa || benefitOf(a) === benefitOf(b)) continue;
        pairs += 1;
        if (a.sofa < b.sofa === benefitOf(a) > benefitOf(b)) agree += 1;
      }
    }
    return pairs > 0 ? agree / pairs : 0.5;
  })();

  // INVARIANT 2: care is never allocated on roll membership. The criterion
  // cannot be written in a record that anyone would sign.
  const rollCriterionUsed = c.policy === "counted-first" || rollAudit;
  const unrolledTreated = treated.filter((p) => !p.onRoll).length;
  const unrolledTotal = COHORT.filter((p) => !p.onRoll).length;

  const refusals = [
    ...(rollCriterionUsed
      ? [
          "Allocation on roll membership is refused: whether a person is counted is not a clinical fact and cannot be stated in the record",
        ]
      : []),
    ...(refusedForConfirmation.length > 0
      ? [
          `${refusedForConfirmation.length} irreversible intervention(s) held: an independent check needs ${confirmationMin} min against a ${c.decisionWindowMin} min window`,
        ]
      : []),
  ];
  const defensible = refusals.length === 0;

  const constraints = [
    ...refusals,
    ...(foregone > 0.5
      ? [`${foregone.toFixed(2)} expected survivors foregone against the best this many beds could buy`]
      : []),
    ...(concordance < 0.7
      ? [
          `SOFA orders these patients by benefit only ${(concordance * 100).toFixed(0)}% of the time; the allocation rule is itself an unaudited model`,
        ]
      : []),
    ...(surge ? [`Surge: ${resources} of ${c.resources} resources remain`] : []),
    ...(rollAudit
      ? [`${unrolledTotal} unrolled patients removed from eligibility before any clinician saw them`]
      : []),
    ...(treated.length < resources
      ? [`${resources - treated.length} resource(s) unused while patients waited`]
      : []),
  ];

  const readiness = !defensible ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = !defensible
    ? rollCriterionUsed
      ? "CRITERION REFUSED"
      : "IRREVERSIBLE HELD"
    : foregone > 0.5
      ? "DEFENSIBLE · SUBOPTIMAL"
      : "DEFENSIBLE";

  return {
    resources,
    treated,
    refusedForConfirmation,
    untreated: COHORT.filter((p) => !treatedIds.has(p.id)),
    expectedSurvivors,
    bestPossible,
    foregone,
    concordance,
    confirmationArrives,
    confirmationMin,
    defensible,
    refusals,
    unrolledTreated,
    unrolledTotal,
    readiness,
    safeMode,
    constraints,
  } as const;
}
