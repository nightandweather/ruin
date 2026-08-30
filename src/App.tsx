import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CONFIG, DysonSwarmSimulation } from "./simulation";
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

function SwarmMap({ satellites, tick, debrisBearing }: { satellites: readonly Satellite[]; tick: number; debrisBearing?: number }) {
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
      context.ellipse(cx, cy, maxRadius * (0.42 + band * 0.075), maxRadius * (0.22 + band * 0.045), -0.18, 0, Math.PI * 2);
      context.stroke();
    }

    const sampleStep = Math.max(1, Math.floor(satellites.length / 1600));
    for (let index = 0; index < satellites.length; index += sampleStep) {
      const satellite = satellites[index];
      const radius = maxRadius * (0.42 + satellite.band * 0.075);
      const angle = satellite.phase + tick * (0.0005 + satellite.band * 0.00003);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.58;
      const color =
        satellite.mode === "offline"
          ? "#ff4f68"
          : satellite.mode === "isolated"
            ? "#8c7cff"
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
  }, [satellites, tick, debrisBearing]);

  return <canvas ref={canvasRef} className="swarm-canvas" aria-label="Orbital map of sampled swarm collectors" />;
}

function PowerChart({ snapshot }: { snapshot: SimulationSnapshot }) {
  const width = 700;
  const height = 150;
  const history = snapshot.history;
  const max = Math.max(1, ...history.flatMap((point) => [point.deliveredGW, point.demandGW])) * 1.1;
  const path = (key: "deliveredGW" | "demandGW") =>
    history
      .map((point, index) => {
        const x = history.length <= 1 ? 0 : (index / (history.length - 1)) * width;
        const y = height - (point[key] / max) * height;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Power delivery and demand history">
        <defs>
          <linearGradient id="power-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#64f3c2" stopOpacity=".23" />
            <stop offset="1" stopColor="#64f3c2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((line) => (
          <line key={line} x1="0" y1={height * line} x2={width} y2={height * line} className="gridline" />
        ))}
        {history.length > 1 && <path d={`${path("deliveredGW")} L${width},${height} L0,${height} Z`} fill="url(#power-fill)" />}
        <path d={path("demandGW")} className="demand-line" />
        <path d={path("deliveredGW")} className="power-line" />
      </svg>
      <div className="chart-legend"><span><i className="power-dot" />Delivered</span><span><i className="demand-dot" />Demand</span></div>
    </div>
  );
}

function Metric({ label, value, unit, tone = "plain" }: { label: string; value: string | number; unit?: string; tone?: string }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}<small>{unit}</small></strong>
    </div>
  );
}

export function App() {
  const [simulation, setSimulation] = useState(() => new DysonSwarmSimulation());
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [debrisBearing, setDebrisBearing] = useState(315);

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

  const inject = (type: ScenarioType) =>
    setSnapshot(simulation.inject(type, type === "debris-corridor" ? { bearingDeg: debrisBearing } : {}));
  const requestReplacements = () => setSnapshot(simulation.requestProduction(50));
  const reset = () => {
    const next = new DysonSwarmSimulation();
    setSimulation(next);
    setSnapshot(next.snapshot());
    setRunning(true);
  };
  const exportSnapshot = () => {
    const safeSnapshot = { ...snapshot, satellites: snapshot.satellites.map(({ id, band, health, temperatureK, mode }) => ({ id, band, health, temperatureK, mode })) };
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
        <div className="brand"><span className="sun-mark">✦</span><div><strong>HELIOS</strong><small>DYSON SWARM AUTONOMY</small></div></div>
        <div className="mission-clock"><span>SOL CONTROL TIME</span><strong>{formatElapsed(snapshot.elapsedSeconds)}</strong></div>
        <div className="module-links"><a className="module-link" href="/foundry.html">FOUNDRY ↗</a><a className="module-link" href="/collector.html">COLLECTOR ↗</a><a className="module-link" href="/datacore.html">DATACORE ↗</a><a className="module-link" href="/agraria.html">AGRARIA ↗</a><a className="module-link" href="/aegis.html">AEGIS ↗</a><a className="module-link" href="/progenitor.html">PROGENITOR ↗</a><a className="module-link" href="/gravitas.html">GRAVITAS ↗</a><a className="module-link" href="/atlas.html">ATLAS ↗</a><a className="module-link" href="/navis.html">NAVIS ↗</a><a className="module-link" href="/mender.html">MENDER ↗</a></div>
        <div className={`system-status ${status.tone}`}><i />SYSTEM {status.label}</div>
      </header>

      <section className="layout">
        <aside className="left-panel panel">
          <div className="section-title"><span>01</span> SWARM STATE</div>
          <Metric label="COLLECTORS" value={DEFAULT_CONFIG.satelliteCount.toLocaleString()} />
          <Metric label="AVAILABILITY" value={snapshot.metrics.availabilityPercent.toFixed(2)} unit="%" tone={snapshot.metrics.availabilityPercent < 95 ? "alert" : "good"} />
          <Metric label="MEAN THERMAL" value={snapshot.metrics.averageTemperatureK.toFixed(1)} unit="K" />
          <div className="mode-grid">
            <div><span className="dot nominal" />Dispatchable<strong>{DEFAULT_CONFIG.satelliteCount - snapshot.metrics.offlineCount - snapshot.metrics.isolatedCount}</strong></div>
            <div><span className="dot isolated" />Isolated<strong>{snapshot.metrics.isolatedCount}</strong></div>
            <div><span className="dot thermal" />Thermal<strong>{snapshot.metrics.thermalCount}</strong></div>
            <div><span className="dot offline" />Offline<strong>{snapshot.metrics.offlineCount}</strong></div>
          </div>

          <div className="section-title section-gap"><span>02</span> INCIDENT INJECTION</div>
          <div className="scenario-list">
            {(Object.keys(scenarioLabels) as ScenarioType[]).map((type) => {
              const item = scenarioLabels[type];
              const active = snapshot.activeScenarios.some((scenario) => scenario.type === type);
              return <button key={type} className={active ? "active" : ""} onClick={() => inject(type)} disabled={active}><b>{item.code}</b><span>{item.title}<small>{item.detail}</small></span></button>;
            })}
          </div>
          <label className="bearing-control">
            <span>DEBRIS BEARING <b>{String(debrisBearing).padStart(3, "0")}°</b></span>
            <input type="range" min="0" max="359" value={debrisBearing} onChange={(event) => setDebrisBearing(Number(event.target.value))} />
          </label>
        </aside>

        <section className="center-stack">
          <div className="map-panel panel">
            <div className="panel-label">ORBITAL DISTRIBUTION // 0.40 AU</div>
            <SwarmMap
              satellites={snapshot.satellites}
              tick={snapshot.tick}
              debrisBearing={snapshot.activeScenarios.find((scenario) => scenario.type === "debris-corridor")?.bearingDeg}
            />
            <div className="map-readout left">BANDS<br /><strong>08</strong></div>
            <div className="map-readout right">SAMPLE<br /><strong>1:6</strong></div>
          </div>
          <div className="power-panel panel">
            <div className="power-head">
              <div><span>GRID DELIVERY</span><strong>{snapshot.metrics.deliveredGW.toFixed(2)} <small>GW</small></strong></div>
              <div><span>DEMAND</span><strong>{snapshot.metrics.demandGW.toFixed(2)} <small>GW</small></strong></div>
              <div><span>CURTAILED</span><strong>{snapshot.metrics.curtailedGW.toFixed(2)} <small>GW</small></strong></div>
            </div>
            <PowerChart snapshot={snapshot} />
          </div>
        </section>

        <aside className="right-panel panel">
          <div className="section-title"><span>03</span> EVENT STREAM</div>
          <div className="event-stream">
            {snapshot.events.map((event) => (
              <article key={event.id} className={event.level}>
                <time>τ {String(event.tick).padStart(5, "0")}</time><b>{event.source}</b><p>{event.message}</p>
              </article>
            ))}
          </div>
          <div className="logistics-block">
            <div className="section-title compact"><span>04</span> ORBITAL SUPPLY</div>
            <div className="logistics-grid">
              <span>FACTORY QUEUE</span><b>{snapshot.logistics.factoryBacklog}</b>
              <span>GROUND STOCK</span><b>{snapshot.logistics.groundInventory}</b>
              <span>ORBITAL STOCK</span><b>{snapshot.logistics.orbitalInventory}</b>
              <span>INSTALLED</span><b>{snapshot.logistics.replacementsInstalled}</b>
            </div>
            <div className="elevator-status">
              <span>GEO CLIMBER</span>
              <b>{snapshot.logistics.elevatorStatus === "ascending" ? `ASCENT ${snapshot.logistics.elevatorProgressPercent}% · ${snapshot.logistics.elevatorCargo} UNITS` : "STANDBY"}</b>
              <div><i style={{ width: `${snapshot.logistics.elevatorStatus === "ascending" ? snapshot.logistics.elevatorProgressPercent : 0}%` }} /></div>
            </div>
            <button className="production-request" onClick={requestReplacements}>REQUEST 50 REPLACEMENTS</button>
          </div>
          <div className="safety-block">
            <span>BEAM SAFETY INTERLOCKS</span>
            <strong>{snapshot.metrics.safetyTrips === 0 ? "ARMED" : `${snapshot.metrics.safetyTrips} TRIPS`}</strong>
            <div className="safety-line"><i style={{ width: `${Math.max(2, 100 - snapshot.metrics.safetyTrips)}%` }} /></div>
            <div className="avoidance-readout"><span>EVASIVE BURNS</span><b>{snapshot.metrics.avoidanceManeuvers}</b><span>IMPACTS</span><b>{snapshot.metrics.confirmedImpacts}</b></div>
          </div>
        </aside>
      </section>

      <footer>
        <div className="controls">
          <button className="primary" onClick={() => setRunning((value) => !value)}>{running ? "Ⅱ  PAUSE" : "▶  RUN"}</button>
          {[1, 5, 20].map((value) => <button key={value} className={speed === value ? "selected" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}
          <button onClick={() => setSnapshot(simulation.step(1))} disabled={running}>STEP</button>
          <button onClick={reset}>RESET</button>
        </div>
        <div className="footer-meta"><span>SEED {DEFAULT_CONFIG.seed}</span><span>TICK {snapshot.tick.toLocaleString()}</span><button onClick={exportSnapshot}>EXPORT SNAPSHOT ↓</button></div>
      </footer>
    </main>
  );
}
