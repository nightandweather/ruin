export type SuitMission = "orbital-service" | "lunar-mining" | "mars-field" | "rescue";
export type SuitIncident = "puncture" | "coolant-loss" | "comms-loss" | "dust-seal";

export interface AegisConfig {
  mission: SuitMission;
  pressureKpa: number;
  enduranceHours: number;
  protectionLayers: number;
  mobilityBearings: number;
  coolingCapacityW: number;
  dustMitigation: number;
  emergencyOxygenMinutes: number;
}

export interface AegisSnapshot {
  tick: number;
  mode: "nominal" | "limited" | "return" | "critical";
  massKg: number;
  localWeightKg: number;
  mobilityScore: number;
  evaMinutes: number;
  metabolicLoadW: number;
  thermalMarginW: number;
  sealIntegrity: number;
  dustRisk: number;
  pressureKpa: number;
  emergencyMinutesRemaining: number;
  readiness: "READY" | "CONDITIONAL" | "NO-GO";
  activeIncidents: readonly SuitIncident[];
  events: readonly { id: number; tick: number; level: "info" | "warning" | "critical" | "recovery"; message: string }[];
}

export const DEFAULT_AEGIS_CONFIG: AegisConfig = {
  mission: "lunar-mining",
  pressureKpa: 29.7,
  enduranceHours: 8,
  protectionLayers: 6,
  mobilityBearings: 12,
  coolingCapacityW: 650,
  dustMitigation: 82,
  emergencyOxygenMinutes: 60,
};

const missions: Record<SuitMission, { gravity: number; baseMass: number; workload: number; dust: number; thermal: number }> = {
  "orbital-service": { gravity: 0, baseMass: 72, workload: 370, dust: 0, thermal: 420 },
  "lunar-mining": { gravity: 0.166, baseMass: 76, workload: 470, dust: 1, thermal: 500 },
  "mars-field": { gravity: 0.38, baseMass: 61, workload: 520, dust: 0.72, thermal: 390 },
  rescue: { gravity: 0, baseMass: 54, workload: 560, dust: 0.1, thermal: 520 },
};

export class AegisSimulation {
  private config: AegisConfig;
  private tick = 0;
  private eventId = 0;
  private emergencyUsed = 0;
  private sealIntegrity = 100;
  private readonly incidents = new Set<SuitIncident>();
  private readonly events: AegisSnapshot["events"][number][] = [];

  constructor(config: AegisConfig = DEFAULT_AEGIS_CONFIG) {
    this.config = { ...config };
    this.record("info", "AEGIS pressure garment and PLSS passed pre-breathe interface checks");
  }

  updateConfig(config: AegisConfig) { this.config = { ...config }; return this.snapshot(); }

  inject(type: SuitIncident) {
    if (this.incidents.has(type)) return this.snapshot();
    this.incidents.add(type);
    const messages: Record<SuitIncident, string> = {
      puncture: "Pressure decay detected; secondary oxygen and return route engaged",
      "coolant-loss": "Primary water-loop pump unavailable; metabolic ceiling reduced",
      "comms-loss": "Relay link lost; breadcrumb navigation and autonomous return active",
      "dust-seal": "Abrasive particulate detected across hip bearing seal",
    };
    this.record(type === "puncture" ? "critical" : "warning", messages[type]);
    return this.snapshot();
  }

  resolve(type: SuitIncident) {
    if (!this.incidents.delete(type)) return this.snapshot();
    if (type === "puncture") this.emergencyUsed = 0;
    this.record("recovery", `${type} isolated; suit verification checklist complete`);
    return this.snapshot();
  }

  step(ticks = 1) {
    for (let i = 0; i < ticks; i++) {
      this.tick++;
      if (this.incidents.has("puncture")) this.emergencyUsed += 5;
      if (this.incidents.has("dust-seal")) this.sealIntegrity = Math.max(0, this.sealIntegrity - (1.6 - this.config.dustMitigation / 100));
    }
    return this.snapshot();
  }

  snapshot(): AegisSnapshot {
    const c = this.config;
    const mission = missions[c.mission];
    const mass = mission.baseMass + 48 + c.enduranceHours * 4 + c.protectionLayers * 2.25 + c.mobilityBearings * 0.7 + c.dustMitigation * mission.dust * 0.09 + c.emergencyOxygenMinutes * 0.07;
    const localWeight = mass * mission.gravity;
    const pressurePenalty = Math.max(0, c.pressureKpa - 25) * 0.95;
    const gravityPenalty = localWeight * 0.32;
    const mobility = Math.max(0, Math.min(100, 64 + c.mobilityBearings * 2.4 - c.protectionLayers * 1.7 - pressurePenalty - gravityPenalty - (this.incidents.has("dust-seal") ? 18 : 0)));
    const metabolic = mission.workload * (1 + (100 - mobility) / 190);
    const cooling = this.incidents.has("coolant-loss") ? c.coolingCapacityW * 0.38 : c.coolingCapacityW;
    const thermalMargin = cooling - Math.max(mission.thermal, metabolic);
    const nominalMinutes = c.enduranceHours * 60;
    const thermalFactor = thermalMargin >= 0 ? 1 : Math.max(0.18, 1 + thermalMargin / 700);
    const emergencyRemaining = Math.max(0, c.emergencyOxygenMinutes - this.emergencyUsed);
    const evaMinutes = this.incidents.has("puncture") ? Math.min(nominalMinutes, emergencyRemaining) : nominalMinutes * thermalFactor;
    const dustRisk = Math.max(0, Math.min(100, mission.dust * (100 - c.dustMitigation) + (100 - this.sealIntegrity) * 1.2));
    const pressure = this.incidents.has("puncture") ? Math.max(0, c.pressureKpa - this.emergencyUsed * 0.06) : c.pressureKpa;
    let readiness: AegisSnapshot["readiness"] = "READY";
    if (pressure < 25 || thermalMargin < -180 || mobility < 35 || this.sealIntegrity < 55) readiness = "NO-GO";
    else if (thermalMargin < 0 || mobility < 55 || dustRisk > 28 || (c.mission === "mars-field" && mass > 150)) readiness = "CONDITIONAL";
    let mode: AegisSnapshot["mode"] = readiness === "NO-GO" ? "critical" : readiness === "CONDITIONAL" ? "limited" : "nominal";
    if (this.incidents.has("puncture") || this.incidents.has("comms-loss")) mode = emergencyRemaining > 0 ? "return" : "critical";
    return {
      tick: this.tick, mode, massKg: +mass.toFixed(1), localWeightKg: +localWeight.toFixed(1), mobilityScore: +mobility.toFixed(0),
      evaMinutes: +evaMinutes.toFixed(0), metabolicLoadW: +metabolic.toFixed(0), thermalMarginW: +thermalMargin.toFixed(0),
      sealIntegrity: +this.sealIntegrity.toFixed(0), dustRisk: +dustRisk.toFixed(0), pressureKpa: +pressure.toFixed(1),
      emergencyMinutesRemaining: emergencyRemaining, readiness, activeIncidents: [...this.incidents], events: this.events.map(e => ({ ...e })),
    };
  }

  private record(level: AegisSnapshot["events"][number]["level"], message: string) {
    this.events.unshift({ id: ++this.eventId, tick: this.tick, level, message });
    if (this.events.length > 32) this.events.length = 32;
  }
}
