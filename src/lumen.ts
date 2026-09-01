/**
 * LUMEN — who loses power when generation exists but the beam fails closed.
 *
 * HELIOS ends at safe aggregate delivery: a number of gigawatts, arrived at a
 * relay hub, with the swarm's own failures already priced. Nothing in the
 * laboratory has yet asked how that number crosses the last hundreds of
 * megameters to a rectenna, or who browns out when it cannot. This module is
 * that grid.
 *
 * Grounded anchors:
 *
 * - William Brown's rectenna converted microwave to DC at a certified 82.5%
 *   in 1975, and the Goldstone demonstration the same year recovered over
 *   30 kW of DC across 1.5 km. Fifty years on, that conversion figure is
 *   still the benchmark every receiver here sits below.
 * - The NASA/DOE Satellite Power System Reference System (1978) transmits
 *   from a kilometre-scale phased array to a kilometres-wide rectenna, and
 *   forms its beam retrodirectively: the power beam is the phase conjugate of
 *   a pilot signal transmitted FROM the rectenna. No pilot, no focused beam.
 *   Fail-closed is not a policy bolted onto this architecture; it is the
 *   architecture.
 * - JAXA steered 1.8 kW across 55 m at 5.8 GHz in its 2015 ground
 *   demonstration; 5.8 GHz is this grid's carrier, and 1.22 λ/D sets each
 *   link's diffraction cone exactly as it does for ODYSSEY's corridors.
 * - Terrestrial grids plan to the N-1 criterion (NERC TPL-001): the system
 *   must survive the loss of any single element. The spare relay string here
 *   is idle capital on every nominal day, and the only reason survival load
 *   holds through a relay casualty.
 *
 * The physics and the precedents are sourced. The grid itself — five
 * customers, their contracts, distances, storage, and every incident — is a
 * RUIN scenario, invented to make one fact legible: dispatch policy chooses
 * who is shed under scarcity, but a beam that fails closed does not read the
 * merit order. Under pointing fog the customer who loses power is whoever's
 * geometry broke, and that can be the survival-rank-one habitat while the
 * lowest-priority tug depot stays lit.
 *
 * Three invariants. Beam authorization fails closed: a link whose beam
 * wander exceeds its receiver's keep-out has lost pilot lock and delivers
 * nothing, whatever the dispatch order wanted. A receiver never accepts
 * power above its thermal or conversion limit: the cap is applied before the
 * power is sent, not after it arrives. And energy is conserved: every
 * gigawatt of source is attributed — delivered, lost in a named stage,
 * curtailed, or stranded — and the ledger closes to numerical precision,
 * because a loss term nobody can name is where silent failure lives.
 */

export type DispatchPolicy = "survival-first" | "price-first" | "contract-share";
export type LumenIncident = "none" | "pointing-fog" | "relay-loss" | "receiver-overheat" | "demand-surge";
export type LumenCustomerId = "habitat" | "agraria" | "datacore" | "foundry" | "propulsion";

export interface LumenContract {
  id: LumenCustomerId;
  name: string;
  /** The laboratory this contract powers, where one exists. */
  moduleId: "gravitas" | "agraria" | "datacore" | "foundry" | "ignis" | null;
  /** Delivered power the customer is contracted for, GW. */
  contractGW: number;
  /** 1 is shed last under survival-first dispatch. */
  survivalRank: number;
  /** Higher pays more; price-first dispatch sorts on this. */
  priceIndex: number;
  /** Hub-to-rectenna range, in megameters. */
  distanceMm: number;
  /** Rectenna radius, m. */
  rectennaRadiusM: number;
  /** Exclusion radius around the rectenna the beam centroid must hold, m. */
  keepoutM: number;
  /** RF→DC conversion, below Brown's 82.5% record. */
  conversion: number;
  /** Maximum power the receiver may accept, GW. */
  thermalLimitGW: number;
  /** Local storage, GWh. */
  storageGWh: number;
}

/**
 * The grid's customers, importable as power contracts by the modules they
 * feed. Contract sizes, distances, and storage are scenario parameters; the
 * distances are chosen at real scales — a GEO-like 36 Mm for the habitat
 * ring, a lunar-like 384 Mm for the foundry — so the geometry is honest.
 */
export const LUMEN_CONTRACTS: readonly LumenContract[] = [
  {
    id: "habitat",
    name: "HABITAT RING · LIFE SUPPORT",
    moduleId: "gravitas",
    contractGW: 8,
    survivalRank: 1,
    priceIndex: 3,
    distanceMm: 36,
    rectennaRadiusM: 4000,
    keepoutM: 400,
    conversion: 0.8,
    thermalLimitGW: 10,
    storageGWh: 40,
  },
  {
    id: "agraria",
    name: "AGRARIA · GROW LIGHTS",
    moduleId: "agraria",
    contractGW: 6,
    survivalRank: 2,
    priceIndex: 2,
    distanceMm: 36,
    rectennaRadiusM: 3500,
    keepoutM: 900,
    conversion: 0.78,
    thermalLimitGW: 8,
    storageGWh: 24,
  },
  {
    id: "datacore",
    name: "DATACORE · VERIFIED COMPUTE",
    moduleId: "datacore",
    contractGW: 5,
    survivalRank: 3,
    priceIndex: 5,
    distanceMm: 2,
    rectennaRadiusM: 1200,
    keepoutM: 200,
    conversion: 0.82,
    thermalLimitGW: 6,
    storageGWh: 10,
  },
  {
    id: "foundry",
    name: "FOUNDRY · SMELT LINES",
    moduleId: "foundry",
    contractGW: 7,
    survivalRank: 4,
    priceIndex: 4,
    distanceMm: 384,
    rectennaRadiusM: 12000,
    keepoutM: 2000,
    conversion: 0.75,
    thermalLimitGW: 9,
    storageGWh: 12,
  },
  {
    id: "propulsion",
    name: "TUG DEPOT · PROPULSION",
    moduleId: "ignis",
    contractGW: 6,
    survivalRank: 5,
    priceIndex: 1,
    distanceMm: 8,
    rectennaRadiusM: 900,
    keepoutM: 300,
    conversion: 0.7,
    thermalLimitGW: 7,
    storageGWh: 2,
  },
];

export interface LumenConfig {
  /** HELIOS's aggregate delivery at the relay hub, GW. */
  sourceGW: number;
  /** Transmitting phased-array aperture, m. */
  apertureM: number;
  /** Pointing jitter, µrad. */
  jitterUrad: number;
  policy: DispatchPolicy;
  incident: LumenIncident;
  /** Transits crossing the beam corridors per day; each forces a hold. */
  corridorTransitsPerDay: number;
  /** Minutes the beams are held per transit. */
  holdMinutesPerTransit: number;
  /** Independent relay strings; N-1 needs at least two. */
  relayStrings: number;
  /** Carrying capacity of one string, GW. */
  stringCapacityGW: number;
}

/** 5.8 GHz — JAXA's 2015 carrier, and an ISM band the SPS literature uses. */
export const WAVELENGTH_M = 0.0517;
/** Brown's 1975 certified rectenna conversion; every receiver sits below it. */
export const RECTENNA_RECORD = 0.825;
/** One relay string's end-to-end efficiency (scenario). */
const RELAY_EFF = 0.96;
/** Storage is worked as a day-average: GWh over these hours (scenario). */
const STORAGE_HORIZON_H = 24;
/** Pointing fog multiplies jitter by this much (scenario). */
const FOG_JITTER_FACTOR = 8;
/** A radiator casualty leaves the habitat receiver this fraction (scenario). */
const OVERHEAT_RETAINED = 0.4;
/** A production campaign multiplies the foundry contract (scenario). */
const SURGE_DEMAND_FACTOR = 1.8;

export function lumenConfig(): LumenConfig {
  return {
    sourceGW: 48,
    apertureM: 2000,
    jitterUrad: 2,
    policy: "survival-first",
    incident: "none",
    corridorTransitsPerDay: 4,
    holdMinutesPerTransit: 18,
    relayStrings: 2,
    stringCapacityGW: 30,
  };
}

export type ShortfallReason = "NONE" | "BEAM HELD" | "THERMAL LIMIT" | "OUTRANKED" | "PRO-RATA";

export interface CustomerResult {
  contract: LumenContract;
  /** Contracted demand after any incident, GW. */
  demandGW: number;
  /** What the receiver may be sent at most, GW delivered-equivalent. */
  targetGW: number;
  /** Beam wander at the rectenna, m. */
  wanderM: number;
  /** keep-out over wander; below 1 the beam is held. */
  pointingMargin: number;
  authorized: boolean;
  /** Fraction of the spot the rectenna captures. */
  capture: number;
  /** Source power granted to this link, GW. */
  grantGW: number;
  /** Power out of the rectenna, GW. */
  deliveredGW: number;
  shortfallGW: number;
  storageCoverGW: number;
  unmetGW: number;
  /** Hours the local storage carries the shortfall, ∞ when there is none. */
  autonomyH: number;
  reason: ShortfallReason;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function evaluateLumen(c: LumenConfig) {
  const fog = c.incident === "pointing-fog";
  const surge = c.incident === "demand-surge";
  const overheat = c.incident === "receiver-overheat";
  const stringsUp = Math.max(0, c.relayStrings - (c.incident === "relay-loss" ? 1 : 0));

  const jitterRad = c.jitterUrad * 1e-6 * (fog ? FOG_JITTER_FACTOR : 1);
  const diffractionRad = (1.22 * WAVELENGTH_M) / c.apertureM;
  const coneRad = Math.hypot(diffractionRad, jitterRad);
  const availability = clamp01(1 - (c.corridorTransitsPerDay * c.holdMinutesPerTransit) / 1440);
  const hubCapacityGW = Math.min(Math.max(0, c.sourceGW), stringsUp * c.stringCapacityGW);

  /** Geometry, authorization, and the most each link could carry. */
  const links = LUMEN_CONTRACTS.map((contract) => {
    const distanceM = contract.distanceMm * 1e6;
    const spotRadiusM = coneRad * distanceM;
    const capture = clamp01((contract.rectennaRadiusM / spotRadiusM) ** 2);
    const wanderM = jitterRad * distanceM;
    // INVARIANT 1: lose pilot lock, lose the beam. The wander exceeding the
    // keep-out means the retrodirective pilot cannot certify the centroid;
    // the beam defocuses by construction rather than by decision.
    const pointingMargin = wanderM > 0 ? contract.keepoutM / wanderM : Infinity;
    const authorized = wanderM <= contract.keepoutM;

    const demandGW = contract.contractGW * (surge && contract.id === "foundry" ? SURGE_DEMAND_FACTOR : 1);
    const thermalGW =
      contract.thermalLimitGW * (overheat && contract.id === "habitat" ? OVERHEAT_RETAINED : 1);
    // INVARIANT 2: the receiver's limit caps what is SENT. Power a rectenna
    // cannot convert is not power in flight looking for somewhere to go.
    const targetGW = Math.min(demandGW, thermalGW);
    const linkEff = RELAY_EFF * capture * contract.conversion;
    const drawGW = authorized && linkEff > 0 ? targetGW / (linkEff * availability) : 0;
    return { contract, demandGW, targetGW, wanderM, pointingMargin, authorized, capture, linkEff, drawGW };
  });

  /** Dispatch: the policy orders the queue; scarcity does the shedding. */
  const order = [...links].sort((a, b) =>
    c.policy === "price-first"
      ? b.contract.priceIndex - a.contract.priceIndex
      : a.contract.survivalRank - b.contract.survivalRank,
  );
  const totalDraw = links.reduce((sum, link) => sum + link.drawGW, 0);
  const proRata =
    c.policy === "contract-share" ? Math.min(1, totalDraw > 0 ? hubCapacityGW / totalDraw : 1) : 1;
  const grants = new Map<LumenCustomerId, number>();
  let remaining = hubCapacityGW;
  for (const link of order) {
    const grant = c.policy === "contract-share" ? link.drawGW * proRata : Math.min(link.drawGW, remaining);
    grants.set(link.contract.id, grant);
    remaining -= grant;
  }

  /** The ledger. Every stage's loss is named; the sum must close. */
  let corridorCurtailGW = 0;
  let relayLossGW = 0;
  let spillLossGW = 0;
  let conversionLossGW = 0;

  const customers: CustomerResult[] = links.map((link) => {
    const grantGW = grants.get(link.contract.id) ?? 0;
    const afterHolds = grantGW * availability;
    corridorCurtailGW += grantGW - afterHolds;
    const afterRelay = afterHolds * RELAY_EFF;
    relayLossGW += afterHolds - afterRelay;
    const afterCapture = afterRelay * link.capture;
    spillLossGW += afterRelay - afterCapture;
    const deliveredGW = afterCapture * link.contract.conversion;
    conversionLossGW += afterCapture - deliveredGW;

    const shortfallGW = Math.max(0, link.demandGW - deliveredGW);
    const storageCoverGW = Math.min(shortfallGW, link.contract.storageGWh / STORAGE_HORIZON_H);
    const unmetGW = shortfallGW - storageCoverGW;
    const autonomyH = shortfallGW > 1e-9 ? link.contract.storageGWh / shortfallGW : Infinity;
    const reason: ShortfallReason =
      shortfallGW <= 1e-9
        ? "NONE"
        : !link.authorized
          ? "BEAM HELD"
          : link.targetGW < link.demandGW - 1e-9
            ? "THERMAL LIMIT"
            : c.policy === "contract-share"
              ? "PRO-RATA"
              : "OUTRANKED";
    return {
      contract: link.contract,
      demandGW: link.demandGW,
      targetGW: link.targetGW,
      wanderM: link.wanderM,
      pointingMargin: link.pointingMargin,
      authorized: link.authorized,
      capture: link.capture,
      grantGW,
      deliveredGW,
      shortfallGW,
      storageCoverGW,
      unmetGW,
      autonomyH,
      reason,
    };
  });

  const grantedGW = customers.reduce((sum, r) => sum + r.grantGW, 0);
  const deliveredGW = customers.reduce((sum, r) => sum + r.deliveredGW, 0);
  const curtailedGW = Math.max(0, c.sourceGW) - grantedGW;
  // INVARIANT 3: the ledger closes. This is an identity of the model, and the
  // tests hold it to numerical precision so no stage can leak silently.
  const ledgerGW =
    curtailedGW + corridorCurtailGW + relayLossGW + spillLossGW + conversionLossGW + deliveredGW;
  const balanceGW = Math.max(0, c.sourceGW) - ledgerGW;

  const held = customers.filter((r) => !r.authorized);
  const contractedGW = customers.reduce((sum, r) => sum + r.demandGW, 0);
  const shortfallGW = customers.reduce((sum, r) => sum + r.shortfallGW, 0);
  const storageCoverGW = customers.reduce((sum, r) => sum + r.storageCoverGW, 0);
  const survivalUnmetGW = customers
    .filter((r) => r.contract.survivalRank <= 2)
    .reduce((sum, r) => sum + r.unmetGW, 0);
  const survivalOnStorage = customers.some((r) => r.contract.survivalRank <= 2 && r.storageCoverGW > 1e-9);
  const strandedGW = Math.max(0, Math.min(c.sourceGW, c.relayStrings * c.stringCapacityGW) - hubCapacityGW);

  const constraints = [
    ...held.map(
      (r) =>
        `${r.contract.name}: beam held — ${r.wanderM.toFixed(0)} m of wander against a ${r.contract.keepoutM} m keep-out`,
    ),
    ...customers
      .filter((r) => r.authorized && r.unmetGW > 1e-9)
      .map((r) => `${r.contract.name}: ${r.unmetGW.toFixed(2)} GW unmet — ${r.reason}`),
    ...(survivalOnStorage
      ? [
          `Survival load is running on storage: ${customers
            .filter((r) => r.contract.survivalRank <= 2 && r.shortfallGW > 1e-9)
            .map((r) => `${r.contract.id} has ${r.autonomyH.toFixed(1)} h`)
            .join(", ")}`,
        ]
      : []),
    ...(strandedGW > 1e-9
      ? [
          `${strandedGW.toFixed(1)} GW of source stranded — generation exists, the string to carry it does not`,
        ]
      : []),
    ...(stringsUp < 2 && c.relayStrings >= 2
      ? ["Single string remaining: the next relay casualty is a blackout, not a curtailment"]
      : []),
    ...(availability < 1 - 1e-9
      ? [
          `Corridor holds curtail ${((1 - availability) * 100).toFixed(1)}% of every granted beam — ${c.corridorTransitsPerDay} transit(s) a day`,
        ]
      : []),
  ];

  const readiness = survivalUnmetGW > 1e-9 ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    survivalUnmetGW > 1e-9
      ? "SURVIVAL LOAD UNMET"
      : held.length > 0
        ? "BEAM HELD — FAIL CLOSED"
        : survivalOnStorage
          ? "STORAGE CARRYING SURVIVAL"
          : shortfallGW > 1e-9
            ? "DISPATCH SHEDDING"
            : "GRID NOMINAL";

  return {
    customers,
    availability,
    hubCapacityGW,
    grantedGW,
    deliveredGW,
    contractedGW,
    shortfallGW,
    storageCoverGW,
    survivalUnmetGW,
    curtailedGW,
    corridorCurtailGW,
    relayLossGW,
    spillLossGW,
    conversionLossGW,
    strandedGW,
    balanceGW,
    heldCount: held.length,
    readiness,
    safeMode,
    constraints,
  } as const;
}
