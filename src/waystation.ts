/**
 * WAYSTATION — which vessel misses a safe departure window.
 *
 * ASCENT ends at orbital custody: tonnes in a depot, with the port that
 * hands them onward still scenery. This module is that port as
 * infrastructure — the shared failure boundary between traffic, docking,
 * propellant, heat, repair, quarantine, and departure geometry.
 *
 * Grounded anchors:
 *
 * - ISS visiting-vehicle rules: an approach ellipsoid, a 200 m keep-out
 *   sphere, corridor approaches, and go/no-go polls before every entry.
 *   Docking clearance here is that discipline: no clearance without
 *   positive identity and relative-state confidence.
 * - The International Docking System Standard verifies soft capture, hard
 *   capture, and pressure before anything flows across the interface. A
 *   collar that fails its check gets a repair cell, not a fuel line.
 * - The ISS never operates without a docked crew-return vehicle — the
 *   lifeboat rule. This port's version: one berth and the emergency tug
 *   are reserved, and routine traffic cannot buy them.
 * - Liquid hydrogen boils off at percent-per-day rates without active
 *   cooling; a departure reserve is a race against its own tank.
 *
 * The manifest, the berths, and every service rate are RUIN scenario
 * parameters, tuned to make one finding legible: the vessel that misses
 * its window is rarely the vessel that broke. The port's services are
 * shared queues, so a collar fault on one ship propagates as waiting time
 * to ships with nothing wrong — and the schedule can name the exact queue
 * that did it.
 *
 * Invariants. No docking without positive identity, relative-state
 * confidence, and a compatible berth — an unidentified hold means a
 * quarantine berth or no berth. No propellant across an unverified
 * interface. The emergency path is never sold: reserve berth and tug stay
 * empty through every scenario. And a missed window returns a vessel to
 * safe holding for the next one; nothing here can force a departure.
 */

export type CargoClass = "bulk" | "cryo" | "hazard" | "crew" | "unidentified";
export type BerthClass = "heavy" | "standard" | "cryo" | "quarantine";
export type Provenance = "ascent" | "foundry" | "progenitor" | "unknown";
export type WaystationIncident =
  | "none"
  | "collar-fault"
  | "boiloff"
  | "radiator-outage"
  | "unidentified-cargo"
  | "debris-corridor"
  | "disabled-vessel";

export interface Vessel {
  id: string;
  name: string;
  cargo: CargoClass;
  provenance: Provenance;
  /** Berth the geometry and mass require. */
  berth: BerthClass;
  /** Hours after shift start the vessel reaches the approach ellipsoid. */
  arrivalH: number;
  /** Relative-state confidence at the keep-out sphere, 0–1. */
  relStateConfidence: number;
  identityConfirmed: boolean;
  inspectionH: number;
  repairH: number;
  propellantT: number;
  /** First safe departure window, hours after shift start. */
  windowOpenH: number;
  windowCloseH: number;
  /** Windows repeat with this period. */
  windowPeriodH: number;
}

/**
 * One shift's arrivals, fixed so the cascade is exact rather than sampled.
 * MERIDIAN is the shift's tight-window runner: nothing wrong with her, a
 * medical consignment that must make the first window — and she is last in
 * every queue the broken ships are first in.
 */
export const MANIFEST: readonly Vessel[] = [
  {
    id: "v1",
    name: "KILN ROW · ORE FREIGHTER",
    cargo: "bulk",
    provenance: "foundry",
    berth: "heavy",
    arrivalH: 0,
    relStateConfidence: 0.995,
    identityConfirmed: true,
    inspectionH: 1.5,
    repairH: 0,
    propellantT: 40,
    windowOpenH: 10,
    windowCloseH: 13,
    windowPeriodH: 12,
  },
  {
    id: "v2",
    name: "FERRY LATERAL · CREW",
    cargo: "crew",
    provenance: "ascent",
    berth: "standard",
    arrivalH: 0.5,
    relStateConfidence: 0.999,
    identityConfirmed: true,
    inspectionH: 1,
    repairH: 0,
    propellantT: 12,
    windowOpenH: 8,
    windowCloseH: 10,
    windowPeriodH: 12,
  },
  {
    id: "v3",
    name: "COLD CHAIN · CRYO TANKER",
    cargo: "cryo",
    provenance: "ascent",
    berth: "cryo",
    arrivalH: 1,
    relStateConfidence: 0.99,
    identityConfirmed: true,
    inspectionH: 2,
    repairH: 0,
    propellantT: 80,
    windowOpenH: 14,
    windowCloseH: 17,
    windowPeriodH: 12,
  },
  {
    id: "v4",
    name: "PALLET QUEEN · BULK",
    cargo: "bulk",
    provenance: "ascent",
    berth: "standard",
    arrivalH: 2,
    relStateConfidence: 0.992,
    identityConfirmed: true,
    inspectionH: 1.5,
    repairH: 2,
    propellantT: 25,
    windowOpenH: 12,
    windowCloseH: 15,
    windowPeriodH: 12,
  },
  {
    id: "v5",
    name: "LOT UNKNOWN · SEALED HOLD",
    cargo: "unidentified",
    provenance: "unknown",
    berth: "quarantine",
    arrivalH: 2.5,
    relStateConfidence: 0.985,
    identityConfirmed: false,
    inspectionH: 4,
    repairH: 0,
    propellantT: 10,
    windowOpenH: 16,
    windowCloseH: 19,
    windowPeriodH: 12,
  },
  {
    id: "v6",
    name: "MERIDIAN · MEDICAL RUNNER",
    cargo: "crew",
    provenance: "ascent",
    berth: "standard",
    arrivalH: 3,
    relStateConfidence: 0.998,
    identityConfirmed: true,
    inspectionH: 1,
    repairH: 0,
    propellantT: 10,
    windowOpenH: 9,
    windowCloseH: 10.5,
    windowPeriodH: 12,
  },
  {
    id: "v7",
    name: "LONG HAUL · HEAVY LIFTER",
    cargo: "hazard",
    provenance: "foundry",
    berth: "heavy",
    arrivalH: 3.5,
    relStateConfidence: 0.985,
    identityConfirmed: true,
    inspectionH: 2.5,
    repairH: 1,
    propellantT: 55,
    windowOpenH: 15,
    windowCloseH: 18,
    windowPeriodH: 12,
  },
  {
    id: "v8",
    name: "SPARROW · COURIER",
    cargo: "bulk",
    provenance: "progenitor",
    berth: "standard",
    arrivalH: 4,
    relStateConfidence: 0.996,
    identityConfirmed: true,
    inspectionH: 0.5,
    repairH: 0,
    propellantT: 6,
    windowOpenH: 11,
    windowCloseH: 14,
    windowPeriodH: 12,
  },
];

export interface WaystationConfig {
  /** Berths by class. One standard berth is the untouchable reserve. */
  heavyBerths: number;
  standardBerths: number;
  cryoBerths: number;
  quarantineBerths: number;
  inspectionDrones: number;
  repairCells: number;
  /** Propellant transfer rate at a verified interface, t/h. */
  pumpRateTPerH: number;
  /** Propellant on hand at shift start, t. */
  propellantStockT: number;
  /** Hours between ASCENT resupply deliveries to the propellant farm. */
  resupplyPeriodH: number;
  /** Relative-state confidence below which no clearance is issued. */
  confidenceFloor: number;
  incident: WaystationIncident;
}

/** Repair hours a failed docking collar adds before any transfer (scenario). */
const COLLAR_REPAIR_H = 6;
/** Fraction of the propellant farm lost to boiloff in that scenario. */
const BOILOFF_RETAINED = 0.35;
/** Service rates under a radiator outage (scenario). */
const RADIATOR_RETAINED = 0.5;
/** Hours the debris corridor closure delays every arrival (scenario). */
const DEBRIS_HOLD_H = 4;
/** Full contamination screen for cargo that fails provenance (scenario). */
const QUARANTINE_SCREEN_H = 8;

export function waystationConfig(): WaystationConfig {
  return {
    heavyBerths: 2,
    standardBerths: 3,
    cryoBerths: 1,
    quarantineBerths: 1,
    inspectionDrones: 2,
    repairCells: 1,
    pumpRateTPerH: 20,
    propellantStockT: 260,
    resupplyPeriodH: 24,
    confidenceFloor: 0.98,
    incident: "none",
  };
}

export interface VesselResult {
  vessel: Vessel;
  cleared: boolean;
  holdReason: string | null;
  dockH: number | null;
  readyH: number | null;
  departureH: number | null;
  missedWindow: boolean;
  delayH: number;
  /** The queue this vessel waited on longest — its actual bottleneck. */
  bottleneck: string;
  waitH: number;
}

const takeSlot = (slots: number[], earliest: number, duration: number): { start: number; end: number } => {
  let best = 0;
  for (let i = 1; i < slots.length; i += 1) if (slots[i] < slots[best]) best = i;
  const start = Math.max(earliest, slots[best]);
  slots[best] = start + duration;
  return { start, end: start + duration };
};

export function evaluateWaystation(c: WaystationConfig) {
  const collarFault = c.incident === "collar-fault";
  const radiator = c.incident === "radiator-outage" ? RADIATOR_RETAINED : 1;
  const debrisHold = c.incident === "debris-corridor" ? DEBRIS_HOLD_H : 0;
  const propellantStockT = c.propellantStockT * (c.incident === "boiloff" ? BOILOFF_RETAINED : 1);

  // INVARIANT 3: the emergency path is never sold. One standard berth and
  // the emergency tug exist outside the schedulable pool entirely; a
  // disabled vessel consumes them, and routine traffic still cannot.
  const disabled = c.incident === "disabled-vessel";
  const reserveCommitted = disabled;
  const standardPool = Math.max(0, c.standardBerths - 1);

  const berthSlots: Record<BerthClass, number[]> = {
    heavy: Array.from({ length: Math.max(0, c.heavyBerths) }, () => 0),
    standard: Array.from({ length: standardPool }, () => 0),
    cryo: Array.from({ length: Math.max(0, c.cryoBerths) }, () => 0),
    quarantine: Array.from({ length: Math.max(0, c.quarantineBerths) }, () => 0),
  };
  const droneSlots = Array.from({ length: Math.max(1, c.inspectionDrones) }, () => 0);
  const repairSlots = Array.from({ length: Math.max(1, c.repairCells) }, () => 0);
  const pumpSlots = [0];

  let propellantLeftT = propellantStockT;

  const vessels: VesselResult[] = MANIFEST.map((vessel) => {
    const waits: Record<string, number> = {};
    const note = (queue: string, wait: number) => {
      waits[queue] = (waits[queue] ?? 0) + Math.max(0, wait);
    };

    const arrival = vessel.arrivalH + debrisHold;
    if (debrisHold > 0) note("debris corridor", debrisHold);

    // INVARIANT 4: custody and contamination state survive every transfer —
    // cargo whose provenance fails mid-shift is reclassified, not waved on.
    const cargo: CargoClass =
      c.incident === "unidentified-cargo" && vessel.id === "v8" ? "unidentified" : vessel.cargo;
    const screenH = cargo === "unidentified" && cargo !== vessel.cargo ? QUARANTINE_SCREEN_H : 0;

    // Inspection happens outside the keep-out sphere, before any clearance.
    const inspection = takeSlot(droneSlots, arrival, (vessel.inspectionH + screenH) / radiator);
    note("inspection drones", inspection.start - arrival);

    // INVARIANT 1: no clearance without identity, confidence, and a
    // compatible berth. An unidentified hold is a quarantine berth or nothing.
    const requiredBerth: BerthClass = cargo === "unidentified" ? "quarantine" : vessel.berth;
    const identityOk = vessel.identityConfirmed || requiredBerth === "quarantine";
    const confidenceOk = vessel.relStateConfidence >= c.confidenceFloor;
    const berthAvailable = berthSlots[requiredBerth].length > 0;
    if (!identityOk || !confidenceOk || !berthAvailable) {
      const holdReason = !confidenceOk
        ? `relative-state confidence ${(vessel.relStateConfidence * 100).toFixed(1)}% below the ${(c.confidenceFloor * 100).toFixed(0)}% floor`
        : !identityOk
          ? "identity unconfirmed and no quarantine berth exists"
          : `no ${requiredBerth} berth exists`;
      return {
        vessel,
        cleared: false,
        holdReason,
        dockH: null,
        readyH: null,
        departureH: null,
        missedWindow: true,
        delayH: Infinity,
        bottleneck: "docking clearance",
        waitH: Infinity,
      };
    }

    const berth = takeSlot(berthSlots[requiredBerth], inspection.end, 0);
    const dockH = berth.start;
    note(`${requiredBerth} berths`, dockH - inspection.end);
    let ready = dockH;

    // INVARIANT 2: a collar that failed verification is repaired before
    // anything flows. The fault ship pays in the repair queue; everyone
    // behind her in that queue pays too.
    const collarRepair = collarFault && vessel.id === "v3" ? COLLAR_REPAIR_H : 0;
    const repairNeeded = vessel.repairH / radiator + collarRepair;
    if (repairNeeded > 0) {
      const repair = takeSlot(repairSlots, ready, repairNeeded);
      note("repair cells", repair.start - ready);
      ready = repair.end;
    }

    if (vessel.propellantT > 0) {
      // The farm serves in docking order; a dry farm waits for ASCENT's
      // next delivery — resupply, never an unverified shortcut.
      let pumpEarliest = ready;
      if (propellantLeftT < vessel.propellantT) {
        const resupplyH = c.resupplyPeriodH;
        note("propellant farm", Math.max(0, resupplyH - ready));
        pumpEarliest = Math.max(pumpEarliest, resupplyH);
        propellantLeftT += propellantStockT;
      }
      propellantLeftT -= vessel.propellantT;
      const pump = takeSlot(pumpSlots, pumpEarliest, vessel.propellantT / (c.pumpRateTPerH * radiator));
      note("propellant pump", pump.start - pumpEarliest);
      ready = pump.end;
    }

    // Occupy the berth until ready, so the next ship truly queues behind.
    berthSlots[requiredBerth][berthSlots[requiredBerth].indexOf(berth.end)] = ready;

    // INVARIANT 5: a missed window means safe holding until the next one.
    // There is no code path that departs a vessel before it is ready.
    let open = vessel.windowOpenH;
    let close = vessel.windowCloseH;
    while (ready > close) {
      open += vessel.windowPeriodH;
      close += vessel.windowPeriodH;
    }
    const departureH = Math.max(ready, open);
    const missedWindow = open !== vessel.windowOpenH;

    const bottleneck =
      Object.entries(waits).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? "none";
    return {
      vessel,
      cleared: true,
      holdReason: null,
      dockH,
      readyH: ready,
      departureH,
      missedWindow,
      delayH: missedWindow ? departureH - vessel.windowOpenH : 0,
      bottleneck,
      waitH: Object.values(waits).reduce((sum, w) => sum + w, 0),
    };
  });

  const missed = vessels.filter((v) => v.missedWindow);
  const held = vessels.filter((v) => !v.cleared);
  const faultless = missed.filter(
    (v) => v.cleared && v.vessel.repairH === 0 && !(collarFault && v.vessel.id === "v3"),
  );

  const constraints = [
    ...held.map((v) => `${v.vessel.name}: held outside the keep-out sphere — ${v.holdReason}`),
    ...missed
      .filter((v) => v.cleared)
      .map(
        (v) =>
          `${v.vessel.name}: missed its window by the ${v.bottleneck} queue — departs at H+${v.departureH!.toFixed(1)}, ${v.delayH.toFixed(1)} h late`,
      ),
    ...(reserveCommitted
      ? ["Emergency tug and reserve berth committed to the disabled vessel; the next casualty has no port"]
      : []),
    ...(c.incident === "boiloff"
      ? [`Boiloff took the farm to ${propellantStockT.toFixed(0)} t; departures now race the tank`]
      : []),
    ...(debrisHold > 0 ? [`Debris corridor closed: every approach held ${DEBRIS_HOLD_H} h`] : []),
    ...(c.incident === "unidentified-cargo"
      ? [
          `SPARROW's provenance failed mid-shift: sealed hold rerouted to quarantine for the full ${QUARANTINE_SCREEN_H} h screen`,
        ]
      : []),
  ];

  const readiness = held.length > 0 || reserveCommitted ? "NO-GO" : missed.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    held.length > 0
      ? "VESSEL HELD — NO CLEARANCE"
      : reserveCommitted
        ? "EMERGENCY RESERVE COMMITTED"
        : missed.length > 0
          ? "WINDOWS SLIPPING"
          : "PORT NOMINAL";

  return {
    vessels,
    missedCount: missed.length,
    heldCount: held.length,
    /** Vessels that missed a window with nothing wrong on board. */
    faultlessMissed: faultless.map((v) => v.vessel.id),
    reservePreserved: !reserveCommitted,
    propellantMarginT: propellantLeftT,
    constraints,
    readiness,
    safeMode,
  } as const;
}
