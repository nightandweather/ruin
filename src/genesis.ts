import { evaluatePrometheus, prometheusConfig } from "./prometheus";
export type GenesisIncident = "none" | "ore-poor" | "metrology-drift" | "reactor-trip" | "pathogen";
export interface GenesisConfig {
  years: number;
  seedMassT: number;
  reactorUnits: number;
  corvusDrones: number;
  oreGradePercent: number;
  factoryClosurePercent: number;
  replicationMonths: number;
  collectorGrowthPercent: number;
  habitatPopulation: number;
  incident: GenesisIncident;
}
export function genesisConfig(): GenesisConfig {
  return {
    years: 100,
    seedMassT: 620,
    reactorUnits: 3,
    corvusDrones: 18,
    oreGradePercent: 7,
    factoryClosurePercent: 72,
    replicationMonths: 30,
    collectorGrowthPercent: 18,
    habitatPopulation: 120,
    incident: "none",
  };
}
export function simulateGenesis(c: GenesisConfig) {
  const years = Math.max(1, Math.floor(c.years));
  const reactor = evaluatePrometheus({
    ...prometheusConfig("surface-40"),
    units: c.reactorUnits,
    factoryPowerKW: 28,
    incident: c.incident === "reactor-trip" ? "conversion-loss" : "none",
  });
  let factories = 1,
    collectors = 0,
    powerKW = reactor.bootstrapPowerKW,
    stockT = Math.max(0, c.seedMassT * 0.18),
    population = 0,
    factoryProgress = 0,
    collectorProgress = 0;
  const events: { year: number; label: string; system: string }[] = [];
  let firstOre: number | null = null,
    firstReplication: number | null = null,
    energyIndependence: number | null = null,
    habitatOnline: number | null = null,
    selfSufficient: number | null = null;
  for (let y = 1; y <= years; y++) {
    const orePenalty = c.incident === "ore-poor" ? 0.08 : 1,
      qualityPenalty = c.incident === "metrology-drift" ? 0.58 : 1,
      biologicalPenalty = c.incident === "pathogen" ? 0.55 : 1;
    const minedT = factories * c.corvusDrones * 0.16 * c.oreGradePercent * orePenalty;
    stockT += minedT;
    if (firstOre === null && minedT > 2) {
      firstOre = y;
      events.push({ year: y, label: "Certified ore stream established", system: "CORVUS → FOUNDRY" });
    }
    const cycle = Math.max(1, c.replicationMonths / 12);
    factoryProgress +=
      stockT > 20 && reactor.factoryFraction > 0.7
        ? (factories * (c.factoryClosurePercent / 100) * qualityPenalty) / cycle
        : 0;
    const added = Math.min(Math.floor(stockT / 18), Math.floor(factoryProgress));
    if (added > 0) {
      factoryProgress -= added;
      factories += added;
      stockT = Math.max(0, stockT - added * 18);
      if (firstReplication === null) {
        firstReplication = y;
        events.push({ year: y, label: "First certified daughter factory", system: "PROGENITOR" });
      }
    }
    collectorProgress += ((factories * c.collectorGrowthPercent) / 100) * qualityPenalty;
    const newCollectors = Math.floor(collectorProgress);
    collectorProgress -= newCollectors;
    collectors += Math.max(0, newCollectors);
    powerKW = reactor.bootstrapPowerKW + collectors * 42;
    if (energyIndependence === null && collectors >= 12) {
      energyIndependence = y;
      events.push({ year: y, label: "Stellar power exceeds reactor bootstrap load", system: "HELIOS" });
    }
    if (energyIndependence !== null && population < c.habitatPopulation)
      population = Math.min(
        c.habitatPopulation,
        population + Math.max(1, Math.floor(factories * 0.35 * biologicalPenalty)),
      );
    if (habitatOnline === null && population >= 12) {
      habitatOnline = y;
      events.push({ year: y, label: "First crew habitat commissioned", system: "GRAVITAS + AGRARIA" });
    }
    if (
      selfSufficient === null &&
      factories >= 8 &&
      collectors >= 30 &&
      population >= Math.min(60, c.habitatPopulation) &&
      c.factoryClosurePercent >= 70
    ) {
      selfSufficient = y;
      events.push({ year: y, label: "Local system declared self-sufficient", system: "GENESIS" });
      break;
    }
    factories = Math.min(factories, 100000);
    collectors = Math.min(collectors, 1000000);
  }
  const readiness =
    reactor.readiness === "NO-GO"
      ? "NO-GO"
      : selfSufficient !== null
        ? "SELF-SUFFICIENT"
        : events.length >= 3
          ? "BOOTSTRAPPING"
          : "FRAGILE";
  const bottlenecks = [
    ...(reactor.readiness === "NO-GO" ? ["PROMETHEUS cannot energize the seed industry"] : []),
    ...(c.factoryClosurePercent < 70 ? ["Precision imports prevent autonomous factory lineage"] : []),
    ...(c.oreGradePercent < 2 ? ["Local ore stream is below industrial bootstrap threshold"] : []),
    ...(c.corvusDrones < 4 ? ["Insufficient survey redundancy"] : []),
    ...(selfSufficient === null ? [`No self-sufficient colony inside ${years} years`] : []),
  ];
  return {
    reactor,
    factories,
    collectors,
    powerKW,
    stockT,
    population,
    firstOre,
    firstReplication,
    energyIndependence,
    habitatOnline,
    selfSufficient,
    events,
    readiness,
    bottlenecks,
  };
}
