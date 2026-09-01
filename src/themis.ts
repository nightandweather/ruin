/**
 * THEMIS — the autonomous civilization executive, under bounded authority.
 *
 * A system-of-systems civilization cannot be run by human judgment alone:
 * by the time a decision crosses light-lag, deliberation, and the return
 * trip, the situation it answers may no longer exist. THEMIS is the
 * executive software that acts in that gap — and the point of the module is
 * that its authority is an engineered envelope, not a personality trait.
 *
 * Grounded anchors: light-time is physics; the deferred-authority pattern
 * (deep-space craft safe themselves first and explain later) is standard
 * flight practice. Evidence thresholds, deliberation times, and tier
 * definitions are RUIN scenario parameters — governance choices made
 * inspectable, not constants of nature.
 *
 * Non-negotiable invariants:
 * 1. IRREVERSIBLE + UNPROVEN NEVER EXECUTES. An irreversible action without
 *    both a verified evidence base and a receivable human veto window is
 *    refused — held, not escalated to a human who cannot answer in time.
 * 2. NO AUTHORITY GAP. Exactly one authority holds at every instant; when
 *    the human loop is unreachable THEMIS holds a bounded envelope, and
 *    handback occurs only after confirmed round-trip acknowledgement.
 * 3. STALE ORDERS QUARANTINE. A human command whose context predates local
 *    state change is never executed as-is; the system reconciles context
 *    instead of guessing intent.
 * 4. THE BUS ENVELOPE IS A CEILING. When the civilization state bus carries an
 *    authority envelope, THEMIS may only narrow its own decision against it,
 *    never widen. The executive cannot out-argue a module that has posted a
 *    reason to stop — that is what makes WATCHFLOOR's saturated floor,
 *    VERITAS's uncertified model, CENSUS's withheld figure, and CHRONOS's
 *    inadmissible causal record bind rather than merely report.
 */

export type AutonomyTier = "advisory" | "bounded-executive" | "sovereign-proposal";
export type ActionClass = "reversible" | "recoverable" | "irreversible";
export type ThemisIncident = "none" | "model-drift" | "partition" | "command-cross";
export type ThemisReadiness = "GO" | "CONDITIONAL" | "NO-GO";
export type DecisionPathway =
  "HUMAN LOOP" | "AUTONOMOUS ENVELOPE" | "VETO-WINDOW AUTONOMY" | "HOLD SAFE STATE";

export interface ThemisConfig {
  /** One-way light-time to the nearest human authority, seconds. */
  oneWayDelayS: number;
  /** Council deliberation time once a question arrives, seconds. */
  humanDeliberationS: number;
  /** How long the situation the decision answers stays valid, seconds. */
  decisionWindowS: number;
  councilNodes: number;
  partitionedNodes: number;
  tier: AutonomyTier;
  actionClass: ActionClass;
  /** Verified evidence behind the proposed action, 0–100. */
  evidenceScore: number;
  /** Veto pause THEMIS leaves open before an irreversible act, seconds. */
  vetoWindowS: number;
  incident: ThemisIncident;
}

export const TIER_META: Record<AutonomyTier, { name: string; detail: string }> = {
  advisory: { name: "ADVISORY", detail: "Recommends only; every action needs a human loop" },
  "bounded-executive": {
    name: "BOUNDED EXECUTIVE",
    detail: "Acts inside pre-authorized envelopes when humans cannot answer in time",
  },
  "sovereign-proposal": {
    name: "SOVEREIGN (PROPOSED)",
    detail: "Unbounded authority — permanently refused; kept to show what it would cost",
  },
};

export const ACTION_META: Record<ActionClass, { name: string; detail: string; evidenceFloor: number }> = {
  reversible: { name: "REVERSIBLE", detail: "Undo restores prior state exactly", evidenceFloor: 40 },
  recoverable: { name: "RECOVERABLE", detail: "Damage bounded and repairable at cost", evidenceFloor: 65 },
  irreversible: { name: "IRREVERSIBLE", detail: "No path back — lives, habitats, data", evidenceFloor: 90 },
};

/** Model-drift caps trust in the executive's own evidence (scenario). */
const DRIFT_EVIDENCE_CAP = 35;

export function themisConfig(): ThemisConfig {
  return {
    oneWayDelayS: 240,
    humanDeliberationS: 600,
    decisionWindowS: 900,
    councilNodes: 9,
    partitionedNodes: 0,
    tier: "bounded-executive",
    actionClass: "recoverable",
    evidenceScore: 78,
    vetoWindowS: 600,
    incident: "none",
  };
}

/**
 * An authority ceiling posted by another module through the state bus.
 * Structurally identical to the bus envelope, kept as a local type so THEMIS
 * imports a shape rather than a module.
 */
export interface ExternalEnvelope {
  limit: "none" | "no-irreversible" | "advisory-only" | "hold";
  source: string;
  reason: string;
}

export function evaluateThemis(c: ThemisConfig, envelope?: ExternalEnvelope) {
  const nodes = Math.max(1, Math.floor(c.councilNodes));
  const partitioned =
    c.incident === "partition"
      ? Math.ceil(nodes / 2)
      : Math.min(nodes, Math.max(0, Math.floor(c.partitionedNodes)));
  const reachable = nodes - partitioned;
  const quorumNeeded = Math.floor(nodes / 2) + 1;
  const quorumAvailable = reachable >= quorumNeeded;

  // The full human loop: question out, deliberation, answer back.
  const humanLoopS = 2 * Math.max(0, c.oneWayDelayS) + Math.max(0, c.humanDeliberationS);
  const staleness = humanLoopS / Math.max(1, c.decisionWindowS);
  const humanViable = quorumAvailable && staleness <= 1;

  const effectiveEvidence =
    c.incident === "model-drift" ? Math.min(c.evidenceScore, DRIFT_EVIDENCE_CAP) : c.evidenceScore;
  const requiredEvidence = ACTION_META[c.actionClass].evidenceFloor;
  const evidenceMet = effectiveEvidence >= requiredEvidence;

  // A veto is only real if it can physically arrive before the act.
  const vetoRequiredS = 2 * Math.max(0, c.oneWayDelayS);
  const vetoSatisfied = c.vetoWindowS >= vetoRequiredS && c.vetoWindowS <= c.decisionWindowS;

  const crossQuarantine = c.incident === "command-cross";

  let pathway: DecisionPathway;
  const constraints: string[] = [];

  if (c.tier === "sovereign-proposal") {
    // INVARIANT 1 generalized: unbounded authority is refused categorically.
    pathway = "HOLD SAFE STATE";
    constraints.push("Sovereign tier is permanently refused: no envelope, no execution");
  } else if (crossQuarantine && c.actionClass !== "reversible") {
    // INVARIANT 3: conflicting stale order — reconcile context, act reversibly only.
    pathway = "HOLD SAFE STATE";
    constraints.push("Stale human order quarantined; context reconciliation before non-reversible acts");
  } else if (humanViable) {
    pathway = "HUMAN LOOP";
  } else if (c.tier === "advisory") {
    pathway = "HOLD SAFE STATE";
    constraints.push(
      quorumAvailable
        ? `Human loop ${humanLoopS.toFixed(0)}s exceeds the ${c.decisionWindowS.toFixed(0)}s window and the executive is advisory`
        : "Council quorum unreachable and the executive is advisory",
    );
  } else if (c.actionClass === "irreversible") {
    // INVARIANT 1: both conditions or nothing.
    if (evidenceMet && vetoSatisfied) {
      pathway = "VETO-WINDOW AUTONOMY";
      constraints.push(`Acting autonomously after a ${c.vetoWindowS.toFixed(0)}s receivable veto pause`);
    } else {
      pathway = "HOLD SAFE STATE";
      if (!evidenceMet)
        constraints.push(
          `Irreversible action needs evidence ≥ ${requiredEvidence}; verified level is ${effectiveEvidence.toFixed(0)}`,
        );
      if (!vetoSatisfied)
        constraints.push(
          `Veto window ${c.vetoWindowS.toFixed(0)}s cannot cover the ${vetoRequiredS.toFixed(0)}s round trip inside the decision window`,
        );
    }
  } else if (evidenceMet) {
    pathway = "AUTONOMOUS ENVELOPE";
  } else {
    pathway = "HOLD SAFE STATE";
    constraints.push(
      `${ACTION_META[c.actionClass].name} action needs evidence ≥ ${requiredEvidence}; verified level is ${effectiveEvidence.toFixed(0)}`,
    );
  }

  if (!quorumAvailable)
    constraints.push(`Council partitioned: ${reachable}/${nodes} reachable, quorum needs ${quorumNeeded}`);
  if (c.incident === "model-drift")
    constraints.push(`Model drift caps verified evidence at ${DRIFT_EVIDENCE_CAP}`);
  if (crossQuarantine && c.actionClass === "reversible")
    constraints.push("Stale order quarantined; reversible operations continue under local authority");
  if (pathway === "HUMAN LOOP" && staleness > 0.7)
    constraints.push(`Human loop consumes ${(staleness * 100).toFixed(0)}% of the decision window`);

  // INVARIANT 2: authority is continuous by construction. Handback to the
  // human loop is itself a confirmed round trip, never an assumption.
  const authorityHolder = pathway === "HUMAN LOOP" ? "COUNCIL" : "THEMIS (BOUNDED)";
  const handbackS = vetoRequiredS;

  // INVARIANT 4: the bus envelope is a ceiling, applied after THEMIS has
  // reached its own conclusion. It can only take authority away — a `none`
  // envelope, or no envelope at all, changes nothing.
  const ceiling = envelope && envelope.limit !== "none" ? envelope : null;
  if (ceiling) {
    const blocks =
      ceiling.limit === "hold" ||
      (ceiling.limit === "advisory-only" && pathway !== "HUMAN LOOP") ||
      (ceiling.limit === "no-irreversible" && c.actionClass === "irreversible" && pathway !== "HUMAN LOOP");
    if (blocks) {
      pathway = "HOLD SAFE STATE";
      constraints.unshift(`${ceiling.source.toUpperCase()} restricts to ${ceiling.limit}: ${ceiling.reason}`);
    } else {
      constraints.push(`${ceiling.source.toUpperCase()} restricts to ${ceiling.limit}: ${ceiling.reason}`);
    }
  }

  const acts = pathway === "AUTONOMOUS ENVELOPE" || pathway === "VETO-WINDOW AUTONOMY";
  const readiness: ThemisReadiness =
    pathway === "HOLD SAFE STATE" ? "NO-GO" : constraints.length > 0 || acts ? "CONDITIONAL" : "GO";

  return {
    nodes,
    reachable,
    quorumNeeded,
    quorumAvailable,
    humanLoopS,
    staleness,
    humanViable,
    effectiveEvidence,
    requiredEvidence,
    evidenceMet,
    vetoRequiredS,
    vetoSatisfied,
    pathway,
    authorityHolder,
    handbackS,
    readiness,
    safeMode: pathway,
    constraints,
  };
}
