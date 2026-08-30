export type CorvusFrame = "micro" | "utility" | "heavy";
export type CorvusMission = "survey" | "relay" | "prospecting" | "repair-support";
export type CorvusPropulsion = "cold-gas" | "water-resistojet" | "hall";
export type CorvusIncident = "none" | "partition" | "nav-drift" | "power-loss";
export type CorvusReadiness = "GO" | "CONDITIONAL" | "NO-GO";
export interface CorvusConfig {
  frame: CorvusFrame;
  mission: CorvusMission;
  propulsion: CorvusPropulsion;
  droneCount: number;
  failedCount: number;
  dryMassKg: number;
  payloadKg: number;
  propellantKg: number;
  thrustN: number;
  ispS: number;
  solarAreaM2: number;
  cellEfficiency: number;
  batteryKWh: number;
  hotelPowerW: number;
  payloadPowerW: number;
  radiatorAreaM2: number;
  radiatorTempK: number;
  distanceAU: number;
  formationRadiusKm: number;
  relativeDriftMS: number;
  linkRangeKm: number;
  oneWayDelayS: number;
  autonomyPercent: number;
  incident: CorvusIncident;
}
export const FRAME_PRESETS: Record<
  CorvusFrame,
  Pick<
    CorvusConfig,
    | "dryMassKg"
    | "payloadKg"
    | "propellantKg"
    | "thrustN"
    | "ispS"
    | "solarAreaM2"
    | "batteryKWh"
    | "hotelPowerW"
    | "payloadPowerW"
    | "radiatorAreaM2"
    | "radiatorTempK"
  >
> = {
  micro: {
    dryMassKg: 18,
    payloadKg: 4,
    propellantKg: 2,
    thrustN: 0.015,
    ispS: 70,
    solarAreaM2: 1.1,
    batteryKWh: 0.6,
    hotelPowerW: 55,
    payloadPowerW: 30,
    radiatorAreaM2: 0.8,
    radiatorTempK: 320,
  },
  utility: {
    dryMassKg: 92,
    payloadKg: 28,
    propellantKg: 18,
    thrustN: 0.4,
    ispS: 220,
    solarAreaM2: 6,
    batteryKWh: 5,
    hotelPowerW: 220,
    payloadPowerW: 160,
    radiatorAreaM2: 5,
    radiatorTempK: 335,
  },
  heavy: {
    dryMassKg: 360,
    payloadKg: 140,
    propellantKg: 70,
    thrustN: 0.18,
    ispS: 1500,
    solarAreaM2: 24,
    batteryKWh: 28,
    hotelPowerW: 780,
    payloadPowerW: 900,
    radiatorAreaM2: 20,
    radiatorTempK: 360,
  },
};
export const MISSION_META: Record<
  CorvusMission,
  { name: string; minimum: number; payloadFactor: number; description: string }
> = {
  survey: {
    name: "MULTIPOINT SURVEY",
    minimum: 4,
    payloadFactor: 1,
    description: "Distributed sensing from several vantage points",
  },
  relay: {
    name: "MESH RELAY",
    minimum: 3,
    payloadFactor: 0.8,
    description: "Self-healing communications and navigation mesh",
  },
  prospecting: {
    name: "RESOURCE PROSPECTING",
    minimum: 6,
    payloadFactor: 1.15,
    description: "Cooperative spectral and field mapping",
  },
  "repair-support": {
    name: "REPAIR SUPPORT",
    minimum: 3,
    payloadFactor: 0.9,
    description: "Inspect, illuminate, and carry tools for MENDER",
  },
};
const G0 = 9.80665,
  SIGMA = 5.670374419e-8,
  SOLAR = 1361,
  EMISSIVITY = 0.88;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function corvusConfig(
  frame: CorvusFrame = "utility",
  mission: CorvusMission = "survey",
): CorvusConfig {
  return {
    frame,
    mission,
    propulsion: "water-resistojet",
    droneCount: 12,
    failedCount: 0,
    distanceAU: 1,
    cellEfficiency: 0.29,
    formationRadiusKm: 18,
    relativeDriftMS: 0.02,
    linkRangeKm: 60,
    oneWayDelayS: 2,
    autonomyPercent: 82,
    incident: "none",
    ...FRAME_PRESETS[frame],
  };
}
export function evaluateCorvus(c: CorvusConfig) {
  const count = Math.max(1, Math.floor(c.droneCount)),
    failed = clamp(Math.floor(c.failedCount), 0, count),
    healthy = count - failed,
    wetMassKg = c.dryMassKg + c.payloadKg + c.propellantKg;
  const deltaVMS =
    c.propellantKg > 0 ? Math.max(0, c.ispS) * G0 * Math.log(wetMassKg / (wetMassKg - c.propellantKg)) : 0;
  const accelerationMS2 = Math.max(0, c.thrustN) / Math.max(1, wetMassKg),
    propellantFlowKgS = c.ispS > 0 ? Math.max(0, c.thrustN) / (c.ispS * G0) : 0,
    burnHours = propellantFlowKgS > 0 ? c.propellantKg / propellantFlowKgS / 3600 : 0;
  const solarPowerW =
    (SOLAR / Math.max(0.01, c.distanceAU ** 2)) * Math.max(0, c.solarAreaM2) * clamp(c.cellEfficiency, 0, 1);
  const totalLoadW = Math.max(0, c.hotelPowerW + c.payloadPowerW),
    powerMarginW = solarPowerW - totalLoadW,
    batteryHours = totalLoadW > 0 ? (Math.max(0, c.batteryKWh) * 1000) / totalLoadW : Infinity;
  const wasteHeatW = totalLoadW * 0.72 + Math.max(0, solarPowerW - totalLoadW) * 0.08,
    radiatorCapacityW =
      EMISSIVITY * SIGMA * Math.max(0, c.radiatorAreaM2) * Math.max(1, c.radiatorTempK) ** 4,
    thermalMarginW = radiatorCapacityW - wasteHeatW;
  const spacingKm = count > 1 ? (2 * Math.PI * Math.max(0.01, c.formationRadiusKm)) / count : Infinity,
    driftPerHourKm = Math.max(0, c.relativeDriftMS) * 3.6,
    collisionReserveHours = driftPerHourKm > 0 ? spacingKm / driftPerHourKm : Infinity;
  const linkMarginKm = c.linkRangeKm - spacingKm * (c.incident === "partition" ? 2.4 : 1),
    meshConnected = healthy > 1 && linkMarginKm >= 0 && c.incident !== "partition";
  const quorumRequired = Math.max(MISSION_META[c.mission].minimum, Math.floor(count / 2) + 1),
    quorumMargin = healthy - quorumRequired;
  const requiredAutonomy = clamp(
      35 + 18 * Math.log10(1 + Math.max(0, c.oneWayDelayS)) + (c.incident !== "none" ? 8 : 0),
      0,
      100,
    ),
    autonomyMargin = c.autonomyPercent - requiredAutonomy;
  const productiveFraction =
    (healthy / count) *
    (meshConnected ? 1 : 0.55) *
    (powerMarginW >= 0 ? 1 : 0.55) *
    (thermalMarginW >= 0 ? 1 : 0.5) *
    MISSION_META[c.mission].payloadFactor;
  const constraints = [
    ...(healthy < MISSION_META[c.mission].minimum
      ? [`Only ${healthy} healthy nodes; mission needs ${MISSION_META[c.mission].minimum}`]
      : []),
    ...(quorumMargin < 0 ? ["Distributed command quorum is unavailable"] : []),
    ...(!meshConnected ? ["Crosslink mesh is partitioned or outside range"] : []),
    ...(powerMarginW < 0 ? [`Power deficit ${Math.abs(powerMarginW).toFixed(0)} W per node`] : []),
    ...(thermalMarginW < 0
      ? [`Heat rejection deficit ${Math.abs(thermalMarginW).toFixed(0)} W per node`]
      : []),
    ...(batteryHours < 2 ? ["Stored energy cannot sustain a two-hour safe hold"] : []),
    ...(collisionReserveHours < 6 || c.incident === "nav-drift"
      ? ["Relative-navigation drift violates the six-hour separation reserve"]
      : []),
    ...(autonomyMargin < 0 ? ["Light-time and incident load exceed onboard autonomy policy"] : []),
    ...(c.incident === "power-loss" ? ["One generation string is unavailable; payload is load-shed"] : []),
  ];
  const hard =
    healthy < MISSION_META[c.mission].minimum ||
    quorumMargin < 0 ||
    thermalMarginW < 0 ||
    collisionReserveHours < 1 ||
    batteryHours < 0.5;
  const readiness: CorvusReadiness = hard ? "NO-GO" : constraints.length ? "CONDITIONAL" : "GO";
  const safeMode =
    c.incident === "partition"
      ? "LOCAL QUORUM"
      : c.incident === "nav-drift"
        ? "FORMATION FREEZE"
        : c.incident === "power-loss"
          ? "NODE HIBERNATE"
          : readiness === "GO"
            ? "MISSION EXECUTION"
            : "MISSION HOLD";
  return {
    count,
    failed,
    healthy,
    wetMassKg,
    deltaVMS,
    accelerationMS2,
    propellantFlowKgS,
    burnHours,
    solarPowerW,
    totalLoadW,
    powerMarginW,
    batteryHours,
    wasteHeatW,
    radiatorCapacityW,
    thermalMarginW,
    spacingKm,
    driftPerHourKm,
    collisionReserveHours,
    linkMarginKm,
    meshConnected,
    quorumRequired,
    quorumMargin,
    requiredAutonomy,
    autonomyMargin,
    productiveFraction,
    readiness,
    safeMode,
    constraints,
  };
}
