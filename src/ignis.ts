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
  /**
   * Where this engine's headline performance comes from.
   *
   * `sourced` means the specific impulse and thrust are the published figures
   * of a real flight or test article, named in `source`. `derived` means they
   * are computed from sourced quantities with the equation shown. `scenario`
   * means invented — legible, configurable, and not a claim about anything
   * that exists.
   */
  grounding: Grounding;
  /** The article the reference numbers are taken from, or why there is none. */
  source: string;
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

/** Provenance of a reference constant. See `EngineArchitecture.grounding`. */
export type Grounding = "sourced" | "derived" | "scenario";

export const ENGINES: Record<EngineId, EngineArchitecture> = {
  "cryo-chemical": {
    id: "cryo-chemical",
    name: "RL10B-2 CRYOGENIC",
    family: "CRYOGENIC CHEMICAL",
    propellant: "LOX + LH₂",
    // Sourced: RL10B-2 vacuum performance. Jet power follows from thrust and
    // exhaust velocity (P = ½·ṁ·v²  with ṁ = F/v), so the 322 MW source power
    // is that jet power divided by the assumed thermal-to-jet efficiency.
    referenceIspS: 465.5,
    referenceThrustN: 110_100,
    referencePowerMW: 322,
    efficiency: 0.78,
    structureHeatFraction: 0.018,
    referenceCoreTempK: 3500,
    maxCoreTempK: 3700,
    maturity: 5,
    evidence: "Flight-proven family; simplified equivalent exhaust model",
    grounding: "sourced",
    source:
      "RL10B-2: 465.5 s vacuum Isp, 110.1 kN (24,750 lbf) vacuum thrust. Chamber temperatures and efficiency are scenario parameters.",
  },
  "hall-electric": {
    id: "hall-electric",
    name: "AEPS HALL ARRAY",
    family: "POWER-LIMITED ELECTRIC",
    propellant: "XENON",
    // Sourced: the 12 kW AEPS/HERMeS operating point. The power-limited thrust
    // relation F = 2ηP/v reproduces 0.59 N from these three numbers, which is
    // the published 0.6 N — the table is self-consistent, and the test says so.
    referenceIspS: 2800,
    referenceThrustN: 0.6,
    referencePowerMW: 0.012,
    efficiency: 0.67,
    structureHeatFraction: 0.45,
    referenceCoreTempK: 900,
    maxCoreTempK: 1150,
    maturity: 5,
    evidence: "12 kW magnetically shielded Hall-thruster class",
    grounding: "sourced",
    source:
      "NASA AEPS / HERMeS at the 12 kW point: ~0.6 N thrust, ~2800 s Isp, 0.67 thrust efficiency. Thermal fractions are scenario parameters.",
  },
  "nuclear-thermal": {
    id: "nuclear-thermal",
    name: "NRX A6 SOLID CORE",
    family: "SOLID-CORE NTP",
    propellant: "HYDROGEN",
    // Sourced: the NRX A6 ground test. Thrust is derived from the reported
    // flow rate and specific impulse (F = ṁ·v = 32.7 kg/s × 8522 m/s), and the
    // efficiency is the ratio of that jet power to the reported reactor
    // thermal power — near unity, because for a solid-core NTP the reported
    // reactor power is essentially the power going into the hydrogen.
    referenceIspS: 869,
    referenceThrustN: 278_700,
    referencePowerMW: 1_199,
    efficiency: 0.99,
    structureHeatFraction: 0.02,
    referenceCoreTempK: 2406,
    maxCoreTempK: 2750,
    maturity: 2,
    evidence: "Rover/NERVA ground-test heritage; no operational flight system",
    grounding: "sourced",
    source:
      "NERVA NRX A6 (1967): 1199 MW thermal, 869 s Isp, 32.7 kg/s flow, 2406 K chamber. The 2750 K material ceiling is a scenario parameter.",
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
    grounding: "scenario",
    source:
      "No article exists. Every number here is invented, and this entry is the reason VERITAS rates the IGNIS fusion branch as it does.",
  },
};

/**
 * Share of the engine table whose headline performance comes from a real
 * article. VERITAS reads this instead of a hand-entered rating, so an audit of
 * the laboratory's own grounding cannot drift away from the laboratory.
 */
export const enginesGroundedFraction = (): number => {
  const all = Object.values(ENGINES);
  return all.filter((engine) => engine.grounding === "sourced").length / all.length;
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
