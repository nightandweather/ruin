import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CONFIG, DysonSwarmSimulation } from "./simulation";
import { runFirstLight, type FirstLightReport } from "./firstLight";
import { projectCivilization } from "./civilizationProjection";
import { angularDistance, inspectSatellite } from "./satelliteInspection";
import type { Satellite, ScenarioType, SimulationSnapshot } from "./types";

const scenarioLabels: Record<ScenarioType, { code: string; title: string; detail: string }> = {
  "communications-blackout": { code: "COMMS", title: "Relay blackout", detail: "Isolate 30% of nodes" },
  "thermal-wave": { code: "FLARE", title: "Thermal wave", detail: "Heat 20% of nodes" },
  "cascade-failure": { code: "FAULT", title: "Cascade failure", detail: "Drop 5% of collectors" },
  "demand-spike": { code: "LOAD", title: "Demand spike", detail: "Raise target by 35%" },
  "debris-corridor": { code: "ROCK", title: "Debris corridor", detail: "Predict and evade impacts" },
};

const formatElapsed = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `T+${String(hours).padStart(3, "0")}:${String(minutes).padStart(2, "0")}`;
};

function screenPosition(satellite: Satellite, tick: number, width: number, height: number) {
  const maxRadius = Math.min(width, height) * 0.45;
  const radius = maxRadius * (0.42 + satellite.band * 0.075);
  const angle = satellite.phase + tick * (0.0005 + satellite.band * 0.00003);
  return { x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius * 0.58 };
}

function SwarmMap({
  satellites,
  tick,
  debrisBearing,
  selectedId,
  onSelect,
  onClear,
}: {
  satellites: readonly Satellite[];
  tick: number;
  debrisBearing?: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;
    const glow = context.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.32);
    glow.addColorStop(0, "rgba(255, 215, 120, 0.95)");
    glow.addColorStop(0.12, "rgba(255, 139, 51, 0.38)");
    glow.addColorStop(1, "rgba(255, 139, 51, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(cx, cy, maxRadius * 0.34, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff3c4";
    context.beginPath();
    context.arc(cx, cy, 7, 0, Math.PI * 2);
    context.fill();

    if (debrisBearing !== undefined) {
      const bearing = (debrisBearing * Math.PI) / 180;
      const startX = cx + Math.cos(bearing) * maxRadius * 1.42;
      const startY = cy + Math.sin(bearing) * maxRadius * 0.88;
      const endX = cx + Math.cos(bearing + Math.PI) * maxRadius * 0.86;
      const endY = cy + Math.sin(bearing + Math.PI) * maxRadius * 0.5;
      context.save();
      context.strokeStyle = "rgba(255, 79, 104, .9)";
      context.fillStyle = "#ff4f68";
      context.lineWidth = 1.2;
      context.setLineDash([7, 6]);
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
      context.setLineDash([]);
      context.beginPath();
      context.arc(startX, startY, 3.5, 0, Math.PI * 2);
      context.fill();
      context.font = "9px DM Mono";
      context.fillText(`INBOUND ${Math.round(debrisBearing)}°`, startX - 34, startY - 10);
      context.restore();
    }

    context.lineWidth = 0.5;
    for (let band = 0; band < DEFAULT_CONFIG.orbitBands; band += 1) {
      context.strokeStyle = band % 2 === 0 ? "rgba(160, 179, 192, .12)" : "rgba(160, 179, 192, .06)";
      context.beginPath();
      context.ellipse(
        cx,
        cy,
        maxRadius * (0.42 + band * 0.075),
        maxRadius * (0.22 + band * 0.045),
        -0.18,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }

    const civilizationNodes = [
      [0.16, 0.29],
      [0.27, 0.18],
      [0.74, 0.2],
      [0.86, 0.34],
      [0.81, 0.72],
      [0.63, 0.82],
      [0.24, 0.76],
      [0.12, 0.58],
    ];
    context.save();
    context.strokeStyle = "rgba(151, 164, 160, .16)";
    context.fillStyle = "rgba(201, 211, 205, .72)";
    context.setLineDash([2, 5]);
    for (let index = 0; index < civilizationNodes.length; index += 1) {
      const [nx, ny] = civilizationNodes[index];
      const x = width * nx;
      const y = height * ny;
      const [nextX, nextY] = civilizationNodes[(index + 1) % civilizationNodes.length];
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(width * nextX, height * nextY);
      context.stroke();
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(cx, cy);
      context.stroke();
      context.setLineDash([]);
      context.beginPath();
      context.arc(x, y, index % 3 === 0 ? 3 : 2, 0, Math.PI * 2);
      context.fill();
      context.setLineDash([2, 5]);
    }
    context.restore();

    const sampleStep = Math.max(1, Math.floor(satellites.length / 1600));
    for (let index = 0; index < satellites.length; index += sampleStep) {
      const satellite = satellites[index];
      const { x, y } = screenPosition(satellite, tick, width, height);
      const color =
        satellite.mode === "offline"
          ? "#ff4f68"
          : satellite.mode === "isolated"
            ? "#d49a50"
            : satellite.mode === "thermal"
              ? "#ff8b33"
              : satellite.mode === "curtailed"
                ? "#55727d"
                : "#64f3c2";
      context.fillStyle = color;
      context.globalAlpha = satellite.mode === "nominal" ? 0.92 : 0.72;
      context.fillRect(x, y, 1.4, 1.4);
    }
    context.globalAlpha = 1;

    const selected = selectedId === null ? undefined : satellites[selectedId];
    if (selected) {
      const selectedPosition = screenPosition(selected, tick, width, height);
      const neighbors = satellites
        .filter((candidate) => candidate.id !== selected.id && candidate.band === selected.band)
        .sort(
          (left, right) =>
            angularDistance(left.phase, selected.phase) - angularDistance(right.phase, selected.phase),
        )
        .slice(0, 6);
      context.save();
      context.strokeStyle = "rgba(216, 164, 94, .38)";
      context.lineWidth = 0.8;
      for (const neighbor of neighbors) {
        const neighborPosition = screenPosition(neighbor, tick, width, height);
        context.beginPath();
        context.moveTo(selectedPosition.x, selectedPosition.y);
        context.lineTo(neighborPosition.x, neighborPosition.y);
        context.stroke();
      }
      context.strokeStyle = "#d8a45e";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(selectedPosition.x, selectedPosition.y, 9, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(selectedPosition.x, selectedPosition.y, 14, 0, Math.PI * 2);
      context.setLineDash([2, 4]);
      context.stroke();
      context.restore();
    }
  }, [satellites, tick, debrisBearing, selectedId]);

  const selectAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    const sampleStep = Math.max(1, Math.floor(satellites.length / 1600));
    let nearestId: number | null = null;
    let nearestDistance = 15 ** 2;
    for (let index = 0; index < satellites.length; index += sampleStep) {
      const position = screenPosition(satellites[index], tick, bounds.width, bounds.height);
      const distance = (position.x - x) ** 2 + (position.y - y) ** 2;
      if (distance < nearestDistance) {
        nearestId = satellites[index].id;
        nearestDistance = distance;
      }
    }
    if (nearestId === null) onClear();
    else onSelect(nearestId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="swarm-canvas"
      aria-label="Interactive orbital map of sampled swarm collectors"
      onClick={(event) => selectAt(event.clientX, event.clientY)}
    />
  );
}

function Metric({
  label,
  value,
  unit,
  tone = "plain",
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}

function CausalHorizon({ snapshot }: { snapshot: SimulationSnapshot }) {
  const civilization = projectCivilization(snapshot);
  return (
    <section className="causal-horizon" aria-label="Projected civilization consequences">
      <header>
        <span>PROJECTED CONSEQUENCES</span>
        <b>MODEL CONFIDENCE {(92 - civilization.stress * 39).toFixed(0)}%</b>
      </header>
      <div className="horizon-track">
        {civilization.horizons.map((point, index) => (
          <article key={point.label} className={point.tone}>
            <i>{String(index + 1).padStart(2, "0")}</i>
            <span>
              {point.label}
              <small>HELIOS C.E. {2321 + point.years}.117</small>
            </span>
            <strong>
              {point.population.toFixed(2)}B<small>POPULATION</small>
            </strong>
            <strong>
              {point.trust.toFixed(0)}%<small>INSTITUTIONAL TRUST</small>
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}

type SatelliteInspection = NonNullable<ReturnType<typeof inspectSatellite>>;

function SatelliteInspector({
  inspection,
  onClose,
  onSelect,
}: {
  inspection: SatelliteInspection;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const { satellite } = inspection;
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [satellite.id]);
  const localTotal = Math.max(1, inspection.localNodes.length);
  const localModes = (["nominal", "curtailed", "isolated", "thermal", "offline"] as const).filter(
    (mode) => inspection.localCounts[mode] > 0,
  );
  return (
    <aside
      ref={panelRef}
      className={`satellite-inspector ${satellite.mode}`}
      aria-label={`Collector ${satellite.id} local inspection`}
    >
      <header>
        <div>
          <span>LOCAL SYSTEM INSPECTION</span>
          <b>COLLECTOR {String(satellite.id).padStart(5, "0")}</b>
        </div>
        <button aria-label="Close collector inspection" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="inspection-status">
        <i />
        <span>CONTROL MODE</span>
        <b>{satellite.mode.toUpperCase()}</b>
        <small>
          BAND {String(satellite.band + 1).padStart(2, "0")} · BEARING {inspection.bearingDegrees.toFixed(1)}°
        </small>
      </div>
      <div className="inspection-metrics">
        <span>HEALTH MARGIN</span>
        <b>{inspection.healthMarginPercent.toFixed(1)}%</b>
        <span>LINK QUALITY</span>
        <b>{(satellite.linkQuality * 100).toFixed(1)}%</b>
        <span>NEIGHBOR MESH</span>
        <b>{(inspection.meanNeighborLink * 100).toFixed(1)}%</b>
        <span>THERMAL MARGIN</span>
        <b className={inspection.thermalMarginK < 12 ? "warning" : ""}>
          {inspection.thermalMarginK.toFixed(1)} K
        </b>
        <span>DELIVERED POWER</span>
        <b>{satellite.deliveredMW.toFixed(3)} MW</b>
        <span>POWER RESERVE</span>
        <b>{inspection.powerMarginMW.toFixed(3)} MW</b>
        <span>ONE-WAY DELAY</span>
        <b>{inspection.oneWayDelaySeconds.toFixed(1)} s</b>
        <span>LOCAL POPULATION</span>
        <b>{inspection.localNodes.length} NODES</b>
      </div>
      <section className="local-composition">
        <span>LOCAL OPERATING FIELD</span>
        {localModes.map((mode) => (
          <div key={mode}>
            <label>
              {mode.toUpperCase()} <b>{inspection.localCounts[mode]}</b>
            </label>
            <i>
              <em
                className={mode}
                style={{ width: `${(inspection.localCounts[mode] / localTotal) * 100}%` }}
              />
            </i>
          </div>
        ))}
      </section>
      <section className="neighbor-list">
        <span>AUTHENTICATED NEIGHBORS</span>
        <div>
          {inspection.neighbors.map((neighbor) => (
            <button key={neighbor.id} onClick={() => onSelect(neighbor.id)}>
              <i className={neighbor.mode} />
              <b>{String(neighbor.id).padStart(5, "0")}</b>
              <small>{(neighbor.linkQuality * 100).toFixed(0)}% LINK</small>
            </button>
          ))}
        </div>
      </section>
      <section className="hazard-list">
        <span>ACTIVE SYSTEM HAZARDS</span>
        <div>
          {inspection.activeHazards.length === 0 ? (
            <b>NOMINAL ENVELOPE</b>
          ) : (
            inspection.activeHazards.map((hazard) => (
              <b key={hazard}>{hazard.replaceAll("-", " ").toUpperCase()}</b>
            ))
          )}
        </div>
      </section>
      <footer>
        <span>AUTONOMY RECOMMENDATION</span>
        <p>{inspection.recommendation}</p>
        <small>SELECTION REMAINS LIVE · TELEMETRY FOLLOWS CONTROL TICKS</small>
      </footer>
    </aside>
  );
}

export function App() {
  const [simulation, setSimulation] = useState(() => new DysonSwarmSimulation());
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [debrisBearing, setDebrisBearing] = useState(315);
  const [campaign, setCampaign] = useState<FirstLightReport | null>(null);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSnapshot(simulation.step(speed)), 250);
    return () => window.clearInterval(timer);
  }, [running, simulation, speed]);

  const status = useMemo(() => {
    if (snapshot.metrics.availabilityPercent < 90) return { label: "CRITICAL", tone: "critical" };
    if (snapshot.activeScenarios.length > 0) return { label: "DEGRADED", tone: "warning" };
    return { label: "NOMINAL", tone: "nominal" };
  }, [snapshot]);
  const civilization = useMemo(() => projectCivilization(snapshot), [snapshot]);
  const inspection = useMemo(
    () => (selectedSatelliteId === null ? null : inspectSatellite(snapshot, selectedSatelliteId)),
    [snapshot, selectedSatelliteId],
  );

  const inject = (type: ScenarioType) =>
    setSnapshot(simulation.inject(type, type === "debris-corridor" ? { bearingDeg: debrisBearing } : {}));
  const requestReplacements = () => setSnapshot(simulation.requestProduction(50));
  const reset = () => {
    const next = new DysonSwarmSimulation();
    setSimulation(next);
    setSnapshot(next.snapshot());
    setRunning(true);
    setCampaign(null);
    setSelectedSatelliteId(null);
  };
  const runCampaign = () => {
    const report = runFirstLight();
    setRunning(false);
    setSnapshot(report.finalSnapshot);
    setSelectedSatelliteId(null);
    setCampaign(report);
  };
  const exportSnapshot = () => {
    const safeSnapshot = {
      ...snapshot,
      satellites: snapshot.satellites.map(({ id, band, health, temperatureK, mode }) => ({
        id,
        band,
        health,
        temperatureK,
        mode,
      })),
    };
    const blob = new Blob([JSON.stringify(safeSnapshot, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `helios-snapshot-tick-${snapshot.tick}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="sun-mark">✦</span>
          <div>
            <strong>RUIN // HELIOS</strong>
            <small>CIVILIZATION OPERATIONS · C.E. 2321.117</small>
          </div>
        </div>
        <div className="mission-clock">
          <span>CONSENSUS CONTROL TIME</span>
          <strong>{formatElapsed(snapshot.elapsedSeconds)}</strong>
        </div>
        <div className="module-links">
          <a className="module-link" href="./horizons.html">
            HORIZONS ↗
          </a>
          <a className="module-link" href="./foundry.html">
            FOUNDRY ↗
          </a>
          <a className="module-link" href="./collector.html">
            COLLECTOR ↗
          </a>
          <a className="module-link" href="./datacore.html">
            DATACORE ↗
          </a>
          <a className="module-link" href="./agraria.html">
            AGRARIA ↗
          </a>
          <a className="module-link" href="./aegis.html">
            AEGIS ↗
          </a>
          <a className="module-link" href="./progenitor.html">
            PROGENITOR ↗
          </a>
          <a className="module-link" href="./gravitas.html">
            GRAVITAS ↗
          </a>
          <a className="module-link" href="./atlas.html">
            ATLAS ↗
          </a>
          <a className="module-link" href="./navis.html">
            NAVIS ↗
          </a>
          <a className="module-link" href="./ignis.html">
            IGNIS ↗
          </a>
          <a className="module-link" href="./odyssey.html">
            ODYSSEY ↗
          </a>
          <a className="module-link" href="./mender.html">
            MENDER ↗
          </a>
          <a className="module-link" href="./corvus.html">
            CORVUS ↗
          </a>
          <a className="module-link" href="./prometheus.html">
            PROMETHEUS ↗
          </a>
          <a className="module-link" href="./genesis.html">
            GENESIS ↗
          </a>
          <a className="module-link" href="./mnemosyne.html">
            MNEMOSYNE ↗
          </a>
          <a className="module-link" href="./sentinel.html">
            SENTINEL ↗
          </a>
        </div>
        <div className={`system-status ${status.tone}`}>
          <i />
          SYSTEM {status.label}
        </div>
      </header>

      <section className="layout">
        <aside className="left-panel panel">
          <div className="section-title">
            <span>01</span> CIVILIZATION STATE
          </div>
          <div className="civilization-vitals">
            <Metric label="POPULATION" value={civilization.population.toFixed(2)} unit="B" />
            <Metric
              label="ENERGY SECURITY"
              value={civilization.energySecurity.toFixed(1)}
              unit="%"
              tone={civilization.energySecurity < 90 ? "alert" : "good"}
            />
            <Metric label="INDUSTRIAL CAPACITY" value={civilization.industrialCapacity.toFixed(1)} unit="%" />
            <Metric
              label="INSTITUTIONAL TRUST"
              value={civilization.institutionalTrust.toFixed(0)}
              unit="%"
              tone={
                civilization.institutionalTrust < 60
                  ? "critical"
                  : civilization.institutionalTrust < 75
                    ? "alert"
                    : "good"
              }
            />
          </div>
          <div className="swarm-ledger">
            <span>
              ACTIVE COLLECTORS <b>{DEFAULT_CONFIG.satelliteCount.toLocaleString()}</b>
            </span>
            <span>
              MEAN THERMAL <b>{snapshot.metrics.averageTemperatureK.toFixed(1)} K</b>
            </span>
            <span>
              ONE-WAY SIGNAL <b>{civilization.signalDelaySeconds} s</b>
            </span>
          </div>
          <div className="mode-grid">
            <div>
              <span className="dot nominal" />
              Dispatchable
              <strong>
                {DEFAULT_CONFIG.satelliteCount -
                  snapshot.metrics.offlineCount -
                  snapshot.metrics.isolatedCount}
              </strong>
            </div>
            <div>
              <span className="dot isolated" />
              Isolated<strong>{snapshot.metrics.isolatedCount}</strong>
            </div>
            <div>
              <span className="dot thermal" />
              Thermal<strong>{snapshot.metrics.thermalCount}</strong>
            </div>
            <div>
              <span className="dot offline" />
              Offline<strong>{snapshot.metrics.offlineCount}</strong>
            </div>
          </div>

          <div className="section-title section-gap">
            <span>02</span> OPERATOR DIRECTIVES
          </div>
          <div className="scenario-list">
            {(Object.keys(scenarioLabels) as ScenarioType[]).map((type) => {
              const item = scenarioLabels[type];
              const active = snapshot.activeScenarios.some((scenario) => scenario.type === type);
              return (
                <button
                  key={type}
                  className={active ? "active" : ""}
                  onClick={() => inject(type)}
                  disabled={active}
                >
                  <b>{item.code}</b>
                  <span>
                    {item.title}
                    <small>{item.detail}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <label className="bearing-control">
            <span>
              DEBRIS BEARING <b>{String(debrisBearing).padStart(3, "0")}°</b>
            </span>
            <input
              type="range"
              min="0"
              max="359"
              value={debrisBearing}
              onChange={(event) => setDebrisBearing(Number(event.target.value))}
            />
          </label>
        </aside>

        <section className="center-stack">
          <div className={`map-panel panel ${inspection ? "inspecting" : ""}`}>
            <div className="panel-label">CIVILIZATION NETWORK // INNER SYSTEM // 0.40 AU</div>
            <SwarmMap
              satellites={snapshot.satellites}
              tick={snapshot.tick}
              debrisBearing={
                snapshot.activeScenarios.find((scenario) => scenario.type === "debris-corridor")?.bearingDeg
              }
              selectedId={selectedSatelliteId}
              onSelect={setSelectedSatelliteId}
              onClear={() => setSelectedSatelliteId(null)}
            />
            {campaign && <FirstLightEvidence report={campaign} close={() => setCampaign(null)} />}
            {inspection && (
              <SatelliteInspector
                inspection={inspection}
                onClose={() => setSelectedSatelliteId(null)}
                onSelect={setSelectedSatelliteId}
              />
            )}
            <button className="map-node node-a" onClick={() => setSelectedSatelliteId(410)}>
              <i />
              L5 RELAY NEXUS<small>Δ 2.1 s · INSPECT</small>
            </button>
            <button className="map-node node-b" onClick={() => setSelectedSatelliteId(2681)}>
              <i />
              INNER COLONIES<small>61 HABITATS · INSPECT</small>
            </button>
            <button className="map-node node-c" onClick={() => setSelectedSatelliteId(7940)}>
              <i />
              OUTER SETTLEMENTS<small>Δ 199.6 s · INSPECT</small>
            </button>
            <div className="signal-key">
              <span>SIGNAL DELAY</span>
              <i className="instant" />
              0–5 s<i className="delayed" />
              30–200 s<i className="lost" />
              PARTITION
            </div>
            <div className="map-readout left">
              CIVILIZATION NODES
              <br />
              <strong>18,732</strong>
            </div>
            <div className="map-readout right">
              ORBITAL ASSETS
              <br />
              <strong>14,398</strong>
            </div>
          </div>
          <div className="power-panel panel">
            <div className="power-head">
              <div>
                <span>GRID DELIVERY</span>
                <strong>
                  {snapshot.metrics.deliveredGW.toFixed(2)} <small>GW</small>
                </strong>
              </div>
              <div>
                <span>DEMAND</span>
                <strong>
                  {snapshot.metrics.demandGW.toFixed(2)} <small>GW</small>
                </strong>
              </div>
              <div>
                <span>CURTAILED</span>
                <strong>
                  {snapshot.metrics.curtailedGW.toFixed(2)} <small>GW</small>
                </strong>
              </div>
            </div>
            <CausalHorizon snapshot={snapshot} />
          </div>
        </section>

        <aside className="right-panel panel">
          <div className="section-title">
            <span>03</span> EVENT PROVENANCE
          </div>
          <div className="event-stream">
            {snapshot.events.map((event) => (
              <article key={event.id} className={event.level}>
                <time>τ {String(event.tick).padStart(5, "0")}</time>
                <b>{event.source}</b>
                <p>{event.message}</p>
              </article>
            ))}
          </div>
          <div className="logistics-block">
            <div className="section-title compact">
              <span>04</span> ORBITAL SUPPLY
            </div>
            <div className="logistics-grid">
              <span>FACTORY QUEUE</span>
              <b>{snapshot.logistics.factoryBacklog}</b>
              <span>GROUND STOCK</span>
              <b>{snapshot.logistics.groundInventory}</b>
              <span>ORBITAL STOCK</span>
              <b>{snapshot.logistics.orbitalInventory}</b>
              <span>INSTALLED</span>
              <b>{snapshot.logistics.replacementsInstalled}</b>
            </div>
            <div className="elevator-status">
              <span>GEO CLIMBER</span>
              <b>
                {snapshot.logistics.elevatorStatus === "ascending"
                  ? `ASCENT ${snapshot.logistics.elevatorProgressPercent}% · ${snapshot.logistics.elevatorCargo} UNITS`
                  : "STANDBY"}
              </b>
              <div>
                <i
                  style={{
                    width: `${snapshot.logistics.elevatorStatus === "ascending" ? snapshot.logistics.elevatorProgressPercent : 0}%`,
                  }}
                />
              </div>
            </div>
            <button className="production-request" onClick={requestReplacements}>
              REQUEST 50 REPLACEMENTS
            </button>
          </div>
          <div className="safety-block">
            <span>INSTITUTIONAL STATUS</span>
            <div className="institution-grid">
              <span>CUSTODIAN OVERSIGHT</span>
              <b>ACTIVE</b>
              <span>CONTINUITY PROTOCOLS</span>
              <b>{status.label === "CRITICAL" ? "CONTESTED" : "STANDBY"}</b>
              <span>ETHICAL FRAMEWORK</span>
              <b>NOMINAL</b>
              <span>AUDIT TRAIL</span>
              <b>VERIFIED</b>
            </div>
            <span>BEAM SAFETY INTERLOCKS</span>
            <strong>
              {snapshot.metrics.safetyTrips === 0 ? "ARMED" : `${snapshot.metrics.safetyTrips} TRIPS`}
            </strong>
            <div className="safety-line">
              <i style={{ width: `${Math.max(2, 100 - snapshot.metrics.safetyTrips)}%` }} />
            </div>
            <div className="avoidance-readout">
              <span>EVASIVE BURNS</span>
              <b>{snapshot.metrics.avoidanceManeuvers}</b>
              <span>IMPACTS</span>
              <b>{snapshot.metrics.confirmedImpacts}</b>
            </div>
          </div>
        </aside>
      </section>

      <footer>
        <div className="controls">
          <button className="primary" onClick={() => setRunning((value) => !value)}>
            {running ? "Ⅱ  PAUSE" : "▶  RUN"}
          </button>
          {[1, 5, 20].map((value) => (
            <button key={value} className={speed === value ? "selected" : ""} onClick={() => setSpeed(value)}>
              {value}×
            </button>
          ))}
          <button onClick={() => setSnapshot(simulation.step(1))} disabled={running}>
            STEP
          </button>
          <button onClick={reset}>RESET</button>
          <button className="campaign-launch" onClick={runCampaign}>
            RUN FIRST LIGHT
          </button>
        </div>
        <div className="footer-meta">
          <span>SEED {DEFAULT_CONFIG.seed}</span>
          <span>TICK {snapshot.tick.toLocaleString()}</span>
          <button onClick={exportSnapshot}>EXPORT SNAPSHOT ↓</button>
        </div>
      </footer>
    </main>
  );
}

function FirstLightEvidence({ report, close }: { report: FirstLightReport; close: () => void }) {
  const invariants = report.checkpoints.at(-1)!.invariants;
  return (
    <section className="campaign-evidence" aria-label="FIRST LIGHT deterministic campaign evidence">
      <header>
        <div>
          <span>COMMISSIONED SCENARIO // 001</span>
          <b>FIRST LIGHT</b>
        </div>
        <button aria-label="Close FIRST LIGHT evidence" onClick={close}>
          ×
        </button>
      </header>
      <div className="campaign-sequence">
        {report.checkpoints.map((c, i) => (
          <article key={c.tick}>
            <i>{String(i + 1).padStart(2, "0")}</i>
            <span>
              <b>{c.label}</b>
              <small>
                τ {c.tick} · AVAIL {c.availabilityPercent.toFixed(1)}% · {c.deliveredGW.toFixed(1)} GW
              </small>
            </span>
          </article>
        ))}
      </div>
      <div className="campaign-proof">
        <div>
          <span>REPLAY HASH</span>
          <b>{report.traceHash}</b>
          <small>{report.replayVerified ? "MATCHED ON SECOND EXECUTION" : "REPLAY DIVERGED"}</small>
        </div>
        <div>
          <span>SAFETY CONTRACT</span>
          <b>{report.allInvariantsPass ? "5 / 5 PASS" : "VIOLATION"}</b>
          <small>ALL CHECKPOINTS</small>
        </div>
      </div>
      <div className="campaign-invariants">
        {invariants.map((x) => (
          <p key={x.id} className={x.passed ? "pass" : "fail"}>
            <i>{x.passed ? "✓" : "×"}</i>
            <span>
              {x.label}
              <small>{x.detail}</small>
            </span>
          </p>
        ))}
      </div>
      <footer>SEED {report.seed} · SAME INPUT → SAME TRACE · EVIDENCE BEFORE RESET</footer>
    </section>
  );
}
