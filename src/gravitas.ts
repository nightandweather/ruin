export type GravityArchitecture = "ring" | "tether" | "short-arm" | "field-core";
export type GravitasIncident =
  "mass-imbalance" | "bearing-loss" | "pressure-sector" | "spin-drive" | "vestibular-event";

export interface GravitasConfig {
  architecture: GravityArchitecture;
  radiusM: number;
  targetG: number;
  rotatingMassTonnes: number;
  crew: number;
  deckHeightM: number;
  radialWalkingSpeedMS: number;
  spinupHours: number;
  counterRotationPercent: number;
}

export interface GravitasSnapshot {
  tick: number;
  mode: "nominal" | "limited" | "isolate" | "despin" | "unsupported";
  feasibility: "PHYSICAL" | "EXTRAPOLATED" | "UNSUPPORTED";
  rpm: number | null;
  angularVelocityRadS: number | null;
  rimSpeedMS: number | null;
  footG: number | null;
  headG: number | null;
  gravityGradientPercent: number | null;
  coriolisG: number | null;
  spinEnergyGJ: number | null;
  spinupPowerMW: number | null;
  effectiveStressMPa: number | null;
  residualAngularMomentumMNs: number | null;
  comfort: "GOOD" | "ADAPTATION" | "HIGH-RISK" | "UNKNOWN";
  readiness: "READY" | "CONDITIONAL" | "NO-GO";
  activeIncidents: readonly GravitasIncident[];
  events: readonly {
    id: number;
    tick: number;
    level: "info" | "warning" | "critical" | "recovery";
    message: string;
  }[];
}

export const DEFAULT_GRAVITAS_CONFIG: GravitasConfig = {
  architecture: "ring",
  radiusM: 120,
  targetG: 0.38,
  rotatingMassTonnes: 2_800,
  crew: 96,
  deckHeightM: 1.75,
  radialWalkingSpeedMS: 1.2,
  spinupHours: 24,
  counterRotationPercent: 95,
};

export const ARCHITECTURE_PRESETS: Record<GravityArchitecture, Partial<GravitasConfig>> = {
  ring: {
    radiusM: 120,
    targetG: 0.38,
    rotatingMassTonnes: 2_800,
    crew: 96,
    spinupHours: 24,
    counterRotationPercent: 95,
  },
  tether: {
    radiusM: 350,
    targetG: 0.38,
    rotatingMassTonnes: 620,
    crew: 24,
    spinupHours: 18,
    counterRotationPercent: 0,
  },
  "short-arm": {
    radiusM: 8,
    targetG: 1,
    rotatingMassTonnes: 42,
    crew: 4,
    spinupHours: 0.5,
    counterRotationPercent: 100,
  },
  "field-core": {
    radiusM: 12,
    targetG: 1,
    rotatingMassTonnes: 80,
    crew: 12,
    spinupHours: 1,
    counterRotationPercent: 100,
  },
};

const G0 = 9.80665;

export class GravitasSimulation {
  private config: GravitasConfig;
  private tick = 0;
  private eventId = 0;
  private readonly incidents = new Set<GravitasIncident>();
  private readonly events: GravitasSnapshot["events"][number][] = [];

  constructor(config: GravitasConfig = DEFAULT_GRAVITAS_CONFIG) {
    this.config = { ...config };
    this.record("info", "GRAVITAS spin envelope loaded; non-rotating dock remains inertially isolated");
  }

  updateConfig(config: GravitasConfig) {
    this.config = { ...config };
    return this.snapshot();
  }

  inject(type: GravitasIncident) {
    if (this.incidents.has(type)) return this.snapshot();
    this.incidents.add(type);
    const messages: Record<GravitasIncident, string> = {
      "mass-imbalance": "Cargo distribution exceeded balance envelope; controlled despin requested",
      "bearing-loss": "Rotary interface bearing channel unavailable; axial traffic suspended",
      "pressure-sector": "Pressure decay detected in one rim sector; pressure doors isolated",
      "spin-drive": "Spin-drive torque unavailable; habitat coasting at conserved angular momentum",
      "vestibular-event": "Crew motion-sickness cluster reported; radial traffic and head motion restricted",
    };
    this.record(
      type === "mass-imbalance" || type === "pressure-sector" ? "critical" : "warning",
      messages[type],
    );
    return this.snapshot();
  }

  resolve(type: GravitasIncident) {
    if (!this.incidents.delete(type)) return this.snapshot();
    this.record("recovery", `${type} cleared after balance, structure, and crew verification`);
    return this.snapshot();
  }

  step(ticks = 1) {
    this.tick += ticks;
    return this.snapshot();
  }

  snapshot(): GravitasSnapshot {
    const c = this.config;
    if (c.architecture === "field-core")
      return {
        tick: this.tick,
        mode: "unsupported",
        feasibility: "UNSUPPORTED",
        rpm: null,
        angularVelocityRadS: null,
        rimSpeedMS: null,
        footG: null,
        headG: null,
        gravityGradientPercent: null,
        coriolisG: null,
        spinEnergyGJ: null,
        spinupPowerMW: null,
        effectiveStressMPa: null,
        residualAngularMomentumMNs: null,
        comfort: "UNKNOWN",
        readiness: "NO-GO",
        activeIncidents: [...this.incidents],
        events: this.events.map((e) => ({ ...e })),
      };
    const radius = Math.max(0.5, c.radiusM);
    const omega = Math.sqrt((c.targetG * G0) / radius);
    const rpm = (omega * 60) / (2 * Math.PI);
    const rimSpeed = omega * radius;
    const headRadius = Math.max(0.1, radius - c.deckHeightM);
    const headG = (omega * omega * headRadius) / G0;
    const gradient = ((c.targetG - headG) / Math.max(0.001, c.targetG)) * 100;
    const coriolisG = (2 * omega * c.radialWalkingSpeedMS) / G0;
    const massKg = c.rotatingMassTonnes * 1000;
    const inertia = massKg * radius * radius;
    const energyJ = 0.5 * inertia * omega * omega;
    const spinPowerW = energyJ / Math.max(60, c.spinupHours * 3600);
    const materialDensity = c.architecture === "tether" ? 1_800 : 1_600;
    const architectureFactor = c.architecture === "tether" ? 2.8 : c.architecture === "short-arm" ? 4.2 : 7.5;
    const stressMPa = (materialDensity * rimSpeed * rimSpeed * architectureFactor) / 1e6;
    const residualMomentum = (inertia * omega * (1 - c.counterRotationPercent / 100)) / 1e6;
    let comfort: GravitasSnapshot["comfort"] =
      rpm <= 2 && gradient <= 5 && coriolisG <= 0.03
        ? "GOOD"
        : rpm <= 4 && gradient <= 15 && coriolisG <= 0.08
          ? "ADAPTATION"
          : "HIGH-RISK";
    if (this.incidents.has("vestibular-event")) comfort = "HIGH-RISK";
    let readiness: GravitasSnapshot["readiness"] =
      comfort === "GOOD" && stressMPa < 120 && residualMomentum < 4_000 ? "READY" : "CONDITIONAL";
    if (stressMPa > 240 || c.targetG <= 0 || c.targetG > 1.5 || this.incidents.has("mass-imbalance"))
      readiness = "NO-GO";
    let mode: GravitasSnapshot["mode"] = readiness === "READY" ? "nominal" : "limited";
    if (this.incidents.has("mass-imbalance")) mode = "despin";
    else if (this.incidents.has("pressure-sector") || this.incidents.has("bearing-loss")) mode = "isolate";
    return {
      tick: this.tick,
      mode,
      feasibility: c.architecture === "short-arm" ? "PHYSICAL" : "EXTRAPOLATED",
      rpm: +rpm.toFixed(2),
      angularVelocityRadS: +omega.toFixed(3),
      rimSpeedMS: +rimSpeed.toFixed(1),
      footG: +c.targetG.toFixed(2),
      headG: +headG.toFixed(2),
      gravityGradientPercent: +gradient.toFixed(1),
      coriolisG: +coriolisG.toFixed(3),
      spinEnergyGJ: +(energyJ / 1e9).toFixed(1),
      spinupPowerMW: +(spinPowerW / 1e6).toFixed(2),
      effectiveStressMPa: +stressMPa.toFixed(1),
      residualAngularMomentumMNs: +residualMomentum.toFixed(0),
      comfort,
      readiness,
      activeIncidents: [...this.incidents],
      events: this.events.map((e) => ({ ...e })),
    };
  }

  private record(level: GravitasSnapshot["events"][number]["level"], message: string) {
    this.events.unshift({ id: ++this.eventId, tick: this.tick, level, message });
    if (this.events.length > 36) this.events.length = 36;
  }
}
