import { DEFAULT_CONFIG } from "./simulation";
import type { SimulationSnapshot } from "./types";

export function projectCivilization(snapshot: SimulationSnapshot) {
  const deliveredRatio =
    snapshot.metrics.demandGW === 0 ? 1 : snapshot.metrics.deliveredGW / snapshot.metrics.demandGW;
  const isolatedRatio = snapshot.metrics.isolatedCount / DEFAULT_CONFIG.satelliteCount;
  const offlineRatio = snapshot.metrics.offlineCount / DEFAULT_CONFIG.satelliteCount;
  const thermalRatio = snapshot.metrics.thermalCount / DEFAULT_CONFIG.satelliteCount;
  const stress = Math.min(
    1,
    Math.max(0, (1 - deliveredRatio) * 1.1 + isolatedRatio + offlineRatio * 2.4 + thermalRatio * 0.45),
  );
  const horizons = [
    { label: "NOW", years: 0, growth: 0, loss: 0, trustLoss: 0 },
    { label: "+1 YEAR", years: 1, growth: 0.004, loss: 0.06, trustLoss: 18 },
    { label: "+10 YEARS", years: 10, growth: 0.035, loss: 0.34, trustLoss: 52 },
    { label: "+50 YEARS", years: 50, growth: 0.12, loss: 0.8, trustLoss: 100 },
  ].map((point) => {
    const population = 8.12 * (1 + point.growth - point.loss * stress);
    const trust = Math.max(4, 84 - point.trustLoss * stress);
    const tone =
      population < 5.5 || trust < 32
        ? "irreversible"
        : population < 7.4 || trust < 60
          ? "uncertain"
          : "nominal";
    return { ...point, population, trust, tone };
  });

  return {
    population: 8.12,
    energySecurity: Math.max(0, Math.min(100, deliveredRatio * 100)),
    industrialCapacity: snapshot.metrics.availabilityPercent,
    institutionalTrust: Math.max(4, 84 - stress * 52),
    signalDelaySeconds: 200,
    stress,
    horizons,
  };
}
