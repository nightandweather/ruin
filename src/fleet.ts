import { DeterministicRandom } from "./prng";

export type FleetIncident = "debris-strike" | "radiator-fault" | "comms-blackout" | "unknown-contact";
export type FleetPosture = "transit" | "screen" | "rescue" | "hold";

export interface FleetSnapshot {
  tick: number;
  posture: FleetPosture;
  convoyIntegrity: number;
  escortIntegrity: number;
  thermalReserve: number;
  propellantReserve: number;
  communicationDelayMinutes: number;
  civilianRisk: number;
  activeIncidents: readonly { type: FleetIncident; endsAt: number }[];
  log: readonly string[];
}

/** Fictional fleet-survival model: logistics and protection only; no weapon design or firing model. */
export class FleetOperationsSimulation {
  private readonly random: DeterministicRandom;
  private tick = 0;
  private convoyIntegrity = 100;
  private escortIntegrity = 100;
  private thermalReserve = 100;
  private propellantReserve = 100;
  private communicationDelayMinutes = 8;
  private posture: FleetPosture = "transit";
  private readonly incidents: { type: FleetIncident; endsAt: number }[] = [];
  private readonly log: string[] = ["Fleet formed around civilian and industrial convoy"];

  constructor(seed = 2057) { this.random = new DeterministicRandom(seed); }

  inject(type: FleetIncident): FleetSnapshot {
    if (!this.incidents.some((incident) => incident.type === type)) {
      const duration: Record<FleetIncident, number> = {
        "debris-strike": 10, "radiator-fault": 16, "comms-blackout": 24, "unknown-contact": 12,
      };
      this.incidents.push({ type, endsAt: this.tick + duration[type] });
      this.log.unshift(`INCIDENT: ${type}`);
    }
    return this.snapshot();
  }

  step(ticks = 1): FleetSnapshot {
    for (let index = 0; index < ticks; index += 1) {
      this.tick += 1;
      this.incidents.splice(0, this.incidents.length, ...this.incidents.filter((item) => item.endsAt > this.tick));
      const has = (type: FleetIncident) => this.incidents.some((incident) => incident.type === type);
      this.posture = has("debris-strike") || this.convoyIntegrity < 75 ? "rescue" : has("unknown-contact") ? "screen" : has("comms-blackout") ? "hold" : "transit";
      if (has("debris-strike")) {
        this.escortIntegrity -= this.random.range(0.15, 0.4);
        this.convoyIntegrity -= this.posture === "rescue" ? this.random.range(0.02, 0.1) : this.random.range(0.3, 0.8);
        this.propellantReserve -= 0.35;
      }
      this.communicationDelayMinutes = has("comms-blackout") ? 999 : 8;
      this.thermalReserve -= has("radiator-fault") ? 0.8 : -0.12;
      this.propellantReserve -= this.posture === "transit" ? 0.04 : 0.12;
      this.convoyIntegrity = Math.max(0, this.convoyIntegrity);
      this.escortIntegrity = Math.max(0, this.escortIntegrity);
      this.thermalReserve = Math.max(0, Math.min(100, this.thermalReserve));
      this.propellantReserve = Math.max(0, this.propellantReserve);
    }
    return this.snapshot();
  }

  snapshot(): FleetSnapshot {
    const incidentRisk = this.incidents.reduce((risk, incident) => risk + (incident.type === "debris-strike" ? 22 : incident.type === "radiator-fault" ? 12 : 7), 0);
    return {
      tick: this.tick, posture: this.posture,
      convoyIntegrity: Number(this.convoyIntegrity.toFixed(1)), escortIntegrity: Number(this.escortIntegrity.toFixed(1)),
      thermalReserve: Number(this.thermalReserve.toFixed(1)), propellantReserve: Number(this.propellantReserve.toFixed(1)),
      communicationDelayMinutes: this.communicationDelayMinutes,
      civilianRisk: Math.min(100, Number((100 - this.convoyIntegrity + incidentRisk).toFixed(1))),
      activeIncidents: this.incidents.map((incident) => ({ ...incident })), log: [...this.log],
    };
  }
}
