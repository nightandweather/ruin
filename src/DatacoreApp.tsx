import { useEffect, useState } from "react";
import { DEFAULT_DATACORE_CONFIG, OrbitalDatacoreSimulation, type DatacoreConfig, type DatacoreIncident, type JobKind } from "./datacore";

const incidentLabels: Record<DatacoreIncident, { code: string; title: string; detail: string }> = {
  "radiation-storm": { code: "RAD", title: "Particle storm", detail: "Scrub + quorum" },
  "coolant-loop-loss": { code: "LOOP", title: "Coolant loss", detail: "Thermal cap" },
  "optical-link-loss": { code: "LINK", title: "Optical loss", detail: "Retain results" },
  "collector-curtailment": { code: "GRID", title: "C-01 curtailment", detail: "Shed low priority" },
};
const jobLabels: Record<JobKind, string> = { "swarm-control": "SWARM", "telescope-ingest": "SKY", "physics-ensemble": "PHYSICS", "factory-twins": "FOUNDRY" };
const number = (value: number, digits = 0) => value.toLocaleString(undefined, { maximumFractionDigits: digits });

export function DatacoreApp() {
  const [config, setConfig] = useState<DatacoreConfig>({ ...DEFAULT_DATACORE_CONFIG });
  const [simulation, setSimulation] = useState(() => new OrbitalDatacoreSimulation());
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(3);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSnapshot(simulation.step(speed)), 320); return () => window.clearInterval(timer); }, [running, simulation, speed]);
  const update = (key: keyof DatacoreConfig, value: number) => { const next = { ...config, [key]: value } as DatacoreConfig; setConfig(next); setSnapshot(simulation.updateConfig(next)); };
  const reset = () => { const next = new OrbitalDatacoreSimulation(); setConfig({ ...DEFAULT_DATACORE_CONFIG }); setSimulation(next); setSnapshot(next.snapshot()); setRunning(true); };
  return <main className="datacore-shell">
    <header className="datacore-topbar"><div className="datacore-brand"><span>D//C</span><div><strong>RUIN // DATACORE</strong><small>ORBITAL VERIFIED COMPUTE</small></div></div><nav><a href="/">HELIOS</a><a href="/foundry.html">FOUNDRY</a><a href="/collector.html">COLLECTOR</a><b>DATACORE</b></nav><div className="datacore-status"><span>NODE DC-01 · τ{String(snapshot.tick).padStart(5,"0")}</span><b className={snapshot.mode}>{snapshot.mode.replace("-"," ").toUpperCase()}</b></div></header>
    <section className="datacore-layout">
      <aside className="compute-config dc-panel"><Title n="01" text="COMPUTE FABRIC" />
        <Stepper label="GPU TILES" value={config.gpuTiles} step={8} min={8} max={128} unit="tiles" onChange={(v)=>update("gpuTiles",v)} />
        <Stepper label="TILE COMPUTE" value={config.tileComputeTflops} step={50} min={100} max={1200} unit="TFLOPS" onChange={(v)=>update("tileComputeTflops",v)} />
        <Stepper label="TILE POWER" value={config.tilePowerKw} step={1} min={5} max={40} unit="kW" onChange={(v)=>update("tilePowerKw",v)} />
        <Stepper label="RADIATOR" value={config.radiatorAreaM2} step={100} min={300} max={3000} unit="m²" onChange={(v)=>update("radiatorAreaM2",v)} />
        <Stepper label="C-01 SOURCES" value={config.sourceCollectors} step={1} min={1} max={8} unit="units" onChange={(v)=>update("sourceCollectors",v)} />
        <div className="replica-select"><span>RESULT QUORUM</span><div>{([1,2,3] as const).map((v)=><button key={v} className={config.verificationReplicas===v?"selected":""} onClick={()=>update("verificationReplicas",v)}>{v}×</button>)}</div><small>3× repeats critical work across independent tiles.</small></div>
        <div className="power-contract"><span>C-01 POWER CONTRACT</span><b>{snapshot.availablePowerMW} MW</b><small>{snapshot.facilityPowerMW} MW scheduled · {number(snapshot.availablePowerMW-snapshot.facilityPowerMW,2)} MW reserve</small></div>
      </aside>
      <section className="fabric-panel dc-panel"><div className="fabric-head"><Title n="02" text="RADIATION-AWARE TILE MAP"/><span>{snapshot.availableTiles}/{snapshot.totalTiles} AVAILABLE</span></div><div className="tile-map">{snapshot.tileStates.map((state,index)=><div key={index} className={`gpu-tile ${state}`}><span>{String(index+1).padStart(2,"0")}</span><i/><small>{state}</small></div>)}</div><div className="tile-legend"><span><i className="active"/>ACTIVE</span><span><i className="standby"/>STANDBY</span><span><i className="scrub"/>ECC SCRUB</span><b>VERIFIED FABRIC · NO SILENT ACCEPTANCE</b></div></section>
      <aside className="dc-telemetry dc-panel"><Title n="03" text="ORBITAL TELEMETRY"/><div className="dc-metrics"><Metric label="RAW COMPUTE" value={snapshot.rawComputePflops} unit="PFLOPS"/><Metric label="VERIFIED" value={snapshot.verifiedComputePflops} unit="PFLOPS" accent/><Metric label="FACILITY POWER" value={snapshot.facilityPowerMW} unit="MW"/><Metric label="RADIATOR" value={snapshot.radiatorTemperatureK} unit="K" alert={snapshot.radiatorTemperatureK>410}/><Metric label="OPTICAL LINK" value={number(snapshot.downlinkMbps)} unit="Mbps"/><Metric label="UTILIZATION" value={snapshot.utilizationPercent} unit="%"/></div><div className="integrity"><div><span>ECC CORRECTED</span><b>{snapshot.correctedErrors}</b></div><div><span>RESULTS REJECTED</span><b>{snapshot.rejectedResults}</b></div><div><span>JOBS COMPLETE</span><b>{snapshot.completedJobs}</b></div></div><p>Commercial-style accelerators are modeled behind shielding, checkpointing, tile isolation, ECC scrubbing, and replicated result verification. Performance values are fictional scenario parameters.</p></aside>
      <section className="jobs-panel dc-panel"><div className="jobs-head"><Title n="04" text="VERIFIED WORK QUEUE"/><div>{(Object.keys(jobLabels) as JobKind[]).map(kind=><button key={kind} onClick={()=>setSnapshot(simulation.submit(kind))}>+ {jobLabels[kind]}</button>)}</div></div><div className="job-list">{snapshot.queue.slice().sort((a,b)=>b.priority-a.priority).map(job=>{const progress=100*(1-job.remainingPetaOps/job.originalPetaOps);return <article key={job.id} className={job.status}><span>P{job.priority}</span><div><b>{job.label}</b><small>{job.status} · {number(job.remainingPetaOps)} POPS REMAIN</small><i><em style={{width:`${progress}%`}}/></i></div></article>})}</div></section>
      <section className="dc-ops dc-panel"><div><Title n="05" text="INCIDENT INJECTION"/><section>{(Object.keys(incidentLabels) as DatacoreIncident[]).map(type=>{const item=incidentLabels[type],active=snapshot.activeIncidents.some(i=>i.type===type);return <button key={type} disabled={active} className={active?"active":""} onClick={()=>setSnapshot(simulation.inject(type))}><b>{item.code}</b><span>{item.title}<small>{item.detail}</small></span></button>})}</section></div><div className="dc-ledger"><Title n="06" text="SYSTEM LEDGER"/><section>{snapshot.events.slice(0,6).map(event=><article key={event.id} className={event.level}><time>τ{String(event.tick).padStart(5,"0")}</time><p>{event.message}</p></article>)}</section></div></section>
    </section>
    <footer className="datacore-controls"><div><button className="run" onClick={()=>setRunning(v=>!v)}>{running?"Ⅱ PAUSE":"▶ RUN"}</button>{[1,3,12].map(v=><button key={v} className={speed===v?"selected":""} onClick={()=>setSpeed(v)}>{v}×</button>)}<button disabled={running} onClick={()=>setSnapshot(simulation.step())}>STEP</button><button onClick={reset}>RESET NODE</button></div><span>THERMAL LIMIT 420 K · RESULT QUORUM {config.verificationReplicas}× · LINK {snapshot.downlinkMbps>0?"LOCKED":"DARK"}</span></footer>
  </main>;
}
function Title({n,text}:{n:string;text:string}){return <div className="dc-title"><span>{n}</span>{text}</div>}
function Stepper({label,value,step,min,max,unit,onChange}:{label:string;value:number;step:number;min:number;max:number;unit:string;onChange:(v:number)=>void}){return <div className="dc-stepper"><span>{label}</span><div><button aria-label={`Decrease ${label}`} onClick={()=>onChange(Math.max(min,value-step))}>−</button><b>{number(value)}<small>{unit}</small></b><button aria-label={`Increase ${label}`} onClick={()=>onChange(Math.min(max,value+step))}>+</button></div></div>}
function Metric({label,value,unit,accent,alert}:{label:string;value:string|number;unit:string;accent?:boolean;alert?:boolean}){return <div className={`dc-metric ${accent?"accent":""} ${alert?"alert":""}`}><span>{label}</span><b>{value}<small>{unit}</small></b></div>}
