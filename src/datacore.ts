import { DeterministicRandom } from "./prng";

export type DatacoreIncident =
  "radiation-storm" | "coolant-loop-loss" | "optical-link-loss" | "collector-curtailment";
export type JobKind = "swarm-control" | "telescope-ingest" | "physics-ensemble" | "factory-twins";

export interface DatacoreConfig {
  gpuTiles: number;
  tileComputeTflops: number;
  tilePowerKw: number;
  radiatorAreaM2: number;
  sourceCollectors: number;
  verificationReplicas: 1 | 2 | 3;
  opticalLinkMbps: number;
}

export interface ComputeJob {
  id: number;
  kind: JobKind;
  label: string;
  remainingPetaOps: number;
  originalPetaOps: number;
  priority: number;
  status: "queued" | "running" | "blocked";
}

export interface DatacoreSnapshot {
  tick: number;
  mode: "compute" | "thermal-cap" | "radiation-scrub" | "link-isolated" | "power-cap";
  availableTiles: number;
  totalTiles: number;
  utilizationPercent: number;
  rawComputePflops: number;
  verifiedComputePflops: number;
  facilityPowerMW: number;
  availablePowerMW: number;
  radiatorTemperatureK: number;
  downlinkMbps: number;
  correctedErrors: number;
  rejectedResults: number;
  completedJobs: number;
  queue: readonly ComputeJob[];
  tileStates: readonly ("active" | "standby" | "scrub" | "offline")[];
  activeIncidents: readonly { type: DatacoreIncident; endsAt: number }[];
  events: readonly {
    id: number;
    tick: number;
    level: "info" | "warning" | "critical" | "recovery";
    message: string;
  }[];
}

export const DEFAULT_DATACORE_CONFIG: DatacoreConfig = {
  gpuTiles: 48,
  tileComputeTflops: 650,
  tilePowerKw: 18,
  radiatorAreaM2: 900,
  sourceCollectors: 1,
  verificationReplicas: 3,
  opticalLinkMbps: 1200,
};

const JOBS: Record<JobKind, { label: string; petaOps: number; priority: number }> = {
  "swarm-control": { label: "SWARM EPHEMERIS", petaOps: 180_000, priority: 4 },
  "telescope-ingest": { label: "DEEP FIELD INGEST", petaOps: 420_000, priority: 3 },
  "factory-twins": { label: "FOUNDRY DIGITAL TWINS", petaOps: 260_000, priority: 2 },
  "physics-ensemble": { label: "STELLAR PHYSICS ENSEMBLE", petaOps: 900_000, priority: 1 },
};

const SIGMA = 5.670374419e-8;
const EMISSIVITY = 0.9;
const MAX_COOLANT_K = 420;
const C01_DELIVERY_MW = 5.03;

export class OrbitalDatacoreSimulation {
  private readonly random: DeterministicRandom;
  private config: DatacoreConfig;
  private tick = 0;
  private eventId = 0;
  private jobId = 0;
  private correctedErrors = 0;
  private rejectedResults = 0;
  private completedJobs = 0;
  private queue: ComputeJob[] = [];
  private readonly incidents: { type: DatacoreIncident; endsAt: number }[] = [];
  private readonly events: DatacoreSnapshot["events"][number][] = [];
  private tileStates: DatacoreSnapshot["tileStates"][number][];

  constructor(config: DatacoreConfig = DEFAULT_DATACORE_CONFIG, seed = 4096) {
    this.config = { ...config };
    this.random = new DeterministicRandom(seed);
    this.tileStates = Array.from({ length: config.gpuTiles }, () => "active");
    this.record("info", "DATACORE synchronized with C-01 power and optical relay");
    this.submit("swarm-control");
    this.submit("telescope-ingest");
    this.submit("physics-ensemble");
  }

  updateConfig(config: DatacoreConfig): DatacoreSnapshot {
    const previousTiles = this.tileStates;
    this.config = { ...config, gpuTiles: Math.max(8, Math.min(256, Math.round(config.gpuTiles))) };
    this.tileStates = Array.from(
      { length: this.config.gpuTiles },
      (_, index) => previousTiles[index] ?? "active",
    );
    return this.snapshot();
  }

  submit(kind: JobKind): DatacoreSnapshot {
    const definition = JOBS[kind];
    this.queue.push({
      id: ++this.jobId,
      kind,
      label: definition.label,
      remainingPetaOps: definition.petaOps,
      originalPetaOps: definition.petaOps,
      priority: definition.priority,
      status: "queued",
    });
    this.record("info", `${definition.label} accepted into verified compute queue`);
    return this.snapshot();
  }

  inject(type: DatacoreIncident): DatacoreSnapshot {
    if (this.incidents.some((incident) => incident.type === type)) return this.snapshot();
    const duration: Record<DatacoreIncident, number> = {
      "radiation-storm": 24,
      "coolant-loop-loss": 18,
      "optical-link-loss": 22,
      "collector-curtailment": 20,
    };
    const message: Record<DatacoreIncident, string> = {
      "radiation-storm": "Particle flux elevated; checkpoint, scrub, and result quorum policy active",
      "coolant-loop-loss": "Coolant loop B isolated; scheduler enforcing radiator-safe power cap",
      "optical-link-loss": "Optical acquisition lost; ingress paused and results retained locally",
      "collector-curtailment": "C-01 power allocation reduced; low-priority tiles entering standby",
    };
    this.incidents.push({ type, endsAt: this.tick + duration[type] });
    this.record(
      type === "radiation-storm" || type === "coolant-loop-loss" ? "critical" : "warning",
      message[type],
    );
    return this.snapshot();
  }

  step(ticks = 1): DatacoreSnapshot {
    for (let step = 0; step < ticks; step += 1) {
      this.tick += 1;
      this.expireIncidents();
      const state = this.computeState();
      this.tileStates = state.tileStates;
      const running = [...this.queue].sort((left, right) => right.priority - left.priority)[0];
      for (const job of this.queue)
        job.status =
          job.id === running?.id
            ? "running"
            : this.has("optical-link-loss") && job.kind === "telescope-ingest"
              ? "blocked"
              : "queued";
      if (running && running.status === "running") {
        // One tick represents one minute; PFLOP/s × 60 = peta-operations per tick.
        running.remainingPetaOps = Math.max(0, running.remainingPetaOps - state.verifiedComputePflops * 60);
        if (running.remainingPetaOps === 0) {
          this.queue = this.queue.filter((job) => job.id !== running.id);
          this.completedJobs += 1;
          this.record("recovery", `${running.label} completed with verification quorum`);
        }
      }
      if (this.has("radiation-storm")) {
        const strikes = Math.floor(this.random.range(2, 9));
        this.correctedErrors += strikes;
        if (this.random.chance(0.22)) this.rejectedResults += 1;
      } else if (this.random.chance(0.035)) this.correctedErrors += 1;
    }
    return this.snapshot();
  }

  snapshot(): DatacoreSnapshot {
    const state = this.computeState();
    return {
      tick: this.tick,
      mode: state.mode,
      availableTiles: state.availableTiles,
      totalTiles: this.config.gpuTiles,
      utilizationPercent: state.utilizationPercent,
      rawComputePflops: state.rawComputePflops,
      verifiedComputePflops: state.verifiedComputePflops,
      facilityPowerMW: state.facilityPowerMW,
      availablePowerMW: state.availablePowerMW,
      radiatorTemperatureK: state.radiatorTemperatureK,
      downlinkMbps: this.has("optical-link-loss") ? 0 : this.config.opticalLinkMbps,
      correctedErrors: this.correctedErrors,
      rejectedResults: this.rejectedResults,
      completedJobs: this.completedJobs,
      queue: this.queue.map((job) => ({ ...job })),
      tileStates: [...state.tileStates],
      activeIncidents: this.incidents.map((incident) => ({ ...incident })),
      events: this.events.map((event) => ({ ...event })),
    };
  }

  private computeState() {
    const availablePowerMW =
      this.config.sourceCollectors * C01_DELIVERY_MW * (this.has("collector-curtailment") ? 0.32 : 1);
    const radiatorArea = this.config.radiatorAreaM2 * (this.has("coolant-loop-loss") ? 0.5 : 1);
    const maxThermalPowerMW = (EMISSIVITY * SIGMA * radiatorArea * MAX_COOLANT_K ** 4) / 1e6;
    const facilityPowerPerTileMW = (this.config.tilePowerKw * 1.24) / 1000;
    const tilesByPower = Math.floor(availablePowerMW / facilityPowerPerTileMW);
    const tilesByThermal = Math.floor(maxThermalPowerMW / facilityPowerPerTileMW);
    const scrubFraction = this.has("radiation-storm") ? 0.25 : 0;
    const tilesAfterScrub = Math.floor(this.config.gpuTiles * (1 - scrubFraction));
    const availableTiles = Math.max(
      0,
      Math.min(this.config.gpuTiles, tilesByPower, tilesByThermal, tilesAfterScrub),
    );
    const tileStates = Array.from(
      { length: this.config.gpuTiles },
      (_, index): DatacoreSnapshot["tileStates"][number] => {
        if (this.has("radiation-storm") && index >= tilesAfterScrub) return "scrub";
        return index < availableTiles ? "active" : "standby";
      },
    );
    const rawComputePflops = (availableTiles * this.config.tileComputeTflops) / 1000;
    const verifiedComputePflops = rawComputePflops / this.config.verificationReplicas;
    const facilityPowerMW = availableTiles * facilityPowerPerTileMW;
    const radiatorTemperatureK =
      facilityPowerMW <= 0
        ? 0
        : Math.pow((facilityPowerMW * 1e6) / (EMISSIVITY * SIGMA * radiatorArea), 0.25);
    let mode: DatacoreSnapshot["mode"] = "compute";
    if (this.has("radiation-storm")) mode = "radiation-scrub";
    else if (this.has("coolant-loop-loss") || tilesByThermal < this.config.gpuTiles) mode = "thermal-cap";
    else if (this.has("optical-link-loss")) mode = "link-isolated";
    else if (this.has("collector-curtailment") || tilesByPower < this.config.gpuTiles) mode = "power-cap";
    return {
      mode,
      availableTiles,
      tileStates,
      rawComputePflops: Number(rawComputePflops.toFixed(2)),
      verifiedComputePflops: Number(verifiedComputePflops.toFixed(2)),
      facilityPowerMW: Number(facilityPowerMW.toFixed(3)),
      availablePowerMW: Number(availablePowerMW.toFixed(2)),
      radiatorTemperatureK: Number(radiatorTemperatureK.toFixed(1)),
      utilizationPercent: Number(((availableTiles / this.config.gpuTiles) * 100).toFixed(1)),
    };
  }

  private has(type: DatacoreIncident): boolean {
    return this.incidents.some((incident) => incident.type === type);
  }
  private expireIncidents(): void {
    for (let index = this.incidents.length - 1; index >= 0; index -= 1)
      if (this.incidents[index].endsAt <= this.tick) {
        const [resolved] = this.incidents.splice(index, 1);
        this.record("recovery", `${resolved.type} recovery completed; capacity re-admitted`);
      }
  }
  private record(level: DatacoreSnapshot["events"][number]["level"], message: string): void {
    this.events.unshift({ id: ++this.eventId, tick: this.tick, level, message });
    if (this.events.length > 48) this.events.length = 48;
  }
}
