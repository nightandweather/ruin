export type SatelliteMode = "nominal" | "curtailed" | "isolated" | "thermal" | "offline";

export type ScenarioType =
  | "communications-blackout"
  | "thermal-wave"
  | "cascade-failure"
  | "demand-spike"
  | "debris-corridor";

export interface SimulationConfig {
  satelliteCount: number;
  seed: number;
  tickSeconds: number;
  orbitRadiusAu: number;
  orbitBands: number;
  collectorAreaM2: number;
  conversionEfficiency: number;
  radiatorAreaM2: number;
  radiatorEmissivity: number;
  thermalLimitK: number;
  shutdownTemperatureK: number;
  baselineDemandFraction: number;
}

export interface Satellite {
  id: number;
  band: number;
  phase: number;
  health: number;
  linkQuality: number;
  temperatureK: number;
  capacityMW: number;
  deliveredMW: number;
  mode: SatelliteMode;
  affectedUntilTick: number;
}

export interface SwarmMetrics {
  potentialGW: number;
  deliveredGW: number;
  demandGW: number;
  curtailedGW: number;
  availabilityPercent: number;
  averageTemperatureK: number;
  offlineCount: number;
  isolatedCount: number;
  thermalCount: number;
  safetyTrips: number;
  avoidanceManeuvers: number;
  confirmedImpacts: number;
}

export interface SimulationEvent {
  id: number;
  tick: number;
  level: "info" | "warning" | "critical" | "recovery";
  source: string;
  message: string;
}

export interface LogisticsState {
  factoryBacklog: number;
  groundInventory: number;
  totalManufactured: number;
  elevatorCargo: number;
  elevatorStatus: "standby" | "ascending";
  elevatorProgressPercent: number;
  orbitalInventory: number;
  replacementsInstalled: number;
}

export interface ChartPoint {
  tick: number;
  deliveredGW: number;
  demandGW: number;
  availabilityPercent: number;
}

export interface SimulationSnapshot {
  tick: number;
  elapsedSeconds: number;
  metrics: SwarmMetrics;
  satellites: readonly Satellite[];
  events: readonly SimulationEvent[];
  history: readonly ChartPoint[];
  logistics: LogisticsState;
  activeScenarios: readonly {
    type: ScenarioType;
    endsAtTick: number;
    bearingDeg?: number;
    affectedCount: number;
  }[];
}
