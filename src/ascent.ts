/**
 * ASCENT — what happens when surface production outruns safe transport.
 *
 * HELIOS has carried a toy of this since its first commit: a factory backlog,
 * one elevator, twelve ticks to orbit. This module is that state machine
 * promoted to a transport system, because the question it hides is real:
 * FOUNDRY can smelt faster than anything can safely climb, and the honest
 * response to over-production is a growing surface stockpile, not an
 * unvalidated launch.
 *
 * Grounded anchors:
 *
 * - Edwards' NIAC space-elevator study (2003) baselines a 20-tonne climber
 *   ascending at about 200 km/h — roughly seven and a half days to GEO — with
 *   tether stress limiting how many climbers share the ribbon. Those are this
 *   module's climber mass and cadence limits.
 * - O'Neill's lunar mass driver and the 1975 NASA Ames summer study launch
 *   bulk material to a catcher at L2. The catcher is the receiver, and its
 *   confidence number is what the launch authorization reads.
 * - Range safety practice licenses no launch without a validated flight
 *   corridor; this module applies the same rule to both routes.
 * - The driver's exclusion of living cargo is physics before it is policy:
 *   reaching 2.4 km/s in a one-kilometre track is about 290 g sustained, and
 *   nothing alive rides that.
 *
 * The routes, rates, depots, and every incident are RUIN scenario parameters.
 * The finding they are tuned to show: bulk cargo reroutes when a road closes,
 * people do not. The mass driver can absorb the elevator's whole manifest the
 * day the tether holds — except the two tonnes of crew, who wait, because the
 * only human-rated road is one ribbon. Redundancy of routes is the N-1 of
 * logistics, and the human-rated route has none.
 *
 * Three invariants. No launch without a validated corridor, a certified
 * manifest, and a receiver that can take custody — a catcher below its
 * confidence floor or a saturated depot refuses mass at the muzzle, not in
 * flight. Living cargo never boards the mass driver, even when the driver has
 * spare capacity and the elevator has none. And mass is conserved: every
 * tonne produced is moved, waiting, or refused — the cargo ledger closes.
 */

export type AscentIncident =
  "none" | "tether-hold" | "missed-window" | "depot-saturation" | "receiver-uncertainty";

export interface AscentConfig {
  /** FOUNDRY output arriving at the surface railhead, t/day. */
  foundryOutputTPerDay: number;
  /** Crew and other living cargo, t/day. Elevator only, by physics. */
  crewTPerDay: number;
  /** Manifest certification throughput, t/day. */
  certificationTPerDay: number;
  /** Climbers dispatched per day; the ribbon's stress sets the ceiling. */
  climbersPerDay: number;
  /** Fraction of days the elevator corridor is clear of weather holds. */
  weatherAvailability: number;
  /** Mass-driver launch windows per day. */
  windowsPerDay: number;
  /** Tonnes one window can throw. */
  driverTonsPerWindow: number;
  /** The catcher's published capture confidence, 0–1. */
  catcherConfidence: number;
  /** Below this confidence the driver is refused authorization. */
  confidenceFloor: number;
  /** Orbital depot capacity, t. */
  depotCapacityT: number;
  /** Current depot fill, fraction of capacity. */
  depotFillPercent: number;
  /** C-01 replacement hardware the swarm consumes, t/day. */
  replacementDemandTPerDay: number;
  /** Outbound transfers to the port and fleet, t/day. */
  transferOutTPerDay: number;
  incident: AscentIncident;
}

/** Edwards' NIAC baseline climber, tonnes. */
export const CLIMBER_MASS_T = 20;
/** Edwards' climb rate: ~200 km/h, GEO in about 7.5 days. */
export const CLIMB_DAYS_TO_GEO = 7.5;
/** Driver exit velocity, m/s (scenario, lunar-escape class). */
export const DRIVER_EXIT_MS = 2400;
/** Driver track length, m (scenario). */
export const DRIVER_TRACK_M = 1000;
/** Sustained acceleration the driver imposes — physics, not policy. */
export const DRIVER_ACCEL_G = DRIVER_EXIT_MS ** 2 / (2 * DRIVER_TRACK_M) / 9.81;
/** Runway below which the swarm's spares situation is a NO-GO (scenario). */
const RUNWAY_FLOOR_DAYS = 10;
/** Depot saturation horizon that earns a register entry (scenario). */
const SATURATION_NOTE_DAYS = 30;
/** Windows remaining under the missed-window incident (scenario). */
const MISSED_WINDOWS = 1;
/** Catcher confidence under the uncertainty incident (scenario). */
const UNCERTAIN_CONFIDENCE = 0.9;

export function ascentConfig(): AscentConfig {
  return {
    foundryOutputTPerDay: 190,
    crewTPerDay: 2,
    certificationTPerDay: 400,
    climbersPerDay: 4,
    weatherAvailability: 0.92,
    windowsPerDay: 4,
    driverTonsPerWindow: 60,
    catcherConfidence: 0.985,
    confidenceFloor: 0.97,
    depotCapacityT: 2000,
    depotFillPercent: 0.5,
    replacementDemandTPerDay: 120,
    transferOutTPerDay: 65,
    incident: "none",
  };
}

export function evaluateAscent(c: AscentConfig) {
  const tetherHold = c.incident === "tether-hold";
  const windows = c.incident === "missed-window" ? MISSED_WINDOWS : Math.max(0, c.windowsPerDay);
  const confidence = c.incident === "receiver-uncertainty" ? UNCERTAIN_CONFIDENCE : c.catcherConfidence;
  const saturated = c.incident === "depot-saturation";
  /** The port stops taking transfers and the depot is already full (scenario). */
  const transferOut = saturated ? 0 : Math.max(0, c.transferOutTPerDay);
  const fillPercent = saturated ? 1 : c.depotFillPercent;

  /** ORDERED → MANIFESTED: nothing flies uncertified. */
  const produced = Math.max(0, c.foundryOutputTPerDay) + Math.max(0, c.crewTPerDay);
  const manifested = Math.min(produced, Math.max(0, c.certificationTPerDay));
  const uncertified = produced - manifested;
  const crewManifested = Math.min(c.crewTPerDay, manifested);
  const bulkManifested = manifested - crewManifested;

  /** The elevator: the only human-rated road. */
  const elevatorCapacity = tetherHold
    ? 0
    : Math.max(0, c.climbersPerDay) * CLIMBER_MASS_T * Math.min(1, Math.max(0, c.weatherAvailability));
  const crewMoved = Math.min(crewManifested, elevatorCapacity);
  // INVARIANT 2: crew that the elevator cannot lift waits. The driver's
  // 290 g is not a queue to join.
  const crewWaiting = crewManifested - crewMoved;
  const elevatorBulk = Math.min(bulkManifested, elevatorCapacity - crewMoved);

  /** The driver: bulk only, and only with corridor + receiver. */
  const depotStock = Math.max(0, c.depotCapacityT) * Math.min(1, Math.max(0, fillPercent));
  const driverCapacity = windows * Math.max(0, c.driverTonsPerWindow);
  const receiverAuthorized = confidence >= c.confidenceFloor;
  const depotHeadroomT = Math.max(0, c.depotCapacityT - depotStock);
  // INVARIANT 1: authorization fails closed at the muzzle. A catcher below
  // its floor, or a depot with no custody to offer, refuses the launch.
  const depotAccepting = depotHeadroomT > 0;
  const driverAuthorized = receiverAuthorized && depotAccepting;
  const driverWanted = bulkManifested - elevatorBulk;
  const driverLaunched = driverAuthorized ? Math.min(driverWanted, driverCapacity) : 0;
  const driverCaptured = driverLaunched * Math.min(1, confidence);
  /** Missed buckets do not vanish; they become KESSLER's inventory. */
  const missesTPerDay = driverLaunched - driverCaptured;

  const backlogGrowth = uncertified + (bulkManifested - elevatorBulk - driverLaunched) + crewWaiting;

  /** CUSTODY-ORBIT → INSTALLED: the depot serves the swarm first. */
  const arrivals = crewMoved + elevatorBulk + driverCaptured;
  const demandOut = Math.max(0, c.replacementDemandTPerDay) + transferOut;
  const depotNet = arrivals - demandOut;
  const installShortfall = Math.max(0, -depotNet);
  /** Days the depot can cover the deficit, ∞ when there is none. */
  const runwayDays = installShortfall > 1e-9 ? depotStock / installShortfall : Infinity;
  const saturationDays = depotNet > 1e-9 ? depotHeadroomT / depotNet : Infinity;

  // INVARIANT 3: the cargo ledger closes — every tonne produced is moved,
  // waiting, or refused, and every launched tonne is caught or counted lost.
  const surfaceLedger = crewMoved + elevatorBulk + driverLaunched + backlogGrowth;
  const orbitLedger = driverCaptured + missesTPerDay;
  const ledgerResidueT = Math.abs(produced - surfaceLedger) + Math.abs(driverLaunched - orbitLedger);

  const refusals = [
    ...(!receiverAuthorized
      ? [
          `Driver refused: catcher confidence ${(confidence * 100).toFixed(1)}% is below the ${(c.confidenceFloor * 100).toFixed(0)}% floor — mass holds at the muzzle`,
        ]
      : []),
    ...(receiverAuthorized && !depotAccepting
      ? ["Driver refused: the depot has no custody to offer — a full receiver is no receiver"]
      : []),
    ...(uncertified > 1e-9
      ? [`${uncertified.toFixed(1)} t/day held uncertified: no manifest, no launch, on either road`]
      : []),
  ];

  const constraints = [
    ...refusals,
    ...(crewWaiting > 1e-9
      ? [
          `${crewWaiting.toFixed(1)} t/day of crew waiting: the driver has ${(driverCapacity - driverLaunched).toFixed(0)} t of spare capacity and cannot take one of them`,
        ]
      : []),
    ...(backlogGrowth - crewWaiting > 1e-9
      ? [
          `Surface backlog grows ${(backlogGrowth - crewWaiting).toFixed(1)} t/day — production outruns safe transport`,
        ]
      : []),
    ...(installShortfall > 1e-9
      ? [
          `Depot draining ${installShortfall.toFixed(1)} t/day against C-01 demand — ${runwayDays.toFixed(1)} days of spares runway`,
        ]
      : []),
    ...(saturationDays < SATURATION_NOTE_DAYS
      ? [
          `Depot saturates in ${saturationDays.toFixed(1)} days; launches will then throttle to the drain rate`,
        ]
      : []),
    ...(missesTPerDay > 1e-9
      ? [
          `${missesTPerDay.toFixed(1)} t/day of missed buckets become debris — KESSLER's inventory, not custody`,
        ]
      : []),
    ...(tetherHold ? ["Tether hold: the one human-rated road is closed; bulk reroutes, people wait"] : []),
  ];

  const readiness = runwayDays < RUNWAY_FLOOR_DAYS ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    runwayDays < RUNWAY_FLOOR_DAYS
      ? "SPARES RUNWAY CRITICAL"
      : !driverAuthorized && driverWanted > 1e-9
        ? "LAUNCH REFUSED — FAIL CLOSED"
        : crewWaiting > 1e-9
          ? "CREW HOLDING — ONE ROAD"
          : installShortfall > 1e-9
            ? "DEPOT DRAINING"
            : "CUSTODY NOMINAL";

  return {
    produced,
    manifested,
    uncertified,
    crewMoved,
    crewWaiting,
    elevatorCapacity,
    elevatorBulk,
    driverCapacity,
    driverWanted,
    driverLaunched,
    driverCaptured,
    driverAuthorized,
    receiverAuthorized,
    depotAccepting,
    missesTPerDay,
    backlogGrowth,
    arrivals,
    demandOut,
    depotNet,
    depotStock,
    installShortfall,
    runwayDays,
    saturationDays,
    ledgerResidueT,
    refusals,
    constraints,
    readiness,
    safeMode,
  } as const;
}
