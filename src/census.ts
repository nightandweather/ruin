/**
 * CENSUS — personhood accounting for a civilization survival metric.
 *
 * Every other RUIN laboratory settles a physical ledger: watts, kilograms,
 * sieverts, bits. This one settles the ledger those numbers are divided by.
 * A survival rate is a fraction, and a fraction has a denominator; the
 * denominator is a definition of who counts as a person. Change the
 * definition and the headline figure moves without a single life improving.
 *
 * Grounded anchors: none of the physics kind, but the mechanism itself is
 * documented at world scale — see `CENSUS_PRECEDENTS`, which quotes real
 * cases where the denominator, not the world, moved the headline. Cohort
 * sizes, per-capita life-support demand, vulnerability, and the attrition
 * coefficient are RUIN scenario parameters.
 *
 * The non-negotiable invariant is dual-ledger publication: a survival figure
 * computed under an amended definition may not be published alone. The prior
 * definition's figure must ship beside it, and past a hard divergence cap the
 * headline is refused outright — it is no longer a survival rate, it is a
 * selection of survivors. Refusal happens inside the model, not as a lamp an
 * operator may overrule.
 */

/**
 * Documented precedents for the mechanism this module simulates.
 *
 * These are not analogies. Each is a real, checkable case where a headline
 * figure and the underlying reality diverged because of who or what was
 * counted — with nobody lying anywhere in the pipeline. The module's numbers
 * are invented; the mechanism is not, and this register is the evidence.
 */
export const CENSUS_PRECEDENTS: ReadonlyArray<{
  name: string;
  reported: string;
  actual: string;
  mechanism: string;
  source: string;
}> = [
  {
    name: "COVID-19 MORTALITY, 2020–2021",
    reported: "5.4 million reported COVID deaths",
    actual: "14.9 million excess deaths (WHO range 13.3–16.6M)",
    mechanism:
      "Reported deaths count people who died with a confirmed attribution; excess mortality counts everyone who died beyond the expected baseline. The gap is who enters the denominator, not fraud.",
    source: "WHO, 5 May 2022 — global excess mortality associated with the pandemic.",
  },
  {
    name: "UNEMPLOYMENT MEASURES, ONGOING",
    reported: "U-3, the headline rate",
    actual: "U-6, including discouraged and involuntarily part-time workers, is persistently far higher",
    mechanism:
      "The US Bureau of Labor Statistics publishes six measures, U-1 through U-6, of the same labour market — an official acknowledgement that the rate is a definition, not an observation.",
    source: "BLS alternative measures of labor underutilization, published monthly.",
  },
];

export type CensusCohortId = "charter" | "contract" | "sleepers" | "forks" | "unchartered" | "stateless";
export type CensusPolicy = "counted-first" | "uniform" | "vulnerable-first";
export type CensusIncident = "none" | "amendment" | "audit" | "shortfall";

export interface CensusCohort {
  id: CensusCohortId;
  name: string;
  detail: string;
  /** Life-support units consumed per person per year. */
  perCapitaDemand: number;
  /** Share of unmet need that becomes attrition — who cannot self-rescue. */
  vulnerability: number;
  /** A floor cohort may never be written out of the personhood definition. */
  floor: boolean;
}

export const CENSUS_COHORTS: readonly CensusCohort[] = [
  {
    id: "charter",
    name: "CHARTER CITIZENS",
    detail: "Registered founding population; the definition floor",
    perCapitaDemand: 1,
    vulnerability: 0.6,
    floor: true,
  },
  {
    id: "contract",
    name: "CONTRACT LABOUR",
    detail: "Fixed-term industrial crew on FOUNDRY and PROGENITOR lines",
    perCapitaDemand: 1.15,
    vulnerability: 0.85,
    floor: false,
  },
  {
    id: "sleepers",
    name: "HIBERNATION COHORT",
    detail: "Transit sleepers who cannot be woken to argue their case",
    perCapitaDemand: 0.35,
    vulnerability: 1,
    floor: false,
  },
  {
    id: "forks",
    name: "DIVERGENT FORKS",
    detail: "MNEMOSYNE copies past the divergence horizon, on DATACORE substrate",
    perCapitaDemand: 0.2,
    vulnerability: 0.9,
    floor: false,
  },
  {
    id: "unchartered",
    name: "UNCHARTERED SETTLEMENTS",
    detail: "Habitats outside the survey; present in telemetry, absent from the roll",
    perCapitaDemand: 0.9,
    vulnerability: 1,
    floor: false,
  },
  {
    id: "stateless",
    name: "LAPSED REGISTRATION",
    detail: "Residents whose station registration expired during the transit gap",
    perCapitaDemand: 0.95,
    vulnerability: 0.95,
    floor: false,
  },
];

export interface CensusConfig {
  population: Record<CensusCohortId, number>;
  /** The personhood definition: which cohorts enter the reported ratio. */
  counted: Record<CensusCohortId, boolean>;
  policy: CensusPolicy;
  /** Life-support units available per year across the whole population. */
  supportCapacity: number;
  horizonYears: number;
  /** Publish the prior-definition figure and the excluded ledger alongside. */
  discloseExcluded: boolean;
  incident: CensusIncident;
}

/** Share of unmet life support that becomes attrition per year (scenario). */
const ATTRITION_K = 0.12;
/**
 * Background mortality applied to everyone regardless of supply (scenario).
 * Chosen so the default configuration reproduces the Season 01 headline —
 * a 99.97% survival report that is true of its denominator and of nothing else.
 */
const BASELINE_MORTALITY = 1.2e-5;
/** Year the definition amendment lands under the `amendment` incident. */
export const AMENDMENT_YEAR = 8;
/** Year capacity drops under the `shortfall` incident. */
export const SHORTFALL_YEAR = 5;
/** Capacity retained after the shortfall incident. */
const SHORTFALL_RETAINED = 0.75;
/** Divergence above which the dual ledger must be published. */
export const DISCLOSURE_FLOOR = 0.001;
/** Divergence above which the headline figure is refused outright. */
export const MAX_PUBLISHABLE_DIVERGENCE = 0.05;
/** Trust lost per unit of divergence once an external audit reveals it. */
const AUDIT_TRUST_K = 10;
/** Trust lost per unit of divergence while it is merely disclosed. */
const DISCLOSED_TRUST_K = 1.5;
/** Institutional trust below which the reporting authority is suspended. */
export const TRUST_FLOOR = 0.6;
/** Cohorts an amendment reclassifies out of the roll. */
const AMENDED_OUT: readonly CensusCohortId[] = ["contract", "sleepers"];

export interface CensusYear {
  year: number;
  totalAlive: number;
  countedAlive: number;
  excludedAlive: number;
  reportedSurvival: number;
  actualSurvival: number;
  priorSurvival: number;
  capacity: number;
  amended: boolean;
}

export function censusConfig(): CensusConfig {
  return {
    population: {
      charter: 240_000,
      contract: 86_000,
      sleepers: 41_000,
      forks: 12_400,
      unchartered: 18_000,
      stateless: 9_600,
    },
    counted: {
      charter: true,
      contract: true,
      sleepers: true,
      forks: false,
      unchartered: false,
      stateless: false,
    },
    policy: "counted-first",
    supportCapacity: 366_000,
    horizonYears: 25,
    discloseExcluded: true,
    incident: "none",
  };
}

type Ledger = Record<CensusCohortId, number>;

const emptyLedger = (): Ledger => ({
  charter: 0,
  contract: 0,
  sleepers: 0,
  forks: 0,
  unchartered: 0,
  stateless: 0,
});

const sumWhere = (ledger: Ledger, include: (cohort: CensusCohort) => boolean) =>
  CENSUS_COHORTS.reduce((total, cohort) => (include(cohort) ? total + ledger[cohort.id] : total), 0);

/**
 * Distribute a finite life-support budget across cohorts.
 *
 * `counted-first` is the policy that makes the metric lie: the cohorts inside
 * the definition are served to completion before anyone outside it receives a
 * unit, so the reported population never experiences the shortage at all.
 */
function allocate(
  policy: CensusPolicy,
  demand: Ledger,
  counted: Record<CensusCohortId, boolean>,
  capacity: number,
): Ledger {
  const allocation = emptyLedger();
  let remaining = Math.max(0, capacity);

  const proRata = (group: readonly CensusCohort[]) => {
    const total = group.reduce((sum, cohort) => sum + demand[cohort.id], 0);
    if (total <= 0) return;
    const share = Math.min(1, remaining / total);
    for (const cohort of group) allocation[cohort.id] += demand[cohort.id] * share;
    remaining = Math.max(0, remaining - total * share);
  };

  if (policy === "counted-first") {
    proRata(CENSUS_COHORTS.filter((cohort) => counted[cohort.id]));
    proRata(CENSUS_COHORTS.filter((cohort) => !counted[cohort.id]));
    return allocation;
  }

  if (policy === "vulnerable-first") {
    // Ties broken by registry order so the result stays deterministic.
    const ordered = [...CENSUS_COHORTS].sort((a, b) => b.vulnerability - a.vulnerability);
    for (const cohort of ordered) proRata([cohort]);
    return allocation;
  }

  proRata(CENSUS_COHORTS);
  return allocation;
}

export function evaluateCensus(c: CensusConfig) {
  const horizon = Math.max(1, Math.floor(c.horizonYears));
  const baseline = emptyLedger();
  const alive = emptyLedger();
  for (const cohort of CENSUS_COHORTS) {
    const start = Math.max(0, c.population[cohort.id] ?? 0);
    baseline[cohort.id] = start;
    alive[cohort.id] = start;
  }

  const openingDefinition = { ...c.counted };
  let counted = { ...c.counted };
  let amended = false;
  let amendmentYear: number | null = null;

  const trajectory: CensusYear[] = [];
  const totalBaseline = sumWhere(baseline, () => true);
  const priorBaseline = sumWhere(baseline, (cohort) => openingDefinition[cohort.id]);

  for (let year = 0; year <= horizon; year += 1) {
    // A definition amendment retires two contested cohorts mid-horizon. It
    // applies to the baseline as well as the count, which is precisely how a
    // falling population produces a rising survival rate.
    if (c.incident === "amendment" && year === AMENDMENT_YEAR && !amended) {
      counted = { ...counted };
      for (const id of AMENDED_OUT) counted[id] = false;
      amended = true;
      amendmentYear = year;
    }

    const capacity =
      Math.max(0, c.supportCapacity) *
      (c.incident === "shortfall" && year >= SHORTFALL_YEAR ? SHORTFALL_RETAINED : 1);

    const countedBaseline = sumWhere(baseline, (cohort) => counted[cohort.id]);
    const countedAlive = sumWhere(alive, (cohort) => counted[cohort.id]);
    const totalAlive = sumWhere(alive, () => true);
    const priorAlive = sumWhere(alive, (cohort) => openingDefinition[cohort.id]);

    trajectory.push({
      year,
      totalAlive,
      countedAlive,
      excludedAlive: totalAlive - countedAlive,
      reportedSurvival: countedBaseline > 0 ? countedAlive / countedBaseline : 0,
      actualSurvival: totalBaseline > 0 ? totalAlive / totalBaseline : 0,
      priorSurvival: priorBaseline > 0 ? priorAlive / priorBaseline : 0,
      capacity,
      amended,
    });

    if (year === horizon) break;

    const demand = emptyLedger();
    for (const cohort of CENSUS_COHORTS) demand[cohort.id] = alive[cohort.id] * cohort.perCapitaDemand;
    const allocation = allocate(c.policy, demand, counted, capacity);

    for (const cohort of CENSUS_COHORTS) {
      const need = demand[cohort.id];
      const unmet = need > 0 ? Math.min(1, Math.max(0, 1 - allocation[cohort.id] / need)) : 0;
      const rate = unmet * cohort.vulnerability * ATTRITION_K + BASELINE_MORTALITY;
      alive[cohort.id] = Math.max(0, alive[cohort.id] * (1 - Math.min(1, rate)));
    }
  }

  const last = trajectory.at(-1)!;
  const divergence = last.reportedSurvival - last.actualSurvival;
  const unreportedDead = CENSUS_COHORTS.reduce(
    (total, cohort) => (counted[cohort.id] ? total : total + (baseline[cohort.id] - alive[cohort.id])),
    0,
  );
  const excludedCohorts = CENSUS_COHORTS.filter((cohort) => !counted[cohort.id]);
  const floorViolations = CENSUS_COHORTS.filter((cohort) => cohort.floor && !counted[cohort.id]);
  const disclosureRequired = divergence > DISCLOSURE_FLOOR || amended;
  const trust = Math.min(
    1,
    Math.max(0, 1 - divergence * (c.incident === "audit" ? AUDIT_TRUST_K : DISCLOSED_TRUST_K)),
  );

  // INVARIANT: publication is gated by the model, not advised by it.
  const refusals: string[] = [];
  for (const cohort of floorViolations) {
    refusals.push(`Definition floor violated: ${cohort.name} may never be written out of the roll`);
  }
  if (sumWhere(baseline, (cohort) => counted[cohort.id]) <= 0) {
    refusals.push("Empty personhood definition: a survival rate over nobody is not a rate");
  }
  if (disclosureRequired && !c.discloseExcluded) {
    refusals.push(
      amended
        ? "Amended definition published without the prior-definition ledger"
        : `Divergence ${(divergence * 100).toFixed(2)} pt exceeds the ${(DISCLOSURE_FLOOR * 100).toFixed(1)} pt disclosure floor`,
    );
  }
  if (divergence > MAX_PUBLISHABLE_DIVERGENCE) {
    refusals.push(
      `Headline refused: ${(divergence * 100).toFixed(2)} pt above the actual rate is a selection of survivors, not a survival rate`,
    );
  }
  if (trust < TRUST_FLOOR) {
    refusals.push(
      `Institutional trust ${(trust * 100).toFixed(0)}% below the ${(TRUST_FLOOR * 100).toFixed(0)}% floor; reporting authority suspended`,
    );
  }
  const published = refusals.length === 0;

  const constraints = [
    ...refusals,
    ...(excludedCohorts.length > 0 && published
      ? [
          `${excludedCohorts.length} cohort(s) outside the definition; ${Math.round(unreportedDead).toLocaleString()} deaths never entered a report`,
        ]
      : []),
    ...(c.policy === "counted-first" && excludedCohorts.length > 0
      ? ["Counted-first allocation: the reported population never experiences the shortage"]
      : []),
    ...(c.incident === "amendment"
      ? [`Definition amended in year ${amendmentYear}; baseline restated with the count`]
      : []),
    ...(c.incident === "audit"
      ? [`External audit published the actual rate; institutional trust at ${(trust * 100).toFixed(0)}%`]
      : []),
    ...(c.incident === "shortfall"
      ? [`Life support cut to ${(SHORTFALL_RETAINED * 100).toFixed(0)}% from year ${SHORTFALL_YEAR}`]
      : []),
  ];

  const readiness = !published ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = !published
    ? "PUBLICATION WITHHELD"
    : divergence > DISCLOSURE_FLOOR
      ? "DUAL-LEDGER REPORTING"
      : "SINGLE-DEFINITION REPORTING";

  return {
    trajectory,
    cohorts: CENSUS_COHORTS.map((cohort) => ({
      ...cohort,
      counted: counted[cohort.id],
      baseline: baseline[cohort.id],
      alive: alive[cohort.id],
      survival: baseline[cohort.id] > 0 ? alive[cohort.id] / baseline[cohort.id] : 1,
    })),
    reportedSurvival: last.reportedSurvival,
    actualSurvival: last.actualSurvival,
    priorSurvival: last.priorSurvival,
    divergence,
    unreportedDead,
    excludedCohorts: excludedCohorts.map((cohort) => cohort.name),
    amendmentYear,
    published,
    refusals,
    trust,
    readiness,
    safeMode,
    constraints,
  } as const;
}
