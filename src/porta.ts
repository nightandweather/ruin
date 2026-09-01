/**
 * PORTA — the transit gate, and what a violation costs forever.
 *
 * Season 02 runs on a gate this repository never modelled. The narrative fixed
 * its constants and checked them against each other; this module makes them
 * executable, so the story's central machine can be operated rather than
 * described. Where the two disagree, the manuscript is the specification and
 * this file is the defect.
 *
 * Grounded anchors: none. A transit gate is not physics, and nothing here
 * claims otherwise — `concepts/transit-gate.md` keeps that boundary. What is
 * modelled is the *operations* around one: an opening deposits heat, heat sets
 * a cooldown, throughput is bounded by quarantine and decompression rather
 * than by the door, and authority to open is a quorum held at both ends.
 *
 * Canon constants (Season 02 chronology):
 *   9.58 PJ deposited by the first 71-minute opening
 *   80 minutes — the safe opening ceiling
 *   94 days ±11 — the pre-war mean reopening interval
 *   211 days — the same interval in 2449, before active recovery panels
 *   43 seconds — Nina's improvised opening, and the only violation
 *
 * Two invariants are the ordinary RUIN kind: no opening past the ceiling, and
 * no automatic opening without quorum. The third is a shape this repository
 * has not used before. An improvised quorum *works* — the gate opens, the
 * children go through — and the cost is that the two ends can no longer
 * agree on a shared past. The model does not forbid the violation. It records
 * what the violation permanently spends.
 */

export type PortaQuorum = "both" | "one" | "revoked";
export type PortaIncident = "none" | "quorum-revoked" | "coolant-short" | "improvised-quorum";

/** Petajoules deposited per minute of opening, from 9.58 PJ over 71 minutes. */
export const DEPOSIT_PJ_PER_MIN = 9.58 / 71;
/** The safe opening ceiling, in minutes. */
export const SAFE_OPENING_MINUTES = 80;
/** Heat the recovery plant clears per day at full panel efficiency (PJ/day). */
const RECOVERY_PJ_PER_DAY = (SAFE_OPENING_MINUTES * DEPOSIT_PJ_PER_MIN) / 94;
/** Panel efficiency in 2449, before the active plates: 94/211 of current. */
export const LEGACY_PANEL_EFFICIENCY = 94 / 211;
/** Nina's opening, in minutes. */
export const IMPROVISED_OPENING_MINUTES = 43 / 60;
/** Discarded ledgers she bound into a temporary causal proof. */
export const IMPROVISED_LEDGER_COUNT = 125;

export interface PortaManifest {
  id: string;
  name: string;
  /** People, or people-equivalents for cargo that occupies the same throat. */
  people: number;
  detail: string;
}

/** What the last evacuation opening was asked to carry. */
export const MANIFESTS: readonly PortaManifest[] = [
  { id: "routine", name: "ROUTINE EXCHANGE", people: 180, detail: "Ore, medicine, rotation crews" },
  { id: "medical", name: "MEDICAL PRIORITY", people: 64, detail: "Marrow therapy on a seventeen-hour clock" },
  {
    id: "evacuation",
    name: "LAST EVACUATION",
    people: 66,
    detail: "47 children, 19 wounded, the third ledger's original, and ARK-2's navigation core",
  },
  { id: "bulk", name: "BULK RESUPPLY", people: 420, detail: "A quarter's coolant, seed stock, and spares" },
];

export interface PortaConfig {
  manifest: string;
  openingMinutes: number;
  /** Active heat-recovery panel efficiency, 0–1. */
  panelEfficiency: number;
  quorum: PortaQuorum;
  /** People per minute the quarantine line can clear. */
  quarantinePerMin: number;
  /** People per minute the decompression lock can cycle. */
  decompressionPerMin: number;
  /**
   * People per minute the throat itself can pass, unbottled. The canon's
   * sixty-six through in forty-three seconds needs at least 93/min, so this
   * is the one rate the story pins from below rather than from above.
   */
  throatPerMin: number;
  /** Coolant on hand, in petajoules of absorption. */
  coolantReservePJ: number;
  incident: PortaIncident;
}

export function portaConfig(): PortaConfig {
  return {
    manifest: "routine",
    openingMinutes: 71,
    panelEfficiency: 1,
    quorum: "both",
    quarantinePerMin: 3,
    decompressionPerMin: 8,
    throatPerMin: 96,
    coolantReservePJ: 14,
    incident: "none",
  };
}

export function evaluatePorta(c: PortaConfig) {
  const manifest = MANIFESTS.find((m) => m.id === c.manifest) ?? MANIFESTS[0];
  const improvised = c.incident === "improvised-quorum";
  const coolantShort = c.incident === "coolant-short";
  const quorum: PortaQuorum = c.incident === "quorum-revoked" ? "revoked" : c.quorum;

  // INVARIANT 1: the ceiling is enforced, not advised. An improvised opening
  // is short by necessity — it is held open by hand on a coolant valve.
  const requested = Math.max(0, c.openingMinutes);
  const openingMinutes = improvised ? IMPROVISED_OPENING_MINUTES : Math.min(SAFE_OPENING_MINUTES, requested);
  const clampedBy = requested > SAFE_OPENING_MINUTES ? requested - SAFE_OPENING_MINUTES : 0;

  const depositPJ = openingMinutes * DEPOSIT_PJ_PER_MIN;
  const panels = Math.min(1, Math.max(0.05, c.panelEfficiency));
  const cooldownDays = depositPJ / (RECOVERY_PJ_PER_DAY * panels);
  const coolant = coolantShort ? c.coolantReservePJ * 0.35 : c.coolantReservePJ;
  const coolantHolds = coolant >= depositPJ;

  // INVARIANT 2: without quorum the gate does not open by itself. An
  // improvised quorum is the one way past this, and it is a violation.
  const authorized = quorum === "both";
  const opens = authorized || improvised;

  /**
   * Throughput is bounded by the slowest station, not by the door. A violation
   * skips quarantine — that is part of what makes it one — so the throat
   * becomes the limit and sixty-six people fit into forty-three seconds.
   */
  const stations = improvised
    ? [
        { name: "THROAT", rate: c.throatPerMin },
        { name: "DECOMPRESSION", rate: c.decompressionPerMin * 12 },
      ]
    : [
        { name: "QUARANTINE", rate: c.quarantinePerMin },
        { name: "DECOMPRESSION", rate: c.decompressionPerMin },
        { name: "THROAT", rate: c.throatPerMin },
      ];
  const bottleneck = stations.reduce((slowest, station) => (station.rate < slowest.rate ? station : slowest));
  const capacity = opens ? bottleneck.rate * openingMinutes : 0;
  const passed = Math.min(manifest.people, capacity);
  const leftBehind = manifest.people - passed;

  // INVARIANT 3: a violation is possible, and permanent. Binding discarded
  // ledgers into a temporary causal proof opens the door and forks the record
  // at both ends — the same method can never be used again, and the act
  // itself cannot be assigned a cause in either ledger.
  const causalLedgerIntact = !improvised;
  const attribution = improvised ? "CAUSE UNASSIGNED" : "ATTRIBUTED";

  const constraints = [
    ...(clampedBy > 0
      ? [
          `Requested opening exceeded the ${SAFE_OPENING_MINUTES}-minute ceiling by ${clampedBy.toFixed(0)} min; the model refused the excess`,
        ]
      : []),
    ...(!authorized && !improvised
      ? [`Quorum ${quorum}: the gate does not open automatically, and nothing here overrides that`]
      : []),
    ...(improvised
      ? [
          `${IMPROVISED_LEDGER_COUNT} discarded ledgers bound as a temporary causal proof; the door opened for ${(openingMinutes * 60).toFixed(0)} s`,
          "Causal ledgers permanently forked: the two ends can no longer agree on a shared past, and this method cannot be used twice",
          "The act is recorded as CAUSE UNASSIGNED; whoever performed it is not in either official record",
        ]
      : []),
    ...(!coolantHolds
      ? [
          `Coolant reserve ${coolant.toFixed(2)} PJ under the ${depositPJ.toFixed(2)} PJ this opening deposits`,
        ]
      : []),
    ...(leftBehind > 0.5
      ? [
          `${Math.ceil(leftBehind)} of ${manifest.people} left behind; ${bottleneck.name} is the limit, not the gate`,
        ]
      : []),
    ...(cooldownDays > 94
      ? [`Reopening in ${cooldownDays.toFixed(0)} days, past the ${94}-day standing interval`]
      : []),
  ];

  const readiness = !opens || !coolantHolds ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = improvised
    ? "LEDGERS FORKED"
    : !opens
      ? "SEALED · NO QUORUM"
      : !coolantHolds
        ? "THERMAL HOLD"
        : leftBehind > 0.5
          ? "PARTIAL TRANSIT"
          : "NOMINAL TRANSIT";

  return {
    manifest,
    openingMinutes,
    openingSeconds: openingMinutes * 60,
    depositPJ,
    cooldownDays,
    coolantPJ: coolant,
    coolantHolds,
    authorized,
    opens,
    bottleneck: bottleneck.name,
    capacity,
    passed,
    leftBehind,
    causalLedgerIntact,
    attribution,
    readiness,
    safeMode,
    constraints,
  } as const;
}
