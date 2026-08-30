export interface CollectorDesign {
  orbitAu: number;
  collectorAreaM2: number;
  radiatorAreaM2: number;
  conversionEfficiency: number;
  shieldThicknessMm: number;
  propellantKg: number;
}

export interface CollectorPerformance {
  solarFluxWm2: number;
  incidentPowerMW: number;
  grossElectricMW: number;
  wasteHeatMW: number;
  radiatorTemperatureK: number;
  deliveredPowerMW: number;
  totalMassKg: number;
  structuralMetalKg: number;
  traceMetalKg: number;
  foundryShifts: number;
  thermalMarginK: number;
  powerToMassWkg: number;
}

export const DEFAULT_COLLECTOR_DESIGN: CollectorDesign = {
  orbitAu: 0.4,
  collectorAreaM2: 1600,
  radiatorAreaM2: 550,
  conversionEfficiency: 0.42,
  shieldThicknessMm: 6,
  propellantKg: 850,
};

export const SOLAR_IRRADIANCE_1_AU_WM2 = 1361;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const RADIATOR_EMISSIVITY = 0.9;
export const MAX_RADIATOR_TEMPERATURE_K = 780;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export function normalizeCollectorDesign(input: CollectorDesign): CollectorDesign {
  return {
    orbitAu: clamp(input.orbitAu, 0.2, 2),
    collectorAreaM2: clamp(input.collectorAreaM2, 200, 5000),
    radiatorAreaM2: clamp(input.radiatorAreaM2, 100, 3000),
    conversionEfficiency: clamp(input.conversionEfficiency, 0.1, 0.6),
    shieldThicknessMm: clamp(input.shieldThicknessMm, 1, 30),
    propellantKg: clamp(input.propellantKg, 100, 5000),
  };
}

export function evaluateCollectorDesign(
  raw: CollectorDesign,
  fluxMultiplier = 1,
  deploymentFraction = 1,
): CollectorPerformance {
  const design = normalizeCollectorDesign(raw);
  const deployed = clamp(deploymentFraction, 0, 1);
  const solarFluxWm2 = (SOLAR_IRRADIANCE_1_AU_WM2 / design.orbitAu ** 2) * Math.max(0, fluxMultiplier);
  const incidentPowerW = solarFluxWm2 * design.collectorAreaM2 * deployed;
  const grossElectricW = incidentPowerW * design.conversionEfficiency;
  const wasteHeatW = incidentPowerW - grossElectricW;
  const radiatorTemperatureK = Math.pow(
    wasteHeatW / (RADIATOR_EMISSIVITY * STEFAN_BOLTZMANN * design.radiatorAreaM2),
    0.25,
  );

  // Areal densities, bus mass, transmission efficiency, and FOUNDRY throughput are RUIN scenario parameters.
  const arrayMassKg = design.collectorAreaM2 * 2.2;
  const radiatorMassKg = design.radiatorAreaM2 * 4;
  const shieldingMassKg = design.shieldThicknessMm * 610;
  const dryBusMassKg = 4800;
  const serviceRobotsKg = 900;
  const totalMassKg =
    arrayMassKg + radiatorMassKg + shieldingMassKg + dryBusMassKg + serviceRobotsKg + design.propellantKg;
  const deliveredPowerW = grossElectricW * 0.88;
  const structuralMetalKg = totalMassKg * 0.7;
  const traceMetalKg = totalMassKg * 0.045;

  return {
    solarFluxWm2: round(solarFluxWm2, 0),
    incidentPowerMW: round(incidentPowerW / 1e6, 3),
    grossElectricMW: round(grossElectricW / 1e6, 3),
    wasteHeatMW: round(wasteHeatW / 1e6, 3),
    radiatorTemperatureK: round(radiatorTemperatureK, 1),
    deliveredPowerMW: round(deliveredPowerW / 1e6, 3),
    totalMassKg: round(totalMassKg, 0),
    structuralMetalKg: round(structuralMetalKg, 0),
    traceMetalKg: round(traceMetalKg, 0),
    foundryShifts: round(structuralMetalKg / 3100 + traceMetalKg / 180, 1),
    thermalMarginK: round(MAX_RADIATOR_TEMPERATURE_K - radiatorTemperatureK, 1),
    powerToMassWkg: round(deliveredPowerW / totalMassKg, 1),
  };
}

export function safeDeploymentFraction(design: CollectorDesign, fluxMultiplier = 1): number {
  const normalized = normalizeCollectorDesign(design);
  const flux = (SOLAR_IRRADIANCE_1_AU_WM2 / normalized.orbitAu ** 2) * fluxMultiplier;
  const maxWasteW =
    RADIATOR_EMISSIVITY * STEFAN_BOLTZMANN * normalized.radiatorAreaM2 * MAX_RADIATOR_TEMPERATURE_K ** 4;
  const fullWasteW = flux * normalized.collectorAreaM2 * (1 - normalized.conversionEfficiency);
  return clamp(maxWasteW / Math.max(1, fullWasteW), 0.08, 1);
}
