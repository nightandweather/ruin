import { useMemo, useState } from "react";
import {
  corvusConfig,
  evaluateCorvus,
  FRAME_PRESETS,
  MISSION_META,
  type CorvusConfig,
  type CorvusFrame,
  type CorvusIncident,
  type CorvusMission,
} from "./corvus";
import { ModuleBar } from "./ModuleBar";
const fmt = (v: number, d = 1) =>
  Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: d }) : "∞";
export function CorvusApp() {
  const [config, setConfig] = useState<CorvusConfig>(() => corvusConfig());
  const result = useMemo(() => evaluateCorvus(config), [config]);
  const update = <K extends keyof CorvusConfig>(k: K, v: CorvusConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));
  const frame = (f: CorvusFrame) => setConfig((c) => ({ ...c, ...FRAME_PRESETS[f], frame: f }));
  return (
    <main className="cv-shell">
      <header className="cv-top">
        <div className="cv-brand">
          <span>C//V</span>
          <div>
            <strong>RUIN // CORVUS</strong>
            <small>AUTONOMOUS CIVILIAN SPACE-DRONE SWARM</small>
          </div>
        </div>
        <ModuleBar current="corvus" />
        <div className="cv-state">
          <span>DESIGN TWIN · NON-FLIGHT SOFTWARE</span>
          <b className={result.readiness.toLowerCase()}>{result.readiness}</b>
        </div>
      </header>
      <section className="cv-layout">
        <aside className="cv-panel cv-config">
          <Title n="01" text="DRONE CHASSIS" />
          <div className="cv-tabs">
            {(["micro", "utility", "heavy"] as CorvusFrame[]).map((f) => (
              <button key={f} className={config.frame === f ? "active" : ""} onClick={() => frame(f)}>
                {f.toUpperCase()}
                <small>
                  {f === "micro" ? "FAST / LIMITED" : f === "utility" ? "BALANCED" : "POWER / RANGE"}
                </small>
              </button>
            ))}
          </div>
          <Title n="02" text="MISSION CONTRACT" />
          <div className="cv-missions">
            {(Object.keys(MISSION_META) as CorvusMission[]).map((m) => (
              <button
                key={m}
                className={config.mission === m ? "active" : ""}
                onClick={() => update("mission", m)}
              >
                <b>{MISSION_META[m].name}</b>
                <small>{MISSION_META[m].description}</small>
              </button>
            ))}
          </div>
          <Control
            label="SWARM NODES"
            value={config.droneCount}
            min={1}
            max={48}
            step={1}
            change={(v) => update("droneCount", v)}
          />
          <Control
            label="FAILED NODES"
            value={config.failedCount}
            min={0}
            max={config.droneCount}
            step={1}
            change={(v) => update("failedCount", v)}
          />
          <Range
            label="STELLAR DISTANCE"
            value={config.distanceAU}
            min={0.3}
            max={5}
            step={0.1}
            suffix=" AU"
            change={(v) => update("distanceAU", v)}
          />
        </aside>
        <section className="cv-panel cv-stage">
          <div className="cv-stagehead">
            <Title n="03" text="DISTRIBUTED FORMATION" />
            <span>
              {result.healthy}/{result.count} HEALTHY ·{" "}
              {result.meshConnected ? "MESH CONNECTED" : "MESH PARTITIONED"}
            </span>
          </div>
          <Swarm config={config} result={result} />
          <div className="cv-legend">
            <span>
              <i className="healthy" />
              HEALTHY NODE
            </span>
            <span>
              <i className="failed" />
              FAILED / ISOLATED
            </span>
            <span>
              <i className="link" />
              CROSSLINK
            </span>
          </div>
          <div className="cv-strip">
            <Metric label="NODE SPACING" value={fmt(result.spacingKm, 2)} unit="km" />
            <Metric
              label="LINK MARGIN"
              value={fmt(result.linkMarginKm, 1)}
              unit="km"
              warning={result.linkMarginKm < 0}
            />
            <Metric
              label="COLLISION RESERVE"
              value={fmt(result.collisionReserveHours, 1)}
              unit="h"
              warning={result.collisionReserveHours < 6}
            />
            <Metric
              label="PRODUCTIVE CAPACITY"
              value={fmt(result.productiveFraction * 100, 0)}
              unit="%"
              accent
            />
          </div>
        </section>
        <aside className="cv-panel cv-output">
          <Title n="04" text="MISSION VERDICT" />
          <div className={`cv-verdict ${result.readiness.toLowerCase()}`}>
            <span>AUTONOMOUS FLEET</span>
            <b>{result.readiness}</b>
            <small>
              {result.constraints[0] ?? "POWER, HEAT, QUORUM, LINK, AND SEPARATION CONTRACTS POSITIVE"}
            </small>
          </div>
          <div className="cv-metrics">
            <Metric label="SAFE STATE" value={result.safeMode} unit="" accent />
            <Metric
              label="QUORUM"
              value={`${result.healthy}/${result.quorumRequired}`}
              unit="nodes"
              warning={result.quorumMargin < 0}
            />
            <Metric label="NODE MASS" value={fmt(result.wetMassKg)} unit="kg" />
            <Metric label="ΔV BUDGET" value={fmt(result.deltaVMS, 0)} unit="m/s" />
            <Metric label="SOLAR INPUT" value={fmt(result.solarPowerW, 0)} unit="W" />
            <Metric
              label="POWER MARGIN"
              value={fmt(result.powerMarginW, 0)}
              unit="W"
              warning={result.powerMarginW < 0}
            />
            <Metric
              label="THERMAL MARGIN"
              value={fmt(result.thermalMarginW, 0)}
              unit="W"
              warning={result.thermalMarginW < 0}
            />
            <Metric label="BATTERY HOLD" value={fmt(result.batteryHours, 1)} unit="h" />
          </div>
          <Title n="05" text="INCIDENT INJECTION" />
          <div className="cv-incidents">
            {(["none", "partition", "nav-drift", "power-loss"] as CorvusIncident[]).map((i) => (
              <button
                key={i}
                className={config.incident === i ? "active" : ""}
                onClick={() => update("incident", i)}
              >
                {i === "none" ? "NOMINAL" : i.replace("-", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </aside>
        <section className="cv-panel cv-ops">
          <div>
            <Title n="06" text="PROPULSION + FORMATION" />
            <div className="cv-grid">
              <Control
                label="PROPELLANT"
                value={config.propellantKg}
                min={0}
                max={300}
                step={2}
                suffix="kg"
                change={(v) => update("propellantKg", v)}
              />
              <Control
                label="SPECIFIC IMPULSE"
                value={config.ispS}
                min={30}
                max={5000}
                step={50}
                suffix="s"
                change={(v) => update("ispS", v)}
              />
              <Control
                label="FORMATION RADIUS"
                value={config.formationRadiusKm}
                min={0.1}
                max={500}
                step={2}
                suffix="km"
                change={(v) => update("formationRadiusKm", v)}
              />
              <Control
                label="RELATIVE DRIFT"
                value={config.relativeDriftMS}
                min={0}
                max={10}
                step={0.02}
                suffix="m/s"
                change={(v) => update("relativeDriftMS", v)}
              />
            </div>
          </div>
          <div>
            <Title n="07" text="POWER + THERMAL" />
            <div className="cv-grid">
              <Control
                label="SOLAR AREA"
                value={config.solarAreaM2}
                min={0.1}
                max={100}
                step={1}
                suffix="m²"
                change={(v) => update("solarAreaM2", v)}
              />
              <Control
                label="BATTERY"
                value={config.batteryKWh}
                min={0.1}
                max={200}
                step={1}
                suffix="kWh"
                change={(v) => update("batteryKWh", v)}
              />
              <Control
                label="PAYLOAD LOAD"
                value={config.payloadPowerW}
                min={0}
                max={5000}
                step={50}
                suffix="W"
                change={(v) => update("payloadPowerW", v)}
              />
              <Control
                label="RADIATOR AREA"
                value={config.radiatorAreaM2}
                min={0.01}
                max={100}
                step={1}
                suffix="m²"
                change={(v) => update("radiatorAreaM2", v)}
              />
            </div>
          </div>
          <div>
            <Title n="08" text="DELAYED-COMMAND AUTONOMY" />
            <Range
              label="ONBOARD AUTONOMY"
              value={config.autonomyPercent}
              min={0}
              max={100}
              step={1}
              suffix="%"
              change={(v) => update("autonomyPercent", v)}
            />
            <Range
              label="ONE-WAY DELAY"
              value={config.oneWayDelayS}
              min={0}
              max={3600}
              step={1}
              suffix=" s"
              change={(v) => update("oneWayDelayS", v)}
            />
            <div className="cv-autonomy">
              <span>REQUIRED / AVAILABLE</span>
              <b>
                {fmt(result.requiredAutonomy, 0)}% / {fmt(config.autonomyPercent, 0)}%
              </b>
            </div>
          </div>
          <div className="cv-faults">
            <Title n="09" text="CONSTRAINT REGISTER" />
            <div>
              {result.constraints.length ? (
                result.constraints.map((x, i) => (
                  <article key={x}>
                    <span>C-{String(i + 1).padStart(2, "0")}</span>
                    <p>{x}</p>
                  </article>
                ))
              ) : (
                <article className="clear">
                  <span>PASS</span>
                  <p>Swarm may execute the selected civilian mission.</p>
                </article>
              )}
            </div>
            <small>NO WEAPONS · NO TARGETING · NO REAL FLIGHT CERTIFICATION</small>
          </div>
        </section>
      </section>
    </main>
  );
}
function Swarm({ config, result }: { config: CorvusConfig; result: ReturnType<typeof evaluateCorvus> }) {
  const nodes = Array.from({ length: result.count }, (_, i) => {
    const a = (i / result.count) * Math.PI * 2 - Math.PI / 2,
      r = 118 + ((i % 3) - 1) * 16;
    return { x: 330 + Math.cos(a) * r, y: 180 + Math.sin(a) * r * 0.7, failed: i >= result.healthy };
  });
  return (
    <svg
      className={`cv-swarm ${config.incident}`}
      viewBox="0 0 660 360"
      role="img"
      aria-label="Autonomous drone formation and crosslink mesh"
    >
      <defs>
        <radialGradient id="cvCore">
          <stop stopColor="#67d8ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#67d8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="330" cy="180" r="75" fill="url(#cvCore)" />
      <ellipse cx="330" cy="180" rx="180" ry="105" />
      <ellipse cx="330" cy="180" rx="118" ry="72" />
      {result.meshConnected &&
        nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return <line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y} />;
        })}
      {nodes.map((n, i) => (
        <g key={i} className={n.failed ? "failed" : "healthy"} transform={`translate(${n.x} ${n.y})`}>
          <path d="M-12-7H12L18 0 12 7H-12L-18 0Z" />
          <path d="M-7-8L-14-20H9L13-8M-7 8L-14 20H9L13 8" />
          <circle r="3" />
          <text y="31">C-{String(i + 1).padStart(2, "0")}</text>
        </g>
      ))}
      <g className="cv-center">
        <circle cx="330" cy="180" r="22" />
        <path d="M300 180H360M330 150V210" />
        <text x="330" y="218">
          LOCAL CONSENSUS
        </text>
      </g>
      <text className="cv-caption" x="20" y="30">
        {MISSION_META[config.mission].name} · R {fmt(config.formationRadiusKm, 1)} KM
      </text>
    </svg>
  );
}
function Title({ n, text }: { n: string; text: string }) {
  return (
    <div className="cv-title">
      <span>{n}</span>
      {text}
    </div>
  );
}
function Control({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  change: (v: number) => void;
}) {
  return (
    <div className="cv-control">
      <span>{label}</span>
      <div>
        <button aria-label={`Decrease ${label}`} onClick={() => change(Math.max(min, value - step))}>
          −
        </button>
        <b>
          {fmt(value, value < 10 ? 2 : 0)}
          <small>{suffix}</small>
        </b>
        <button aria-label={`Increase ${label}`} onClick={() => change(Math.min(max, value + step))}>
          +
        </button>
      </div>
    </div>
  );
}
function Range({
  label,
  value,
  min,
  max,
  step,
  suffix,
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  change: (v: number) => void;
}) {
  return (
    <label className="cv-range">
      <span>
        {label}
        <b>
          {fmt(value, 1)}
          {suffix}
        </b>
      </span>
      <input
        aria-label={label}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => change(Number(e.target.value))}
      />
    </label>
  );
}
function Metric({
  label,
  value,
  unit,
  accent,
  warning,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={`cv-metric ${accent ? "accent" : ""} ${warning ? "warning" : ""}`}>
      <span>{label}</span>
      <b>
        {value}
        <small>{unit}</small>
      </b>
    </div>
  );
}
