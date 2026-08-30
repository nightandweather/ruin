/**
 * HYGEIA — crew radiation-health operations.
 *
 * Grounded anchors: the MSL/RAD cruise measurement of the deep-space
 * galactic-cosmic-ray (GCR) environment (~1.8 mSv/day behind light
 * shielding), the August 1972 and October 2003 solar particle events (SPE)
 * as canonical storm magnitudes, and NASA's 600 mSv career effective-dose
 * standard (NASA-STD-3001). Exponential attenuation lengths, suit factors,
 * EVA multipliers, and event free-space doses are RUIN scenario
 * coefficients, not radiation-transport results — see concepts/hygeia.
 *
 * The non-negotiable invariant is fail-closed assignment: a mission whose
 * conservative upper-bound dose would exceed the career allowance for any
 * crew member is NO-GO. The system must never propose the assignment and
 * let a human argue it back in.
 */

export type SpeEvent = "none" | "moderate" | "oct-2003" | "aug-1972";
export type HygeiaIncident = "none" | "dosimeter-drift" | "shelter-power-loss";
export type HygeiaReadiness = "GO" | "CONDITIONAL" | "NO-GO";

export interface HygeiaConfig {
  crewCount: number;
  missionDays: number;
  /** Habitat hull areal density, g/cm² aluminium-equivalent. */
  habitatShieldGcm2: number;
  /** Extra areal density of the storm shelter, on top of the hull. */
  shelterExtraGcm2: number;
  shelterCapacity: number;
  /** Scheduled EVA hours per crew member per week. */
  evaHoursPerWeek: number;
  /** Warning lead time from heliophysics monitors before SPE onset, minutes. */
  speWarningMinutes: number;
  /** Time to abort an EVA and reach the shelter, minutes. */
  evaRecallMinutes: number;
  /** Career effective dose already accumulated by the most-exposed crew member. */
  priorCareerMSv: number;
  spe: SpeEvent;
  incident: HygeiaIncident;
}

/** MSL/RAD cruise GCR rate, mSv/day, behind light shielding (grounded anchor). */
export const GCR_FREE_MSV_DAY = 1.8;
/** NASA-STD-3001 career effective-dose standard, mSv (grounded anchor). */
export const CAREER_LIMIT_MSV = 600;
/** GCR fraction that no practical shielding mass removes (scenario coefficient). */
const GCR_FLOOR = 0.35;
/** e-folding areal densities, g/cm² (scenario coefficients). */
const GCR_EFOLD_GCM2 = 65;
const SPE_EFOLD_GCM2 = 24;
/** Suit areal density and EVA exposure multiplier (scenario coefficients). */
const SUIT_GCM2 = 0.4;
const EVA_GCR_FACTOR = 1.7;
/** Conservative measurement bound applied when dosimetry is suspect. */
const DRIFT_BOUND_FACTOR = 1.3;

/** Free-space SPE doses at ~1 AU behind minimal shielding, mSv (scenario table). */
export const SPE_META: Record<SpeEvent, { name: string; freeSpaceMSv: number; detail: string }> = {
  none: { name: "QUIET SUN", freeSpaceMSv: 0, detail: "No proton event in the forecast window" },
  moderate: { name: "MODERATE SPE", freeSpaceMSv: 350, detail: "Routine storm; shelter drill expected" },
  "oct-2003": { name: "OCT-2003 CLASS", freeSpaceMSv: 900, detail: "Halloween-storm analogue" },
  "aug-1972": { name: "AUG-1972 CLASS", freeSpaceMSv: 2600, detail: "Canonical worst-observed proton event" },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function hygeiaConfig(): HygeiaConfig {
  return {
    crewCount: 12,
    missionDays: 180,
    habitatShieldGcm2: 20,
    shelterExtraGcm2: 25,
    shelterCapacity: 12,
    evaHoursPerWeek: 6,
    speWarningMinutes: 30,
    evaRecallMinutes: 25,
    priorCareerMSv: 120,
    spe: "moderate",
    incident: "none",
  };
}

const gcrRate = (shieldGcm2: number) =>
  GCR_FREE_MSV_DAY * (GCR_FLOOR + (1 - GCR_FLOOR) * Math.exp(-Math.max(0, shieldGcm2) / GCR_EFOLD_GCM2));

const speDose = (event: SpeEvent, shieldGcm2: number) =>
  SPE_META[event].freeSpaceMSv * Math.exp(-Math.max(0, shieldGcm2) / SPE_EFOLD_GCM2);

export function evaluateHygeia(c: HygeiaConfig) {
  const crew = Math.max(1, Math.floor(c.crewCount));
  const days = Math.max(1, c.missionDays);

  // Chronic GCR inside the hull, plus the EVA supplement in a thin suit.
  const habitatGcrMSvDay = gcrRate(c.habitatShieldGcm2);
  const evaGcrMSvHour = (gcrRate(SUIT_GCM2) / 24) * EVA_GCR_FACTOR;
  const evaHours = Math.max(0, c.evaHoursPerWeek) * (days / 7);
  const chronicMSv = habitatGcrMSvDay * days + evaGcrMSvHour * evaHours;

  // Storm doses by refuge quality.
  const shelterShield = c.habitatShieldGcm2 + Math.max(0, c.shelterExtraGcm2);
  const speShelterMSv = speDose(c.spe, shelterShield);
  const speHabitatMSv = speDose(c.spe, c.habitatShieldGcm2);
  const speSuitMSv = speDose(c.spe, SUIT_GCM2);

  // Shelter power loss forces the shelter to hull-only protection.
  const effectiveShelterMSv = c.incident === "shelter-power-loss" ? speHabitatMSv : speShelterMSv;

  // Who rides the storm where: shelter seats first, hull for the overflow,
  // and an EVA crew caught outside if the warning cannot cover the recall.
  const shelterCapacity = Math.max(0, Math.floor(c.shelterCapacity));
  const shelterDeficit = Math.max(0, crew - shelterCapacity);
  const recallMarginMin = c.speWarningMinutes - c.evaRecallMinutes;
  const caughtOutside = recallMarginMin < 0 && c.spe !== "none" && c.evaHoursPerWeek > 0;
  // Fraction of the storm absorbed in the suit before reaching cover.
  const outsideFraction = caughtOutside ? clamp(-recallMarginMin / Math.max(1, c.evaRecallMinutes), 0, 1) : 0;

  const stormShelteredMSv = effectiveShelterMSv;
  const stormOverflowMSv = speHabitatMSv;
  const stormEvaMSv = speSuitMSv * outsideFraction + effectiveShelterMSv * (1 - outsideFraction);

  const worstStormMSv = Math.max(
    stormShelteredMSv,
    shelterDeficit > 0 ? stormOverflowMSv : 0,
    caughtOutside ? stormEvaMSv : 0,
  );

  // The planning number is a conservative upper bound; suspect dosimetry
  // widens it. Bounds decide limits — never the optimistic estimate.
  const boundFactor = c.incident === "dosimeter-drift" ? DRIFT_BOUND_FACTOR : 1;
  const missionBestMSv = chronicMSv + worstStormMSv;
  const missionBoundMSv = missionBestMSv * boundFactor;
  const careerBoundMSv = c.priorCareerMSv + missionBoundMSv;
  const careerFraction = careerBoundMSv / CAREER_LIMIT_MSV;
  const careerMarginMSv = CAREER_LIMIT_MSV - careerBoundMSv;

  const constraints = [
    ...(careerMarginMSv < 0
      ? [
          `Career bound ${careerBoundMSv.toFixed(0)} mSv exceeds the ${CAREER_LIMIT_MSV} mSv allowance — assignment refused`,
        ]
      : []),
    ...(shelterDeficit > 0
      ? [`${shelterDeficit} crew have no shelter seat and ride storms on the hull`]
      : []),
    ...(caughtOutside
      ? [
          `EVA recall needs ${c.evaRecallMinutes} min but warning gives ${c.speWarningMinutes} — crew caught in suit`,
        ]
      : []),
    ...(c.incident === "dosimeter-drift"
      ? [
          `Dosimetry suspect; planning against a ${((DRIFT_BOUND_FACTOR - 1) * 100).toFixed(0)}% widened bound`,
        ]
      : []),
    ...(c.incident === "shelter-power-loss"
      ? ["Shelter environmental power lost; refuge downgraded to hull shielding"]
      : []),
    ...(careerFraction > 0.85 && careerMarginMSv >= 0
      ? ["Career allowance margin under 15% — rotation planning required"]
      : []),
  ];

  const hard = careerMarginMSv < 0;
  const readiness: HygeiaReadiness = hard ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    c.spe !== "none" && (shelterDeficit > 0 || c.incident === "shelter-power-loss")
      ? "SHELTER TRIAGE"
      : caughtOutside
        ? "EVA RECALL"
        : c.spe !== "none"
          ? "SHELTER-IN-PLACE"
          : readiness === "GO"
            ? "NOMINAL OPS"
            : "MISSION HOLD";

  return {
    crew,
    habitatGcrMSvDay,
    chronicMSv,
    evaHours,
    speShelterMSv,
    speHabitatMSv,
    speSuitMSv,
    stormEvaMSv,
    worstStormMSv,
    shelterShield,
    shelterDeficit,
    recallMarginMin,
    caughtOutside,
    outsideFraction,
    missionBestMSv,
    missionBoundMSv,
    careerBoundMSv,
    careerFraction,
    careerMarginMSv,
    readiness,
    safeMode,
    constraints,
  };
}
