import { useEffect, useMemo, useState } from "react";
import { AutonomousFoundrySimulation, type FoundryScenario } from "./foundry";

const scenarios: Record<FoundryScenario, { code: string; title: string; detail: string }> = {
  "dust-front": { code: "DUST", title: "Electrostatic dust", detail: "Derate excavation" },
  "crusher-jam": { code: "JAM", title: "Crusher obstruction", detail: "Stop material grading" },
  "power-ration": { code: "GRID", title: "Habitat power call", detail: "Cap industrial demand" },
  "cutter-wear": { code: "TOOL", title: "Cutter wear", detail: "Derate machine shop" },
};

const formatTime = (minutes: number) => `SHIFT ${String(Math.floor(minutes / 60)).padStart(3, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const number = (value: number, digits = 0) => value.toLocaleString(undefined, { maximumFractionDigits: digits });

export function FoundryApp() {
  const [simulation, setSimulation] = useState(() => new AutonomousFoundrySimulation());
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(3);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSnapshot(simulation.step(speed)), 300);
    return () => window.clearInterval(timer);
  }, [running, simulation, speed]);

  const status = useMemo(() => {
    if (snapshot.stages.some((stage) => stage.status === "fault")) return "FAULT";
    if (snapshot.activeScenarios.length > 0) return "DERATED";
    return "AUTONOMOUS";
  }, [snapshot]);

  const reset = () => {
    const next = new AutonomousFoundrySimulation();
    setSimulation(next);
    setSnapshot(next.snapshot());
    setRunning(true);
  };

  return (
    <main className="foundry-shell">
      <header className="foundry-topbar">
        <div className="foundry-brand"><span>R//F</span><div><strong>RUIN // FOUNDRY</strong><small>AUTONOMOUS LUNAR MANUFACTURING</small></div></div>
        <nav><a href="/">HELIOS</a><b>FOUNDRY</b></nav>
        <div className="foundry-clock"><span>{formatTime(snapshot.elapsedMinutes)}</span><b className={status.toLowerCase()}>{status}</b></div>
      </header>

      <section className="foundry-layout">
        <section className="foundry-main">
          <div className="foundry-metrics">
            <Metric label="MINING ROBOTS" value={`${snapshot.activeBots}/24`} />
            <Metric label="INDUSTRIAL POWER" value={number(snapshot.powerMW, 1)} unit="MW" />
            <Metric label="ORDER BACKLOG" value={snapshot.orderBacklog} unit="KITS" alert={snapshot.orderBacklog > 0} />
            <Metric label="TOTAL SHIPPED" value={snapshot.totalKitsShipped} unit="KITS" />
            <Metric label="BOTTLENECK" value={snapshot.bottleneck} wide />
          </div>

          <div className="process-panel">
            <div className="foundry-title"><span>01</span> MATERIAL TRANSFORMATION LINE</div>
            <div className="process-line">
              {snapshot.stages.map((stage, index) => (
                <div className="process-wrap" key={stage.id}>
                  <article className={`process-card ${stage.status}`}>
                    <div><span>0{index + 1}</span><i>{stage.status}</i></div>
                    <strong>{stage.label}</strong>
                    <small>{stage.rateLabel}</small>
                    <div className="utilization"><i style={{ width: `${stage.utilizationPercent}%` }} /></div>
                    <footer><span>LOAD {stage.utilizationPercent}%</span><span>HLTH {stage.healthPercent}%</span></footer>
                  </article>
                  {index < snapshot.stages.length - 1 && <span className="flow-arrow">›</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="inventory-panel">
            <div className="foundry-title"><span>02</span> MASS BALANCE</div>
            <div className="inventory-grid">
              <Inventory label="RAW REGOLITH" value={snapshot.inventory.regolithKg} unit="kg" color="#a48d72" />
              <Inventory label="GRADED FEED" value={snapshot.inventory.gradedFeedKg} unit="kg" color="#d2b276" />
              <Inventory label="STRUCTURAL METAL" value={snapshot.inventory.structuralMetalKg} unit="kg" color="#b7c8cb" />
              <Inventory label="TRACE METALS" value={snapshot.inventory.rareMetalKg} unit="kg" color="#e6cc70" />
              <Inventory label="OXYGEN CO-PRODUCT" value={snapshot.inventory.oxygenKg} unit="kg" color="#67b9ff" />
              <Inventory label="MACHINED SETS" value={snapshot.inventory.machinedSets} unit="sets" color="#64f3c2" />
            </div>
            <div className="science-note">MRE yields and all throughput values are configurable scenario parameters—not lunar resource predictions.</div>
          </div>
        </section>

        <aside className="foundry-side">
          <div className="foundry-title"><span>03</span> PRODUCTION CONTROL</div>
          <button className="order-button" onClick={() => setSnapshot(simulation.requestKits(20))}><span>+20</span> REQUEST REPAIR KITS</button>
          <div className="incident-list">
            {(Object.keys(scenarios) as FoundryScenario[]).map((type) => {
              const item = scenarios[type];
              const active = snapshot.activeScenarios.some((scenario) => scenario.type === type);
              return <button key={type} className={active ? "active" : ""} disabled={active} onClick={() => setSnapshot(simulation.inject(type))}><b>{item.code}</b><span>{item.title}<small>{item.detail}</small></span></button>;
            })}
          </div>
          <div className="foundry-title event-title"><span>04</span> FACTORY LEDGER</div>
          <div className="foundry-events">
            {snapshot.events.map((event) => <article key={event.id} className={event.level}><time>τ{String(event.tick).padStart(5, "0")}</time><b>{event.source}</b><p>{event.message}</p></article>)}
          </div>
        </aside>
      </section>

      <footer className="foundry-controls">
        <div><button className="run" onClick={() => setRunning((value) => !value)}>{running ? "Ⅱ PAUSE" : "▶ RUN"}</button>{[1, 3, 12].map((value) => <button key={value} className={speed === value ? "selected" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}<button disabled={running} onClick={() => setSnapshot(simulation.step())}>STEP</button><button onClick={reset}>RESET</button></div>
        <span>SEED 2049 · TICK {snapshot.tick.toLocaleString()}</span>
      </footer>
    </main>
  );
}

function Metric({ label, value, unit, alert, wide }: { label: string; value: string | number; unit?: string; alert?: boolean; wide?: boolean }) {
  return <div className={`foundry-metric ${alert ? "alert" : ""} ${wide ? "wide" : ""}`}><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>;
}

function Inventory({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return <div className="inventory-item" style={{ "--material": color } as React.CSSProperties}><i /><span>{label}</span><strong>{number(value, 1)} <small>{unit}</small></strong></div>;
}
