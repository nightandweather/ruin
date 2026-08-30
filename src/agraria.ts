import { DeterministicRandom } from "./prng";

export type CropStrategy = "balanced" | "calorie-first" | "fresh-food" | "life-support";
export type AgrariaIncident = "root-dryout" | "fungal-outbreak" | "co2-shortage" | "lighting-bus-fault";

export interface AgrariaConfig {
  areaM2: number;
  ppfd: number;
  photoperiodHours: number;
  co2Ppm: number;
  waterRecovery: number;
  nutrientRecovery: number;
  ledEfficacy: number;
  crew: number;
  strategy: CropStrategy;
}
export interface AgrariaSnapshot {
  tick: number;
  mode: "growing" | "water-ration" | "quarantine" | "carbon-limit" | "light-limit";
  edibleKgDay: number;
  caloriesDay: number;
  peopleFed: number;
  oxygenPeople: number;
  facilityPowerMW: number;
  energyKwhPerKg: number;
  waterRecoveredLDay: number;
  waterMakeupLDay: number;
  nutrientMakeupKgDay: number;
  co2FixedKgDay: number;
  productiveAreaPercent: number;
  beds: readonly { crop: string; fraction: number; status: "productive" | "quarantine" | "stressed" }[];
  activeIncidents: readonly { type: AgrariaIncident; endsAt: number }[];
  events: readonly {
    id: number;
    tick: number;
    level: "info" | "warning" | "critical" | "recovery";
    message: string;
  }[];
}

export const DEFAULT_AGRARIA_CONFIG: AgrariaConfig = {
  areaM2: 1200,
  ppfd: 550,
  photoperiodHours: 18,
  co2Ppm: 1000,
  waterRecovery: 0.94,
  nutrientRecovery: 0.82,
  ledEfficacy: 3.4,
  crew: 24,
  strategy: "balanced",
};
const strategies: Record<
  CropStrategy,
  { beds: AgrariaSnapshot["beds"]; kgM2Day: number; kcalM2Day: number; oxygenFactor: number }
> = {
  balanced: {
    beds: [
      { crop: "POTATO", fraction: 0.35, status: "productive" },
      { crop: "WHEAT", fraction: 0.25, status: "productive" },
      { crop: "SOY", fraction: 0.2, status: "productive" },
      { crop: "GREENS", fraction: 0.2, status: "productive" },
    ],
    kgM2Day: 0.105,
    kcalM2Day: 42,
    oxygenFactor: 1,
  },
  "calorie-first": {
    beds: [
      { crop: "POTATO", fraction: 0.5, status: "productive" },
      { crop: "WHEAT", fraction: 0.35, status: "productive" },
      { crop: "SOY", fraction: 0.15, status: "productive" },
    ],
    kgM2Day: 0.095,
    kcalM2Day: 51,
    oxygenFactor: 0.92,
  },
  "fresh-food": {
    beds: [
      { crop: "GREENS", fraction: 0.45, status: "productive" },
      { crop: "TOMATO", fraction: 0.3, status: "productive" },
      { crop: "RADISH", fraction: 0.25, status: "productive" },
    ],
    kgM2Day: 0.15,
    kcalM2Day: 24,
    oxygenFactor: 1.08,
  },
  "life-support": {
    beds: [
      { crop: "WHEAT", fraction: 0.35, status: "productive" },
      { crop: "POTATO", fraction: 0.25, status: "productive" },
      { crop: "ALGAE", fraction: 0.4, status: "productive" },
    ],
    kgM2Day: 0.09,
    kcalM2Day: 35,
    oxygenFactor: 1.3,
  },
};

export class AgrariaSimulation {
  private config: AgrariaConfig;
  private readonly random: DeterministicRandom;
  private tick = 0;
  private eventId = 0;
  private readonly incidents: { type: AgrariaIncident; endsAt: number }[] = [];
  private readonly events: AgrariaSnapshot["events"][number][] = [];
  constructor(config: AgrariaConfig = DEFAULT_AGRARIA_CONFIG, seed = 811) {
    this.config = { ...config };
    this.random = new DeterministicRandom(seed);
    this.record("info", "AGRARIA crop decks synchronized with habitat air and water loops");
  }
  updateConfig(config: AgrariaConfig) {
    this.config = { ...config };
    return this.snapshot();
  }
  inject(type: AgrariaIncident) {
    if (this.incidents.some((i) => i.type === type)) return this.snapshot();
    const durations: Record<AgrariaIncident, number> = {
      "root-dryout": 16,
      "fungal-outbreak": 28,
      "co2-shortage": 20,
      "lighting-bus-fault": 18,
    };
    const messages: Record<AgrariaIncident, string> = {
      "root-dryout": "Root-zone moisture confidence lost; affected racks isolated",
      "fungal-outbreak": "Airborne spore signature detected; one crop sector quarantined",
      "co2-shortage": "Habitat carbon supply below photosynthetic setpoint",
      "lighting-bus-fault": "LED bus B unavailable; photoperiod scheduler shedding load",
    };
    this.incidents.push({ type, endsAt: this.tick + durations[type] });
    this.record(type === "fungal-outbreak" ? "critical" : "warning", messages[type]);
    return this.snapshot();
  }
  step(ticks = 1) {
    for (let s = 0; s < ticks; s++) {
      this.tick++;
      for (let i = this.incidents.length - 1; i >= 0; i--)
        if (this.incidents[i].endsAt <= this.tick) {
          const [x] = this.incidents.splice(i, 1);
          this.record("recovery", `${x.type} recovery and food-safety checks completed`);
        }
      if (this.has("fungal-outbreak") && this.random.chance(0.08))
        this.record("info", "Quarantine imaging found no cross-sector spread");
    }
    return this.snapshot();
  }
  snapshot(): AgrariaSnapshot {
    const c = this.config,
      s = strategies[c.strategy];
    const lightBase = 1 - Math.exp(-c.ppfd / 360);
    const lightRef = 1 - Math.exp(-550 / 360);
    const lightFactor = Math.min(1.12, lightBase / lightRef) * (this.has("lighting-bus-fault") ? 0.55 : 1);
    const photoFactor =
      c.photoperiodHours <= 20
        ? c.photoperiodHours / 18
        : Math.max(0.7, 1.11 - (c.photoperiodHours - 20) * 0.08);
    const effectiveCo2 = this.has("co2-shortage") ? 350 : c.co2Ppm;
    const co2Factor = Math.min(1.12, 0.72 + 0.4 * (1 - Math.exp(-Math.max(0, effectiveCo2 - 300) / 500)));
    const waterFactor = this.has("root-dryout") ? 0.62 : 1;
    const quarantineFactor = this.has("fungal-outbreak") ? 0.78 : 1;
    const growth = lightFactor * photoFactor * co2Factor * waterFactor * quarantineFactor;
    const edibleKgDay = c.areaM2 * s.kgM2Day * growth,
      caloriesDay = c.areaM2 * s.kcalM2Day * growth;
    const ledKw =
      ((c.areaM2 * c.ppfd) / c.ledEfficacy / 1000) *
      (c.photoperiodHours / 24) *
      (this.has("lighting-bus-fault") ? 0.55 : 1);
    const facilityKw = ledKw * 1.38 + 18;
    const transpired = c.areaM2 * 4.2 * growth,
      waterRecovered = transpired * c.waterRecovery;
    let mode: AgrariaSnapshot["mode"] = "growing";
    if (this.has("root-dryout")) mode = "water-ration";
    else if (this.has("fungal-outbreak")) mode = "quarantine";
    else if (this.has("co2-shortage")) mode = "carbon-limit";
    else if (this.has("lighting-bus-fault")) mode = "light-limit";
    return {
      tick: this.tick,
      mode,
      edibleKgDay: +edibleKgDay.toFixed(1),
      caloriesDay: Math.round(caloriesDay),
      peopleFed: +(caloriesDay / 2400).toFixed(1),
      oxygenPeople: +((c.areaM2 / 22.5) * s.oxygenFactor * growth).toFixed(1),
      facilityPowerMW: +(facilityKw / 1000).toFixed(3),
      energyKwhPerKg: +((facilityKw * 24) / Math.max(1, edibleKgDay)).toFixed(1),
      waterRecoveredLDay: +waterRecovered.toFixed(0),
      waterMakeupLDay: +(transpired - waterRecovered).toFixed(0),
      nutrientMakeupKgDay: +(c.areaM2 * 0.012 * (1 - c.nutrientRecovery)).toFixed(2),
      co2FixedKgDay: +(c.areaM2 * 0.045 * growth).toFixed(1),
      productiveAreaPercent: +(quarantineFactor * waterFactor * 100).toFixed(0),
      beds: s.beds.map((b, i) => ({
        ...b,
        status:
          this.has("fungal-outbreak") && i === s.beds.length - 1
            ? "quarantine"
            : this.has("root-dryout") && i === 0
              ? "stressed"
              : "productive",
      })),
      activeIncidents: this.incidents.map((i) => ({ ...i })),
      events: this.events.map((e) => ({ ...e })),
    };
  }
  private has(type: AgrariaIncident) {
    return this.incidents.some((i) => i.type === type);
  }
  private record(level: AgrariaSnapshot["events"][number]["level"], message: string) {
    this.events.unshift({ id: ++this.eventId, tick: this.tick, level, message });
    if (this.events.length > 40) this.events.length = 40;
  }
}
