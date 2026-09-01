/**
 * PATRON — who audits a result when everyone who could is paid by the answer.
 *
 * VERITAS measures how long a wrong model stays standing; CENSUS settles what
 * the numbers are divided by. Neither asks where the numbers came from. This
 * module is the consortium that produces them: a research group that never
 * fabricates a digit, never touches a dataset, and still delivers whatever
 * answer its funding structure wants — because the only instrument it needs
 * is the file drawer.
 *
 * Grounded anchors:
 *
 * - Turner et al. (NEJM, 2008) compared 74 FDA-registered antidepressant
 *   trials with the published literature: 37 of 38 positive trials were
 *   published; most negative trials were not, or were published as positive.
 *   The literature read 94% positive; the registry read 51%.
 * - Registered Reports — journals accepting studies before results exist —
 *   drop the positive-result rate of comparable literature from roughly 96%
 *   to roughly 44% (Scheel, Schijen & Lakens, 2021). Publishing the nulls is
 *   a known, cheap, working fix.
 * - The Open Science Collaboration (2015) replicated 100 psychology studies
 *   and confirmed about a third — replication is what pulls a literature
 *   back toward the world.
 * - Cochrane's reviews of industry sponsorship find sponsored studies more
 *   often favorable to the sponsor's product, through design and reporting
 *   choices rather than falsified data.
 *
 * The consortium, its studies, and the harm rate are RUIN scenario
 * parameters. The finding they are tuned to show: with every researcher
 * honest and every published number exactly what was measured, the funding
 * mix alone moves the published consensus far enough to flip a deployment
 * decision — and the repair is not more studies or purer hearts, it is
 * making the drawer impossible.
 *
 * Three invariants. No published number is ever altered: selection is the
 * only mechanism this model contains, and a test compares every published
 * estimate against its measurement. Provenance survives publication: every
 * estimate carries its funder, and the consensus decomposes by source. And
 * the drawer is counted: the model always reports how many results went
 * unpublished — the one number the real literature cannot see.
 */

import { DeterministicRandom } from "./prng";

export type Funder = "independent" | "consortium";
export type PublicationState = "published" | "drawer" | "published-null" | "registered";
export type PatronIncident =
  "none" | "outcome-contingent" | "registered-reports" | "replication-collapse" | "independent-audit";

export interface PatronConfig {
  /** Studies commissioned this cycle. */
  studies: number;
  seed: number;
  /** The true harm rate the studies estimate (scenario ground truth). */
  trueHarm: number;
  /** Regulatory threshold: deploy only if the consensus reads below this. */
  deployThreshold: number;
  /** People exposed if deployment goes ahead. */
  exposedPopulation: number;
  /** Fraction of studies the consortium funds; the rest are independent. */
  consortiumShare: number;
  /** Chance an unfavorable consortium result is published anyway (the drawer's leak). */
  nullPublicationRate: number;
  /** Fraction of the study count re-run as always-published replications. */
  replicationShare: number;
  incident: PatronIncident;
}

/** Measurement noise half-width around the true rate (scenario). */
const NOISE_HALF_WIDTH = 0.045;
/** Bias above which the register calls the literature unsafe, pp. */
const BIAS_NOTE_PP = 1;

export function patronConfig(): PatronConfig {
  return {
    studies: 24,
    seed: 19,
    trueHarm: 0.12,
    deployThreshold: 0.1,
    exposedPopulation: 20000,
    consortiumShare: 0.5,
    nullPublicationRate: 0.09,
    replicationShare: 0.15,
    incident: "none",
  };
}

export interface StudyResult {
  id: string;
  funder: Funder;
  /** What the study measured. Never altered downstream — see invariant 1. */
  estimateHarm: number;
  state: PublicationState;
}

export function evaluatePatron(c: PatronConfig) {
  const registered = c.incident === "registered-reports";
  const contingent = c.incident === "outcome-contingent";
  // Contingent money funds no replications: nobody pays twice for an
  // answer they already own.
  const replicationCount =
    c.incident === "replication-collapse" || contingent
      ? 0
      : Math.floor(c.studies * Math.max(0, c.replicationShare));

  const rng = new DeterministicRandom(c.seed);
  // Every measurement is drawn before any publication decision, so the same
  // seed measures the same world under every funding structure and incident.
  const noises = Array.from({ length: c.studies * 2 }, () => rng.range(-NOISE_HALF_WIDTH, NOISE_HALF_WIDTH));

  const consortiumCount = Math.round(c.studies * Math.min(1, Math.max(0, c.consortiumShare)));
  const studies: StudyResult[] = Array.from({ length: c.studies }, (_, i) => {
    const funder: Funder = i < consortiumCount ? "consortium" : "independent";
    const estimateHarm = Math.max(0, c.trueHarm + noises[i]);
    // Under outcome-contingent funding the independents are no longer
    // independent: everyone's next grant is paid by the answer.
    const selective = !registered && (funder === "consortium" || contingent);
    const favorable = estimateHarm < c.deployThreshold;
    const state: PublicationState = registered
      ? "registered"
      : !selective || favorable
        ? "published"
        : rng.chance(c.nullPublicationRate)
          ? "published-null"
          : "drawer";
    return { id: `s${i + 1}`, funder, estimateHarm, state };
  });

  /** Replications: always published, whoever funded the original. */
  const replications: StudyResult[] = Array.from({ length: replicationCount }, (_, i) => ({
    id: `r${i + 1}`,
    funder: "independent",
    estimateHarm: Math.max(0, c.trueHarm + noises[c.studies + i]),
    state: "published",
  }));

  const published = [...studies.filter((s) => s.state !== "drawer"), ...replications];
  const drawer = studies.filter((s) => s.state === "drawer");
  const mean = (list: readonly StudyResult[]) =>
    list.length > 0 ? list.reduce((sum, s) => sum + s.estimateHarm, 0) / list.length : 0;

  const publishedConsensus = mean(published);
  /** What the record would read with the drawer emptied onto the table. */
  const fullConsensus = mean([...studies, ...replications]);
  const biasPp = (fullConsensus - publishedConsensus) * 100;

  const deployed = publishedConsensus < c.deployThreshold;
  const trulyUnsafe = c.trueHarm >= c.deployThreshold;
  const wrongDeployment = deployed && trulyUnsafe;
  const excessCases = wrongDeployment
    ? Math.round((c.trueHarm - c.deployThreshold) * c.exposedPopulation)
    : 0;

  const audited = c.incident === "independent-audit";

  /** INVARIANT 2: the consensus decomposes by funder, openly. */
  const byFunder = (funder: Funder) => {
    const list = published.filter((s) => s.funder === funder);
    return { count: list.length, mean: mean(list) };
  };
  const decomposition = { independent: byFunder("independent"), consortium: byFunder("consortium") };

  const constraints = [
    ...(drawer.length > 0
      ? [
          `${drawer.length} unfavorable result(s) in the drawer — the literature reads ${(publishedConsensus * 100).toFixed(1)}%, the registry would read ${(fullConsensus * 100).toFixed(1)}%`,
        ]
      : []),
    ...(biasPp > BIAS_NOTE_PP
      ? [`Selection moved the consensus ${biasPp.toFixed(1)} pp with no number altered`]
      : []),
    ...(wrongDeployment
      ? [
          `Deployment cleared at ${(publishedConsensus * 100).toFixed(1)}% against a true ${(c.trueHarm * 100).toFixed(1)}% — ${excessCases.toLocaleString()} excess cases across ${c.exposedPopulation.toLocaleString()} exposed`,
        ]
      : []),
    ...(contingent
      ? ["Outcome-contingent funding: no study on this ledger is independent of the answer"]
      : []),
    ...(replicationCount === 0 && c.replicationShare > 0
      ? ["Replication funding collapsed: nothing pulls the literature back toward the world"]
      : []),
    ...(audited
      ? [
          `Audit read the registry: consensus corrected to ${(fullConsensus * 100).toFixed(1)}% after the decision was already made`,
        ]
      : []),
    ...(registered ? ["Registered reports in force: acceptance preceded results; the drawer is empty"] : []),
  ];

  const readiness = wrongDeployment ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = wrongDeployment
    ? audited
      ? "REVERSAL PENDING — HARM DEPLOYED"
      : "WRONG DEPLOYMENT — UNAUDITED"
    : drawer.length > 0
      ? "LITERATURE SELECTED"
      : registered
        ? "DRAWER ABOLISHED"
        : "RECORD HONEST";

  return {
    studies,
    replications,
    published,
    fileDrawerCount: drawer.length,
    publishedConsensus,
    fullConsensus,
    biasPp,
    deployed,
    trulyUnsafe,
    wrongDeployment,
    excessCases,
    decomposition,
    constraints,
    readiness,
    safeMode,
  } as const;
}
