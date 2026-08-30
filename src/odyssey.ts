export type RelayTopology = "origin" | "endpoints" | "chain";
export type OdysseyStatus = "NETWORKED" | "DEGRADED" | "BLACKOUT" | "THERMAL-LIMIT";

export interface OdysseyConfig {
  routeDistanceLy: number;
  positionPercent: number;
  cruiseFractionC: number;
  topology: RelayTopology;
  relayCount: number;
  transmitterPowerPW: number;
  wavelengthNm: number;
  transmitterApertureKm: number;
  receiverDiameterM: number;
  pointingJitterNrad: number;
  transmissionEfficiency: number;
  receiverEfficiency: number;
  hotelPowerMW: number;
  propulsionIspS: number;
  propulsionEfficiency: number;
  vehicleMassT: number;
  radiatorAreaM2: number;
  radiatorTemperatureK: number;
  storageGWh: number;
  relayOutage: boolean;
}

export interface RelayNode {
  id: string;
  positionPercent: number;
  distanceLy: number;
  active: boolean;
}
export interface OdysseyResult {
  relays: readonly RelayNode[];
  nearestRelay: RelayNode;
  relayDistanceLy: number;
  diffractionAngleNrad: number;
  effectiveBeamAngleNrad: number;
  beamRadiusKm: number;
  capturePercent: number;
  incidentPowerMW: number;
  receivedPowerMW: number;
  busMarginMW: number;
  propulsionPowerMW: number;
  thrustN: number;
  accelerationMicroG: number;
  deltaVPerDayMS: number;
  receiverWasteHeatMW: number;
  propulsionWasteHeatMW: number;
  radiatorCapacityMW: number;
  thermalMarginMW: number;
  reserveHours: number;
  commandDelayYears: number;
  navigationUncertaintyKm: number;
  remainingYears: number;
  status: OdysseyStatus;
  constraints: readonly string[];
}

const LIGHT_YEAR_M = 9.4607304725808e15;
const G0 = 9.80665;
const SIGMA = 5.670374419e-8;
const EMISSIVITY = 0.88;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function odysseyConfig(routeDistanceLy = 10.475): OdysseyConfig {
  return {
    routeDistanceLy,
    positionPercent: 35,
    cruiseFractionC: 0.002,
    topology: "chain",
    relayCount: 5,
    transmitterPowerPW: 8,
    wavelengthNm: 1064,
    transmitterApertureKm: 10,
    receiverDiameterM: 2000,
    pointingJitterNrad: 0.5,
    transmissionEfficiency: 0.72,
    receiverEfficiency: 0.55,
    hotelPowerMW: 4,
    propulsionIspS: 6000,
    propulsionEfficiency: 0.62,
    vehicleMassT: 695,
    radiatorAreaM2: 60000,
    radiatorTemperatureK: 480,
    storageGWh: 2,
    relayOutage: false,
  };
}

export function buildRelays(config: OdysseyConfig): RelayNode[] {
  const count =
    config.topology === "origin"
      ? 1
      : config.topology === "endpoints"
        ? 2
        : Math.max(2, Math.floor(config.relayCount));
  return Array.from({ length: count }, (_, index) => {
    const positionPercent = count === 1 ? 0 : (index / (count - 1)) * 100;
    return {
      id:
        index === 0
          ? "HELIOS // SOL"
          : index === count - 1
            ? "NEIGHBOR SWARM"
            : `DEEP RELAY ${String(index).padStart(2, "0")}`,
      positionPercent,
      distanceLy: (config.routeDistanceLy * positionPercent) / 100,
      active: !(config.relayOutage && index === Math.floor(count / 2)),
    };
  });
}

export function evaluateVoyage(config: OdysseyConfig): OdysseyResult {
  const routeDistanceLy = Math.max(0.000001, config.routeDistanceLy);
  const positionPercent = clamp(config.positionPercent, 0, 100);
  const relays = buildRelays(config);
  const activeRelays = relays.filter((relay) => relay.active);
  const nearestRelay = (activeRelays.length ? activeRelays : relays).reduce((best, relay) =>
    Math.abs(relay.positionPercent - positionPercent) < Math.abs(best.positionPercent - positionPercent)
      ? relay
      : best,
  );
  const relayDistanceLy = (Math.abs(nearestRelay.positionPercent - positionPercent) / 100) * routeDistanceLy;
  const rangeM = Math.max(1_000_000, relayDistanceLy * LIGHT_YEAR_M);
  const wavelengthM = Math.max(1e-12, config.wavelengthNm * 1e-9);
  const apertureM = Math.max(1, config.transmitterApertureKm * 1000);
  const diffractionAngleRad = (1.22 * wavelengthM) / apertureM;
  const jitterAngleRad = Math.max(0, config.pointingJitterNrad) * 1e-9;
  const effectiveAngleRad = Math.hypot(diffractionAngleRad, jitterAngleRad);
  const beamRadiusM = Math.max(apertureM / 2, rangeM * effectiveAngleRad);
  const receiverAreaM2 = Math.PI * (Math.max(1, config.receiverDiameterM) / 2) ** 2;
  const beamAreaM2 = Math.PI * beamRadiusM ** 2;
  const captureFraction = clamp(receiverAreaM2 / beamAreaM2, 0, 1);
  const transmitterPowerW = Math.max(0, config.transmitterPowerPW) * 1e15;
  const incidentPowerMW =
    (transmitterPowerW * clamp(config.transmissionEfficiency, 0, 1) * captureFraction) / 1e6;
  const receivedPowerMW = incidentPowerMW * clamp(config.receiverEfficiency, 0, 1);
  const propulsionPowerMW = Math.max(0, receivedPowerMW - Math.max(0, config.hotelPowerMW));
  const busMarginMW = receivedPowerMW - config.hotelPowerMW;
  const exhaustVelocityMS = Math.max(1, config.propulsionIspS * G0);
  const thrustN =
    (2 * clamp(config.propulsionEfficiency, 0, 1) * propulsionPowerMW * 1e6) / exhaustVelocityMS;
  const vehicleMassKg = Math.max(1, config.vehicleMassT * 1000);
  const accelerationMS2 = thrustN / vehicleMassKg;
  const receiverWasteHeatMW = incidentPowerMW - receivedPowerMW;
  const propulsionWasteHeatMW = propulsionPowerMW * (1 - clamp(config.propulsionEfficiency, 0, 1));
  const radiatorCapacityMW =
    (EMISSIVITY *
      SIGMA *
      Math.max(0, config.radiatorAreaM2) *
      Math.max(1, config.radiatorTemperatureK) ** 4) /
    1e6;
  const thermalMarginMW =
    radiatorCapacityMW - receiverWasteHeatMW - propulsionWasteHeatMW - config.hotelPowerMW * 0.72;
  const reserveHours =
    config.hotelPowerMW > 0 ? (Math.max(0, config.storageGWh) * 1000) / config.hotelPowerMW : Infinity;
  const navigationUncertaintyKm = Math.max(0.1, ((rangeM * effectiveAngleRad) / 1000) * 0.001);
  const commandDelayYears = relayDistanceLy;
  const remainingYears =
    (routeDistanceLy * (1 - positionPercent / 100)) / Math.max(0.000001, config.cruiseFractionC);
  const constraints = [
    ...(activeRelays.length === 0 ? ["No operational energy relay remains"] : []),
    ...(receivedPowerMW < config.hotelPowerMW
      ? [
          `Beam delivers ${receivedPowerMW.toFixed(2)} MW below ${config.hotelPowerMW.toFixed(2)} MW survival load`,
        ]
      : []),
    ...(thermalMarginMW < 0 ? [`Heat rejection deficit ${Math.abs(thermalMarginMW).toFixed(2)} MW`] : []),
    ...(captureFraction < 1e-8 ? ["Receiver captures less than 0.000001% of transmitted beam"] : []),
    ...(commandDelayYears > 0.1
      ? [
          `Nearest relay command is ${commandDelayYears.toFixed(2)} light-years old; onboard autonomy is mandatory`,
        ]
      : []),
    ...(config.topology === "origin" && positionPercent > 50
      ? ["No destination-side relay exists for arrival and braking support"]
      : []),
    ...(config.relayOutage
      ? ["Scheduled relay is offline; route has re-acquired the next healthy node"]
      : []),
  ];
  const status: OdysseyStatus =
    activeRelays.length === 0 || receivedPowerMW <= 0
      ? "BLACKOUT"
      : thermalMarginMW < 0
        ? "THERMAL-LIMIT"
        : receivedPowerMW < config.hotelPowerMW
          ? "BLACKOUT"
          : busMarginMW < config.hotelPowerMW * 0.25 || config.relayOutage
            ? "DEGRADED"
            : "NETWORKED";
  return {
    relays,
    nearestRelay,
    relayDistanceLy,
    diffractionAngleNrad: diffractionAngleRad * 1e9,
    effectiveBeamAngleNrad: effectiveAngleRad * 1e9,
    beamRadiusKm: beamRadiusM / 1000,
    capturePercent: captureFraction * 100,
    incidentPowerMW,
    receivedPowerMW,
    busMarginMW,
    propulsionPowerMW,
    thrustN,
    accelerationMicroG: (accelerationMS2 / G0) * 1e6,
    deltaVPerDayMS: accelerationMS2 * 86400,
    receiverWasteHeatMW,
    propulsionWasteHeatMW,
    radiatorCapacityMW,
    thermalMarginMW,
    reserveHours,
    commandDelayYears,
    navigationUncertaintyKm,
    remainingYears,
    status,
    constraints,
  };
}
