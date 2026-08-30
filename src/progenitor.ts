export type ReplicationSite = "lunar" | "asteroid" | "mars";
export type ReplicationPolicy = "conservative" | "balanced" | "exponential";
export type ProgenitorIncident =
  "metrology-drift" | "controller-shortage" | "tool-wear" | "power-brownout" | "feedstock-contamination";

export interface ProgenitorConfig {
  site: ReplicationSite;
  powerMW: number;
  oreGradePercent: number;
  automationPercent: number;
  metrologyPercent: number;
  localElectronicsPercent: number;
  electronicsImportKgMonth: number;
  maxFactories: number;
  policy: ReplicationPolicy;
}

export interface ProgenitorSnapshot {
  month: number;
  mode: "nominal" | "constrained" | "quarantine" | "halted";
  factoryCount: number;
  generation: number;
  closurePercent: number;
  qualityScore: number;
  lineageDriftPercent: number;
  oreTonnesMonth: number;
  manufacturedTonnesMonth: number;
  reproductionSharePercent: number;
  copyProgressPercent: number;
  estimatedDoublingMonths: number | null;
  externalDependencyTonnes: number;
  importedInventoryTonnes: number;
  usefulOutputTonnesMonth: number;
  machineFleet: readonly {
    type: string;
    count: number;
    localContent: number;
    status: "ready" | "degraded" | "blocked";
  }[];
  activeIncidents: readonly ProgenitorIncident[];
  events: readonly {
    id: number;
    month: number;
    level: "info" | "warning" | "critical" | "recovery";
    message: string;
  }[];
}

export const DEFAULT_PROGENITOR_CONFIG: ProgenitorConfig = {
  site: "lunar",
  powerMW: 18,
  oreGradePercent: 9,
  automationPercent: 82,
  metrologyPercent: 91,
  localElectronicsPercent: 24,
  electronicsImportKgMonth: 12_000,
  maxFactories: 8,
  policy: "balanced",
};

const sites: Record<ReplicationSite, { excavation: number; refining: number; note: string }> = {
  lunar: { excavation: 1, refining: 0.92, note: "Lunar seed site accepted" },
  asteroid: { excavation: 0.72, refining: 1.18, note: "Microgravity anchoring plan accepted" },
  mars: { excavation: 0.88, refining: 1.03, note: "Mars dust isolation plan accepted" },
};

const policies: Record<
  ReplicationPolicy,
  { reproductionShare: number; qualityOffset: number; driftFactor: number }
> = {
  conservative: { reproductionShare: 0.36, qualityOffset: 7, driftFactor: 0.55 },
  balanced: { reproductionShare: 0.56, qualityOffset: 0, driftFactor: 1 },
  exponential: { reproductionShare: 0.78, qualityOffset: -9, driftFactor: 1.75 },
};

const COPY_MASS_KG = 420_000;

export class ProgenitorSimulation {
  private config: ProgenitorConfig;
  private month = 0;
  private eventId = 0;
  private factoryCount = 1;
  private copyProgressKg = 0;
  private importedInventoryKg = 0;
  private lineageDrift = 0;
  private readonly incidents = new Set<ProgenitorIncident>();
  private readonly events: ProgenitorSnapshot["events"][number][] = [];

  constructor(config: ProgenitorConfig = DEFAULT_PROGENITOR_CONFIG) {
    this.config = { ...config };
    this.record("info", `${sites[config.site].note}; seed factory lineage P-0001 registered`);
  }

  updateConfig(config: ProgenitorConfig) {
    this.config = { ...config };
    return this.snapshot();
  }

  inject(type: ProgenitorIncident) {
    if (this.incidents.has(type)) return this.snapshot();
    this.incidents.add(type);
    const messages: Record<ProgenitorIncident, string> = {
      "metrology-drift": "Reference artifact disagreement detected; offspring certification suspended",
      "controller-shortage": "Radiation-tolerant controller inventory unavailable",
      "tool-wear": "Machine-tool spindle wear exceeded compensation envelope",
      "power-brownout": "Power contract derated; nonessential production shed",
      "feedstock-contamination": "Refined feedstock failed composition verification",
    };
    this.record(type === "metrology-drift" ? "critical" : "warning", messages[type]);
    return this.snapshot();
  }

  resolve(type: ProgenitorIncident) {
    if (!this.incidents.delete(type)) return this.snapshot();
    this.record("recovery", `${type} cleared after independent verification`);
    return this.snapshot();
  }

  step(months = 1) {
    for (let i = 0; i < months; i++) {
      this.month++;
      const state = this.calculate();
      if (!this.incidents.has("controller-shortage"))
        this.importedInventoryKg += this.config.electronicsImportKgMonth;
      if (state.mode !== "quarantine" && state.mode !== "halted") {
        this.copyProgressKg += state.reproductionKgMonth;
        const externalPerCopy = COPY_MASS_KG * (1 - state.closure / 100);
        while (
          this.copyProgressKg >= COPY_MASS_KG &&
          this.importedInventoryKg >= externalPerCopy &&
          this.factoryCount < this.config.maxFactories
        ) {
          this.copyProgressKg -= COPY_MASS_KG;
          this.importedInventoryKg -= externalPerCopy;
          this.factoryCount++;
          this.lineageDrift +=
            Math.max(0.08, (100 - state.quality) / 20) * policies[this.config.policy].driftFactor;
          this.record(
            "info",
            `Factory P-${String(this.factoryCount).padStart(4, "0")} certified and admitted to production graph`,
          );
        }
      }
      if (
        this.factoryCount >= this.config.maxFactories &&
        !this.events.some((e) => e.message.includes("production ceiling"))
      )
        this.record("warning", "Human-set production ceiling reached; replication queue halted");
    }
    return this.snapshot();
  }

  snapshot(): ProgenitorSnapshot {
    const x = this.calculate();
    const externalPerCopy = COPY_MASS_KG * (1 - x.closure / 100);
    const localMonths =
      x.reproductionKgMonth > 0
        ? Math.max(0, COPY_MASS_KG - this.copyProgressKg) / x.reproductionKgMonth
        : Infinity;
    const importRate = this.incidents.has("controller-shortage") ? 0 : this.config.electronicsImportKgMonth;
    const importMonths =
      externalPerCopy <= this.importedInventoryKg
        ? 0
        : importRate > 0
          ? (externalPerCopy - this.importedInventoryKg) / importRate
          : Infinity;
    const doubling =
      x.mode === "quarantine" || x.mode === "halted" || !Number.isFinite(Math.max(localMonths, importMonths))
        ? null
        : Math.ceil(Math.max(localMonths, importMonths));
    return {
      month: this.month,
      mode: x.mode,
      factoryCount: this.factoryCount,
      generation: Math.floor(Math.log2(this.factoryCount)),
      closurePercent: +x.closure.toFixed(0),
      qualityScore: +x.quality.toFixed(0),
      lineageDriftPercent: +this.lineageDrift.toFixed(1),
      oreTonnesMonth: +x.oreTonnes.toFixed(0),
      manufacturedTonnesMonth: +(x.manufacturedKg / 1000).toFixed(1),
      reproductionSharePercent: +(policies[this.config.policy].reproductionShare * 100).toFixed(0),
      copyProgressPercent: Math.min(100, +((this.copyProgressKg / COPY_MASS_KG) * 100).toFixed(0)),
      estimatedDoublingMonths: doubling,
      externalDependencyTonnes: +(externalPerCopy / 1000).toFixed(1),
      importedInventoryTonnes: +(this.importedInventoryKg / 1000).toFixed(1),
      usefulOutputTonnesMonth: +(
        (x.manufacturedKg * (1 - policies[this.config.policy].reproductionShare)) /
        1000
      ).toFixed(1),
      machineFleet: this.fleet(x.quality),
      activeIncidents: [...this.incidents],
      events: this.events.map((e) => ({ ...e })),
    };
  }

  private calculate() {
    const c = this.config,
      site = sites[c.site],
      policy = policies[c.policy];
    const powerFactor = this.incidents.has("power-brownout") ? 0.44 : 1;
    const wearFactor = this.incidents.has("tool-wear") ? 0.58 : 1;
    const feedFactor = this.incidents.has("feedstock-contamination") ? 0.52 : 1;
    const oreTonnes = c.powerMW * 390 * site.excavation * this.factoryCount * powerFactor;
    const refinedKg = ((oreTonnes * 1000 * c.oreGradePercent) / 100) * site.refining * feedFactor;
    const automationFactor = 0.48 + (c.automationPercent / 100) * 0.62;
    const manufacturedKg =
      Math.min(refinedKg, c.powerMW * 10_500 * this.factoryCount * powerFactor) *
      automationFactor *
      wearFactor;
    const materialClosure = Math.min(100, 76 + c.oreGradePercent * 1.25);
    const precisionClosure = Math.max(
      0,
      Math.min(100, c.metrologyPercent - (this.incidents.has("metrology-drift") ? 32 : 0)),
    );
    const closure =
      0.46 * materialClosure +
      0.24 * precisionClosure +
      0.22 * c.localElectronicsPercent +
      0.08 * c.automationPercent;
    const quality = Math.max(
      0,
      Math.min(
        100,
        c.metrologyPercent * 0.56 +
          c.automationPercent * 0.34 +
          policy.qualityOffset -
          this.lineageDrift * 0.7 -
          (this.incidents.has("metrology-drift") ? 22 : 0) -
          (this.incidents.has("tool-wear") ? 10 : 0) -
          (this.incidents.has("feedstock-contamination") ? 12 : 0),
      ),
    );
    let mode: ProgenitorSnapshot["mode"] = "nominal";
    if (this.factoryCount >= c.maxFactories) mode = "halted";
    else if (quality < 68 || this.incidents.has("metrology-drift")) mode = "quarantine";
    else if (this.incidents.size > 0 || closure < 76) mode = "constrained";
    return {
      oreTonnes,
      manufacturedKg,
      closure,
      quality,
      mode,
      reproductionKgMonth: manufacturedKg * policy.reproductionShare,
    };
  }

  private fleet(quality: number): ProgenitorSnapshot["machineFleet"] {
    const f = this.factoryCount;
    const status = (incident: ProgenitorIncident, blocked = false): "ready" | "degraded" | "blocked" =>
      this.incidents.has(incident) ? (blocked ? "blocked" : "degraded") : quality < 68 ? "blocked" : "ready";
    return [
      { type: "EXCAVATOR", count: 12 * f, localContent: 92, status: status("feedstock-contamination") },
      { type: "HAULER", count: 18 * f, localContent: 88, status: status("power-brownout") },
      { type: "FURNACE", count: 4 * f, localContent: 94, status: status("feedstock-contamination") },
      { type: "MACHINE TOOL", count: 8 * f, localContent: 83, status: status("tool-wear") },
      { type: "ASSEMBLER", count: 10 * f, localContent: 79, status: status("controller-shortage", true) },
      { type: "METROLOGY", count: 3 * f, localContent: 41, status: status("metrology-drift", true) },
    ];
  }

  private record(level: ProgenitorSnapshot["events"][number]["level"], message: string) {
    this.events.unshift({ id: ++this.eventId, month: this.month, level, message });
    if (this.events.length > 40) this.events.length = 40;
  }
}
