import { DeterministicRandom } from "./prng";
import type {
  ChartPoint,
  Satellite,
  ScenarioType,
  SimulationConfig,
  SimulationEvent,
  SimulationSnapshot,
  SwarmMetrics,
  LogisticsState,
} from "./types";

const SOLAR_IRRADIANCE_AT_1_AU = 1361;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const BACKGROUND_TEMPERATURE_K = 3;
const FACTORY_UNITS_PER_TICK = 4;
const ELEVATOR_CAPACITY = 40;
const ELEVATOR_MINIMUM_BATCH = 20;
const ELEVATOR_TRANSIT_TICKS = 12;
const INSTALLATIONS_PER_TICK = 2;

export const DEFAULT_CONFIG: SimulationConfig = {
  satelliteCount: 10_000,
  seed: 1977,
  tickSeconds: 60,
  orbitRadiusAu: 0.4,
  orbitBands: 8,
  collectorAreaM2: 1_000,
  conversionEfficiency: 0.42,
  radiatorAreaM2: 1_000,
  radiatorEmissivity: 0.9,
  thermalLimitK: 585,
  shutdownTemperatureK: 620,
  baselineDemandFraction: 0.72,
};

interface ActiveScenario {
  type: ScenarioType;
  endsAtTick: number;
  affectedIds: Set<number>;
  bearingDeg?: number;
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export class DysonSwarmSimulation {
  readonly config: SimulationConfig;
  private readonly random: DeterministicRandom;
  private readonly fleet: Satellite[];
  private readonly eventLog: SimulationEvent[] = [];
  private readonly chartHistory: ChartPoint[] = [];
  private readonly scenarios: ActiveScenario[] = [];
  private currentTick = 0;
  private eventSequence = 0;
  private safetyTrips = 0;
  private avoidanceManeuvers = 0;
  private confirmedImpacts = 0;
  private readonly logistics: LogisticsState & { elevatorTicksRemaining: number } = {
    factoryBacklog: 0,
    groundInventory: 0,
    totalManufactured: 0,
    elevatorCargo: 0,
    elevatorStatus: "standby",
    elevatorProgressPercent: 0,
    elevatorTicksRemaining: 0,
    orbitalInventory: 0,
    replacementsInstalled: 0,
  };
  private latestMetrics: SwarmMetrics;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.random = new DeterministicRandom(this.config.seed);
    this.fleet = this.createFleet();
    this.latestMetrics = this.calculateAndDispatch();
    this.recordEvent("info", "CONTROL", `${this.config.satelliteCount.toLocaleString()} collectors synchronized`);
    this.recordHistory();
  }

  private solarFluxWm2(): number {
    return SOLAR_IRRADIANCE_AT_1_AU / this.config.orbitRadiusAu ** 2;
  }

  private nominalCapacityMW(): number {
    return (this.solarFluxWm2() * this.config.collectorAreaM2 * this.config.conversionEfficiency) / 1_000_000;
  }

  private equilibriumTemperatureK(fluxMultiplier = 1): number {
    const absorbedWasteW =
      this.solarFluxWm2() *
      fluxMultiplier *
      this.config.collectorAreaM2 *
      (1 - this.config.conversionEfficiency);
    const radiativeTerm =
      absorbedWasteW /
      (this.config.radiatorEmissivity * STEFAN_BOLTZMANN * this.config.radiatorAreaM2);
    return (radiativeTerm + BACKGROUND_TEMPERATURE_K ** 4) ** 0.25;
  }

  private createFleet(): Satellite[] {
    const nominalCapacity = this.nominalCapacityMW();
    const nominalTemperature = this.equilibriumTemperatureK();
    return Array.from({ length: this.config.satelliteCount }, (_, id) => {
      const health = this.random.range(0.94, 1);
      return {
        id,
        band: id % this.config.orbitBands,
        phase: this.random.next() * Math.PI * 2,
        health,
        linkQuality: this.random.range(0.965, 1),
        temperatureK: nominalTemperature + this.random.range(-7, 7),
        capacityMW: nominalCapacity * health,
        deliveredMW: 0,
        mode: "nominal",
        affectedUntilTick: 0,
      };
    });
  }

  step(ticks = 1): SimulationSnapshot {
    for (let index = 0; index < ticks; index += 1) {
      this.currentTick += 1;
      this.expireScenarios();
      this.updateFleet();
      this.advanceLogistics();
      this.latestMetrics = this.calculateAndDispatch();
      if (this.currentTick % 5 === 0) this.recordHistory();
      if (this.currentTick % 120 === 0) {
        this.recordEvent("info", "CONTROL", `Routine consensus checkpoint ${this.currentTick / 120} committed`);
      }
    }
    return this.snapshot();
  }

  inject(type: ScenarioType, options: { bearingDeg?: number } = {}): SimulationSnapshot {
    const definitions: Record<ScenarioType, { fraction: number; duration: number; message: string }> = {
      "communications-blackout": {
        fraction: 0.3,
        duration: 90,
        message: "A heliospheric relay blackout isolated 30% of the swarm",
      },
      "thermal-wave": {
        fraction: 0.2,
        duration: 75,
        message: "Coronal activity raised incident flux across 20% of collectors",
      },
      "cascade-failure": {
        fraction: 0.05,
        duration: 180,
        message: "A manufacturing fault cascade removed 5% of collectors",
      },
      "demand-spike": {
        fraction: 0,
        duration: 60,
        message: "Outer-system beam demand rose 35% above baseline",
      },
      "debris-corridor": {
        fraction: 0.015,
        duration: 45,
        message: "",
      },
    };
    const definition = definitions[type];
    const affectedIds = new Set<number>();
    const targetCount = Math.floor(this.config.satelliteCount * definition.fraction);
    const bearingDeg = type === "debris-corridor" ? ((options.bearingDeg ?? 315) % 360 + 360) % 360 : undefined;
    if (type === "debris-corridor") {
      const bearingRad = (bearingDeg! * Math.PI) / 180;
      const byCorridorDistance = [...this.fleet].sort(
        (left, right) => this.angularDistance(left.phase, bearingRad) - this.angularDistance(right.phase, bearingRad),
      );
      for (let index = 0; index < targetCount; index += 1) affectedIds.add(byCorridorDistance[index].id);
    } else {
      while (affectedIds.size < targetCount) {
        affectedIds.add(Math.floor(this.random.next() * this.config.satelliteCount));
      }
    }

    const endsAtTick = this.currentTick + definition.duration;
    for (const id of affectedIds) {
      const satellite = this.fleet[id];
      satellite.affectedUntilTick = Math.max(satellite.affectedUntilTick, endsAtTick);
      if (type === "cascade-failure") {
        satellite.health = Math.min(satellite.health, 0.08);
        satellite.mode = "offline";
      }
    }
    this.scenarios.push({ type, endsAtTick, affectedIds, bearingDeg });
    const message =
      type === "debris-corridor"
        ? `Inbound debris detected on bearing ${bearingDeg!.toFixed(0)}°; ${targetCount} conjunctions predicted`
        : definition.message;
    this.recordEvent(type === "demand-spike" ? "warning" : "critical", "SCENARIO", message);
    return this.snapshot();
  }

  requestProduction(units = 50): SimulationSnapshot {
    const safeUnits = Math.max(1, Math.min(1_000, Math.round(units)));
    this.enqueueProduction(safeUnits, "Operator");
    return this.snapshot();
  }

  snapshot(): SimulationSnapshot {
    return {
      tick: this.currentTick,
      elapsedSeconds: this.currentTick * this.config.tickSeconds,
      metrics: { ...this.latestMetrics },
      satellites: this.fleet,
      events: this.eventLog,
      history: this.chartHistory,
      logistics: {
        factoryBacklog: this.logistics.factoryBacklog,
        groundInventory: this.logistics.groundInventory,
        totalManufactured: this.logistics.totalManufactured,
        elevatorCargo: this.logistics.elevatorCargo,
        elevatorStatus: this.logistics.elevatorStatus,
        elevatorProgressPercent: this.logistics.elevatorProgressPercent,
        orbitalInventory: this.logistics.orbitalInventory,
        replacementsInstalled: this.logistics.replacementsInstalled,
      },
      activeScenarios: this.scenarios.map(({ type, endsAtTick, bearingDeg, affectedIds }) => ({
        type,
        endsAtTick,
        bearingDeg,
        affectedCount: affectedIds.size,
      })),
    };
  }

  private updateFleet(): void {
    const nominalCapacity = this.nominalCapacityMW();
    const thermalScenario = this.scenarios.find((scenario) => scenario.type === "thermal-wave");
    const blackoutScenario = this.scenarios.find((scenario) => scenario.type === "communications-blackout");
    const debrisScenario = this.scenarios.find((scenario) => scenario.type === "debris-corridor");

    for (const satellite of this.fleet) {
      const thermallyAffected = thermalScenario?.affectedIds.has(satellite.id) ?? false;
      const isolated = blackoutScenario?.affectedIds.has(satellite.id) ?? false;
      const avoidingDebris = debrisScenario?.affectedIds.has(satellite.id) ?? false;
      const targetTemperature = this.equilibriumTemperatureK(thermallyAffected ? 1.18 : 1);
      satellite.temperatureK += (targetTemperature - satellite.temperatureK) * 0.08;
      satellite.temperatureK += this.random.range(-0.45, 0.45);
      satellite.linkQuality = isolated ? 0 : Math.min(1, Math.max(0, satellite.linkQuality + this.random.range(-0.004, 0.004)));

      if (satellite.health <= 0.1 || satellite.temperatureK >= this.config.shutdownTemperatureK) {
        if (satellite.mode !== "offline" && satellite.temperatureK >= this.config.shutdownTemperatureK) {
          this.safetyTrips += 1;
        }
        satellite.mode = "offline";
        satellite.deliveredMW = 0;
      } else if (isolated || satellite.linkQuality < 0.2) {
        satellite.mode = "isolated";
        satellite.deliveredMW = 0;
      } else if (satellite.temperatureK >= this.config.thermalLimitK) {
        satellite.mode = "thermal";
      } else if (avoidingDebris) {
        satellite.mode = "curtailed";
      } else {
        satellite.mode = "nominal";
      }
      satellite.capacityMW =
        nominalCapacity * satellite.health * (thermallyAffected ? 1.18 : 1) * (avoidingDebris ? 0.62 : 1);
    }
  }

  private calculateAndDispatch(): SwarmMetrics {
    const demandMultiplier = this.scenarios.some((scenario) => scenario.type === "demand-spike") ? 1.35 : 1;
    const nominalFleetPotential = this.nominalCapacityMW() * this.config.satelliteCount;
    const demandMW = nominalFleetPotential * this.config.baselineDemandFraction * demandMultiplier;
    const eligible = this.fleet.filter((satellite) => satellite.mode !== "offline" && satellite.mode !== "isolated");
    const safeCapacityMW = eligible.reduce((sum, satellite) => {
      const thermalDerating = satellite.mode === "thermal" ? 0.3 : 1;
      return sum + satellite.capacityMW * thermalDerating;
    }, 0);
    const dispatchRatio = safeCapacityMW === 0 ? 0 : Math.min(1, demandMW / safeCapacityMW);

    for (const satellite of this.fleet) {
      if (satellite.mode === "offline" || satellite.mode === "isolated") {
        satellite.deliveredMW = 0;
        continue;
      }
      const thermalDerating = satellite.mode === "thermal" ? 0.3 : 1;
      satellite.deliveredMW = satellite.capacityMW * thermalDerating * dispatchRatio;
      if (satellite.mode === "nominal" && dispatchRatio < 0.995) satellite.mode = "curtailed";
    }

    const potentialMW = this.fleet.reduce((sum, satellite) => sum + satellite.capacityMW, 0);
    const deliveredMW = this.fleet.reduce((sum, satellite) => sum + satellite.deliveredMW, 0);
    const offlineCount = this.fleet.filter((satellite) => satellite.mode === "offline").length;
    const dispatchableCount = this.fleet.filter(
      (satellite) => satellite.mode !== "offline" && satellite.mode !== "isolated",
    ).length;
    const averageTemperature =
      this.fleet.reduce((sum, satellite) => sum + satellite.temperatureK, 0) / this.config.satelliteCount;

    return {
      potentialGW: round(potentialMW / 1_000),
      deliveredGW: round(deliveredMW / 1_000),
      demandGW: round(demandMW / 1_000),
      curtailedGW: round(Math.max(0, potentialMW - deliveredMW) / 1_000),
      availabilityPercent: round((dispatchableCount / this.config.satelliteCount) * 100),
      averageTemperatureK: round(averageTemperature, 1),
      offlineCount,
      isolatedCount: this.fleet.filter((satellite) => satellite.mode === "isolated").length,
      thermalCount: this.fleet.filter((satellite) => satellite.mode === "thermal").length,
      safetyTrips: this.safetyTrips,
      avoidanceManeuvers: this.avoidanceManeuvers,
      confirmedImpacts: this.confirmedImpacts,
    };
  }

  private expireScenarios(): void {
    for (let index = this.scenarios.length - 1; index >= 0; index -= 1) {
      const scenario = this.scenarios[index];
      if (scenario.endsAtTick <= this.currentTick) {
        if (scenario.type === "communications-blackout") {
          for (const id of scenario.affectedIds) {
            const satellite = this.fleet[id];
            satellite.linkQuality = Math.max(satellite.linkQuality, this.random.range(0.82, 0.94));
          }
        }
        if (scenario.type === "cascade-failure") {
          for (const id of scenario.affectedIds) {
            const satellite = this.fleet[id];
            satellite.health = this.random.range(0.82, 0.92);
            satellite.mode = "nominal";
          }
        }
        if (scenario.type === "debris-corridor") {
          let avoided = 0;
          let impacts = 0;
          for (const id of scenario.affectedIds) {
            const satellite = this.fleet[id];
            if (this.random.chance(0.985)) {
              satellite.phase = (satellite.phase + this.random.range(0.008, 0.018)) % (Math.PI * 2);
              satellite.health = Math.max(0, satellite.health - 0.001);
              avoided += 1;
            } else {
              satellite.health = 0;
              satellite.mode = "offline";
              satellite.deliveredMW = 0;
              impacts += 1;
            }
          }
          this.avoidanceManeuvers += avoided;
          this.confirmedImpacts += impacts;
          if (impacts > 0) this.enqueueProduction(impacts, "Autonomous damage control");
          this.recordEvent(
            impacts === 0 ? "recovery" : "warning",
            "COLLISION",
            `${avoided} avoidance burns completed; ${impacts} collector impacts confirmed`,
          );
        }
        this.scenarios.splice(index, 1);
        if (scenario.type !== "debris-corridor") {
          this.recordEvent("recovery", "AUTONOMY", `${scenario.type} recovery protocol completed`);
        }
      }
    }
  }

  private angularDistance(left: number, right: number): number {
    const difference = Math.abs(left - right) % (Math.PI * 2);
    return Math.min(difference, Math.PI * 2 - difference);
  }

  private enqueueProduction(units: number, source: string): void {
    this.logistics.factoryBacklog += units;
    this.recordEvent("info", "FACTORY", `${source} requested ${units} replacement collector${units === 1 ? "" : "s"}`);
  }

  private advanceLogistics(): void {
    const produced = Math.min(FACTORY_UNITS_PER_TICK, this.logistics.factoryBacklog);
    this.logistics.factoryBacklog -= produced;
    this.logistics.groundInventory += produced;
    this.logistics.totalManufactured += produced;

    if (this.logistics.elevatorStatus === "ascending") {
      this.logistics.elevatorTicksRemaining -= 1;
      this.logistics.elevatorProgressPercent = round(
        ((ELEVATOR_TRANSIT_TICKS - this.logistics.elevatorTicksRemaining) / ELEVATOR_TRANSIT_TICKS) * 100,
        0,
      );
      if (this.logistics.elevatorTicksRemaining <= 0) {
        const delivered = this.logistics.elevatorCargo;
        this.logistics.orbitalInventory += delivered;
        this.logistics.elevatorCargo = 0;
        this.logistics.elevatorStatus = "standby";
        this.logistics.elevatorProgressPercent = 0;
        this.recordEvent("recovery", "ELEVATOR", `${delivered} replacement collectors delivered to orbital depot`);
      }
    } else if (
      this.logistics.groundInventory >= ELEVATOR_MINIMUM_BATCH ||
      (this.logistics.groundInventory > 0 && this.logistics.factoryBacklog === 0)
    ) {
      const cargo = Math.min(ELEVATOR_CAPACITY, this.logistics.groundInventory);
      this.logistics.groundInventory -= cargo;
      this.logistics.elevatorCargo = cargo;
      this.logistics.elevatorStatus = "ascending";
      this.logistics.elevatorTicksRemaining = ELEVATOR_TRANSIT_TICKS;
      this.logistics.elevatorProgressPercent = 0;
      this.recordEvent("info", "ELEVATOR", `Climber departed with ${cargo} replacement collectors`);
    }

    const damaged = this.fleet.filter(
      (satellite) => satellite.health <= 0.1 && satellite.affectedUntilTick <= this.currentTick,
    );
    const installCount = Math.min(INSTALLATIONS_PER_TICK, damaged.length, this.logistics.orbitalInventory);
    for (let index = 0; index < installCount; index += 1) {
      const satellite = damaged[index];
      satellite.health = this.random.range(0.96, 1);
      satellite.temperatureK = this.equilibriumTemperatureK();
      satellite.linkQuality = this.random.range(0.97, 1);
      satellite.mode = "nominal";
      satellite.affectedUntilTick = 0;
      this.logistics.orbitalInventory -= 1;
      this.logistics.replacementsInstalled += 1;
    }
    if (installCount > 0 && (installCount === damaged.length || this.logistics.orbitalInventory === 0)) {
      this.recordEvent("recovery", "DEPOT", `${installCount} damaged collector${installCount === 1 ? "" : "s"} replaced on orbit`);
    }
  }

  private recordEvent(level: SimulationEvent["level"], source: string, message: string): void {
    this.eventLog.unshift({ id: ++this.eventSequence, tick: this.currentTick, level, source, message });
    if (this.eventLog.length > 80) this.eventLog.pop();
  }

  private recordHistory(): void {
    this.chartHistory.push({
      tick: this.currentTick,
      deliveredGW: this.latestMetrics.deliveredGW,
      demandGW: this.latestMetrics.demandGW,
      availabilityPercent: this.latestMetrics.availabilityPercent,
    });
    if (this.chartHistory.length > 120) this.chartHistory.shift();
  }
}
