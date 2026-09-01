/**
 * WATCHFLOOR — the control room as a modelled system.
 *
 * Every SENTINEL fault-response plan in this repository ends the same way:
 * "the operator decides." That step has always been free. WATCHFLOOR prices
 * it. Alarms arrive faster than they can be triaged, attention degrades with
 * queue depth and time on console, shift handover destroys context, and a
 * history of false alarms teaches a crew to defer the very alarm that matters.
 * The physics of the plant is not the subject here; the humans holding it are.
 *
 * Grounded anchors: alarm flooding and operator overload are documented
 * process-control failure modes (the EEMUA 191 alarm-rate guidance exists
 * because unmanaged alarm rates defeat crews), shift handover is a recognised
 * clinical and industrial defect source, and the cry-wolf effect on alarm
 * response is a real human-factors finding. Every rate, coefficient, and
 * fatigue curve below is a RUIN scenario parameter, not measured data.
 *
 * The non-negotiable invariant is authority withdrawal: while unacknowledged
 * alarms exceed the cap, irreversible-action authority is withdrawn from the
 * floor. A saturated crew may still safe, isolate, and observe — it may not
 * commit anything that cannot be undone. The model enforces it with
 * hysteresis, so authority returns only after the queue is genuinely drained.
 */

export type WatchfloorIncident = "none" | "alarm-flood" | "console-loss" | "cry-wolf" | "handover-collision";

export interface WatchfloorConfig {
  /** Operators on console at the start of the watch. */
  operators: number;
  /** Alarms presented to the floor per minute at baseline. */
  alarmRate: number;
  /** Share of alarms that turn out to be spurious. */
  falseAlarmRate: number;
  /** Share of alarms that carry an irreversible consequence if missed. */
  criticalFraction: number;
  /** Alarms one rested, unsaturated operator can fully triage per minute. */
  triagePerOperator: number;
  /** Minutes per shift before the console changes hands. */
  shiftMinutes: number;
  /** Share of open work whose context is lost at handover and must be redone. */
  handoverLossRate: number;
  /** One-way signal delay to the asset, in minutes. */
  signalDelayMinutes: number;
  /** Share of routine alarms the machine may close without a human. */
  automationAuthority: number;
  /** Length of the watch, in minutes. */
  watchMinutes: number;
  incident: WatchfloorIncident;
}

/** Minutes a critical alarm stays actionable before the window closes. */
export const BASE_CRITICAL_WINDOW = 20;
/** Unacknowledged alarms above which irreversible authority is withdrawn. */
export const AUTHORITY_QUEUE_CAP = 40;
/** Expected missed criticals per watch above which the floor is NO-GO. */
export const MISSED_CRITICAL_LIMIT = 0.5;
/** Queue depth at which withdrawn authority is restored (hysteresis). */
export const AUTHORITY_RECOVERY = 15;
/** Attention floor at the end of a shift — fatigue never zeroes a crew. */
const FATIGUE_FLOOR = 0.55;
const FATIGUE_K = 0.45;
/** Queue depth at which task saturation costs a crew half its throughput. */
const SATURATION_REF = 140;
/** A saturated crew sheds load; it never drops below this share of capacity. */
const SATURATION_FLOOR = 0.45;
/** Queue depth at which a crew stops finding the critical item first. */
const PRIORITISATION_REF = 60;
/** Minutes an incoming shift works below its own capacity. */
const WARMUP_MINUTES = 10;
const WARMUP_ATTENTION = 0.65;
/** Response confidence lost per unit of accumulated false-alarm exposure. */
const CRYWOLF_K = 0.6;
/** Confidence below which criticals start being dismissed as another false one. */
const DISMISSAL_TRUST_REF = 0.75;
/** Minutes over which the cry-wolf effect builds to full strength. */
const CRYWOLF_ONSET = 60;
/** Period of the correlated arrival burst, in minutes. */
const BURST_PERIOD = 70;
/** Peak multiplier of the burst profile over the baseline rate. */
const BURST_PEAK = 1.6;
const FLOOD_START = 60;
const FLOOD_END = 130;
const FLOOD_MULT = 6;
const CONSOLE_LOSS_MINUTE = 90;
const COLLISION_MINUTE = 88;

export interface WatchfloorMinute {
  minute: number;
  queue: number;
  criticals: number;
  arrivals: number;
  attention: number;
  trust: number;
  authority: boolean;
  missed: number;
}

export function watchfloorConfig(): WatchfloorConfig {
  return {
    operators: 3,
    alarmRate: 3,
    falseAlarmRate: 0.35,
    criticalFraction: 0.008,
    triagePerOperator: 1.8,
    shiftMinutes: 120,
    handoverLossRate: 0.25,
    signalDelayMinutes: 8,
    automationAuthority: 0.4,
    watchMinutes: 240,
    incident: "none",
  };
}

export function evaluateWatchfloor(c: WatchfloorConfig) {
  const watch = Math.max(10, Math.floor(c.watchMinutes));
  const shift = Math.max(10, Math.floor(c.shiftMinutes));
  const falseRate = Math.min(1, Math.max(0, c.incident === "cry-wolf" ? 0.7 : c.falseAlarmRate));
  // A decision must be sent early enough to arrive: light-lag is subtracted
  // from the window, not added to the schedule.
  const window = Math.max(1, Math.round(BASE_CRITICAL_WINDOW - Math.max(0, c.signalDelayMinutes)));

  let routineQueue = 0;
  /** criticalAges[i] = unacknowledged criticals that have waited i minutes. */
  let criticalAges: number[] = [];
  let authority = true;
  let authorityWithdrawnMinutes = 0;
  let withdrawnAt: number | null = null;
  let restoredAt: number | null = null;
  let saturationMinute: number | null = null;
  let agedOutCriticals = 0;
  let dismissedCriticals = 0;
  let ackWeight = 0;
  let ackCount = 0;
  let peakQueue = 0;
  let minAttention = 1;
  let handovers = 0;
  let lastHandover = -WARMUP_MINUTES;

  const trajectory: WatchfloorMinute[] = [];

  for (let minute = 0; minute < watch; minute += 1) {
    // Handover: the console changes hands, and part of the open work loses the
    // context that made it tractable. It arrives back as fresh, unowned load.
    const collision = c.incident === "handover-collision" && minute === COLLISION_MINUTE;
    if (minute > 0 && (minute % shift === 0 || collision)) {
      const openWork = routineQueue + criticalAges.reduce((sum, n) => sum + n, 0);
      const loss = Math.min(1, Math.max(0, c.handoverLossRate)) * (collision ? 2 : 1);
      routineQueue += openWork * loss;
      // An urgent item that does not survive the handover note is not merely
      // delayed. Nobody on the incoming shift knows it was ever urgent.
      const orphaned = Math.min(1, loss * 0.5);
      agedOutCriticals += criticalAges.reduce((sum, n) => sum + n, 0) * orphaned;
      criticalAges = criticalAges.map((n) => n * (1 - orphaned));
      handovers += 1;
      lastHandover = minute;
    }

    // Faults are correlated, so alarms arrive in bursts rather than at a flat
    // rate. A queue against a flat arrival either drains to zero or diverges;
    // it is the bursts that make a floor recover, and handover land on work.
    const burst = 1 + BURST_PEAK * Math.max(0, Math.sin((2 * Math.PI * minute) / BURST_PERIOD)) ** 3;
    const flooding = c.incident === "alarm-flood" && minute >= FLOOD_START && minute < FLOOD_END;
    const arrivals = Math.max(0, c.alarmRate) * burst * (flooding ? FLOOD_MULT : 1);
    const criticalArrivals = arrivals * Math.min(1, Math.max(0, c.criticalFraction));
    const routineArrivals = arrivals - criticalArrivals;
    // Automation may close routine alarms alone. It is never given criticals:
    // that is the authority boundary THEMIS draws, respected here.
    const machineClosed = routineArrivals * Math.min(1, Math.max(0, c.automationAuthority));

    routineQueue += routineArrivals - machineClosed;
    criticalAges = [criticalArrivals, ...criticalAges];

    const openCriticals = criticalAges.reduce((sum, n) => sum + n, 0);
    const totalQueue = routineQueue + openCriticals;
    peakQueue = Math.max(peakQueue, totalQueue);
    if (saturationMinute === null && totalQueue > AUTHORITY_QUEUE_CAP) saturationMinute = minute;

    // INVARIANT: irreversible authority is withdrawn while the floor is
    // saturated, and returns only after the queue is genuinely drained.
    if (authority && totalQueue > AUTHORITY_QUEUE_CAP) {
      authority = false;
      if (withdrawnAt === null) withdrawnAt = minute;
    } else if (!authority && totalQueue < AUTHORITY_RECOVERY) {
      authority = true;
      restoredAt = minute;
    }
    if (!authority) authorityWithdrawnMinutes += 1;

    const activeOperators =
      Math.max(0, c.operators) * (c.incident === "console-loss" && minute >= CONSOLE_LOSS_MINUTE ? 0.5 : 1);
    const intoShift = (minute % shift) / shift;
    const fatigue = Math.max(FATIGUE_FLOOR, 1 - FATIGUE_K * intoShift ** 2);
    const saturation = Math.max(SATURATION_FLOOR, 1 / (1 + totalQueue / SATURATION_REF));
    const warmup = minute - lastHandover < WARMUP_MINUTES ? WARMUP_ATTENTION : 1;
    const attention = fatigue * saturation * warmup;
    minAttention = Math.min(minAttention, attention);
    // Cry-wolf: exposure to spurious alarms teaches deferral, and deferral is
    // spent on exactly the alarms that deserved the attention.
    const trust = Math.max(0, 1 - CRYWOLF_K * falseRate * Math.min(1, minute / CRYWOLF_ONSET));

    // Cry-wolf, made concrete: below the confidence threshold a share of new
    // criticals is written off as another spurious alarm. They are never
    // worked, so no amount of spare capacity later recovers them.
    const dismissalRate = Math.max(0, (DISMISSAL_TRUST_REF - trust) / DISMISSAL_TRUST_REF);
    const dismissed = criticalAges[0] * dismissalRate;
    criticalAges[0] -= dismissed;
    dismissedCriticals += dismissed;

    let capacity = Math.max(0, activeOperators * Math.max(0, c.triagePerOperator) * attention);
    // Finding the critical item in a deep queue is itself work. A shallow
    // queue is sorted at a glance; a flooded one is worked first-come, and a
    // critical alarm is buried by volume rather than by any decision.
    const criticalShare = totalQueue > 0 ? openCriticals / totalQueue : 1;
    const prioritisation = Math.max(criticalShare, 1 / (1 + totalQueue / PRIORITISATION_REF));
    let criticalCapacity = capacity * prioritisation;
    for (let age = criticalAges.length - 1; age >= 0 && criticalCapacity > 0; age -= 1) {
      const handled = Math.min(criticalAges[age], criticalCapacity);
      criticalAges[age] -= handled;
      criticalCapacity -= handled;
      capacity -= handled;
      ackWeight += handled * age;
      ackCount += handled;
    }
    const routineHandled = Math.min(routineQueue, Math.max(0, capacity));
    routineQueue -= routineHandled;

    // Anything still unacknowledged past the window is a missed intervention.
    while (criticalAges.length > window) {
      agedOutCriticals += criticalAges.pop() ?? 0;
    }
    const missedCriticals = agedOutCriticals + dismissedCriticals;

    trajectory.push({
      minute,
      queue: routineQueue + criticalAges.reduce((sum, n) => sum + n, 0),
      criticals: criticalAges.reduce((sum, n) => sum + n, 0),
      arrivals,
      attention,
      trust,
      authority,
      missed: missedCriticals,
    });
  }

  const missedCriticals = agedOutCriticals + dismissedCriticals;
  const endQueue = trajectory.at(-1)!.queue;
  const meanAckLatency = ackCount > 0 ? ackWeight / ackCount : 0;

  const constraints = [
    ...(agedOutCriticals >= 0.5
      ? [
          `${agedOutCriticals.toFixed(1)} critical alarms aged out of a ${window}-minute window unacknowledged`,
        ]
      : []),
    ...(dismissedCriticals >= 0.5
      ? [
          `${dismissedCriticals.toFixed(1)} real criticals written off as spurious by a crew that stopped believing`,
        ]
      : []),
    ...(saturationMinute !== null
      ? [`Floor saturated at minute ${saturationMinute}; queue over ${AUTHORITY_QUEUE_CAP} unacknowledged`]
      : []),
    ...(withdrawnAt !== null
      ? [
          `Irreversible authority withdrawn at minute ${withdrawnAt}` +
            (restoredAt !== null ? `, restored at ${restoredAt}` : " and never restored this watch"),
        ]
      : []),
    ...(c.signalDelayMinutes >= BASE_CRITICAL_WINDOW
      ? ["Signal delay exceeds the decision window: no command can arrive in time"]
      : []),
    ...(c.incident === "cry-wolf"
      ? [`False-alarm exposure at ${(falseRate * 100).toFixed(0)}%; response confidence collapsing`]
      : []),
    ...(handovers > 0 && endQueue > AUTHORITY_RECOVERY
      ? [`${handovers} handover(s) returned lost context as new load`]
      : []),
    ...(minAttention < 0.5
      ? [`Attention floor ${(minAttention * 100).toFixed(0)}% — crew past useful capacity`]
      : []),
  ];

  // Expected-value model: half a missed critical per watch is one missed
  // intervention every second watch, which is not a tolerable rate.
  const readiness =
    missedCriticals >= MISSED_CRITICAL_LIMIT ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    missedCriticals >= MISSED_CRITICAL_LIMIT
      ? "MISSED INTERVENTION REVIEW"
      : !trajectory.at(-1)!.authority
        ? "IRREVERSIBLE AUTHORITY WITHDRAWN"
        : saturationMinute !== null
          ? "SUPERVISED AUTONOMY"
          : "NOMINAL WATCH";

  return {
    trajectory,
    window,
    peakQueue,
    saturationMinute,
    withdrawnAt,
    restoredAt,
    authorityWithdrawnMinutes,
    missedCriticals,
    agedOutCriticals,
    dismissedCriticals,
    meanAckLatency,
    minAttention,
    endQueue,
    handovers,
    readiness,
    safeMode,
    constraints,
  } as const;
}
