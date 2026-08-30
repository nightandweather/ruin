import { DeterministicRandom } from "./prng";

export type FoundryScenario = "dust-front" | "crusher-jam" | "power-ration" | "cutter-wear";

export interface FoundryInventory {
  regolithKg: number;
  gradedFeedKg: number;
  structuralMetalKg: number;
  rareMetalKg: number;
  oxygenKg: number;
  machinedSets: number;
  replacementKits: number;
}

export interface FoundryStage {
  id: "excavation" | "crushing" | "refining" | "machining" | "assembly";
  label: string;
  utilizationPercent: number;
  healthPercent: number;
  status: "nominal" | "derated" | "fault" | "starved";
  rateLabel: string;
}

export interface FoundryEvent {
  id: number;
  tick: number;
  level: "info" | "warning" | "critical" | "recovery";
  source: string;
  message: string;
}

export interface FoundrySnapshot {
  tick: number;
  elapsedMinutes: number;
  orderBacklog: number;
  totalKitsShipped: number;
  activeBots: number;
  powerMW: number;
  bottleneck: string;
  inventory: FoundryInventory;
  stages: readonly FoundryStage[];
  events: readonly FoundryEvent[];
  activeScenarios: readonly { type: FoundryScenario; endsAtTick: number }[];
  history: readonly { tick: number; rawKg: number; refinedKg: number; kits: number; powerMW: number }[];
}

interface ActiveScenario {
  type: FoundryScenario;
  endsAtTick: number;
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export class AutonomousFoundrySimulation {
  private readonly random: DeterministicRandom;
  private currentTick = 0;
  private eventSequence = 0;
  private orderBacklog = 0;
  private totalKitsShipped = 0;
  private readonly botHealth: number[];
  private readonly inventory: FoundryInventory = {
    regolithKg: 0,
    gradedFeedKg: 0,
    structuralMetalKg: 120,
    rareMetalKg: 8,
    oxygenKg: 0,
    machinedSets: 2,
    replacementKits: 0,
  };
  private readonly stageHealth = new Map<FoundryStage["id"], number>([
    ["excavation", 0.99],
    ["crushing", 0.98],
    ["refining", 0.97],
    ["machining", 0.99],
    ["assembly", 0.99],
  ]);
  private stages: FoundryStage[] = [];
  private readonly scenarios: ActiveScenario[] = [];
  private readonly eventLog: FoundryEvent[] = [];
  private readonly history: FoundrySnapshot["history"][number][] = [];
  private powerMW = 0;

  constructor(seed = 2049, botCount = 24) {
    this.random = new DeterministicRandom(seed);
    this.botHealth = Array.from({ length: botCount }, () => this.random.range(0.93, 1));
    this.stages = this.emptyStages();
    this.recordEvent("info", "AUTONOMY", `${botCount} excavation robots and five production cells online`);
    this.recordHistory();
  }

  requestKits(units = 20): FoundrySnapshot {
    const safeUnits = Math.max(1, Math.min(500, Math.round(units)));
    this.orderBacklog += safeUnits;
    this.recordEvent("info", "PLANNER", `Production order accepted for ${safeUnits} collector repair kits`);
    return this.snapshot();
  }

  inject(type: FoundryScenario): FoundrySnapshot {
    if (this.scenarios.some((scenario) => scenario.type === type)) return this.snapshot();
    const duration: Record<FoundryScenario, number> = {
      "dust-front": 30,
      "crusher-jam": 12,
      "power-ration": 24,
      "cutter-wear": 18,
    };
    const messages: Record<FoundryScenario, string> = {
      "dust-front": "Electrostatic dust reduced excavation visibility and traction",
      "crusher-jam": "Oversized regolith fragment stopped the primary crusher",
      "power-ration": "Habitat reserve request capped industrial power draw",
      "cutter-wear": "Machine-tool vibration exceeded the cutter wear envelope",
    };
    this.scenarios.push({ type, endsAtTick: this.currentTick + duration[type] });
    this.recordEvent(type === "power-ration" ? "warning" : "critical", "INCIDENT", messages[type]);
    return this.snapshot();
  }

  step(ticks = 1): FoundrySnapshot {
    for (let index = 0; index < ticks; index += 1) {
      this.currentTick += 1;
      this.expireScenarios();
      this.runProductionTick();
      if (this.currentTick % 3 === 0) this.recordHistory();
      if (this.currentTick % 72 === 0)
        this.recordEvent("info", "QUALITY", "Shift mass balance and tool calibration committed");
    }
    return this.snapshot();
  }

  snapshot(): FoundrySnapshot {
    const bottleneck = [...this.stages]
      .filter((stage) => stage.status !== "starved")
      .sort((left, right) => right.utilizationPercent - left.utilizationPercent)[0];
    return {
      tick: this.currentTick,
      elapsedMinutes: this.currentTick * 10,
      orderBacklog: this.orderBacklog,
      totalKitsShipped: this.totalKitsShipped,
      activeBots: this.botHealth.filter((health) => health > 0.4).length,
      powerMW: this.powerMW,
      bottleneck: bottleneck?.utilizationPercent >= 90 ? bottleneck.label : "Flow balanced",
      inventory: { ...this.inventory },
      stages: this.stages.map((stage) => ({ ...stage })),
      events: this.eventLog.map((event) => ({ ...event })),
      activeScenarios: this.scenarios.map((scenario) => ({ ...scenario })),
      history: this.history.map((point) => ({ ...point })),
    };
  }

  private runProductionTick(): void {
    const has = (type: FoundryScenario) => this.scenarios.some((scenario) => scenario.type === type);
    const powerFactor = has("power-ration") ? 0.55 : 1;
    const dustFactor = has("dust-front") ? 0.35 : 1;
    const activeBotFactor = this.botHealth.reduce((sum, health) => sum + health, 0) / this.botHealth.length;

    const mined = 432 * activeBotFactor * dustFactor * powerFactor;
    this.inventory.regolithKg += mined;

    const crusherCapacity = has("crusher-jam") ? 0 : 360 * powerFactor * this.health("crushing");
    const crushedInput = Math.min(this.inventory.regolithKg, crusherCapacity);
    this.inventory.regolithKg -= crushedInput;
    this.inventory.gradedFeedKg += crushedInput * 0.92;

    const refineryInput = Math.min(this.inventory.gradedFeedKg, 250 * powerFactor * this.health("refining"));
    this.inventory.gradedFeedKg -= refineryInput;
    const structuralOutput = refineryInput * 0.18;
    const rareOutput = refineryInput * 0.008;
    this.inventory.structuralMetalKg += structuralOutput;
    this.inventory.rareMetalKg += rareOutput;
    this.inventory.oxygenKg += refineryInput * 0.4;

    const machineFactor = has("cutter-wear") ? 0.15 : 1;
    const possibleByStructural = Math.floor(this.inventory.structuralMetalKg / 40);
    const possibleByRare = Math.floor(this.inventory.rareMetalKg / 0.5);
    const machined = Math.min(
      3 * machineFactor * powerFactor * this.health("machining"),
      possibleByStructural,
      possibleByRare,
    );
    this.inventory.structuralMetalKg -= machined * 40;
    this.inventory.rareMetalKg -= machined * 0.5;
    this.inventory.machinedSets += machined;

    const assembled = Math.min(
      1 * powerFactor * this.health("assembly"),
      Math.floor(this.inventory.machinedSets / 4),
    );
    this.inventory.machinedSets -= assembled * 4;
    this.inventory.replacementKits += assembled;

    const shipped = Math.min(Math.floor(this.inventory.replacementKits), this.orderBacklog);
    this.inventory.replacementKits -= shipped;
    this.orderBacklog -= shipped;
    this.totalKitsShipped += shipped;
    if (shipped > 0 && this.orderBacklog === 0) {
      this.recordEvent(
        "recovery",
        "DISPATCH",
        `Production order completed; ${this.totalKitsShipped} kits shipped in total`,
      );
    }

    this.powerMW = round(
      (4.8 * dustFactor +
        (crushedInput > 0 ? 1.8 : 0) +
        (refineryInput > 0 ? 8 : 0) +
        (machined > 0 ? 2.4 : 0) +
        (assembled > 0 ? 0.8 : 0)) *
        powerFactor,
    );
    this.stages = [
      this.makeStage("excavation", "ROBOT MINE", mined, 432, `${round(mined, 0)} kg/tick`, has("dust-front")),
      this.makeStage(
        "crushing",
        "CRUSH + GRADE",
        crushedInput,
        360,
        `${round(crushedInput, 0)} kg/tick`,
        has("crusher-jam"),
        has("crusher-jam"),
      ),
      this.makeStage(
        "refining",
        "MRE REFINERY",
        refineryInput,
        250,
        `${round(structuralOutput, 1)} kg metal`,
        false,
      ),
      this.makeStage(
        "machining",
        "MACHINE SHOP",
        machined,
        3,
        `${round(machined, 1)} sets/tick`,
        has("cutter-wear"),
      ),
      this.makeStage("assembly", "ROBOT ASSEMBLY", assembled, 1, `${round(assembled, 1)} kits/tick`, false),
    ];
    for (const stage of this.stages) {
      const wear = (stage.utilizationPercent / 100) * (stage.id === "refining" ? 0.00022 : 0.00012);
      this.stageHealth.set(stage.id, Math.max(0.72, this.health(stage.id) - wear));
    }
    for (let index = 0; index < this.botHealth.length; index += 1) {
      this.botHealth[index] = Math.max(0.55, this.botHealth[index] - this.random.range(0.00001, 0.00006));
    }
    this.clampInventory();
  }

  private makeStage(
    id: FoundryStage["id"],
    label: string,
    actual: number,
    capacity: number,
    rateLabel: string,
    derated: boolean,
    fault = false,
  ): FoundryStage {
    const utilization = capacity === 0 ? 0 : Math.min(100, (actual / capacity) * 100);
    return {
      id,
      label,
      utilizationPercent: round(utilization, 0),
      healthPercent: round(this.health(id) * 100, 1),
      status: fault ? "fault" : derated ? "derated" : actual <= 0 ? "starved" : "nominal",
      rateLabel,
    };
  }

  private health(id: FoundryStage["id"]): number {
    return this.stageHealth.get(id) ?? 1;
  }

  private expireScenarios(): void {
    for (let index = this.scenarios.length - 1; index >= 0; index -= 1) {
      if (this.scenarios[index].endsAtTick <= this.currentTick) {
        const [scenario] = this.scenarios.splice(index, 1);
        this.recordEvent("recovery", "AUTONOMY", `${scenario.type} recovery procedure completed`);
      }
    }
  }

  private clampInventory(): void {
    for (const key of Object.keys(this.inventory) as (keyof FoundryInventory)[]) {
      this.inventory[key] = round(Math.max(0, this.inventory[key]), 3);
    }
  }

  private emptyStages(): FoundryStage[] {
    return [
      ["excavation", "ROBOT MINE"],
      ["crushing", "CRUSH + GRADE"],
      ["refining", "MRE REFINERY"],
      ["machining", "MACHINE SHOP"],
      ["assembly", "ROBOT ASSEMBLY"],
    ].map(([id, label]) => ({
      id: id as FoundryStage["id"],
      label,
      utilizationPercent: 0,
      healthPercent: 100,
      status: "starved",
      rateLabel: "standby",
    }));
  }

  private recordEvent(level: FoundryEvent["level"], source: string, message: string): void {
    this.eventLog.unshift({ id: ++this.eventSequence, tick: this.currentTick, level, source, message });
    if (this.eventLog.length > 60) this.eventLog.pop();
  }

  private recordHistory(): void {
    this.history.push({
      tick: this.currentTick,
      rawKg: round(this.inventory.regolithKg),
      refinedKg: round(this.inventory.structuralMetalKg + this.inventory.rareMetalKg),
      kits: this.totalKitsShipped,
      powerMW: this.powerMW,
    });
    if (this.history.length > 120) this.history.shift();
  }
}
