import type { Satellite, SimulationSnapshot } from "./types";

export const angularDistance = (left: number, right: number) => {
  const difference = Math.abs(left - right) % (Math.PI * 2);
  return Math.min(difference, Math.PI * 2 - difference);
};

const recommendation = (satellite: Satellite) => {
  if (satellite.mode === "offline")
    return "Maintain hard power isolation; dispatch MENDER and reserve a replacement slot.";
  if (satellite.mode === "isolated")
    return "Hold export at zero; reacquire authenticated mesh quorum before beam authorization.";
  if (satellite.mode === "thermal")
    return "Derate conversion load and rotate radiator normal toward the cold-sky window.";
  if (satellite.mode === "curtailed")
    return "Preserve maneuver reserve; resume export only after the local constraint clears.";
  return "Continue autonomous dispatch; retain present thermal and collision margins.";
};

export function inspectSatellite(snapshot: SimulationSnapshot, satelliteId: number) {
  const satellite = snapshot.satellites[satelliteId];
  if (!satellite) return null;

  const sameBand = snapshot.satellites
    .filter((candidate) => candidate.id !== satellite.id && candidate.band === satellite.band)
    .sort(
      (left, right) =>
        angularDistance(left.phase, satellite.phase) - angularDistance(right.phase, satellite.phase),
    );
  const neighbors = sameBand.slice(0, 6);
  const localRadius = 0.18;
  const localNodes = snapshot.satellites.filter(
    (candidate) =>
      Math.abs(candidate.band - satellite.band) <= 1 &&
      angularDistance(candidate.phase, satellite.phase) <= localRadius,
  );
  const localCounts = {
    nominal: localNodes.filter((candidate) => candidate.mode === "nominal").length,
    curtailed: localNodes.filter((candidate) => candidate.mode === "curtailed").length,
    isolated: localNodes.filter((candidate) => candidate.mode === "isolated").length,
    thermal: localNodes.filter((candidate) => candidate.mode === "thermal").length,
    offline: localNodes.filter((candidate) => candidate.mode === "offline").length,
  };
  const meanNeighborLink =
    neighbors.length === 0
      ? satellite.linkQuality
      : neighbors.reduce((sum, node) => sum + node.linkQuality, 0) / neighbors.length;
  const activeHazards = snapshot.activeScenarios.map((scenario) => scenario.type);

  return {
    satellite,
    neighbors,
    localNodes,
    localCounts,
    meanNeighborLink,
    activeHazards,
    bearingDegrees: ((satellite.phase * 180) / Math.PI + 360) % 360,
    oneWayDelaySeconds: 196 + satellite.band * 1.15,
    healthMarginPercent: Math.max(0, satellite.health * 100),
    thermalMarginK: 585 - satellite.temperatureK,
    powerMarginMW: Math.max(0, satellite.capacityMW - satellite.deliveredMW),
    recommendation: recommendation(satellite),
  };
}
