/**
 * KESSLER — debris population dynamics for the swarm's orbital band.
 *
 * Grounded anchors: the collisional-cascade mechanism (Kessler &
 * Cour-Palais 1978) — collisions create fragments faster than any natural
 * process removes them, so past a critical density the population grows on
 * its own; and the fragmentation scale of observed breakups (thousands of
 * trackable fragments per catastrophic collision). Encounter coefficients,
 * fragment yields, and tracking fractions are RUIN scenario parameters.
 *
 * A heliocentric band at 0.4 AU has NO atmospheric drag: nothing decays.
 * Debris leaves only when actively removed — which is the operational point
 * this module exists to make experienceable.
 *
 * The non-negotiable invariant is the installation moratorium: once band
 * density crosses the cap, the model itself stops accepting new installs —
 * fail-closed, not an advisory lamp an operator may overrule.
 */

export type KesslerIncident = "none" | "breakup" | "tracking-outage";
export type KesslerReadiness = "GO" | "CONDITIONAL" | "NO-GO";

export interface KesslerConfig {
  /** Operating collectors sharing the band. */
  swarmCount: number;
  /** Tracked derelicts and large debris at year zero. */
  initialTracked: number;
  /** Lethal-but-untrackable objects at year zero. */
  initialUntracked: number;
  /** New collectors installed per year while installs are allowed. */
  installsPerYear: number;
  /** Fraction of installs that fail on arrival and become derelicts. */
  installFailureRate: number;
  /** Active debris removals per year (tracked objects only). */
  adrPerYear: number;
  /** Fraction of tracked conjunctions resolved by avoidance burns. */
  avoidanceReliability: number;
  /** Trackable fragments produced by one catastrophic collision. */
  fragmentsPerCollision: number;
  /** Untracked lethal fragments produced alongside them. */
  untrackedPerCollision: number;
  horizonYears: number;
  incident: KesslerIncident;
}

/** Annual collision expectation per debris object at 10k collectors (scenario). */
const ENCOUNTER_K = 0.00002;
/** Band density (objects per collector) above which installs are refused. */
export const MORATORIUM_DENSITY = 0.5;
/** Debris-debris collision coefficient — the cascade's own feedback (scenario). */
const CASCADE_K2 = 2e-10;
/** Collisions per year that mark the cascade as running away. */
export const RUNAWAY_COLLISIONS_PER_YEAR = 5;
/** Runaway sooner than this is an immediate NO-GO; later is a standing warning. */
export const NO_GO_RUNAWAY_YEARS = 25;
/** Population clamp keeping a saturated cascade finite. */
const POPULATION_CAP = 5_000_000;

export interface KesslerYear {
  year: number;
  tracked: number;
  untracked: number;
  collisions: number;
  swarm: number;
  installsAllowed: boolean;
}

export function kesslerConfig(): KesslerConfig {
  return {
    swarmCount: 10_000,
    initialTracked: 1200,
    initialUntracked: 900,
    installsPerYear: 400,
    installFailureRate: 0.02,
    adrPerYear: 150,
    avoidanceReliability: 0.95,
    fragmentsPerCollision: 1200,
    untrackedPerCollision: 2400,
    horizonYears: 50,
    incident: "none",
  };
}

export function evaluateKessler(c: KesslerConfig) {
  let tracked = Math.max(0, c.initialTracked);
  let untracked = Math.max(0, c.initialUntracked);
  let swarm = Math.max(0, c.swarmCount);
  const avoidance = c.incident === "tracking-outage" ? 0 : Math.min(1, Math.max(0, c.avoidanceReliability));

  // A breakup incident is one catastrophic fragmentation at year zero.
  if (c.incident === "breakup") {
    tracked += c.fragmentsPerCollision;
    untracked += c.untrackedPerCollision;
  }

  const trajectory: KesslerYear[] = [];
  let installsAllowed = true;
  let moratoriumYear: number | null = null;
  let runawayYear: number | null = null;
  let firstCollisionYear: number | null = null;
  let totalCollisions = 0;

  for (let year = 0; year <= Math.max(1, Math.floor(c.horizonYears)); year += 1) {
    const density = swarm > 0 ? (tracked + untracked) / swarm : Infinity;

    // INVARIANT: the moratorium is enforced by the model, not suggested.
    if (installsAllowed && density > MORATORIUM_DENSITY) {
      installsAllowed = false;
      moratoriumYear = year;
    }

    // Expected collisions this year. Swarm hits scale with debris count and
    // swarm density — expanding the swarm raises the encounter rate, which is
    // how a growing constellation makes its own band hostile. Debris-debris
    // collisions are the cascade's quadratic feedback: negligible when the
    // band is clean, dominant past the knee. Tracked objects can be dodged;
    // untracked objects cannot, which is why they dominate the swarm term.
    const scale = ENCOUNTER_K * (swarm / 10_000);
    const fromTracked = tracked * scale * (1 - avoidance);
    const fromUntracked = untracked * scale;
    const fromDebris = CASCADE_K2 * (tracked + untracked) ** 2;
    const collisions = Math.min(fromTracked + fromUntracked + fromDebris, swarm);
    totalCollisions += collisions;
    if (firstCollisionYear === null && totalCollisions >= 1) firstCollisionYear = year;
    if (runawayYear === null && collisions >= RUNAWAY_COLLISIONS_PER_YEAR) runawayYear = year;

    trajectory.push({
      year,
      tracked: Math.round(tracked),
      untracked: Math.round(untracked),
      collisions,
      swarm: Math.round(swarm),
      installsAllowed,
    });

    // Population update. No natural decay at 0.4 AU — removal is ADR only.
    swarm = Math.max(0, swarm - collisions + (installsAllowed ? c.installsPerYear : 0));
    tracked = Math.min(
      POPULATION_CAP,
      Math.max(
        0,
        tracked +
          collisions * c.fragmentsPerCollision +
          (installsAllowed ? c.installsPerYear * Math.max(0, c.installFailureRate) : 0) -
          c.adrPerYear,
      ),
    );
    untracked = Math.min(POPULATION_CAP, untracked + collisions * c.untrackedPerCollision);
  }

  const last = trajectory.at(-1)!;
  const netGrowthPerYear =
    (last.tracked + last.untracked - (trajectory[0].tracked + trajectory[0].untracked)) /
    Math.max(1, last.year);

  const constraints = [
    ...(runawayYear !== null
      ? [`Cascade runs away in year ${runawayYear} — ${RUNAWAY_COLLISIONS_PER_YEAR}+ collisions/yr`]
      : []),
    ...(moratoriumYear !== null
      ? [`Installation moratorium engaged in year ${moratoriumYear}; band density over cap`]
      : []),
    ...(c.adrPerYear <= 0 ? ["No active removal: nothing ever leaves a dragless band"] : []),
    ...(c.incident === "tracking-outage" ? ["Tracking outage: every conjunction is unavoidable"] : []),
    ...(netGrowthPerYear > 0 && runawayYear === null
      ? [`Population grows ${netGrowthPerYear.toFixed(0)}/yr; removal budget does not close`]
      : []),
  ];

  const readiness: KesslerReadiness =
    runawayYear !== null && runawayYear <= NO_GO_RUNAWAY_YEARS
      ? "NO-GO"
      : constraints.length > 0
        ? "CONDITIONAL"
        : "GO";
  const safeMode =
    runawayYear !== null
      ? "BAND EVACUATION STUDY"
      : moratoriumYear !== null
        ? "INSTALL MORATORIUM"
        : c.incident === "tracking-outage"
          ? "AVOIDANCE BLIND"
          : "CATALOG MAINTENANCE";

  return {
    trajectory,
    firstCollisionYear,
    runawayYear,
    moratoriumYear,
    totalCollisions,
    netGrowthPerYear,
    endTracked: last.tracked,
    endUntracked: last.untracked,
    endSwarm: last.swarm,
    readiness,
    safeMode,
    constraints,
  };
}
