export type MenderFrame = "free-flyer" | "rail-walker" | "lunar-crawler" | "micro-swarm";
export type RepairTask = "collector-tile" | "radiator-patch" | "fluid-valve" | "machine-bearing";
export interface MenderConfig {
  frame: MenderFrame;
  task: RepairTask;
  chassisKg: number;
  armCount: number;
  armReachM: number;
  dofPerArm: number;
  payloadKg: number;
  gripForceN: number;
  batteryKWh: number;
  activePowerKW: number;
  solarAreaM2: number;
  radiatorAreaM2: number;
  radiatorTempK: number;
  propellantKg: number;
  toolCount: number;
  autonomyPercent: number;
  signalDelayS: number;
}
export interface TaskContract {
  name: string;
  forceN: number;
  reachM: number;
  componentKg: number;
  tools: number;
  hours: number;
  precisionMm: number;
}
export const TASKS: Record<RepairTask, TaskContract> = {
  "collector-tile": {
    name: "COLLECTOR TILE SWAP",
    forceN: 120,
    reachM: 2.4,
    componentKg: 38,
    tools: 3,
    hours: 2.5,
    precisionMm: 1.5,
  },
  "radiator-patch": {
    name: "RADIATOR LOOP PATCH",
    forceN: 70,
    reachM: 3.2,
    componentKg: 16,
    tools: 4,
    hours: 4.5,
    precisionMm: 0.5,
  },
  "fluid-valve": {
    name: "CRYOGENIC VALVE SERVICE",
    forceN: 260,
    reachM: 1.8,
    componentKg: 52,
    tools: 5,
    hours: 6,
    precisionMm: 0.25,
  },
  "machine-bearing": {
    name: "FACTORY BEARING CHANGE",
    forceN: 900,
    reachM: 1.4,
    componentKg: 180,
    tools: 4,
    hours: 8,
    precisionMm: 0.2,
  },
};
export const MENDER_PRESETS: Record<MenderFrame, Omit<MenderConfig, "frame" | "task" | "signalDelayS">> = {
  "free-flyer": {
    chassisKg: 240,
    armCount: 2,
    armReachM: 2.8,
    dofPerArm: 7,
    payloadKg: 65,
    gripForceN: 850,
    batteryKWh: 18,
    activePowerKW: 3.2,
    solarAreaM2: 7,
    radiatorAreaM2: 9,
    radiatorTempK: 340,
    propellantKg: 28,
    toolCount: 6,
    autonomyPercent: 75,
  },
  "rail-walker": {
    chassisKg: 310,
    armCount: 3,
    armReachM: 3.6,
    dofPerArm: 7,
    payloadKg: 110,
    gripForceN: 1600,
    batteryKWh: 24,
    activePowerKW: 4.4,
    solarAreaM2: 5,
    radiatorAreaM2: 14,
    radiatorTempK: 350,
    propellantKg: 4,
    toolCount: 8,
    autonomyPercent: 82,
  },
  "lunar-crawler": {
    chassisKg: 680,
    armCount: 2,
    armReachM: 2.2,
    dofPerArm: 7,
    payloadKg: 260,
    gripForceN: 2800,
    batteryKWh: 72,
    activePowerKW: 8.5,
    solarAreaM2: 18,
    radiatorAreaM2: 20,
    radiatorTempK: 365,
    propellantKg: 0,
    toolCount: 10,
    autonomyPercent: 70,
  },
  "micro-swarm": {
    chassisKg: 42,
    armCount: 2,
    armReachM: 0.8,
    dofPerArm: 6,
    payloadKg: 8,
    gripForceN: 180,
    batteryKWh: 3.5,
    activePowerKW: 0.65,
    solarAreaM2: 1.5,
    radiatorAreaM2: 2,
    radiatorTempK: 330,
    propellantKg: 3,
    toolCount: 3,
    autonomyPercent: 92,
  },
};
const G0 = 9.80665,
  SIGMA = 5.670374419e-8;
export function menderConfig(
  frame: MenderFrame = "free-flyer",
  task: RepairTask = "collector-tile",
  signalDelayS = 2,
): MenderConfig {
  return { frame, task, signalDelayS, ...MENDER_PRESETS[frame] };
}
export function evaluateMender(c: MenderConfig) {
  const task = TASKS[c.task],
    totalMassKg = c.chassisKg + c.payloadKg + c.propellantKg + c.toolCount * 3.5;
  const operationMomentNm = task.forceN * task.reachM;
  const anchorFactor =
    c.frame === "rail-walker"
      ? 2.4
      : c.frame === "lunar-crawler"
        ? 2
        : c.frame === "micro-swarm"
          ? 1.15
          : 0.75;
  const anchorMomentNm =
    c.gripForceN * Math.max(0.4, c.armReachM * 0.45) * Math.max(1, c.armCount - 1) * anchorFactor;
  const stabilityMargin = anchorMomentNm / operationMomentNm;
  const manipulationMarginKg = c.payloadKg - task.componentKg;
  const reachMarginM = c.armReachM - task.reachM;
  const taskEnergyKWh = c.activePowerKW * task.hours;
  const enduranceHours = c.batteryKWh / c.activePowerKW;
  const solarKW = c.solarAreaM2 * 1.361 * 0.28;
  const rechargeHours = solarKW > 0 ? taskEnergyKWh / solarKW : null;
  const wasteHeatKW = c.activePowerKW * 0.68;
  const radiatorCapacityKW = (0.88 * SIGMA * c.radiatorAreaM2 * Math.pow(c.radiatorTempK, 4)) / 1000;
  const thermalMarginKW = radiatorCapacityKW - wasteHeatKW;
  const deltaVMS =
    c.propellantKg > 0 && c.frame === "free-flyer"
      ? 220 * G0 * Math.log(totalMassKg / (totalMassKg - c.propellantKg))
      : 0;
  const requiredAutonomy = Math.min(100, 35 + 18 * Math.log10(1 + Math.max(0, c.signalDelayS)));
  const autonomyMargin = c.autonomyPercent - requiredAutonomy;
  const constraints = [
    ...(c.armCount < 2 ? ["Two-point contact cannot be maintained"] : []),
    ...(c.dofPerArm < 7 ? ["Dexterity below seven-DOF servicing baseline"] : []),
    ...(stabilityMargin < 1 ? ["Tool reaction exceeds anchored moment"] : []),
    ...(manipulationMarginKg < 0 ? ["Replacement component exceeds payload rating"] : []),
    ...(reachMarginM < 0 ? ["Arm cannot reach the work envelope"] : []),
    ...(c.toolCount < task.tools ? ["Tool magazine cannot complete the procedure"] : []),
    ...(enduranceHours < task.hours ? ["Battery cannot finish one repair cycle"] : []),
    ...(thermalMarginKW < 0 ? ["Radiator cannot reject active waste heat"] : []),
    ...(autonomyMargin < 0 ? ["Signal delay exceeds autonomy policy"] : []),
  ];
  const repairCyclesPerDay =
    (24 / (task.hours + Math.max(0, rechargeHours ?? 0))) * (constraints.length ? 0.35 : 1);
  return {
    task,
    totalMassKg,
    operationMomentNm,
    anchorMomentNm,
    stabilityMargin,
    manipulationMarginKg,
    reachMarginM,
    taskEnergyKWh,
    enduranceHours,
    solarKW,
    rechargeHours,
    wasteHeatKW,
    radiatorCapacityKW,
    thermalMarginKW,
    deltaVMS,
    requiredAutonomy,
    autonomyMargin,
    repairCyclesPerDay,
    readiness: constraints.some((x) => x.includes("exceeds") || x.includes("cannot"))
      ? "NO-GO"
      : constraints.length
        ? "CONDITIONAL"
        : "GO",
    constraints,
  };
}
