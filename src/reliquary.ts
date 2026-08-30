/**
 * RELIQUARY — century-scale knowledge preservation.
 *
 * A hundred-year project's quietest enemy is not fire but entropy in three
 * currencies: media decay corrupts bits, format death leaves intact bits
 * unreadable, and institutional forgetting leaves readable archives that
 * nobody knows how to restore. RELIQUARY couples all three so the operator
 * can watch a "safe" archive die of the one budget they neglected.
 *
 * Grounded anchors: media classes decay on wildly different timescales
 * (magnetic tape is rated in decades, pressed film and fused silica in
 * centuries); format obsolescence and reader extinction are documented
 * archival failure modes; and digital-preservation practice (LOCKSS,
 * 3-2-1) is built on independent copies plus scheduled verification.
 * Specific half-lives, knowledge decay, and probability composition are
 * RUIN scenario coefficients.
 *
 * The non-negotiable invariant is the verified-restore rule: a backup that
 * has not been restored in rehearsal within its rehearsal interval counts
 * as zero copies. Unverified redundancy is a rumor, not a plan.
 */

export type MediaClass = "magnetic-tape" | "hard-disk" | "archival-film" | "fused-silica";
export type ReliquaryIncident = "none" | "reader-extinction" | "curator-loss";
export type ReliquaryReadiness = "GO" | "CONDITIONAL" | "NO-GO";

export interface ReliquaryConfig {
  archivePB: number;
  copies: number;
  media: MediaClass;
  /** Years between integrity scrubs (detect + repair from healthy copies). */
  scrubIntervalYears: number;
  /** Years between format migrations to a currently readable encoding. */
  migrationIntervalYears: number;
  /** Years a format generation remains readable before its readers die out. */
  formatLifeYears: number;
  /** Years between full restore rehearsals. */
  rehearsalIntervalYears: number;
  curatorFTE: number;
  horizonYears: number;
  incident: ReliquaryIncident;
}

export const MEDIA_META: Record<MediaClass, { name: string; halfLifeYears: number; detail: string }> = {
  "magnetic-tape": { name: "MAGNETIC TAPE", halfLifeYears: 15, detail: "Dense and cheap; decades at best" },
  "hard-disk": { name: "HARD DISK", halfLifeYears: 7, detail: "Online and fast; dies youngest" },
  "archival-film": { name: "ARCHIVAL FILM", halfLifeYears: 100, detail: "Human-readable with a lens" },
  "fused-silica": { name: "FUSED SILICA", halfLifeYears: 500, detail: "Century-class; slow and costly" },
};

/** Institutional memory halves this often without deliberate renewal (scenario). */
const KNOWLEDGE_HALF_LIFE_YEARS = 12;
/** Curator coverage that keeps renewal running at full effect (scenario). */
const CURATORS_FOR_FULL_RENEWAL = 3;

export interface ReliquaryYear {
  year: number;
  survival: number;
  readable: boolean;
  knowledge: number;
  countedCopies: number;
}

export function reliquaryConfig(): ReliquaryConfig {
  return {
    archivePB: 40,
    copies: 3,
    media: "magnetic-tape",
    scrubIntervalYears: 2,
    migrationIntervalYears: 10,
    formatLifeYears: 25,
    rehearsalIntervalYears: 5,
    curatorFTE: 4,
    horizonYears: 100,
    incident: "none",
  };
}

export function evaluateReliquary(c: ReliquaryConfig) {
  const copies = Math.max(0, Math.floor(c.copies));
  const halfLife = MEDIA_META[c.media].halfLifeYears;
  const scrub = Math.max(0.5, c.scrubIntervalYears);

  // Probability one copy is lost within a scrub window; the archive loses
  // data only if every copy fails inside the same window, before repair.
  const perCopyWindowLoss = 1 - 2 ** (-scrub / halfLife);

  // INVARIANT: copies count only while rehearsed. No rehearsal, no copies.
  const rehearsed = c.rehearsalIntervalYears <= c.horizonYears && c.rehearsalIntervalYears > 0;

  // Format readability: migration must outpace reader extinction. The
  // incident halves the remaining reader lifetime overnight.
  const formatLife = c.incident === "reader-extinction" ? c.formatLifeYears / 2 : c.formatLifeYears;
  const readabilityHeld = c.migrationIntervalYears <= formatLife;

  const curators = c.incident === "curator-loss" ? Math.max(0, c.curatorFTE - 3) : c.curatorFTE;
  const renewal = Math.min(1, curators / CURATORS_FOR_FULL_RENEWAL);

  const trajectory: ReliquaryYear[] = [];
  let survival = 1;
  let knowledge = 1;
  let expectedLossYear: number | null = null;

  for (let year = 0; year <= Math.max(1, Math.floor(c.horizonYears)); year += 1) {
    const countedCopies = rehearsed && year >= 0 ? copies : 0;
    const readable = readabilityHeld || year < formatLife;

    trajectory.push({ year, survival, readable, knowledge, countedCopies });

    // Institutional memory decays and is renewed by staffed rehearsal.
    const decay = 2 ** (-1 / KNOWLEDGE_HALF_LIFE_YEARS);
    knowledge = knowledge * decay + (1 - decay) * renewal * (rehearsed ? 1 : 0);

    // Bits survive a year if not all counted copies die in a scrub window.
    // Lost readability or lost restore knowledge gates survival exactly
    // like lost bits: an archive nobody can read has not survived.
    const windowLoss = countedCopies > 0 ? perCopyWindowLoss ** countedCopies : 1;
    const annualLoss = windowLoss / scrub;
    survival *= Math.max(0, 1 - annualLoss) * (readable ? 1 : 0.5) * (0.6 + 0.4 * knowledge);
    if (expectedLossYear === null && survival < 0.5) expectedLossYear = year;
  }

  const last = trajectory.at(-1)!;
  const constraints = [
    ...(!rehearsed
      ? ["Restores are never rehearsed: every copy counts as zero — the archive is a rumor"]
      : []),
    ...(!readabilityHeld
      ? [
          `Migration every ${c.migrationIntervalYears}y cannot outpace a ${formatLife.toFixed(0)}y reader lifetime`,
        ]
      : []),
    ...(copies < 3 ? [`${copies} copies is below the independent-copy floor of 3`] : []),
    ...(renewal < 1
      ? [`Curator coverage ${(renewal * 100).toFixed(0)}%; institutional memory decays faster than renewal`]
      : []),
    ...(c.incident === "reader-extinction" ? ["Reader extinction halved the remaining format lifetime"] : []),
    ...(last.survival < 0.9 && last.survival >= 0.5
      ? [`Century survival ${(last.survival * 100).toFixed(0)}% — below the 90% design floor`]
      : []),
  ];

  const hard = last.survival < 0.5 || !rehearsed;
  const readiness: ReliquaryReadiness = hard ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = !rehearsed
    ? "REHEARSAL MANDATE"
    : !readabilityHeld
      ? "EMERGENCY MIGRATION"
      : renewal < 1
        ? "KNOWLEDGE RENEWAL"
        : "SCHEDULED STEWARDSHIP";

  return {
    trajectory,
    survivalAtHorizon: last.survival,
    knowledgeAtHorizon: last.knowledge,
    countedCopies: last.countedCopies,
    perCopyWindowLoss,
    readabilityHeld,
    renewal,
    expectedLossYear,
    readiness,
    safeMode,
    constraints,
  };
}
