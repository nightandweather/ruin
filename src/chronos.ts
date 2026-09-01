/**
 * CHRONOS — simultaneity, causal order, and command freshness.
 *
 * Every other laboratory in RUIN uses light-lag as a parameter. THEMIS asks
 * whether a veto can physically arrive; ODYSSEY puts light-time in the
 * navigation budget; WATCHFLOOR subtracts it from the decision window. None
 * of them treats it as the subject, and the subject is not the delay. It is
 * that beyond a certain radius there is no civilization-wide "now" at all:
 * two settlements can disagree about which of two events happened first, and
 * both are right.
 *
 * Grounded anchors: relativity of simultaneity — two events separated by more
 * space than light can cross in the time between them (spacelike separation)
 * have no frame-independent order, and for any such pair there exist valid
 * frames in which either came first. Time dilation by the Lorentz factor
 * γ = 1/√(1−v²/c²) is likewise standard, and gravity assists of the same
 * mathematics fly today. The site distances are real orbital and stellar
 * distances; the event schedule, the drift rates, and every operational
 * threshold are RUIN scenario parameters.
 *
 * The non-negotiable invariant is that the ledger never lies about order. It
 * may not assert a sequence over spacelike-separated events, because no such
 * sequence exists to record, and it may not record an effect before its
 * cause. A recording policy that produces either is refused by the model —
 * the ledger is withheld, not annotated.
 */

export type ChronosPolicy = "arrival" | "timestamp" | "partial";
export type ChronosIncident = "none" | "relay-outage" | "frame-shift" | "clock-drift";

/** Light-seconds per astronomical unit. */
const AU_LS = 499.005;
/** Light-seconds per light-year — light travels one light-year in one year. */
const LY_LS = 3.15576e7;

export interface ChronosSite {
  id: string;
  name: string;
  detail: string;
  /** Distance from the ledger station, in light-seconds. */
  distanceLs: number;
  /** Cruise velocity as a fraction of c. Only the cruiser is relativistic. */
  velocityC: number;
  /** Phase of this site's event schedule within the run window, in [0, 1). */
  phase: number;
}

/**
 * One fixed network, so a run is comparable across configurations. The
 * distances are real: the Moon at 1.28 light-seconds, a HELIOS collector at
 * 0.4 AU seen from Earth, Jupiter at opposition, the inner Kuiper belt, a
 * cruiser 1.2 light-years out, and the α Centauri settlement at 4.3465 ly.
 */
export const CHRONOS_SITES: readonly ChronosSite[] = [
  {
    id: "foundry",
    name: "LUNA FOUNDRY",
    detail: "1.28 light-seconds — inside every practical decision window",
    distanceLs: 1.28,
    velocityC: 0,
    phase: 0.05,
  },
  {
    id: "helios",
    name: "HELIOS SWARM",
    detail: "0.6 AU — five light-minutes of round trip before anything moves",
    distanceLs: 0.6 * AU_LS,
    velocityC: 0,
    phase: 0.23,
  },
  {
    id: "waystation",
    name: "JOVIAN WAYSTATION",
    detail: "4.2 AU — a command answers a state seventy minutes old",
    distanceLs: 4.2 * AU_LS,
    velocityC: 0,
    phase: 0.41,
  },
  {
    id: "kuiper",
    name: "KUIPER RELAY",
    detail: "40 AU — eleven hours of round trip; the edge of supervised control",
    distanceLs: 40 * AU_LS,
    velocityC: 0,
    phase: 0.62,
  },
  {
    id: "cruiser",
    name: "ODYSSEY CRUISER",
    detail: "1.2 light-years out and the only clock running at its own rate",
    distanceLs: 1.2 * LY_LS,
    velocityC: 0.6,
    phase: 0.78,
  },
  {
    id: "proxima",
    name: "α CEN SETTLEMENT",
    detail: "4.3465 light-years — no shared present exists with this site",
    distanceLs: 4.3465 * LY_LS,
    velocityC: 0,
    phase: 0.91,
  },
];

export interface ChronosConfig {
  policy: ChronosPolicy;
  /** Cruiser velocity as a fraction of c; sets its clock rate. */
  cruiserVelocityC: number;
  /** Seconds of staleness an irreversible command may carry. */
  decisionWindowS: number;
  /** Seconds a delegated authority grant stays valid before it must refresh. */
  grantValidityS: number;
  /** Seconds within which two clocks must agree to share a "now". */
  syncToleranceS: number;
  eventsPerSite: number;
  /** Length of the recorded window, in seconds of ledger-station time. */
  windowS: number;
  incident: ChronosIncident;
}

/** The `frame-shift` incident forces the cruiser to this velocity mid-run. */
const SHIFTED_VELOCITY_C = 0.9;
/** Clock drift under the `clock-drift` incident, in parts per million. */
const DRIFT_PPM = 900;
/**
 * The site whose oscillator drifts. Deliberately the nearest one: it is the
 * only site in the network that has a shared present to lose.
 */
const DRIFT_SITE = "foundry";
/** Sites the deep relay carries; a relay outage cuts them off entirely. */
const RELAY_SITES = ["cruiser", "proxima"];

export type PairRelation = "before" | "after" | "concurrent";

export interface ChronosEvent {
  id: string;
  siteId: string;
  siteName: string;
  /** Coordinate time in the ledger station's frame, seconds from run start. */
  coordinateS: number;
  /** The timestamp the site's own clock puts on it. */
  localS: number;
  /** When the ledger station receives the report. */
  arrivalS: number;
  distanceLs: number;
}

export interface OrderFault {
  a: string;
  b: string;
  kind: "fabricated" | "inverted";
  detail: string;
}

export const lorentzFactor = (velocityC: number) => {
  const v = Math.min(0.999999, Math.max(0, velocityC));
  return 1 / Math.sqrt(1 - v * v);
};

export function chronosConfig(): ChronosConfig {
  return {
    policy: "arrival",
    cruiserVelocityC: 0.6,
    decisionWindowS: 3600,
    grantValidityS: 86_400,
    syncToleranceS: 60,
    eventsPerSite: 6,
    windowS: 12 * LY_LS,
    incident: "none",
  };
}

/**
 * The physically invariant relation between two events.
 *
 * With c = 1 and distance in light-seconds, light crosses Δx in Δx seconds.
 * If the events are further apart in space than light can cross in the time
 * between them, no signal connects them, no frame agrees on their order, and
 * the honest answer is that they are concurrent.
 */
export function relate(a: ChronosEvent, b: ChronosEvent): PairRelation {
  const dt = b.coordinateS - a.coordinateS;
  const dx = Math.abs(b.distanceLs - a.distanceLs);
  if (dx > Math.abs(dt)) return "concurrent";
  return dt >= 0 ? "before" : "after";
}

export function evaluateChronos(c: ChronosConfig) {
  const window = Math.max(1, c.windowS);
  const perSite = Math.max(1, Math.floor(c.eventsPerSite));
  const drifting = c.incident === "clock-drift";
  const shifting = c.incident === "frame-shift";
  const outage = c.incident === "relay-outage";

  const sites = CHRONOS_SITES.map((site) => ({
    ...site,
    velocityC: site.id === "cruiser" ? Math.min(0.99, Math.max(0, c.cruiserVelocityC)) : site.velocityC,
    reachable: !(outage && RELAY_SITES.includes(site.id)),
  }));

  const events: ChronosEvent[] = [];
  let eventsLost = 0;
  for (const site of sites) {
    // A site the relay cannot reach does not appear in the ledger at all.
    // Nothing about its order is wrong, because nothing about it is recorded.
    if (!site.reachable) {
      eventsLost += perSite;
      continue;
    }
    const gamma = lorentzFactor(site.velocityC);
    const shiftedGamma = lorentzFactor(SHIFTED_VELOCITY_C);
    for (let k = 0; k < perSite; k += 1) {
      const coordinateS = ((k + site.phase) / perSite) * window;
      // A moving clock accrues proper time more slowly, so the timestamp the
      // site writes on its own report is smaller than the coordinate time.
      // Under a frame shift the cruiser changes rate mid-run, so its later
      // stamps are on a different scale from its earlier ones.
      const half = window / 2;
      const proper =
        shifting && site.id === "cruiser" && coordinateS > half
          ? half / gamma + (coordinateS - half) / shiftedGamma
          : coordinateS / gamma;
      const drift = drifting && site.id === DRIFT_SITE ? coordinateS * (DRIFT_PPM / 1e6) : 0;
      events.push({
        id: `${site.id}-${k}`,
        siteId: site.id,
        siteName: site.name,
        coordinateS,
        localS: proper + drift,
        arrivalS: coordinateS + site.distanceLs,
        distanceLs: site.distanceLs,
      });
    }
  }
  events.sort((a, b) => a.coordinateS - b.coordinateS || (a.id < b.id ? -1 : 1));

  // What the selected policy claims about each pair.
  const asserted = (a: ChronosEvent, b: ChronosEvent): PairRelation => {
    if (c.policy === "partial") return relate(a, b);
    const key = c.policy === "arrival" ? "arrivalS" : "localS";
    const delta = b[key] - a[key];
    if (delta === 0) return "concurrent";
    return delta > 0 ? "before" : "after";
  };

  const faults: OrderFault[] = [];
  let spacelikePairs = 0;
  let pairs = 0;
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const a = events[i];
      const b = events[j];
      const truth = relate(a, b);
      const claim = asserted(a, b);
      pairs += 1;
      if (truth === "concurrent") spacelikePairs += 1;
      if (truth === claim) continue;
      if (truth === "concurrent") {
        // INVARIANT: no order exists here, so none may be recorded.
        faults.push({
          a: a.id,
          b: b.id,
          kind: "fabricated",
          detail: `${a.siteName} and ${b.siteName} are spacelike separated; the ledger claims an order`,
        });
      } else {
        // Worse: the ledger has an effect preceding its cause.
        faults.push({
          a: a.id,
          b: b.id,
          kind: "inverted",
          detail: `${a.siteName} → ${b.siteName} recorded in reverse; an effect precedes its cause`,
        });
      }
    }
  }
  const fabricated = faults.filter((fault) => fault.kind === "fabricated").length;
  const inverted = faults.filter((fault) => fault.kind === "inverted").length;
  // An effect recorded before its cause is strictly worse than an invented
  // order between events that never touched, so it is what the operator sees
  // first — the register is capped, and the cap must not hide the worse fault.
  const ranked = [...faults].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "inverted" ? -1 : 1));

  // Command freshness, delegated authority, and the radius of a shared now.
  const roster = sites.map((site) => {
    const roundTripS = site.reachable ? 2 * site.distanceLs : Infinity;
    const gamma = lorentzFactor(site.velocityC);
    // Drift is measured against the ledger station's clock over the window.
    const clockOffsetS = drifting && site.id === DRIFT_SITE ? window * (DRIFT_PPM / 1e6) : 0;
    return {
      ...site,
      gamma,
      roundTripS,
      clockOffsetS,
      /** A command answers a state this old; beyond the window it is refused. */
      commandAdmitted: roundTripS <= Math.max(0, c.decisionWindowS),
      /** Authority that cannot be refreshed inside its validity must expire. */
      authorityHeld: roundTripS < Math.max(1, c.grantValidityS),
      /**
       * A "now" agreed to within tolerance needs two things: the round trip
       * has to fit inside the tolerance, and the clocks have to actually
       * agree. A perfect link to a drifting clock buys no shared present.
       */
      sharesNow: roundTripS <= Math.max(0, c.syncToleranceS) && clockOffsetS <= Math.max(0, c.syncToleranceS),
      /** Proper time this site accrues over the recorded window. */
      properWindowS: window / gamma,
    };
  });

  const admitted = roster.filter((site) => site.commandAdmitted);
  const autonomous = roster.filter((site) => !site.authorityHeld);
  const sharedNow = roster.filter((site) => site.sharesNow);
  const unreachable = roster.filter((site) => !site.reachable);
  const nowRadiusLs = Math.max(0, c.syncToleranceS) / 2;
  const maxClockGapS = Math.max(...roster.map((site) => window - site.properWindowS));

  const ledgerHonest = fabricated === 0 && inverted === 0;

  const constraints = [
    ...(inverted > 0 ? [`${inverted} pair(s) recorded with an effect before its cause`] : []),
    ...(fabricated > 0 ? [`${fabricated} spacelike pair(s) given an order the universe does not have`] : []),
    ...(sharedNow.length < roster.length
      ? [
          `A shared present holds only inside ${nowRadiusLs.toFixed(1)} light-seconds: ${sharedNow.length} of ${roster.length} sites`,
        ]
      : []),
    ...(autonomous.length > 0
      ? [
          `${autonomous.map((site) => site.name).join(", ")} cannot refresh delegated authority; local autonomy or nothing`,
        ]
      : []),
    ...(roster.length - admitted.length > 0
      ? [`${roster.length - admitted.length} site(s) outside the ${c.decisionWindowS}s decision window`]
      : []),
    ...(unreachable.length > 0
      ? [
          `Deep relay down: ${unreachable.map((site) => site.name).join(", ")} unreachable; ${eventsLost} events never reached the ledger`,
        ]
      : []),
    ...(drifting && sharedNow.length === 0
      ? ["No two clocks in the network agree inside the tolerance; there is no shared present anywhere"]
      : []),
    ...(shifting ? ["Cruiser changed frame mid-run; its earlier stamps are on another scale"] : []),
    ...(drifting ? [`${DRIFT_PPM} ppm oscillator drift on the Kuiper relay`] : []),
  ];

  const readiness = !ledgerHonest ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = !ledgerHonest
    ? "LEDGER REFUSED"
    : autonomous.length > 0
      ? "PARTIAL ORDER · LOCAL AUTONOMY"
      : "PARTIAL ORDER · SUPERVISED";

  return {
    events,
    roster,
    pairs,
    spacelikePairs,
    eventsLost,
    faults: ranked.slice(0, 12),
    fabricated,
    inverted,
    ledgerHonest,
    nowRadiusLs,
    sharedNowCount: sharedNow.length,
    admittedCount: admitted.length,
    autonomousCount: autonomous.length,
    maxClockGapS,
    windowS: window,
    readiness,
    safeMode,
    constraints,
  } as const;
}

/** Seconds rendered in the largest unit that keeps the number readable. */
export function humanDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "∞";
  const abs = Math.abs(seconds);
  if (abs < 90) return `${seconds.toFixed(abs < 10 ? 2 : 0)} s`;
  if (abs < 5400) return `${(seconds / 60).toFixed(1)} min`;
  if (abs < 172_800) return `${(seconds / 3600).toFixed(1)} h`;
  if (abs < LY_LS) return `${(seconds / 86_400).toFixed(1)} d`;
  return `${(seconds / LY_LS).toFixed(2)} yr`;
}
