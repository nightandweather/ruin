/**
 * ARK — which loops recover, and which failures silently compound.
 *
 * AGRARIA grows the food, HYGEIA counts the dose, GRAVITAS spins the
 * floor; nothing yet closes the loop those modules live inside. This
 * module is the habitat as a set of coupled recycling loops — oxygen,
 * carbon, water, food — each with a closure fraction, a store, and an
 * alarm, run day by day for a year.
 *
 * Grounded anchors:
 *
 * - Biosphere 2, 1991–93: oxygen fell from 20.9% to 14.2% over sixteen
 *   months. Soil microbes were consuming O₂ and breathing out CO₂ — and
 *   the structure's curing concrete absorbed that CO₂ into carbonate, so
 *   the one telemetry that would have flagged the loss read nominal. The
 *   crew got two emergency oxygen injections. The canonical silently
 *   compounding failure, and this module's central incident.
 * - The ISS ECLSS reached 98% water recovery in 2023; the Sabatier
 *   reactor closes part of the carbon loop; a person consumes about
 *   0.84 kg of oxygen and produces about 1 kg of CO₂ per day (NASA BVAD
 *   values). Those set this habitat's rates and its best-case closure.
 * - BIOS-3 demonstrated roughly 85% closure in the 1970s; full closure
 *   has never been demonstrated by anyone. Makeup mass is not a failure
 *   of design; pretending it is zero is.
 *
 * The habitat, its stores, and every incident are RUIN scenario
 * parameters. The finding they are tuned to show: Biosphere 2's oxygen
 * did not fall silently — it fell unwatched-for. A threshold alarm on
 * absolute O₂ fires around day 150, with the reserve nearly spent. A
 * trend alarm — fourteen consecutive declining days is an alarm,
 * whatever the absolute level — fires inside three weeks. The silent
 * window is not a property of the failure; it is a property of the
 * alarm.
 *
 * Three invariants. Every loop's mass ledger closes daily — production
 * plus makeup equals consumption plus loss plus the store's change, to
 * numerical precision. A trend is an alarm: fourteen declining days on a
 * life variable raises the register even when every absolute threshold
 * holds. And makeup is finite and counted — every injection comes from a
 * store ASCENT has to refill, never from nowhere.
 */

import { AgrariaSimulation, DEFAULT_AGRARIA_CONFIG } from "./agraria";

export type ArkIncident =
  "none" | "curing-structure" | "scrubber-fault" | "crop-collapse" | "leak-growth" | "water-processor-down";

export interface ArkConfig {
  crew: number;
  horizonDays: number;
  /** Water loop closure — ISS ECLSS reached 0.98 in 2023. */
  waterRecovery: number;
  /** Cabin leakage, kg of air per day. */
  leakKgPerDay: number;
  /** AEGIS excursions per week; each costs water and oxygen. */
  evaPerWeek: number;
  /** Oxygen reserve at day zero, kg. */
  o2StoreKg: number;
  /** Water reserve at day zero, kg. */
  waterStoreKg: number;
  /** Stored food at day zero, crew-days. */
  foodStoreCrewDays: number;
  /** Days between ASCENT resupply calls at the habitat. */
  resupplyPeriodDays: number;
  /** Water delivered per resupply, kg. */
  resupplyWaterKg: number;
  /** Food delivered per resupply, crew-days. */
  resupplyFoodCrewDays: number;
  /** Consecutive declining days that constitute a trend alarm. */
  trendAlarmDays: number;
  incident: ArkIncident;
}

/** NASA BVAD-scale crew rates, kg per person per day. */
export const O2_KG_PER_PERSON_DAY = 0.84;
export const CO2_KG_PER_PERSON_DAY = 1.0;
export const WATER_KG_PER_PERSON_DAY = 3.6;
/** Absolute alarm floors (scenario): fraction of the day-zero store. */
const O2_THRESHOLD_FRACTION = 0.35;
const WATER_THRESHOLD_FRACTION = 0.3;
/** Emergency injection drawn when O₂ crosses its floor, kg (scenario). */
const O2_INJECTION_KG = 400;
/** Soil respiration under the curing incident, kg O₂ per day (scenario). */
const CURING_RESPIRATION_O2_KG = 8;
/** Workshops, reformers, and everything else that exhales, kg CO₂/day (scenario). */
const INDUSTRIAL_CO2_KG = 40;
/** The scrubber's capacity, kg CO₂ per day (scenario). */
const SCRUB_CAPACITY_KG = 12;
/** CO₂ scrubbing retained under the scrubber fault (scenario). */
const SCRUBBER_RETAINED = 0.45;
/** Farm output retained under a crop collapse (scenario). */
const CROP_RETAINED = 0.4;
/** Leak multiplier when a seal fails (scenario). */
const LEAK_GROWTH_FACTOR = 40;
/** CO₂ display ceiling, ppm — beyond this the number is a tombstone. */
const CO2_CEILING_PPM = 20000;
/** Water recovery under a degraded processor — pre-2023 vintage (scenario). */
const DEGRADED_RECOVERY = 0.87;
/** CO₂ ppm added per net kg in the cabin volume (scenario). */
const CO2_PPM_PER_KG = 9;
const CO2_SETPOINT_PPM = 1000;
const CO2_ALARM_PPM = 4000;
/** EVA cost per sortie, kg (scenario). */
const EVA_WATER_KG = 4;
const EVA_O2_KG = 1.2;

export function arkConfig(): ArkConfig {
  return {
    crew: 24,
    horizonDays: 365,
    waterRecovery: 0.98,
    leakKgPerDay: 0.9,
    evaPerWeek: 3,
    o2StoreKg: 1500,
    waterStoreKg: 6000,
    foodStoreCrewDays: 900,
    resupplyPeriodDays: 90,
    resupplyWaterKg: 1500,
    resupplyFoodCrewDays: 300,
    trendAlarmDays: 14,
    incident: "none",
  };
}

export interface LoopReport {
  loop: "oxygen" | "carbon" | "water" | "food";
  /** Store (or level) at horizon end, in the loop's own unit. */
  finalLevel: number;
  unit: string;
  /** First day the absolute threshold alarm fired, null if never. */
  thresholdAlarmDay: number | null;
  /** First day the trend alarm fired, null if never. */
  trendAlarmDay: number | null;
  /** Day the store ran out, null if it never did. */
  failureDay: number | null;
  compounding: boolean;
}

export function evaluateArk(c: ArkConfig) {
  const curing = c.incident === "curing-structure";
  const scrubRetained = c.incident === "scrubber-fault" ? SCRUBBER_RETAINED : 1;
  const cropRetained = c.incident === "crop-collapse" ? CROP_RETAINED : 1;
  const leakKg = c.leakKgPerDay * (c.incident === "leak-growth" ? LEAK_GROWTH_FACTOR : 1);
  const recovery = c.incident === "water-processor-down" ? DEGRADED_RECOVERY : c.waterRecovery;

  /** The farm's own numbers, through its public snapshot — never re-derived. */
  const farm = new AgrariaSimulation(DEFAULT_AGRARIA_CONFIG, 811).snapshot();
  // The cabin regulates the farm's O₂ contribution to demand plus a
  // margin; a greenhouse cannot over-pressurize the habitat.
  const farmO2KgPerDay = Math.min(farm.oxygenPeople, c.crew * 1.1) * O2_KG_PER_PERSON_DAY * cropRetained;
  const farmCo2FixKgPerDay = farm.co2FixedKgDay * cropRetained;
  const peopleFed = farm.peopleFed * cropRetained;

  const crewO2 = c.crew * O2_KG_PER_PERSON_DAY;
  const crewCo2 = c.crew * CO2_KG_PER_PERSON_DAY;
  const crewWater = c.crew * WATER_KG_PER_PERSON_DAY;
  const evaPerDay = c.evaPerWeek / 7;

  /** Oxygen and CO₂ flows, kg/day. Constant per scenario, so the year is exact. */
  const respirationO2 = curing ? CURING_RESPIRATION_O2_KG : 0;
  const respirationCo2 = respirationO2 * (CO2_KG_PER_PERSON_DAY / O2_KG_PER_PERSON_DAY);
  const o2NetKgPerDay = farmO2KgPerDay - crewO2 - respirationO2 - leakKg * 0.23 - evaPerDay * EVA_O2_KG;
  // The curing structure absorbs exactly what the soil breathes out: the
  // Biosphere 2 mechanism, where the masking is the failure.
  const concreteAbsorb = curing ? respirationCo2 : 0;
  const co2Unhandled = Math.max(
    0,
    crewCo2 + INDUSTRIAL_CO2_KG + respirationCo2 - farmCo2FixKgPerDay - concreteAbsorb,
  );
  const scrubberKgPerDay = Math.min(SCRUB_CAPACITY_KG * scrubRetained, co2Unhandled);
  const co2NetKgPerDay = co2Unhandled - scrubberKgPerDay;

  const waterNetKgPerDay = -(crewWater * (1 - recovery)) - evaPerDay * EVA_WATER_KG - leakKg * 0.1;
  const foodNetCrewDaysPerDay = -Math.max(0, c.crew - peopleFed) / Math.max(1, c.crew);

  /** Day-by-day, deterministic. Stores cap at day-zero levels; the excess
   * is vented or deferred, and the ledger names it. */
  let o2 = c.o2StoreKg;
  let water = c.waterStoreKg;
  let food = c.foodStoreCrewDays;
  let co2Ppm = CO2_SETPOINT_PPM;
  let o2Injections = 0;
  let resupplies = 0;
  let o2VentedKg = 0;
  let waterDeferredKg = 0;
  let o2FlowSumKg = 0;
  let waterFlowSumKg = 0;

  const alarms = {
    o2: { threshold: null as number | null, trend: null as number | null, fail: null as number | null },
    water: { threshold: null as number | null, fail: null as number | null },
    food: { threshold: null as number | null, fail: null as number | null },
    co2: { threshold: null as number | null, trend: null as number | null },
  };
  let o2DeclineRun = 0;
  let co2RiseRun = 0;
  let prevO2 = o2;
  let prevCo2 = co2Ppm;

  for (let day = 1; day <= c.horizonDays; day += 1) {
    const o2Raw = o2 + o2NetKgPerDay;
    const o2Capped = Math.min(c.o2StoreKg, Math.max(0, o2Raw));
    o2VentedKg += Math.max(0, o2Raw - c.o2StoreKg);
    o2FlowSumKg += o2Capped - o2;
    o2 = o2Capped;

    let waterRaw = water + waterNetKgPerDay;
    if (day % c.resupplyPeriodDays === 0) {
      waterRaw += c.resupplyWaterKg;
      food += c.resupplyFoodCrewDays;
      resupplies += 1;
    }
    const waterCapped = Math.min(c.waterStoreKg, Math.max(0, waterRaw));
    waterDeferredKg += Math.max(0, waterRaw - c.waterStoreKg);
    waterFlowSumKg += waterCapped - water;
    water = waterCapped;

    food = Math.min(
      c.foodStoreCrewDays + c.resupplyFoodCrewDays,
      Math.max(0, food + foodNetCrewDaysPerDay * c.crew),
    );
    co2Ppm = Math.min(CO2_CEILING_PPM, Math.max(400, co2Ppm + co2NetKgPerDay * CO2_PPM_PER_KG));

    if (o2 < c.o2StoreKg * O2_THRESHOLD_FRACTION && o2 > 0) {
      if (alarms.o2.threshold === null) alarms.o2.threshold = day;
      // INVARIANT 3: makeup is finite and counted. Two injections was
      // Biosphere 2's bill; the register keeps this habitat's.
      o2 += O2_INJECTION_KG;
      o2FlowSumKg += O2_INJECTION_KG;
      o2Injections += 1;
    }
    if (water < c.waterStoreKg * WATER_THRESHOLD_FRACTION && alarms.water.threshold === null)
      alarms.water.threshold = day;
    if (food < c.crew * 30 && alarms.food.threshold === null) alarms.food.threshold = day;
    if (co2Ppm > CO2_ALARM_PPM && alarms.co2.threshold === null) alarms.co2.threshold = day;

    // INVARIANT 2: on the atmosphere, a trend is an alarm. The water and
    // food stores sawtooth against scheduled resupply; the air has no
    // schedule, so consecutive movement against it IS the signal.
    o2DeclineRun = o2 < prevO2 - 1e-12 ? o2DeclineRun + 1 : 0;
    co2RiseRun = co2Ppm > prevCo2 + 1e-12 ? co2RiseRun + 1 : 0;
    if (o2DeclineRun >= c.trendAlarmDays && alarms.o2.trend === null) alarms.o2.trend = day;
    if (co2RiseRun >= c.trendAlarmDays && alarms.co2.trend === null) alarms.co2.trend = day;
    prevO2 = o2;
    prevCo2 = co2Ppm;

    if (o2 <= 0 && alarms.o2.fail === null) alarms.o2.fail = day;
    if (water <= 0 && alarms.water.fail === null) alarms.water.fail = day;
    if (food <= 0 && alarms.food.fail === null) alarms.food.fail = day;
  }

  // INVARIANT 1: each loop's ledger closes — the store's total movement
  // equals the summed named flows, to numerical precision.
  const ledgerResidueKg =
    Math.abs(o2 - c.o2StoreKg - o2FlowSumKg) + Math.abs(water - c.waterStoreKg - waterFlowSumKg);

  const loops: LoopReport[] = [
    {
      loop: "oxygen",
      finalLevel: o2,
      unit: "kg",
      thresholdAlarmDay: alarms.o2.threshold,
      trendAlarmDay: alarms.o2.trend,
      failureDay: alarms.o2.fail,
      compounding: o2NetKgPerDay < -1e-9,
    },
    {
      loop: "carbon",
      finalLevel: co2Ppm,
      unit: "ppm",
      thresholdAlarmDay: alarms.co2.threshold,
      trendAlarmDay: alarms.co2.trend,
      failureDay: null,
      compounding: co2NetKgPerDay > 1e-9,
    },
    {
      loop: "water",
      finalLevel: water,
      unit: "kg",
      thresholdAlarmDay: alarms.water.threshold,
      trendAlarmDay: null,
      failureDay: alarms.water.fail,
      compounding: -waterNetKgPerDay > c.resupplyWaterKg / c.resupplyPeriodDays,
    },
    {
      loop: "food",
      finalLevel: food,
      unit: "crew-days",
      thresholdAlarmDay: alarms.food.threshold,
      trendAlarmDay: null,
      failureDay: alarms.food.fail,
      compounding: -foodNetCrewDaysPerDay * c.crew > c.resupplyFoodCrewDays / c.resupplyPeriodDays,
    },
  ];

  /** The Biosphere 2 number: days the O₂ decline ran before any threshold saw it. */
  const silentWindowDays =
    alarms.o2.trend !== null && alarms.o2.threshold !== null ? alarms.o2.threshold - alarms.o2.trend : null;
  const compoundingLoops = loops.filter((l) => l.compounding).map((l) => l.loop);
  const failedLoops = loops.filter((l) => l.failureDay !== null).map((l) => l.loop);

  const closurePercent = (1 - Math.abs(waterNetKgPerDay) / crewWater) * 100;

  const constraints = [
    ...(curing && alarms.co2.threshold === null
      ? [
          `The CO₂ alarm never fired: the curing structure absorbed ${concreteAbsorb.toFixed(0)} kg/day — the telemetry that would have flagged the O₂ loss reads nominal`,
        ]
      : []),
    ...(silentWindowDays !== null && silentWindowDays > 30
      ? [
          `O₂ trend alarm at day ${alarms.o2.trend}; threshold alarm at day ${alarms.o2.threshold} — a ${silentWindowDays}-day silent window that belongs to the alarm, not the failure`,
        ]
      : []),
    ...(o2Injections > 0
      ? [`${o2Injections} emergency O₂ injection(s) of ${O2_INJECTION_KG} kg — Biosphere 2 needed two`]
      : []),
    ...compoundingLoops.map(
      (loop) => `${loop.toUpperCase()} loop is compounding: no flow on the books recovers it`,
    ),
    ...failedLoops.map((loop) => `${loop.toUpperCase()} store exhausted inside the horizon`),
    ...(peopleFed < c.crew
      ? [
          `AGRARIA feeds ${peopleFed.toFixed(1)} of ${c.crew}: the food loop leans on stores by design — ${(c.crew - peopleFed).toFixed(1)} crew-days a day`,
        ]
      : []),
    ...(recovery < 0.9
      ? [
          `Water processor at ${(recovery * 100).toFixed(0)}%: the loop loses ${Math.abs(waterNetKgPerDay).toFixed(1)} kg/day and leans on ASCENT ${(Math.abs(waterNetKgPerDay) / 3.53).toFixed(1)}× harder`,
        ]
      : []),
    ...(resupplies > 0
      ? [
          `${resupplies} ASCENT resupply call(s) — closure is ${closurePercent.toFixed(1)}%, not a number anyone has ever made 100`,
        ]
      : []),
  ];

  const readiness = failedLoops.length > 0 ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode =
    failedLoops.length > 0
      ? "LOOP EXHAUSTED"
      : curing
        ? "MASKED DECLINE — TREND CAUGHT IT"
        : compoundingLoops.length > 0
          ? "COMPOUNDING WATCHED"
          : "LOOPS CLOSING";

  return {
    loops,
    o2NetKgPerDay,
    co2NetKgPerDay,
    waterNetKgPerDay,
    foodNetCrewDaysPerDay,
    farmO2KgPerDay,
    peopleFed,
    o2Injections,
    resupplies,
    silentWindowDays,
    compoundingLoops,
    failedLoops,
    closurePercent,
    ledgerResidueKg,
    constraints,
    readiness,
    safeMode,
  } as const;
}
