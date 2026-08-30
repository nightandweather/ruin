export type ReactorClass = "kilopower" | "surface-40" | "nep-megawatt";
export type PrometheusIncident = "none" | "conversion-loss" | "coolant-loss" | "thruster-out";
export interface PrometheusConfig {
  reactorClass: ReactorClass;
  units: number;
  failedUnits: number;
  thermalPowerKW: number;
  conversionEfficiency: number;
  hotelPowerKW: number;
  factoryPowerKW: number;
  radiatorAreaM2: number;
  radiatorTempK: number;
  shieldKg: number;
  crewDistanceM: number;
  thrusterEfficiency: number;
  ispS: number;
  propellantT: number;
  dryMassT: number;
  burnDays: number;
  designLifeYears: number;
  incident: PrometheusIncident;
}
export const REACTORS: Record<
  ReactorClass,
  { name: string; thermalKW: number; efficiency: number; life: number; maturity: string }
> = {
  kilopower: {
    name: "KRUSTY HERITAGE",
    thermalKW: 25,
    efficiency: 0.2,
    life: 10,
    maturity: "GROUND-TEST HERITAGE",
  },
  "surface-40": {
    name: "40 kWe SURFACE CLASS",
    thermalKW: 160,
    efficiency: 0.25,
    life: 10,
    maturity: "NASA/DOE DESIGN TARGET",
  },
  "nep-megawatt": {
    name: "MW-CLASS NEP",
    thermalKW: 4000,
    efficiency: 0.3,
    life: 15,
    maturity: "TECHNOLOGY MATURATION",
  },
};
const SIGMA = 5.670374419e-8,
  G0 = 9.80665,
  EM = 0.88,
  clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function prometheusConfig(reactorClass: ReactorClass = "surface-40"): PrometheusConfig {
  const r = REACTORS[reactorClass];
  return {
    reactorClass,
    units: 2,
    failedUnits: 0,
    thermalPowerKW: r.thermalKW,
    conversionEfficiency: r.efficiency,
    hotelPowerKW: 8,
    factoryPowerKW: 20,
    radiatorAreaM2: 180,
    radiatorTempK: 475,
    shieldKg: 2200,
    crewDistanceM: 60,
    thrusterEfficiency: 0.62,
    ispS: 4000,
    propellantT: 12,
    dryMassT: 48,
    burnDays: 180,
    designLifeYears: r.life,
    incident: "none",
  };
}
export function evaluatePrometheus(c: PrometheusConfig) {
  const units = Math.max(1, Math.floor(c.units)),
    failed = clamp(Math.floor(c.failedUnits) + (c.incident === "conversion-loss" ? 1 : 0), 0, units),
    active = units - failed;
  const thermalKW = Math.max(0, c.thermalPowerKW) * active,
    electricKW =
      thermalKW * clamp(c.conversionEfficiency, 0, 1) * (c.incident === "conversion-loss" ? 0.55 : 1);
  const baseLoadKW = Math.max(0, c.hotelPowerKW + c.factoryPowerKW),
    propulsionKW = Math.max(0, electricKW - baseLoadKW);
  const wasteHeatKW = thermalKW - electricKW + electricKW * 0.06;
  const radiatorCapacityKW =
      ((EM * SIGMA * Math.max(0, c.radiatorAreaM2) * Math.max(1, c.radiatorTempK) ** 4) / 1000) *
      (c.incident === "coolant-loss" ? 0.35 : 1),
    thermalMarginKW = radiatorCapacityKW - wasteHeatKW;
  const ve = Math.max(1, c.ispS * G0),
    usablePropulsionKW = thermalMarginKW >= 0 ? propulsionKW : 0,
    thrustN =
      ((2 * clamp(c.thrusterEfficiency, 0, 1) * usablePropulsionKW * 1000) / ve) *
      (c.incident === "thruster-out" ? 0.5 : 1);
  const wetMassKg = Math.max(0.001, c.dryMassT + c.propellantT) * 1000 + Math.max(0, c.shieldKg),
    dryMassKg = Math.max(1, c.dryMassT * 1000 + c.shieldKg),
    deltaVMS = ve * Math.log(wetMassKg / dryMassKg),
    accelerationMicroG = (thrustN / wetMassKg / G0) * 1e6,
    massFlowKgS = thrustN / ve,
    burnEnduranceDays = massFlowKgS > 0 ? (c.propellantT * 1000) / massFlowKgS / 86400 : 0,
    achievableBurnDays = Math.min(Math.max(0, c.burnDays), burnEnduranceDays);
  const doseIndex = (1 / Math.max(1, c.shieldKg / 1000)) * Math.pow(25 / Math.max(1, c.crewDistanceM), 2);
  const bootstrapPowerKW = Math.max(0, electricKW - c.hotelPowerKW),
    factoryFraction = c.factoryPowerKW > 0 ? clamp(bootstrapPowerKW / c.factoryPowerKW, 0, 1) : 1;
  const constraints = [
    ...(active === 0 ? ["No healthy reactor unit remains"] : []),
    ...(electricKW < baseLoadKW ? ["Electrical output cannot serve survival and factory loads"] : []),
    ...(thermalMarginKW < 0
      ? [`Radiator deficit ${Math.abs(thermalMarginKW).toFixed(0)} kW blocks powered operation`]
      : []),
    ...(doseIndex > 1 ? ["Crew radiation proxy exceeds the conservative design boundary"] : []),
    ...(c.incident !== "none"
      ? [`Injected ${c.incident.replace("-", " ")} requires degraded operation`]
      : []),
    ...(c.reactorClass === "nep-megawatt" ? ["MW-class NEP remains a technology-maturation scenario"] : []),
  ];
  const readiness =
    active === 0 || thermalMarginKW < 0 || electricKW < c.hotelPowerKW || doseIndex > 2
      ? "NO-GO"
      : constraints.length
        ? "CONDITIONAL"
        : "GO";
  const safeState =
    c.incident === "coolant-loss"
      ? "DECAY-HEAT SAFE"
      : c.incident === "conversion-loss"
        ? "SURVIVAL BUS"
        : c.incident === "thruster-out"
          ? "BALLISTIC COAST"
          : readiness === "GO"
            ? "POWERED MISSION"
            : "REACTOR HOLD";
  return {
    units,
    active,
    thermalKW,
    electricKW,
    baseLoadKW,
    propulsionKW,
    wasteHeatKW,
    radiatorCapacityKW,
    thermalMarginKW,
    thrustN,
    wetMassKg,
    deltaVMS,
    accelerationMicroG,
    massFlowKgS,
    burnEnduranceDays,
    achievableBurnDays,
    doseIndex,
    bootstrapPowerKW,
    factoryFraction,
    readiness,
    safeState,
    constraints,
  };
}
