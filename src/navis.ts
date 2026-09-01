export type PropulsionId = "chemical" | "solar-electric" | "nuclear-electric" | "fusion-concept";
export type MissionId = "orbital-tug" | "asteroid-freighter" | "atlas-probe" | "seedship";
export type ModelMaturity = 0 | 2 | 5;

export interface PropulsionArchitecture {
  id: PropulsionId;
  name: string;
  specificImpulseS: number;
  thrustKN: number;
  propulsionPowerMW: number;
  efficiency: number;
  maturity: ModelMaturity;
  evidence: string;
  /** Provenance of the headline performance. See IGNIS `Grounding`. */
  grounding: Grounding;
  /** The article the reference numbers are taken from, or why there is none. */
  source: string;
}
export interface NavisConfig {
  mission: MissionId;
  propulsion: PropulsionId;
  dryMassT: number;
  payloadT: number;
  propellantT: number;
  hotelPowerMW: number;
  powerPlantMW: number;
  radiatorAreaM2: number;
  radiatorTemperatureK: number;
  antennaDiameterM: number;
  redundancyPercent: number;
  crew: number;
  targetDistanceLy: number;
}
export interface NavisResult {
  wetMassT: number;
  finalMassT: number;
  payloadFractionPercent: number;
  deltaVkmS: number;
  initialAccelerationMilliG: number;
  burnDays: number | null;
  requiredPowerMW: number;
  powerMarginMW: number;
  wasteHeatMW: number;
  radiatorCapacityMW: number;
  thermalMarginMW: number;
  oneWaySignalYears: number;
  roundTripSignalYears: number;
  autonomyLevel: string;
  linkIndex: number;
  idealTransitYears: number | null;
  readiness: "GO" | "CONDITIONAL" | "NO-GO";
  maturity: ModelMaturity;
  constraints: readonly string[];
}

/** Provenance of a reference constant, shared with the IGNIS engine table. */
export type Grounding = "sourced" | "derived" | "scenario";

export const PROPULSION: Record<PropulsionId, PropulsionArchitecture> = {
  chemical: {
    id: "chemical",
    name: "LOX / LH₂ CHEMICAL",
    // Eight RL10B-2 in a cluster: 8 × 110.1 kN. The specific impulse is the
    // single-engine vacuum figure, which a cluster does not change.
    specificImpulseS: 465.5,
    thrustKN: 880.8,
    propulsionPowerMW: 0,
    efficiency: 0.78,
    maturity: 5,
    evidence: "Flight-proven class; ideal rocket equation only",
    grounding: "sourced",
    source: "RL10B-2 × 8: 465.5 s vacuum Isp, 110.1 kN each.",
  },
  "solar-electric": {
    id: "solar-electric",
    name: "SOLAR HALL ARRAY",
    // AEPS Hall thrusters scaled to a 30 MW array. Thrust is the power-limited
    // relation F = 2ηP/v, not an independent guess: it follows from the other
    // three numbers, and the test asserts that it still does.
    specificImpulseS: 2800,
    thrustKN: 1.46,
    propulsionPowerMW: 30,
    efficiency: 0.67,
    maturity: 5,
    evidence: "Flight-proven Hall-effect family; scaled power plant",
    grounding: "derived",
    source: "NASA AEPS / HERMeS 12 kW point (2800 s, 0.67), scaled to a 30 MW array by F = 2ηP/v.",
  },
  "nuclear-electric": {
    id: "nuclear-electric",
    name: "NUCLEAR ELECTRIC",
    specificImpulseS: 4190,
    thrustKN: 0.69,
    propulsionPowerMW: 20,
    efficiency: 0.71,
    maturity: 2,
    evidence: "Subsystem heritage; integrated vehicle is conceptual",
    grounding: "derived",
    source: "NEXT-C gridded ion at 6.9 kW (4190 s, 0.71 thrust efficiency), scaled to 20 MW by F = 2ηP/v.",
  },
  "fusion-concept": {
    id: "fusion-concept",
    name: "FUSION PULSE CONCEPT",
    specificImpulseS: 100000,
    thrustKN: 250,
    propulsionPowerMW: 5000,
    efficiency: 0.55,
    maturity: 0,
    evidence: "No verified flight-capable fusion propulsion system",
    grounding: "scenario",
    source: "No article exists. Every number in this row is invented.",
  },
};

/** Share of the propulsion table backed by a real article, sourced or derived. */
export const propulsionGroundedFraction = (): number => {
  const all = Object.values(PROPULSION);
  return all.filter((drive) => drive.grounding !== "scenario").length / all.length;
};

export const MISSION_PRESETS: Record<MissionId, Omit<NavisConfig, "mission" | "targetDistanceLy">> = {
  "orbital-tug": {
    propulsion: "chemical",
    dryMassT: 42,
    payloadT: 18,
    propellantT: 110,
    hotelPowerMW: 0.4,
    powerPlantMW: 1,
    radiatorAreaM2: 180,
    radiatorTemperatureK: 360,
    antennaDiameterM: 1.5,
    redundancyPercent: 20,
    crew: 2,
  },
  "asteroid-freighter": {
    propulsion: "solar-electric",
    dryMassT: 180,
    payloadT: 420,
    propellantT: 95,
    hotelPowerMW: 4,
    powerPlantMW: 38,
    radiatorAreaM2: 8000,
    radiatorTemperatureK: 430,
    antennaDiameterM: 4,
    redundancyPercent: 30,
    crew: 0,
  },
  "atlas-probe": {
    propulsion: "nuclear-electric",
    dryMassT: 85,
    payloadT: 20,
    propellantT: 60,
    hotelPowerMW: 6,
    powerPlantMW: 32,
    radiatorAreaM2: 3600,
    radiatorTemperatureK: 480,
    antennaDiameterM: 8,
    redundancyPercent: 45,
    crew: 0,
  },
  seedship: {
    propulsion: "fusion-concept",
    dryMassT: 4800,
    payloadT: 12000,
    propellantT: 22000,
    hotelPowerMW: 800,
    powerPlantMW: 6500,
    radiatorAreaM2: 180000,
    radiatorTemperatureK: 620,
    antennaDiameterM: 40,
    redundancyPercent: 80,
    crew: 0,
  },
};

const G0 = 9.80665;
const C_KM_S = 299792.458;
const SIGMA = 5.670374419e-8;
const EMISSIVITY = 0.88;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function designSpacecraft(config: NavisConfig): NavisResult {
  const drive = PROPULSION[config.propulsion];
  const redundancyMassT = (config.dryMassT * clamp(config.redundancyPercent, 0, 100)) / 100;
  const finalMassT = config.dryMassT + config.payloadT + redundancyMassT;
  const wetMassT = finalMassT + config.propellantT;
  const exhaustVelocityMS = drive.specificImpulseS * G0;
  const deltaVkmS =
    (exhaustVelocityMS * Math.log(Math.max(1, wetMassT / Math.max(0.001, finalMassT)))) / 1000;
  const thrustN = drive.thrustKN * 1000;
  const initialAccelerationMilliG = (thrustN / (wetMassT * 1000) / G0) * 1000;
  const massFlowKgS = thrustN / exhaustVelocityMS;
  const burnDays = thrustN > 0 ? (config.propellantT * 1000) / massFlowKgS / 86400 : null;
  const requiredPowerMW = config.hotelPowerMW + drive.propulsionPowerMW;
  const availablePowerMW = config.powerPlantMW;
  const powerMarginMW = availablePowerMW - requiredPowerMW;
  const wasteHeatMW = config.hotelPowerMW * 0.72 + drive.propulsionPowerMW * (1 - drive.efficiency);
  const radiatorCapacityMW =
    (EMISSIVITY * SIGMA * config.radiatorAreaM2 * Math.pow(config.radiatorTemperatureK, 4)) / 1e6;
  const thermalMarginMW = radiatorCapacityMW - wasteHeatMW;
  const linkIndex =
    config.targetDistanceLy <= 0
      ? 100
      : clamp(
          (100 * Math.pow(config.antennaDiameterM / 4, 2)) / Math.pow(config.targetDistanceLy / 10, 2),
          0,
          100,
        );
  const cruiseFractionC = deltaVkmS / 2 / C_KM_S;
  const idealTransitYears =
    config.targetDistanceLy > 0 && cruiseFractionC > 0 ? config.targetDistanceLy / cruiseFractionC : null;
  const autonomyLevel =
    config.targetDistanceLy < 0.01
      ? "REAL-TIME SUPERVISION"
      : config.targetDistanceLy < 0.2
        ? "DELAY-TOLERANT CONTROL"
        : config.targetDistanceLy < 5
          ? "MISSION AUTONOMY"
          : "CIVILIZATION-SCALE AUTONOMY";
  const constraints = [
    ...(thermalMarginMW < 0 ? [`Radiator deficit ${Math.abs(thermalMarginMW).toFixed(1)} MW`] : []),
    ...(powerMarginMW < 0 ? [`Power deficit ${Math.abs(powerMarginMW).toFixed(1)} MW`] : []),
    ...(config.payloadT / wetMassT < 0.05 ? ["Payload fraction below 5%"] : []),
    ...(config.targetDistanceLy >= 1 && deltaVkmS < 1000
      ? ["Interstellar transit is not operationally credible"]
      : []),
    ...(linkIndex < 1 ? ["Direct link budget collapses without relay or larger aperture"] : []),
    ...(drive.maturity === 0 ? ["Propulsion has no verified engineering path"] : []),
    ...(config.crew > 0 && config.targetDistanceLy >= 0.01
      ? ["Crew survival and closed-loop life support are not modeled"]
      : []),
  ];
  const readiness =
    drive.maturity === 0 || thermalMarginMW < 0 || powerMarginMW < 0
      ? "NO-GO"
      : constraints.length
        ? "CONDITIONAL"
        : "GO";
  return {
    wetMassT,
    finalMassT,
    payloadFractionPercent: (config.payloadT / wetMassT) * 100,
    deltaVkmS,
    initialAccelerationMilliG,
    burnDays,
    requiredPowerMW,
    powerMarginMW,
    wasteHeatMW,
    radiatorCapacityMW,
    thermalMarginMW,
    oneWaySignalYears: config.targetDistanceLy,
    roundTripSignalYears: config.targetDistanceLy * 2,
    autonomyLevel,
    linkIndex,
    idealTransitYears,
    readiness,
    maturity: drive.maturity,
    constraints,
  };
}

export function missionConfig(mission: MissionId, targetDistanceLy = 10.5): NavisConfig {
  return { mission, targetDistanceLy, ...MISSION_PRESETS[mission] };
}
