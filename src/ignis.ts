export type EngineId = "cryo-chemical" | "hall-electric" | "nuclear-thermal" | "fusion-concept";
export type EngineMaturity = 0 | 2 | 5;

export interface EngineArchitecture {
  id: EngineId;
  name: string;
  family: string;
  propellant: string;
  referenceIspS: number;
  referenceThrustN: number;
  referencePowerMW: number;
  efficiency: number;
  structureHeatFraction: number;
  referenceCoreTempK: number;
  maxCoreTempK: number;
  maturity: EngineMaturity;
  evidence: string;
}

export interface IgnisConfig {
  engine: EngineId;
  units: number;
  throttlePercent: number;
  coreTemperatureK: number;
  propellantT: number;
  vehicleDryMassT: number;
  requestedBurnHours: number;
  radiatorAreaM2: number;
  radiatorTemperatureK: number;
  thermalSinkGJ: number;
  failedUnits: number;
}

export interface IgnisResult {
  effectiveIspS: number;
  exhaustVelocityMS: number;
  thrustN: number;
  thrustKN: number;
  massFlowKgS: number;
  sourcePowerMW: number;
  exhaustPowerMW: number;
  structuralHeatMW: number;
  radiatorCapacityMW: number;
  netHeatMW: number;
  thermalEnduranceHours: number | null;
  propellantEnduranceHours: number;
  allowedBurnHours: number;
  propellantUsedT: number;
  totalImpulseMNs: number;
  availableDeltaVkmS: number;
  achievedDeltaVkmS: number;
  initialAccelerationMilliG: number;
  engineOutThrustPercent: number;
  readiness: "GO" | "CONDITIONAL" | "NO-GO";
  constraints: readonly string[];
}

export const ENGINES: Record<EngineId, EngineArchitecture> = {
  "cryo-chemical": {
    id: "cryo-chemical",
    name: "AURORA LOX / LH₂",
    family: "CRYOGENIC CHEMICAL",
    propellant: "LOX + LH₂",
    referenceIspS: 450,
    referenceThrustN: 900_000,
    referencePowerMW: 3_100,
    efficiency: 0.64,
    structureHeatFraction: 0.018,
    referenceCoreTempK: 3500,
    maxCoreTempK: 3700,
    maturity: 5,
    evidence: "Flight-proven family; simplified equivalent exhaust model",
  },
  "hall-electric": {
    id: "hall-electric",
    name: "VECTIS HALL ARRAY",
    family: "POWER-LIMITED ELECTRIC",
    propellant: "XENON",
    referenceIspS: 1900,
    referenceThrustN: 0.55,
    referencePowerMW: 0.012,
    efficiency: 0.55,
    structureHeatFraction: 0.45,
    referenceCoreTempK: 900,
    maxCoreTempK: 1150,
    maturity: 5,
    evidence: "12 kW magnetically shielded Hall-thruster class",
  },
  "nuclear-thermal": {
    id: "nuclear-thermal",
    name: "EMBER NUCLEAR THERMAL",
    family: "SOLID-CORE NTP",
    propellant: "HYDROGEN",
    referenceIspS: 900,
    referenceThrustN: 100_000,
    referencePowerMW: 500,
    efficiency: 0.86,
    structureHeatFraction: 0.02,
    referenceCoreTempK: 2800,
    maxCoreTempK: 3100,
    maturity: 2,
    evidence: "Rover/NERVA ground-test heritage; no operational flight system",
  },
  "fusion-concept": {
    id: "fusion-concept",
    name: "PROMETHEUS FUSION DRIVE",
    family: "MAGNETIC EXHAUST CONCEPT",
    propellant: "D / He³ + REACTION MASS",
    referenceIspS: 100_000,
    referenceThrustN: 250_000,
    referencePowerMW: 5_000,
    efficiency: 0.55,
    structureHeatFraction: 0.12,
    referenceCoreTempK: 5000,
    maxCoreTempK: 6000,
    maturity: 0,
    evidence: "Speculative placeholder; no verified flight-capable fusion drive",
  },
};

const G0 = 9.80665;
const SIGMA = 5.670374419e-8;
const EMISSIVITY = 0.88;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function engineConfig(engine: EngineId = "hall-electric"): IgnisConfig {
  const architecture = ENGINES[engine];
  const presets: Record<EngineId, Omit<IgnisConfig, "engine" | "coreTemperatureK">> = {
    "cryo-chemical": {
      units: 2,
      throttlePercent: 100,
      propellantT: 180,
      vehicleDryMassT: 120,
      requestedBurnHours: 0.08,
      radiatorAreaM2: 800,
      radiatorTemperatureK: 650,
      thermalSinkGJ: 12_000,
      failedUnits: 0,
    },
    "hall-electric": {
      units: 24,
      throttlePercent: 90,
      propellantT: 18,
      vehicleDryMassT: 70,
      requestedBurnHours: 4_000,
      radiatorAreaM2: 180,
      radiatorTemperatureK: 420,
      thermalSinkGJ: 120,
      failedUnits: 0,
    },
    "nuclear-thermal": {
      units: 3,
      throttlePercent: 100,
      propellantT: 160,
      vehicleDryMassT: 150,
      requestedBurnHours: 0.5,
      radiatorAreaM2: 1_200,
      radiatorTemperatureK: 700,
      thermalSinkGJ: 24_000,
      failedUnits: 0,
    },
    "fusion-concept": {
      units: 2,
      throttlePercent: 70,
      propellantT: 8_000,
      vehicleDryMassT: 9_000,
      requestedBurnHours: 240,
      radiatorAreaM2: 240_000,
      radiatorTemperatureK: 720,
      thermalSinkGJ: 8_000_000,
      failedUnits: 0,
    },
  };
  return { engine, coreTemperatureK: architecture.referenceCoreTempK, ...presets[engine] };
}

export function evaluateEngine(config: IgnisConfig): IgnisResult {
  const engine = ENGINES[config.engine];
  const units = Math.max(1, Math.floor(config.units));
  const activeUnits = Math.max(0, units - clamp(Math.floor(config.failedUnits), 0, units));
  const throttle = clamp(config.throttlePercent, 0, 100) / 100;
  const temperatureRatio =
    clamp(config.coreTemperatureK, 1, engine.maxCoreTempK * 1.2) / engine.referenceCoreTempK;
  const effectiveIspS = engine.referenceIspS * Math.sqrt(temperatureRatio);
  const exhaustVelocityMS = effectiveIspS * G0;
  const referenceThrust = engine.referenceThrustN * activeUnits * throttle;
  const sourcePowerMW = engine.referencePowerMW * activeUnits * throttle;
  const powerLimitedThrust =
    engine.id === "hall-electric"
      ? (2 * engine.efficiency * sourcePowerMW * 1e6) / exhaustVelocityMS
      : referenceThrust;
  const thrustN = Math.max(0, powerLimitedThrust);
  const massFlowKgS = thrustN / Math.max(1, exhaustVelocityMS);
  const exhaustPowerMW = (0.5 * massFlowKgS * exhaustVelocityMS ** 2) / 1e6;
  const structuralHeatMW = sourcePowerMW * engine.structureHeatFraction;
  const radiatorCapacityMW =
    (EMISSIVITY *
      SIGMA *
      Math.max(0, config.radiatorAreaM2) *
      Math.max(1, config.radiatorTemperatureK) ** 4) /
    1e6;
  const netHeatMW = Math.max(0, structuralHeatMW - radiatorCapacityMW);
  const thermalEnduranceHours = netHeatMW > 0 ? Math.max(0, config.thermalSinkGJ) / netHeatMW / 3.6 : null;
  const propellantEnduranceHours =
    massFlowKgS > 0 ? (Math.max(0, config.propellantT) * 1000) / massFlowKgS / 3600 : 0;
  const allowedBurnHours = Math.min(
    Math.max(0, config.requestedBurnHours),
    propellantEnduranceHours,
    thermalEnduranceHours ?? Infinity,
  );
  const propellantUsedT = (massFlowKgS * allowedBurnHours * 3600) / 1000;
  const initialMassKg = (Math.max(0.001, config.vehicleDryMassT) + Math.max(0, config.propellantT)) * 1000;
  const finalMassKg = Math.max(0.001, config.vehicleDryMassT) * 1000;
  const availableDeltaVkmS = (exhaustVelocityMS * Math.log(initialMassKg / finalMassKg)) / 1000;
  const achievedFinalMassKg = Math.max(finalMassKg, initialMassKg - propellantUsedT * 1000);
  const achievedDeltaVkmS = (exhaustVelocityMS * Math.log(initialMassKg / achievedFinalMassKg)) / 1000;
  const initialAccelerationMilliG = initialMassKg > 0 ? (thrustN / initialMassKg / G0) * 1000 : 0;
  const engineOutThrustPercent = units > 0 ? (activeUnits / units) * 100 : 0;
  const constraints = [
    ...(activeUnits === 0 ? ["No healthy engine remains online"] : []),
    ...(config.coreTemperatureK > engine.maxCoreTempK
      ? [`Core temperature exceeds ${engine.maxCoreTempK.toFixed(0)} K material limit`]
      : []),
    ...(thermalEnduranceHours !== null && thermalEnduranceHours < config.requestedBurnHours
      ? [`Thermal sink saturates after ${thermalEnduranceHours.toFixed(2)} h`]
      : []),
    ...(propellantEnduranceHours < config.requestedBurnHours
      ? [`Propellant exhausted after ${propellantEnduranceHours.toFixed(2)} h`]
      : []),
    ...(config.failedUnits > 0
      ? [
          `${Math.min(units, Math.floor(config.failedUnits))} unit(s) isolated; guidance must trim asymmetric thrust`,
        ]
      : []),
    ...(engine.maturity === 0 ? ["Engine has no verified engineering path"] : []),
    ...(engine.id === "nuclear-thermal"
      ? ["Reactor startup, radiation shielding, and ground safety remain mission constraints"]
      : []),
  ];
  const readiness =
    engine.maturity === 0 ||
    activeUnits === 0 ||
    config.coreTemperatureK > engine.maxCoreTempK ||
    allowedBurnHours <= 0
      ? "NO-GO"
      : constraints.some((item) => item.startsWith("Thermal sink") || item.startsWith("Propellant exhausted"))
        ? "NO-GO"
        : constraints.length
          ? "CONDITIONAL"
          : "GO";
  return {
    effectiveIspS,
    exhaustVelocityMS,
    thrustN,
    thrustKN: thrustN / 1000,
    massFlowKgS,
    sourcePowerMW,
    exhaustPowerMW,
    structuralHeatMW,
    radiatorCapacityMW,
    netHeatMW,
    thermalEnduranceHours,
    propellantEnduranceHours,
    allowedBurnHours,
    propellantUsedT,
    totalImpulseMNs: (thrustN * allowedBurnHours * 3600) / 1e6,
    availableDeltaVkmS,
    achievedDeltaVkmS,
    initialAccelerationMilliG,
    engineOutThrustPercent,
    readiness,
    constraints,
  };
}
