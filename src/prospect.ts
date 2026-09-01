/**
 * PROSPECT — the ore grade is a model, and the map's biggest number is the
 * least measured one.
 *
 * Until now the laboratory's material came from a counter: FOUNDRY smelts,
 * ASCENT hauls, and somewhere upstream an inventory simply refills. This
 * module is that upstream as geology — surveyed deposits whose tonnage and
 * grade are estimates with confidence classes, not facts, where the
 * planning failure is not running out of rock but believing a number that
 * was never measured.
 *
 * Grounded anchors:
 *
 * - Mining law separates resources from reserves by confidence: the JORC
 *   Code and NI 43-101 classify resources as inferred, indicated, or
 *   measured, and an inferred resource may not be booked as a reserve.
 *   NI 43-101 exists because Bre-X's faked assays evaporated six billion
 *   dollars in 1997; the rule is written in investors' blood.
 * - Copper head grades fell from roughly 2% at 1900 to roughly 0.5% today,
 *   and the energy to produce a tonne of metal rises steeply as grade
 *   falls — grade, not tonnage, is what a mine eats and breathes.
 * - Beneficiation recovers a fraction of what the rock holds; the rest is
 *   tailings, and tailings are a stored liability with their own dam.
 *
 * The three deposits, their numbers, and every incident are RUIN scenario
 * parameters. The finding they are tuned to show: the largest surveyed
 * deposit is inferred, and inferred is another word for "mostly
 * imagination" — drill it and the estimate collapses to 40% of itself.
 * That collapse is not the survey failing; it is the survey working. The
 * booking rule that refuses to plan on it is the same fail-closed shape as
 * every other invariant in this laboratory.
 *
 * Three invariants. An inferred resource is never booked as a reserve —
 * the plan that tries is refused before a tonne moves. Mass balances:
 * rock in equals product plus tailings plus losses, to numerical
 * precision. And provenance survives planning: every booked tonne carries
 * its confidence class, so a plan can always be asked what it actually
 * knows.
 */

export type ConfidenceClass = "measured" | "indicated" | "inferred";
export type DepositId = "hearth" | "midfield" | "bignumber";
export type ProspectIncident =
  "none" | "drill-the-big-number" | "assay-drift" | "tool-shortage" | "tailings-dam";

export interface Deposit {
  id: DepositId;
  name: string;
  /** Surveyed rock, kilotonnes. */
  rockKt: number;
  /** Surveyed head grade, fraction of rock that is metal. */
  gradeEstimate: number;
  /** What the rock actually holds (scenario ground truth). */
  gradeTrue: number;
  confidence: ConfidenceClass;
  /** Spares consumed per kilotonne moved — the abrasiveness bill, t/kt. */
  toolWearTPerKt: number;
  /** Energy to mine and beneficiate one kilotonne, GWh/kt. */
  energyGWhPerKt: number;
}

/**
 * The survey as filed. HEARTH is small, rich, and measured; MIDFIELD is
 * the compromise; BIG NUMBER is the one every projection wants to cite —
 * nine thousand kilotonnes on the map, drilled exactly nowhere.
 */
export const DEPOSITS: readonly Deposit[] = [
  {
    id: "hearth",
    name: "HEARTH · MEASURED, RICH, SMALL",
    rockKt: 800,
    gradeEstimate: 0.08,
    gradeTrue: 0.078,
    confidence: "measured",
    toolWearTPerKt: 0.6,
    energyGWhPerKt: 0.9,
  },
  {
    id: "midfield",
    name: "MIDFIELD · INDICATED, MIDGRADE",
    rockKt: 2400,
    gradeEstimate: 0.045,
    gradeTrue: 0.041,
    confidence: "indicated",
    toolWearTPerKt: 1.1,
    energyGWhPerKt: 1.4,
  },
  {
    id: "bignumber",
    name: "BIG NUMBER · INFERRED, VAST",
    rockKt: 9000,
    gradeEstimate: 0.055,
    gradeTrue: 0.022,
    confidence: "inferred",
    toolWearTPerKt: 1.8,
    energyGWhPerKt: 1.6,
  },
];

export interface ProspectConfig {
  /** The deposit the plan develops. */
  develop: DepositId;
  /** Rock moved per day, kt. */
  extractionKtPerDay: number;
  /** Fraction of contained metal the plant recovers. */
  recovery: number;
  /** FOUNDRY's feedstock contract, t/day of refined metal. */
  demandTPerDay: number;
  /** LUMEN's power contract for the whole operation, GWh/day. */
  energyBudgetGWhPerDay: number;
  /** Tailings the dam can take, kt/day. */
  tailingsCapacityKtPerDay: number;
  /** Spare tooling ASCENT delivers, t/day. */
  sparesTPerDay: number;
  incident: ProspectIncident;
}

/** JORC-shaped booking factors: what fraction of an estimate a plan may count. */
export const BOOKING_FACTOR: Record<ConfidenceClass, number> = {
  measured: 1,
  indicated: 0.7,
  inferred: 0,
};

/** Drilling reveals BIG NUMBER at this fraction of its filed estimate (scenario). */
const DRILL_REVEALED_FRACTION = 0.4;
/** Assay drift inflates undrilled estimates by this factor (scenario). */
const ASSAY_DRIFT_FACTOR = 1.3;
/** Tailings capacity retained when the dam is derated (scenario). */
const DAM_RETAINED = 0.7;
/** Spares delivered under an ASCENT shortage (scenario). */
const SHORTAGE_SPARES_T = 1.5;
/** Planned-vs-realized gap worth a register entry, t/day. */
const MODEL_ERROR_NOTE_T = 10;

export function prospectConfig(): ProspectConfig {
  return {
    develop: "hearth",
    extractionKtPerDay: 3.4,
    recovery: 0.82,
    demandTPerDay: 210,
    energyBudgetGWhPerDay: 5,
    tailingsCapacityKtPerDay: 3.6,
    sparesTPerDay: 8,
    incident: "none",
  };
}

export function evaluateProspect(c: ProspectConfig) {
  const drilled = c.incident === "drill-the-big-number";
  const drift = c.incident === "assay-drift";
  const sparesTPerDay = c.incident === "tool-shortage" ? SHORTAGE_SPARES_T : Math.max(0, c.sparesTPerDay);
  const tailingsCapacity = c.tailingsCapacityKtPerDay * (c.incident === "tailings-dam" ? DAM_RETAINED : 1);

  /** The survey as the plan sees it today. */
  const deposits = DEPOSITS.map((deposit) => {
    const isBig = deposit.id === "bignumber";
    // Drilling buys truth: BIG NUMBER converges to what the rock holds and
    // earns the indicated class — a smaller number you may finally use.
    const confidence: ConfidenceClass = drilled && isBig ? "indicated" : deposit.confidence;
    const gradeEstimate =
      drilled && isBig
        ? deposit.gradeEstimate * DRILL_REVEALED_FRACTION
        : drift && confidence !== "measured"
          ? deposit.gradeEstimate * ASSAY_DRIFT_FACTOR
          : deposit.gradeEstimate;
    const bookableGrade = gradeEstimate * BOOKING_FACTOR[confidence];
    return { ...deposit, confidence, gradeEstimate, bookableGrade };
  });

  const target = deposits.find((d) => d.id === c.develop)!;

  // INVARIANT 1: an inferred resource is never booked as a reserve. The
  // plan that develops one is refused before a tonne of rock moves.
  const bookingRefused = BOOKING_FACTOR[target.confidence] === 0;

  /** What actually limits the day: tools, power, the dam, or the plan. */
  const rateByTools = target.toolWearTPerKt > 0 ? sparesTPerDay / target.toolWearTPerKt : Infinity;
  const rateByEnergy = target.energyGWhPerKt > 0 ? c.energyBudgetGWhPerDay / target.energyGWhPerKt : Infinity;
  const plannedRate = Math.max(0, c.extractionKtPerDay);
  const preDamRate = bookingRefused ? 0 : Math.min(plannedRate, rateByTools, rateByEnergy);

  /** Tailings are made by the rock, so the dam caps the rock. */
  const tailingsPerKt = 1 - target.gradeTrue * Math.min(1, Math.max(0, c.recovery));
  const rateByDam = tailingsPerKt > 0 ? tailingsCapacity / tailingsPerKt : Infinity;
  const rateKtPerDay = Math.min(preDamRate, rateByDam);

  const limiter = bookingRefused
    ? "booking rule"
    : rateKtPerDay >= plannedRate - 1e-12
      ? "plan"
      : rateKtPerDay === rateByDam && rateByDam < Math.min(rateByTools, rateByEnergy, plannedRate)
        ? "tailings dam"
        : rateByTools <= rateByEnergy
          ? "tool spares"
          : "power contract";

  /** The plan's promise, made from booked numbers. */
  const plannedProductTPerDay = plannedRate * 1000 * target.bookableGrade * c.recovery;
  /** The rock's answer. */
  const productTPerDay = rateKtPerDay * 1000 * target.gradeTrue * c.recovery;
  const tailingsKtPerDay = rateKtPerDay * tailingsPerKt;
  /** Metal the plant failed to recover — inside the tailings, and named. */
  const lossesTPerDay = rateKtPerDay * 1000 * target.gradeTrue * (1 - c.recovery);
  // INVARIANT 2: mass balances — rock in equals product plus tailings
  // (which carry the unrecovered metal), and a residue would be ore
  // invented from nothing.
  const massResidueT = Math.abs(rateKtPerDay * 1000 - (productTPerDay + tailingsKtPerDay * 1000));

  const shortfallTPerDay = Math.max(0, c.demandTPerDay - productTPerDay);
  const modelErrorTPerDay = plannedProductTPerDay - productTPerDay;
  const energyUsedGWh = rateKtPerDay * target.energyGWhPerKt;
  const energyPerProductMWhPerT = productTPerDay > 0 ? (energyUsedGWh * 1000) / productTPerDay : Infinity;
  const lifeOfMineDays = rateKtPerDay > 0 ? target.rockKt / rateKtPerDay : Infinity;
  const wearTPerDay = rateKtPerDay * target.toolWearTPerKt;

  const constraints = [
    ...(bookingRefused
      ? [
          `${target.name}: inferred booked as reserve — refused. ${target.rockKt.toLocaleString()} kt on the map, drilled nowhere; drill it before you plan on it`,
        ]
      : []),
    ...(shortfallTPerDay > 1e-9
      ? [
          `FOUNDRY feedstock short ${shortfallTPerDay.toFixed(0)} t/day against its ${c.demandTPerDay} t/day contract`,
        ]
      : []),
    ...(modelErrorTPerDay > MODEL_ERROR_NOTE_T
      ? [
          `The plan promised ${plannedProductTPerDay.toFixed(0)} t/day off booked grades; the rock pays ${productTPerDay.toFixed(0)} — the ore grade is a model`,
        ]
      : []),
    ...(!bookingRefused && limiter !== "plan"
      ? [
          `Extraction capped by the ${limiter}: ${rateKtPerDay.toFixed(2)} of ${plannedRate.toFixed(2)} kt/day`,
        ]
      : []),
    ...(drilled
      ? [
          `Drilling revealed BIG NUMBER at ${(DRILL_REVEALED_FRACTION * 100).toFixed(0)}% of its filed grade — the survey worked; the number was the failure`,
        ]
      : []),
    ...(drift
      ? ["Assay drift inflates every undrilled estimate 1.3× — and changes nothing the rock will pay"]
      : []),
    ...(tailingsKtPerDay > 1e-9
      ? [
          `${tailingsKtPerDay.toFixed(2)} kt/day of tailings banked at the dam — ${((tailingsKtPerDay / Math.max(rateKtPerDay, 1e-12)) * 100).toFixed(1)}% of everything mined`,
        ]
      : []),
  ];

  const readiness =
    bookingRefused || shortfallTPerDay > c.demandTPerDay * 0.25
      ? "NO-GO"
      : constraints.length > 0
        ? "CONDITIONAL"
        : "GO";
  const safeMode = bookingRefused
    ? "PLAN REFUSED — UNMEASURED"
    : shortfallTPerDay > 1e-9
      ? "FEEDSTOCK SHORT"
      : modelErrorTPerDay > MODEL_ERROR_NOTE_T
        ? "MODEL OPTIMISTIC"
        : "SURVEY HONEST";

  return {
    deposits,
    target,
    bookingRefused,
    limiter,
    rateKtPerDay,
    plannedProductTPerDay,
    productTPerDay,
    tailingsKtPerDay,
    lossesTPerDay,
    massResidueT,
    shortfallTPerDay,
    modelErrorTPerDay,
    energyUsedGWh,
    energyPerProductMWhPerT,
    wearTPerDay,
    lifeOfMineDays,
    constraints,
    readiness,
    safeMode,
  } as const;
}
