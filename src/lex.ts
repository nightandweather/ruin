/**
 * LEX — whether an act is lawful, and whether that still means anything.
 *
 * RUIN models what a machine can do (physics) and what it may do (THEMIS's
 * authority envelope). It has never modelled who decided that, or how far the
 * decision reaches. LEX is that layer, and its subject is not the treaties —
 * those are the easy part, because they exist and can be quoted. Its subject
 * is the gap that opens between an obligation and anyone's ability to enforce
 * it, once the acting party is light-years from every signatory and centuries
 * from the signature.
 *
 * Grounded anchors: the instruments below are real, and the stances recorded
 * against each activity follow from their operative provisions — the Outer
 * Space Treaty's non-appropriation and liability articles, the Liability
 * Convention's split between absolute and fault-based liability, the Moon
 * Agreement's common-heritage clause and its seventeen parties, the national
 * resource-rights statutes that read the same treaty the other way, and the
 * Artemis Accords' non-binding safety zones. Party counts and article numbers
 * are sourced. The decay model, the reachability thresholds, and every
 * activity's mapping onto the instruments are RUIN scenario parameters: they
 * are a reading, and a lawyer would argue with them.
 *
 * The non-negotiable invariant is that enforcement decay is not repeal. An
 * act prohibited by an instrument in force when it was committed stays
 * prohibited until a successor instrument permits it. Distance is not a
 * defence, silence is not consent, and the model refuses the act rather than
 * noting the difficulty — which is the whole reason to write it down.
 */

import type { Grounding } from "./navis";

export type LexInstrumentId = "ost" | "liability" | "moon" | "space-act" | "luxembourg" | "artemis";
export type LexActivityId =
  | "stellar-collection"
  | "resource-extraction"
  | "debris-generation"
  | "aimed-transit"
  | "biological-seeding"
  | "personhood-classification";
export type LexStance = "permits" | "restricts" | "prohibits" | "silent";
export type LexIncident = "none" | "denunciation" | "successor-lapse" | "enforcement-gap";
/** How much force an instrument carries independently of who can reach you. */
export type BindingClass = "treaty" | "national" | "non-binding";

export interface LexInstrument {
  id: LexInstrumentId;
  name: string;
  year: number;
  bindingClass: BindingClass;
  /** Share of the relevant spacefaring parties bound by it. */
  partiesFraction: number;
  /** The operative provision this module reasons from. */
  provision: string;
  grounding: Grounding;
  source: string;
}

/**
 * Real instruments, in force order. `partiesFraction` is the share of
 * spacefaring parties bound — high for the Outer Space Treaty, which every
 * major spacefaring nation has joined, and very low for the Moon Agreement,
 * which none of them has.
 */
export const LEX_INSTRUMENTS: readonly LexInstrument[] = [
  {
    id: "ost",
    name: "OUTER SPACE TREATY",
    year: 1967,
    bindingClass: "treaty",
    partiesFraction: 0.95,
    provision:
      "Art. II — outer space, including the moon and other celestial bodies, is not subject to national appropriation by claim of sovereignty, by means of use or occupation, or by any other means",
    grounding: "sourced",
    source:
      "Outer Space Treaty (1967), Arts. II, VI, VII, IX, XVI. 118 parties and 20 signatories as of October 2025; withdrawal takes effect one year after written notice.",
  },
  {
    id: "liability",
    name: "LIABILITY CONVENTION",
    year: 1972,
    bindingClass: "treaty",
    partiesFraction: 0.9,
    provision:
      "Art. II — a launching State is absolutely liable for damage on the surface of the Earth or to aircraft in flight; Art. III — elsewhere, liability is fault-based",
    grounding: "sourced",
    source:
      "Convention on International Liability for Damage Caused by Space Objects (1972), Arts. II and III.",
  },
  {
    id: "moon",
    name: "MOON AGREEMENT",
    year: 1979,
    bindingClass: "treaty",
    partiesFraction: 0.08,
    provision: "Art. 11 — the Moon and its natural resources are the common heritage of mankind",
    grounding: "sourced",
    source:
      "Moon Agreement (1979), Art. 11. Seventeen parties as of May 2024, none of them a major spacefaring nation.",
  },
  {
    id: "space-act",
    name: "US SPACE ACT",
    year: 2015,
    bindingClass: "national",
    partiesFraction: 0.35,
    provision:
      "A citizen engaged in commercial recovery is entitled to possess, own, transport, use, and sell the resource obtained",
    grounding: "sourced",
    source: "US Commercial Space Launch Competitiveness Act (2015), space resource provisions.",
  },
  {
    id: "luxembourg",
    name: "LUXEMBOURG RESOURCES LAW",
    year: 2017,
    bindingClass: "national",
    partiesFraction: 0.1,
    provision: "Space resources are capable of being appropriated",
    grounding: "sourced",
    source:
      "Luxembourg law on the exploration and use of space resources (2017); the UAE enacted a comparable statute.",
  },
  {
    id: "artemis",
    name: "ARTEMIS ACCORDS",
    year: 2020,
    bindingClass: "non-binding",
    partiesFraction: 0.5,
    provision:
      "Sec. 11 — safety zones deconflict activities as an implementation of the Outer Space Treaty's harmful-interference provision, and are not permanent",
    grounding: "sourced",
    source: "Artemis Accords (2020), Sec. 11. A non-binding multilateral arrangement, not a treaty.",
  },
];

export interface LexActivity {
  id: LexActivityId;
  name: string;
  detail: string;
  /** The RUIN laboratory that performs this activity. */
  module: string;
  /** Whether the act can be undone once committed. */
  irreversible: boolean;
  stances: Partial<Record<LexInstrumentId, LexStance>>;
}

/**
 * What the laboratory actually does, mapped onto the instruments.
 *
 * The mapping is the invented part and it is where a lawyer would start
 * arguing — reasonable readings differ, which is the point of writing it in a
 * table rather than in prose.
 */
export const LEX_ACTIVITIES: readonly LexActivity[] = [
  {
    id: "stellar-collection",
    name: "STELLAR POWER COLLECTION",
    detail: "Intercepting a substantial fraction of a star's output with a swarm at 0.4 AU",
    module: "HELIOS",
    irreversible: true,
    // A star is a celestial body, and a swarm that intercepts its output
    // occupies and uses it. Art. II names use and occupation explicitly.
    stances: { ost: "prohibits", moon: "prohibits", artemis: "restricts" },
  },
  {
    id: "resource-extraction",
    name: "RESOURCE EXTRACTION",
    detail: "Mining and refining regolith and asteroid material for industrial feedstock",
    module: "FOUNDRY / PROGENITOR",
    irreversible: false,
    // The instruments genuinely disagree here: the national statutes were
    // written to read the treaty as permitting extraction without permitting
    // appropriation of the body itself.
    stances: {
      ost: "restricts",
      moon: "prohibits",
      "space-act": "permits",
      luxembourg: "permits",
      artemis: "permits",
    },
  },
  {
    id: "debris-generation",
    name: "PERSISTENT DEBRIS GENERATION",
    detail: "An activity that leaves lethal fragments in a band with no natural sink",
    module: "KESSLER",
    irreversible: true,
    stances: { ost: "restricts", liability: "restricts", artemis: "restricts" },
  },
  {
    id: "aimed-transit",
    name: "AIMED MASS TRANSIT",
    detail: "Releasing an unpowered payload on a corridor crossing another party's volume",
    module: "FUNDA",
    irreversible: true,
    stances: { ost: "restricts", liability: "prohibits", artemis: "restricts" },
  },
  {
    id: "biological-seeding",
    name: "BIOLOGICAL SEEDING",
    detail: "Introducing terrestrial biology to another body as part of a settlement campaign",
    module: "GENESIS / AGRARIA",
    irreversible: true,
    // Art. IX's harmful-contamination duty is the operative provision.
    stances: { ost: "prohibits", moon: "prohibits", artemis: "restricts" },
  },
  {
    id: "personhood-classification",
    name: "PERSONHOOD CLASSIFICATION",
    detail: "Deciding which cohorts enter the reported population",
    module: "CENSUS / MNEMOSYNE",
    irreversible: false,
    // No space-law instrument reaches this at all, and that silence is the
    // finding rather than a gap in the table.
    stances: {},
  },
];

export interface LexConfig {
  activity: LexActivityId;
  /** Distance from the nearest party able to enforce, in light-seconds. */
  distanceLs: number;
  /** Years elapsed between the instrument entering force and the act. */
  yearsElapsed: number;
  /** Does the acting polity recognise its predecessor's obligations? 0–1. */
  successorRecognition: number;
  /** Round trips an enforcement action needs before it bites, in years. */
  enforcementWindowYears: number;
  incident: LexIncident;
}

/** Light-seconds in a year of light travel. */
const LY_LS = 3.15576e7;
/** Binding weight by instrument class (scenario). */
const CLASS_WEIGHT: Record<BindingClass, number> = { treaty: 1, national: 0.6, "non-binding": 0.25 };
/** Binding strength below which an instrument no longer constrains (scenario). */
export const BINDING_FLOOR = 0.3;
/** Withdrawal from the Outer Space Treaty takes effect one year after notice. */
export const DENUNCIATION_NOTICE_YEARS = 1;
/** Recognition retained per century of elapsed time, absent renewal (scenario). */
const RECOGNITION_HALF_LIFE_YEARS = 180;

export function lexConfig(): LexConfig {
  return {
    activity: "stellar-collection",
    distanceLs: 0.6 * 499.005,
    yearsElapsed: 200,
    successorRecognition: 0.7,
    enforcementWindowYears: 5,
    incident: "none",
  };
}

export interface InstrumentVerdict {
  instrument: LexInstrument;
  stance: LexStance;
  /** How much force it still carries, 0–1. */
  binding: number;
  /** Whether anyone bound by it can act on a breach inside the window. */
  enforceable: boolean;
  binds: boolean;
}

export function evaluateLex(c: LexConfig) {
  const activity = LEX_ACTIVITIES.find((a) => a.id === c.activity) ?? LEX_ACTIVITIES[0];
  const lapsed = c.incident === "successor-lapse";
  const denounced = c.incident === "denunciation";
  const cutOff = c.incident === "enforcement-gap";

  const recognition = lapsed
    ? 0
    : Math.min(1, Math.max(0, c.successorRecognition)) *
      0.5 ** (Math.max(0, c.yearsElapsed) / RECOGNITION_HALF_LIFE_YEARS);

  // Enforcement needs a round trip, plus whatever the process itself costs.
  const roundTripYears = (2 * Math.max(0, c.distanceLs)) / LY_LS;
  const enforcementReachable = !cutOff && roundTripYears <= Math.max(0, c.enforcementWindowYears);

  const verdicts: InstrumentVerdict[] = LEX_INSTRUMENTS.map((instrument) => {
    const stance = activity.stances[instrument.id] ?? "silent";
    // A treaty the acting polity denounced still governs acts committed while
    // it was bound; denunciation is prospective, and takes a year besides.
    const denouncedHere = denounced && instrument.id === "ost";
    const prospectiveOnly = denouncedHere && c.yearsElapsed > DENUNCIATION_NOTICE_YEARS;
    const binding =
      CLASS_WEIGHT[instrument.bindingClass] *
      instrument.partiesFraction *
      (0.35 + 0.65 * recognition) *
      (prospectiveOnly ? 0.4 : 1);
    return {
      instrument,
      stance,
      binding,
      enforceable: enforcementReachable,
      binds: stance !== "silent" && binding >= BINDING_FLOOR,
    };
  });

  const prohibitions = verdicts.filter((v) => v.stance === "prohibits" && v.binds);
  const restrictions = verdicts.filter((v) => v.stance === "restricts" && v.binds);
  const permissions = verdicts.filter((v) => v.stance === "permits" && v.binds);
  const applicable = verdicts.filter((v) => v.stance !== "silent");

  // INVARIANT: lawfulness is decided by what binds, never by who can reach.
  // Enforceability is computed separately and only ever reported.
  const lawful = prohibitions.length === 0;
  const enforceable = prohibitions.some((v) => v.enforceable);
  /** Prohibited, and nobody able to do anything about it. */
  const impunity = !lawful && !enforceable;
  const contested = prohibitions.length > 0 && permissions.length > 0;
  const undetermined = applicable.length === 0;

  const verdict = undetermined
    ? "UNGOVERNED"
    : !lawful
      ? "UNLAWFUL"
      : restrictions.length > 0
        ? "CONDITIONALLY LAWFUL"
        : "LAWFUL";

  const constraints = [
    ...prohibitions.map((v) => `${v.instrument.name} prohibits this act — ${v.instrument.provision}`),
    ...(impunity
      ? [
          `Prohibited and unenforceable: nearest party is ${roundTripYears.toFixed(2)} yr of round trip away. Unenforceable is not permitted.`,
        ]
      : []),
    ...(contested
      ? [
          `Instruments disagree: ${permissions.map((v) => v.instrument.name).join(", ")} permit what ${prohibitions.map((v) => v.instrument.name).join(", ")} prohibit`,
        ]
      : []),
    ...(undetermined
      ? ["No instrument in the register reaches this activity; the silence is the finding, not a permission"]
      : []),
    ...restrictions.map((v) => `${v.instrument.name} restricts this act — ${v.instrument.provision}`),
    ...(lapsed ? ["Signatory polity no longer exists; no successor recognises the obligation"] : []),
    ...(denounced
      ? [
          `Outer Space Treaty denounced; withdrawal binds only ${DENUNCIATION_NOTICE_YEARS} yr after notice and never retroactively`,
        ]
      : []),
    ...(cutOff ? ["Enforcement body unreachable at any latency"] : []),
    ...(recognition < 0.25
      ? [
          `Successor recognition at ${(recognition * 100).toFixed(0)}%; most instruments have fallen below the binding floor`,
        ]
      : []),
  ];

  const readiness = !lawful ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = !lawful
    ? impunity
      ? "UNLAWFUL · UNENFORCEABLE"
      : "UNLAWFUL · ENFORCEABLE"
    : undetermined
      ? "UNGOVERNED ACT"
      : restrictions.length > 0
        ? "CONDITIONAL COMPLIANCE"
        : "IN COMPLIANCE";

  return {
    activity,
    verdicts,
    prohibitions: prohibitions.length,
    restrictions: restrictions.length,
    permissions: permissions.length,
    lawful,
    enforceable,
    impunity,
    contested,
    undetermined,
    recognition,
    roundTripYears,
    verdict,
    readiness,
    safeMode,
    constraints,
  } as const;
}

/** Share of the instrument register whose provisions are quoted from source. */
export const instrumentsGroundedFraction = (): number =>
  LEX_INSTRUMENTS.filter((i) => i.grounding === "sourced").length / LEX_INSTRUMENTS.length;
