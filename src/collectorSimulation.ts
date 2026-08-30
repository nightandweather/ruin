import { evaluateCollectorDesign, safeDeploymentFraction, type CollectorDesign, type CollectorPerformance } from "./collectorDesign";
import { DeterministicRandom } from "./prng";

export type CollectorIncident = "solar-flare" | "debris-corridor" | "communications-loss" | "transmitter-fault";

export interface CollectorEvent { id: number; tick: number; level: "info" | "warning" | "critical" | "recovery"; message: string; }
export interface CollectorSnapshot {
  tick: number;
  mode: "harvest" | "thermal-curtail" | "evasive" | "isolated" | "service";
  performance: CollectorPerformance;
  deploymentPercent: number;
  busHealthPercent: number;
  arrayHealthPercent: number;
  radiatorHealthPercent: number;
  propellantRemainingKg: number;
  maintenanceKits: number;
  activeIncidents: readonly { type: CollectorIncident; endsAt: number }[];
  events: readonly CollectorEvent[];
}

export class CollectorSimulation {
  private readonly random: DeterministicRandom;
  private design: CollectorDesign;
  private tick = 0;
  private eventId = 0;
  private busHealth = 1;
  private arrayHealth = 1;
  private radiatorHealth = 1;
  private propellantRemainingKg: number;
  private maintenanceKits = 2;
  private readonly incidents: { type: CollectorIncident; endsAt: number }[] = [];
  private readonly events: CollectorEvent[] = [];

  constructor(design: CollectorDesign, seed = 3101) {
    this.random = new DeterministicRandom(seed);
    this.design = { ...design };
    this.propellantRemainingKg = design.propellantKg;
    this.record("info", "C-01 digital twin commissioned; two service robots online");
  }

  updateDesign(design: CollectorDesign): CollectorSnapshot {
    const propellantDelta = design.propellantKg - this.design.propellantKg;
    this.design = { ...design };
    this.propellantRemainingKg = Math.max(0, this.propellantRemainingKg + propellantDelta);
    return this.snapshot();
  }

  inject(type: CollectorIncident): CollectorSnapshot {
    if (this.incidents.some((incident) => incident.type === type)) return this.snapshot();
    const duration: Record<CollectorIncident, number> = {
      "solar-flare": 20, "debris-corridor": 12, "communications-loss": 28, "transmitter-fault": 18,
    };
    const messages: Record<CollectorIncident, string> = {
      "solar-flare": "Flux surge detected; array articulation handed to thermal controller",
      "debris-corridor": "Inbound debris corridor; transmitter inhibited and avoidance burn authorized",
      "communications-loss": "Relay quorum lost; power beam disabled under local fail-closed policy",
      "transmitter-fault": "Beam steering mismatch; transmitter isolated for robotic inspection",
    };
    this.incidents.push({ type, endsAt: this.tick + duration[type] });
    this.record(type === "solar-flare" || type === "debris-corridor" ? "critical" : "warning", messages[type]);
    return this.snapshot();
  }

  step(ticks = 1): CollectorSnapshot {
    for (let index = 0; index < ticks; index += 1) {
      this.tick += 1;
      for (let incidentIndex = this.incidents.length - 1; incidentIndex >= 0; incidentIndex -= 1) {
        if (this.incidents[incidentIndex].endsAt <= this.tick) {
          const [resolved] = this.incidents.splice(incidentIndex, 1);
          this.record("recovery", `${resolved.type} recovery checklist completed`);
        }
      }
      if (this.has("debris-corridor")) {
        this.propellantRemainingKg = Math.max(0, this.propellantRemainingKg - 0.9);
        if (this.random.chance(0.08)) this.arrayHealth = Math.max(0.5, this.arrayHealth - this.random.range(0.002, 0.008));
      }
      if (this.has("solar-flare")) this.arrayHealth = Math.max(0.5, this.arrayHealth - 0.0007);
      this.radiatorHealth = Math.max(0.6, this.radiatorHealth - 0.000025);
      if (this.tick % 72 === 0 && this.maintenanceKits > 0 && (this.arrayHealth < 0.97 || this.radiatorHealth < 0.97)) {
        this.maintenanceKits -= 1;
        this.arrayHealth = Math.min(1, this.arrayHealth + 0.025);
        this.radiatorHealth = Math.min(1, this.radiatorHealth + 0.025);
        this.record("recovery", "Service robots installed one FOUNDRY maintenance kit");
      }
    }
    return this.snapshot();
  }

  snapshot(): CollectorSnapshot {
    const fluxMultiplier = this.has("solar-flare") ? 1.55 : 1;
    const thermalDeployment = safeDeploymentFraction({ ...this.design, radiatorAreaM2: this.design.radiatorAreaM2 * this.radiatorHealth }, fluxMultiplier);
    const deployment = Math.min(thermalDeployment, this.has("debris-corridor") ? 0.28 : 1) * this.arrayHealth;
    let mode: CollectorSnapshot["mode"] = "harvest";
    if (this.has("debris-corridor")) mode = "evasive";
    else if (this.has("communications-loss")) mode = "isolated";
    else if (this.has("transmitter-fault")) mode = "service";
    else if (deployment < 0.99) mode = "thermal-curtail";
    const performance = evaluateCollectorDesign({ ...this.design, radiatorAreaM2: this.design.radiatorAreaM2 * this.radiatorHealth }, fluxMultiplier, deployment);
    const installedHardware = evaluateCollectorDesign(this.design, fluxMultiplier, deployment);
    performance.totalMassKg = installedHardware.totalMassKg;
    performance.structuralMetalKg = installedHardware.structuralMetalKg;
    performance.traceMetalKg = installedHardware.traceMetalKg;
    performance.foundryShifts = installedHardware.foundryShifts;
    performance.powerToMassWkg = Number((performance.deliveredPowerMW * 1e6 / installedHardware.totalMassKg).toFixed(1));
    if (mode === "isolated" || mode === "service" || mode === "evasive") performance.deliveredPowerMW = 0;
    return {
      tick: this.tick, mode, performance, deploymentPercent: Number((deployment * 100).toFixed(1)),
      busHealthPercent: Number((this.busHealth * 100).toFixed(1)), arrayHealthPercent: Number((this.arrayHealth * 100).toFixed(1)),
      radiatorHealthPercent: Number((this.radiatorHealth * 100).toFixed(1)), propellantRemainingKg: Number(this.propellantRemainingKg.toFixed(1)),
      maintenanceKits: this.maintenanceKits, activeIncidents: this.incidents.map((incident) => ({ ...incident })),
      events: this.events.map((event) => ({ ...event })),
    };
  }

  private has(type: CollectorIncident): boolean { return this.incidents.some((incident) => incident.type === type); }
  private record(level: CollectorEvent["level"], message: string): void {
    this.events.unshift({ id: ++this.eventId, tick: this.tick, level, message });
    if (this.events.length > 40) this.events.length = 40;
  }
}
