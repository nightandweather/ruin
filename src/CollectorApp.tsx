import { useEffect, useMemo, useState } from "react";
import { DEFAULT_COLLECTOR_DESIGN, type CollectorDesign } from "./collectorDesign";
import { CollectorSimulation, type CollectorIncident } from "./collectorSimulation";

const incidents: Record<CollectorIncident, { code: string; title: string; detail: string }> = {
  "solar-flare": { code: "FLUX", title: "Solar flare", detail: "Articulate arrays" },
  "debris-corridor": { code: "ROCK", title: "Debris corridor", detail: "Retract + evade" },
  "communications-loss": { code: "LINK", title: "Relay loss", detail: "Inhibit beam" },
  "transmitter-fault": { code: "BEAM", title: "Steering fault", detail: "Robot inspection" },
};

const number = (value: number, digits = 0) => value.toLocaleString(undefined, { maximumFractionDigits: digits });

export function CollectorApp() {
  const [design, setDesign] = useState<CollectorDesign>({ ...DEFAULT_COLLECTOR_DESIGN });
  const [simulation, setSimulation] = useState(() => new CollectorSimulation(DEFAULT_COLLECTOR_DESIGN));
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(3);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSnapshot(simulation.step(speed)), 320);
    return () => window.clearInterval(timer);
  }, [running, simulation, speed]);

  const update = (key: keyof CollectorDesign, value: number) => {
    const next = { ...design, [key]: value };
    setDesign(next);
    setSnapshot(simulation.updateDesign(next));
  };
  const reset = () => {
    const nextDesign = { ...DEFAULT_COLLECTOR_DESIGN };
    const next = new CollectorSimulation(nextDesign);
    setDesign(nextDesign); setSimulation(next); setSnapshot(next.snapshot()); setRunning(true);
  };
  const status = snapshot.mode.replace("-", " ").toUpperCase();
  const verdict = useMemo(() => {
    if (snapshot.performance.thermalMarginK < 0) return "THERMALLY INVALID";
    if (snapshot.performance.powerToMassWkg < 180) return "MASS HEAVY";
    if (snapshot.performance.foundryShifts > 8) return "SLOW TO REPLICATE";
    return "SEED READY";
  }, [snapshot]);

  return (
    <main className="collector-shell">
      <header className="collector-topbar">
        <div className="collector-brand"><span>C//01</span><div><strong>RUIN // COLLECTOR</strong><small>PARAMETRIC STELLAR MACHINE</small></div></div>
        <nav><a href="/">HELIOS</a><a href="/foundry.html">FOUNDRY</a><b>COLLECTOR</b></nav>
        <div className="collector-clock"><span>UNIT C-01 · τ{String(snapshot.tick).padStart(5, "0")}</span><b className={snapshot.mode}>{status}</b></div>
      </header>

      <section className="collector-layout">
        <aside className="design-panel panel-box">
          <Title number="01" text="PARAMETRIC DESIGN" />
          <Range label="ORBIT RADIUS" value={design.orbitAu} min={0.2} max={1.5} step={0.05} unit="AU" onChange={(v) => update("orbitAu", v)} />
          <Range label="COLLECTOR AREA" value={design.collectorAreaM2} min={400} max={4000} step={100} unit="m²" onChange={(v) => update("collectorAreaM2", v)} />
          <Range label="RADIATOR AREA" value={design.radiatorAreaM2} min={200} max={2000} step={50} unit="m²" onChange={(v) => update("radiatorAreaM2", v)} />
          <Range label="CONVERSION" value={design.conversionEfficiency * 100} min={15} max={55} step={1} unit="%" onChange={(v) => update("conversionEfficiency", v / 100)} />
          <Range label="SHIELD DEPTH" value={design.shieldThicknessMm} min={1} max={20} step={1} unit="mm" onChange={(v) => update("shieldThicknessMm", v)} />
          <Range label="PROPELLANT" value={design.propellantKg} min={200} max={2500} step={50} unit="kg" onChange={(v) => update("propellantKg", v)} />
          <div className="material-bill">
            <span>FOUNDRY BILL</span>
            <div><b>{number(snapshot.performance.structuralMetalKg)}</b><small>kg structural</small></div>
            <div><b>{number(snapshot.performance.traceMetalKg)}</b><small>kg trace metals</small></div>
            <div><b>{snapshot.performance.foundryShifts}</b><small>factory shifts</small></div>
          </div>
        </aside>

        <section className="machine-panel panel-box">
          <div className="machine-heading"><Title number="02" text="C-01 SEED COLLECTOR" /><span className={`verdict ${verdict.toLowerCase().replaceAll(" ", "-")}`}>{verdict}</span></div>
          <CollectorSchematic design={design} deployment={snapshot.deploymentPercent} mode={snapshot.mode} />
          <div className="schematic-legend"><span><i className="array" />4× collector wing</span><span><i className="radiator" />2× radiator</span><span><i className="bus" />service spine</span><span>NOT TO SCALE · GEOMETRY FOLLOWS DESIGN RATIOS</span></div>
        </section>

        <aside className="telemetry-panel panel-box">
          <Title number="03" text="LIVE PERFORMANCE" />
          <div className="telemetry-grid">
            <Metric label="DELIVERED" value={snapshot.performance.deliveredPowerMW} unit="MW" accent />
            <Metric label="GROSS POWER" value={snapshot.performance.grossElectricMW} unit="MW" />
            <Metric label="WASTE HEAT" value={snapshot.performance.wasteHeatMW} unit="MW" />
            <Metric label="RADIATOR" value={snapshot.performance.radiatorTemperatureK} unit="K" alert={snapshot.performance.thermalMarginK < 25} />
            <Metric label="TOTAL MASS" value={number(snapshot.performance.totalMassKg)} unit="kg" />
            <Metric label="POWER / MASS" value={snapshot.performance.powerToMassWkg} unit="W/kg" />
          </div>
          <div className="health-list">
            <Health label="ARRAY DEPLOYMENT" value={snapshot.deploymentPercent} />
            <Health label="ARRAY HEALTH" value={snapshot.arrayHealthPercent} />
            <Health label="RADIATOR HEALTH" value={snapshot.radiatorHealthPercent} />
            <Health label="BUS HEALTH" value={snapshot.busHealthPercent} />
          </div>
          <div className="consumables"><div><span>Xe/Kr RESERVE</span><b>{number(snapshot.propellantRemainingKg, 1)} kg</b></div><div><span>REPAIR KITS</span><b>{snapshot.maintenanceKits}</b></div></div>
          <p className="model-note">Solar flux follows inverse square distance. Efficiency, areal density, transmission loss, shielding mass, and factory throughput are RUIN scenario parameters.</p>
        </aside>

        <section className="operations-panel panel-box">
          <div className="incident-controls"><Title number="04" text="INCIDENT INJECTION" /><div>{(Object.keys(incidents) as CollectorIncident[]).map((type) => { const item = incidents[type]; const active = snapshot.activeIncidents.some((incident) => incident.type === type); return <button key={type} disabled={active} className={active ? "active" : ""} onClick={() => setSnapshot(simulation.inject(type))}><b>{item.code}</b><span>{item.title}<small>{item.detail}</small></span></button>; })}</div></div>
          <div className="collector-events"><Title number="05" text="AUTONOMY LEDGER" /><div>{snapshot.events.slice(0, 7).map((event) => <article key={event.id} className={event.level}><time>τ{String(event.tick).padStart(5, "0")}</time><p>{event.message}</p></article>)}</div></div>
        </section>
      </section>

      <footer className="collector-controls"><div><button className="run" onClick={() => setRunning((v) => !v)}>{running ? "Ⅱ PAUSE" : "▶ RUN"}</button>{[1, 3, 12].map((v) => <button key={v} className={speed === v ? "selected" : ""} onClick={() => setSpeed(v)}>{v}×</button>)}<button disabled={running} onClick={() => setSnapshot(simulation.step())}>STEP</button><button onClick={reset}>RESET DESIGN</button></div><span>THERMAL MARGIN {snapshot.performance.thermalMarginK > 0 ? "+" : ""}{snapshot.performance.thermalMarginK} K · DEPLOYED {snapshot.deploymentPercent}%</span></footer>
    </main>
  );
}

function CollectorSchematic({ design, deployment, mode }: { design: CollectorDesign; deployment: number; mode: string }) {
  const wingLength = 105 + (design.collectorAreaM2 / 4000) * 90;
  const wingWidth = 38 + (design.collectorAreaM2 / 4000) * 36;
  const radiatorLength = 75 + (design.radiatorAreaM2 / 2000) * 85;
  const scale = Math.max(0.28, deployment / 100);
  return <svg className={`collector-schematic ${mode}`} viewBox="0 0 720 470" role="img" aria-label="Parametric diagram of the C-01 seed collector">
    <defs><linearGradient id="arrayFill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#85631f"/><stop offset=".5" stopColor="#e7bd52"/><stop offset="1" stopColor="#5f4519"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle cx="360" cy="235" r="190" className="orbit-ring"/><path d="M74 67L145 67" className="sun-rays"/><circle cx="58" cy="67" r="13" className="diagram-sun" filter="url(#glow)"/><text x="35" y="99">SOL · {design.orbitAu.toFixed(2)} AU</text>
    <g className="machine-geometry" transform={`translate(360 235) scale(${scale},1)`}>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y], index) => <g key={index} transform={`translate(${x * 46} ${y * 25})`}><line x1="0" y1="0" x2={x * 32} y2={y * 18} className="boom"/><rect x={x < 0 ? -wingLength - 30 : 30} y={y < 0 ? -wingWidth - 18 : 18} width={wingLength} height={wingWidth} className="collector-wing"/><path d={`M${x < 0 ? -wingLength - 30 : 30 + wingLength/2},${y < 0 ? -wingWidth - 18 : 18}v${wingWidth}`} className="panel-line"/></g>)}
      <rect x={-radiatorLength / 2} y="-144" width={radiatorLength} height="58" className="radiator-panel"/><rect x={-radiatorLength / 2} y="86" width={radiatorLength} height="58" className="radiator-panel"/>
    </g>
    <g className="central-bus"><rect x="331" y="171" width="58" height="128" rx="4"/><rect x="343" y="187" width="34" height="34" className="core"/><circle cx="360" cy="250" r="12"/><path d="M339 278h42"/><text x="325" y="327">SERVICE SPINE</text></g>
    <g className="thrusters"><path d="M345 299l-11 24h22z"/><path d="M375 299l-11 24h22z"/></g>
    <g className="service-bots"><circle cx="307" cy="235" r="7"/><circle cx="413" cy="235" r="7"/><path d="M300 235h-18M420 235h18"/></g>
    <path d="M389 206C470 179 535 184 641 159" className="power-beam"/><text x="538" y="147">POWER CORRIDOR</text>
    <g className="dimension"><path d={`M${360-wingLength-78} 415H${360+wingLength+78}`}/><path d={`M${360-wingLength-78} 409v12M${360+wingLength+78} 409v12`}/><text x="314" y="441">{number(design.collectorAreaM2)} m² ACTIVE AREA</text></g>
  </svg>;
}

function Title({ number, text }: { number: string; text: string }) { return <div className="collector-title"><span>{number}</span>{text}</div>; }
function Range({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) { const set = (next: number) => onChange(Math.max(min, Math.min(max, Number(next.toFixed(4))))); return <label className="design-range"><span>{label}<b>{number(value, step < 1 ? 2 : 0)} <small>{unit}</small></b></span><div className="range-control"><button type="button" aria-label={`Decrease ${label}`} onClick={() => set(value-step)}>−</button><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => set(Number(event.target.value))}/><button type="button" aria-label={`Increase ${label}`} onClick={() => set(value+step)}>+</button></div></label>; }
function Metric({ label, value, unit, accent, alert }: { label: string; value: string | number; unit: string; accent?: boolean; alert?: boolean }) { return <div className={`collector-metric ${accent ? "accent" : ""} ${alert ? "alert" : ""}`}><span>{label}</span><b>{value}<small>{unit}</small></b></div>; }
function Health({ label, value }: { label: string; value: number }) { return <div className="health-row"><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }}/></i></div>; }
