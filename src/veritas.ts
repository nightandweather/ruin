/**
 * VERITAS — model-reality divergence for the laboratory's own models.
 *
 * Every other module in RUIN asks whether a machine will hold. This one asks
 * whether the model of that machine still describes it. A validated model
 * does not fail loudly: the world drifts, the equations do not, and the
 * certificate on the wall keeps saying the same thing. The dangerous quantity
 * is not the error — it is the gap between the error and the error anyone can
 * see, and the years that gap stays open while decisions are still being made
 * on the output.
 *
 * Grounded anchors: model drift and the distinction between interpolation and
 * extrapolation beyond a validated envelope are standard verification and
 * validation concepts; systematic sensor bias defeats residual monitoring
 * because the residuals themselves go quiet; and anomalies dismissed as
 * instrument error are a recognised route to silent failure. The drift rates,
 * grounded fractions, and detection curve are RUIN scenario parameters — this
 * module's own numbers are exactly the kind of number it exists to distrust.
 *
 * The non-negotiable invariant is certification scope: a model whose
 * validation is stale, or which is being run outside the envelope it was
 * validated in, is refused irreversible-action authority. It may still
 * advise. It may not commit anything that cannot be undone.
 */

import { enginesGroundedFraction } from "./ignis";

export type VeritasRegime = "interpolation" | "edge" | "extrapolation";
export type VeritasIncident = "none" | "regime-shift" | "sensor-bias" | "validation-lapse";

export interface VeritasModel {
  id: string;
  name: string;
  detail: string;
  /** Share of the model derived from sourced physics rather than invention. */
  groundedFraction: number;
  /** Fractional error the world adds per year at the envelope edge. */
  driftRate: number;
}

/**
 * The laboratory's own model portfolio, rated by how much of each is sourced.
 *
 * Most ratings are still hand-entered from this repository's engineering
 * notes, which is exactly the weakness this module exists to distrust — a
 * rating typed by the same person who wrote the model is not evidence. The
 * IGNIS conventional branch is the first entry to escape that: its fraction is
 * computed from the engine table's own `grounding` declarations, so the audit
 * cannot drift away from the laboratory it audits. The rest should follow.
 */
export const VERITAS_MODELS: readonly VeritasModel[] = [
  {
    id: "helios-thermal",
    name: "HELIOS THERMAL DERATE",
    detail: "Radiative limits and safe dispatch — mostly sourced physics",
    groundedFraction: 0.8,
    driftRate: 0.014,
  },
  {
    id: "odyssey-beam",
    name: "ODYSSEY LINK BUDGET",
    detail: "Diffraction, pointing, and capture over real stellar distances",
    groundedFraction: 0.65,
    driftRate: 0.016,
  },
  {
    id: "agraria-yield",
    name: "AGRARIA CROP YIELD",
    detail: "Bioregenerative output under light, carbon, and water policy",
    groundedFraction: 0.5,
    driftRate: 0.02,
  },
  {
    id: "kessler-cascade",
    name: "KESSLER CASCADE",
    detail: "Encounter and fragment-yield coefficients — mechanism sourced, numbers invented",
    groundedFraction: 0.35,
    driftRate: 0.024,
  },
  {
    id: "mnemosyne-identity",
    name: "MNEMOSYNE EVIDENCE",
    detail: "Identity-evidence thresholds with no measured ground truth at all",
    groundedFraction: 0.15,
    driftRate: 0.032,
  },
  {
    id: "ignis-fusion",
    name: "IGNIS FUSION BRANCH",
    detail: "The one engine-table row with no article behind it; every number invented",
    groundedFraction: 0.05,
    driftRate: 0.045,
  },
];

/**
 * The portfolio, with any computed ratings resolved.
 *
 * Kept separate from the literal above so the table stays readable, and so a
 * computed entry cannot be mistaken for a typed one.
 */
export const veritasPortfolio = (): readonly VeritasModel[] => [
  ...VERITAS_MODELS.slice(0, 4),
  {
    id: "ignis-conventional",
    name: "IGNIS CONVENTIONAL",
    detail: "Chemical, Hall, and NTP reference points — rating read from the engine table",
    groundedFraction: enginesGroundedFraction(),
    driftRate: 0.018,
  },
  ...VERITAS_MODELS.slice(4),
];

export interface VeritasConfig {
  modelId: string;
  groundedFraction: number;
  driftRate: number;
  /** Independent observations of the real system per year. */
  observationRate: number;
  /** Years between recalibration campaigns. */
  calibrationCadence: number;
  regime: VeritasRegime;
  /** Share of detected anomalies written off as instrument error. */
  autoAcceptance: number;
  horizonYears: number;
  incident: VeritasIncident;
}

/** Fractional error above which decisions taken on the model are wrong. */
export const ACTION_ERROR_LIMIT = 0.15;
/** Reported error at which the model is flagged for revalidation. */
export const ALARM_THRESHOLD = 0.08;
/** Years a validation stays current before certification lapses. */
export const MAX_VALIDATION_AGE = 5;
/** Observation rate at which residual monitoring reaches 1/e of full power. */
const OBSERVATION_REF = 8;
/** Best achievable error reduction from one calibration campaign. */
const CALIBRATION_CEILING = 0.85;
/** How much sourced physics slows drift. */
const GROUNDING_SHIELD = 0.8;
const REGIME_MULTIPLIER: Record<VeritasRegime, number> = {
  interpolation: 0.5,
  edge: 1,
  extrapolation: 2.6,
};
export const REGIME_SHIFT_YEAR = 12;
export const SENSOR_BIAS_YEAR = 8;
export const VALIDATION_LAPSE_YEAR = 10;

export interface VeritasYear {
  year: number;
  trueError: number;
  reportedError: number;
  blindGap: number;
  validationAge: number;
  certified: boolean;
  silent: boolean;
}

export function veritasConfig(): VeritasConfig {
  const model = VERITAS_MODELS.find((m) => m.id === "kessler-cascade")!;
  return {
    modelId: model.id,
    groundedFraction: model.groundedFraction,
    driftRate: model.driftRate,
    observationRate: 6,
    calibrationCadence: 5,
    regime: "edge",
    autoAcceptance: 0.35,
    horizonYears: 30,
    incident: "none",
  };
}

/** Apply a portfolio model's ratings to the current configuration. */
export function withModel(config: VeritasConfig, modelId: string): VeritasConfig {
  const model = veritasPortfolio().find((m) => m.id === modelId);
  if (!model) return config;
  return {
    ...config,
    modelId: model.id,
    groundedFraction: model.groundedFraction,
    driftRate: model.driftRate,
  };
}

export function evaluateVeritas(c: VeritasConfig) {
  const horizon = Math.max(1, Math.floor(c.horizonYears));
  const cadence = Math.max(1, Math.floor(c.calibrationCadence));
  const grounded = Math.min(1, Math.max(0, c.groundedFraction));
  const acceptance = Math.min(1, Math.max(0, c.autoAcceptance));
  const observations = Math.max(0, c.observationRate);

  let trueError = 0;
  let validationAge = 0;
  let calibrations = 0;
  let firstTrueBreach: number | null = null;
  let firstReportedBreach: number | null = null;
  let certificationLapseYear: number | null = null;
  let decertifiedYears = 0;
  let maxBlindGap = 0;

  const trajectory: VeritasYear[] = [];

  for (let year = 0; year <= horizon; year += 1) {
    const lapsed = c.incident === "validation-lapse" && year > VALIDATION_LAPSE_YEAR;
    const shifted = c.incident === "regime-shift" && year >= REGIME_SHIFT_YEAR;
    const biased = c.incident === "sensor-bias" && year >= SENSOR_BIAS_YEAR;

    // Recalibration reduces the error it can see. It cannot reduce error the
    // observation programme is too thin to resolve.
    if (year > 0 && year % cadence === 0 && observations > 0 && !lapsed) {
      const efficacy = CALIBRATION_CEILING * (1 - Math.exp(-observations / OBSERVATION_REF));
      trueError *= 1 - efficacy;
      validationAge = 0;
      calibrations += 1;
    }

    const effectiveRegime: VeritasRegime = shifted ? "extrapolation" : c.regime;
    const detection =
      (1 - Math.exp(-observations / OBSERVATION_REF)) * (biased ? 0.5 : 1) * (lapsed ? 0.4 : 1);
    const reportedError = trueError * detection * (1 - acceptance);
    const blindGap = trueError - reportedError;
    maxBlindGap = Math.max(maxBlindGap, blindGap);

    // INVARIANT: certification is scope, not reputation. Stale validation or
    // operation outside the validated envelope removes irreversible authority.
    const certified = validationAge <= MAX_VALIDATION_AGE && effectiveRegime !== "extrapolation";
    if (!certified) {
      decertifiedYears += 1;
      if (certificationLapseYear === null) certificationLapseYear = year;
    }

    if (firstTrueBreach === null && trueError > ACTION_ERROR_LIMIT) firstTrueBreach = year;
    if (firstReportedBreach === null && reportedError > ALARM_THRESHOLD) firstReportedBreach = year;
    const silent = trueError > ACTION_ERROR_LIMIT && reportedError <= ALARM_THRESHOLD;

    trajectory.push({
      year,
      trueError,
      reportedError,
      blindGap,
      validationAge,
      certified,
      silent,
    });

    if (year === horizon) break;

    trueError +=
      Math.max(0, c.driftRate) * REGIME_MULTIPLIER[effectiveRegime] * (1 - grounded * GROUNDING_SHIELD);
    validationAge += 1;
  }

  const silentYears = trajectory.filter((y) => y.silent).length;
  // Years between the model becoming wrong and anyone being able to say so.
  // A model that never reports a breach stays silent for the rest of the run.
  const silentWindowYears =
    firstTrueBreach === null
      ? 0
      : firstReportedBreach === null
        ? horizon + 1 - firstTrueBreach
        : Math.max(0, firstReportedBreach - firstTrueBreach);
  const last = trajectory.at(-1)!;

  const constraints = [
    ...(silentYears > 0
      ? [
          `Silent divergence for ${silentYears} year(s) from year ${firstTrueBreach}: decisions wrong, residuals quiet`,
        ]
      : []),
    ...(certificationLapseYear !== null
      ? [`Certification lapsed in year ${certificationLapseYear}; ${decertifiedYears} year(s) advisory only`]
      : []),
    ...(c.regime === "extrapolation"
      ? ["Operating outside the validated envelope by configuration, not by accident"]
      : []),
    ...(c.incident === "sensor-bias"
      ? [
          `Systematic observation bias from year ${SENSOR_BIAS_YEAR}: the residuals went quiet, the error did not`,
        ]
      : []),
    ...(c.incident === "validation-lapse"
      ? [`Validation programme stopped after year ${VALIDATION_LAPSE_YEAR}`]
      : []),
    ...(acceptance >= 0.5
      ? [`${(acceptance * 100).toFixed(0)}% of anomalies written off as instrument error`]
      : []),
    ...(last.trueError > ACTION_ERROR_LIMIT
      ? [
          `Terminal error ${(last.trueError * 100).toFixed(1)}% above the ${(ACTION_ERROR_LIMIT * 100).toFixed(0)}% action limit`,
        ]
      : []),
  ];

  const readiness = silentYears > 0 ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    silentYears > 0
      ? "SILENT DIVERGENCE REVIEW"
      : !last.certified
        ? "ADVISORY ONLY"
        : last.trueError > ACTION_ERROR_LIMIT
          ? "REVALIDATION REQUIRED"
          : "CERTIFIED IN ENVELOPE";

  return {
    trajectory,
    model: veritasPortfolio().find((m) => m.id === c.modelId) ?? null,
    calibrations,
    firstTrueBreach,
    firstReportedBreach,
    silentYears,
    silentWindowYears,
    certificationLapseYear,
    decertifiedYears,
    maxBlindGap,
    endTrueError: last.trueError,
    endReportedError: last.reportedError,
    endCertified: last.certified,
    readiness,
    safeMode,
    constraints,
  } as const;
}
