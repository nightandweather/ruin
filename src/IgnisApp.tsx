import { useMemo, useState } from "react";
import { ENGINES, engineConfig, evaluateEngine, type EngineId, type IgnisConfig } from "./ignis";
import { ModuleBar } from "./ModuleBar";

const engineIds = Object.keys(ENGINES) as EngineId[];
const format = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "∞";

export function IgnisApp() {
  const [config, setConfig] = useState<IgnisConfig>(() => engineConfig());
  const result = useMemo(() => evaluateEngine(config), [config]);
  const engine = ENGINES[config.engine];
  const update = <K extends keyof IgnisConfig>(key: K, value: IgnisConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));
  const selectEngine = (id: EngineId) => setConfig(engineConfig(id));
  const thermalRatio =
    result.structuralHeatMW > 0
      ? Math.min(100, (result.radiatorCapacityMW / result.structuralHeatMW) * 100)
      : 100;
  const burnRatio =
    config.requestedBurnHours > 0
      ? Math.min(100, (result.allowedBurnHours / config.requestedBurnHours) * 100)
      : 0;

  return (
    <main className="ig-shell">
      <header className="ig-top">
        <div className="ig-brand">
          <span>I//G</span>
          <div>
            <strong>RUIN // IGNIS</strong>
            <small>PROPULSION ENGINE LABORATORY</small>
          </div>
        </div>
        <ModuleBar current="ignis" />
        <div className="ig-state">
          <span>DESIGN MODEL · NON-FLIGHT SOFTWARE</span>
          <b className={result.readiness.toLowerCase()}>{result.readiness}</b>
        </div>
      </header>

      <section className="ig-layout">
        <aside className="ig-panel ig-config">
          <Title n="01" text="ENGINE ARCHITECTURE" />
          <div className="ig-engines">
            {engineIds.map((id) => (
              <button
                key={id}
                className={`${config.engine === id ? "active" : ""} ${ENGINES[id].maturity === 0 ? "unsupported" : ""}`}
                onClick={() => selectEngine(id)}
              >
                <i>M{ENGINES[id].maturity}</i>
                <span>
                  <b>{ENGINES[id].name}</b>
                  <small>{ENGINES[id].family}</small>
                </span>
              </button>
            ))}
          </div>
          <Title n="02" text="OPERATING POINT" />
          <Range
            label="THROTTLE"
            value={config.throttlePercent}
            min={0}
            max={100}
            step={1}
            suffix="%"
            change={(v) => update("throttlePercent", v)}
          />
          <Range
            label="CORE / DISCHARGE TEMP"
            value={config.coreTemperatureK}
            min={Math.floor((engine.referenceCoreTempK * 0.65) / 10) * 10}
            max={Math.ceil((engine.maxCoreTempK * 1.1) / 10) * 10}
            step={10}
            suffix="K"
            change={(v) => update("coreTemperatureK", v)}
          />
          <Stepper
            label="ENGINE UNITS"
            value={config.units}
            min={1}
            max={128}
            step={1}
            change={(v) => update("units", v)}
          />
          <Stepper
            label="FAILED / ISOLATED"
            value={config.failedUnits}
            min={0}
            max={config.units}
            step={1}
            change={(v) => update("failedUnits", v)}
          />
          <div className="ig-evidence">
            <b>{engine.propellant}</b>
            <span>{engine.evidence}</span>
          </div>
        </aside>

        <section className="ig-panel ig-stage">
          <div className="ig-stagehead">
            <Title n="03" text="ENGINE CUTAWAY" />
            <span>
              {engine.family} · {config.units - config.failedUnits}/{config.units} ONLINE
            </span>
          </div>
          <EngineDiagram
            engine={config.engine}
            throttle={config.throttlePercent}
            failed={config.failedUnits > 0}
          />
          <div className="ig-flow">
            <article>
              <span>01</span>
              <b>ENERGY SOURCE</b>
              <small>{format(result.sourcePowerMW, 3)} MW</small>
            </article>
            <article>
              <span>02</span>
              <b>WORKING FLUID</b>
              <small>{engine.propellant}</small>
            </article>
            <article>
              <span>03</span>
              <b>ACCELERATOR</b>
              <small>{format(result.exhaustVelocityMS / 1000, 1)} km/s exhaust</small>
            </article>
            <article>
              <span>04</span>
              <b>THRUST</b>
              <small>
                {result.thrustKN < 1 ? format(result.thrustN, 2) + " N" : format(result.thrustKN, 1) + " kN"}
              </small>
            </article>
          </div>
        </section>

        <aside className="ig-panel ig-output">
          <Title n="04" text="PERFORMANCE VERDICT" />
          <div className={`ig-verdict ${result.readiness.toLowerCase()}`}>
            <span>IGNITION AUTHORITY</span>
            <b>{result.readiness}</b>
            <small>{result.constraints[0] ?? "ALL PRELIMINARY CONTRACTS POSITIVE"}</small>
          </div>
          <div className="ig-metrics">
            <Metric label="SPECIFIC IMPULSE" value={format(result.effectiveIspS, 0)} unit="s" accent />
            <Metric label="MASS FLOW" value={format(result.massFlowKgS, 4)} unit="kg/s" />
            <Metric
              label="INITIAL ACCEL"
              value={format(result.initialAccelerationMilliG, 3)}
              unit="milli-g"
            />
            <Metric label="AVAILABLE ΔV" value={format(result.availableDeltaVkmS, 2)} unit="km/s" accent />
            <Metric label="TOTAL IMPULSE" value={format(result.totalImpulseMNs, 1)} unit="MN·s" />
            <Metric
              label="ENGINE-OUT THRUST"
              value={format(result.engineOutThrustPercent, 0)}
              unit="%"
              warning={result.engineOutThrustPercent < 100}
            />
          </div>
          <Title n="05" text="AUTHORIZATION LOGIC" />
          <Gauge label="HEAT REJECTION" value={thermalRatio} />
          <Gauge label="REQUESTED BURN ADMITTED" value={burnRatio} />
          <div className="ig-interlock">
            <b>{result.readiness === "NO-GO" ? "INHIBIT" : "ARMED"}</b>
            <span>
              {result.readiness === "NO-GO" ? "IGNITION COMMAND BLOCKED" : "TWO-CHANNEL PERMIT AVAILABLE"}
            </span>
          </div>
        </aside>

        <section className="ig-panel ig-contracts">
          <div>
            <Title n="06" text="VEHICLE + BURN CONTRACT" />
            <div className="ig-control-grid">
              <Stepper
                label="DRY VEHICLE"
                value={config.vehicleDryMassT}
                min={1}
                max={30000}
                step={config.vehicleDryMassT > 1000 ? 500 : 10}
                suffix="t"
                change={(v) => update("vehicleDryMassT", v)}
              />
              <Stepper
                label="PROPELLANT"
                value={config.propellantT}
                min={0.1}
                max={50000}
                step={config.propellantT > 1000 ? 500 : 10}
                suffix="t"
                change={(v) => update("propellantT", v)}
              />
              <Stepper
                label="REQUESTED BURN"
                value={config.requestedBurnHours}
                min={0.01}
                max={10000}
                step={config.requestedBurnHours > 100 ? 100 : config.requestedBurnHours > 1 ? 1 : 0.01}
                suffix="h"
                change={(v) => update("requestedBurnHours", v)}
              />
            </div>
          </div>
          <div>
            <Title n="07" text="THERMAL CONTRACT" />
            <div className="ig-control-grid">
              <Stepper
                label="RADIATOR AREA"
                value={config.radiatorAreaM2}
                min={0}
                max={500000}
                step={config.radiatorAreaM2 > 10000 ? 5000 : 100}
                suffix="m²"
                change={(v) => update("radiatorAreaM2", v)}
              />
              <Stepper
                label="RADIATOR TEMP"
                value={config.radiatorTemperatureK}
                min={250}
                max={1200}
                step={10}
                suffix="K"
                change={(v) => update("radiatorTemperatureK", v)}
              />
              <Stepper
                label="HEAT SINK"
                value={config.thermalSinkGJ}
                min={0}
                max={10000000}
                step={config.thermalSinkGJ > 100000 ? 100000 : 1000}
                suffix="GJ"
                change={(v) => update("thermalSinkGJ", v)}
              />
            </div>
          </div>
          <div className="ig-budget">
            <Title n="08" text="ENERGY + ENDURANCE" />
            <div>
              <Metric label="STRUCTURE HEAT" value={format(result.structuralHeatMW, 2)} unit="MW" />
              <Metric label="RADIATOR" value={format(result.radiatorCapacityMW, 2)} unit="MW" />
              <Metric
                label="THERMAL ENDURANCE"
                value={
                  result.thermalEnduranceHours === null
                    ? "CONTINUOUS"
                    : format(result.thermalEnduranceHours, 2)
                }
                unit={result.thermalEnduranceHours === null ? "" : "h"}
              />
              <Metric
                label="PROPELLANT ENDURANCE"
                value={format(result.propellantEnduranceHours, 1)}
                unit="h"
              />
              <Metric label="ADMITTED BURN" value={format(result.allowedBurnHours, 2)} unit="h" accent />
            </div>
          </div>
          <div className="ig-constraints">
            <Title n="09" text="OPEN CONSTRAINTS" />
            <div>
              {result.constraints.length ? (
                result.constraints.map((item, i) => (
                  <article key={item}>
                    <span>C-{String(i + 1).padStart(2, "0")}</span>
                    <p>{item}</p>
                  </article>
                ))
              ) : (
                <article className="clear">
                  <span>PASS</span>
                  <p>No preliminary limit violation detected.</p>
                </article>
              )}
            </div>
            <small>NO GUIDANCE · NO TARGETING · NO FLIGHT CERTIFICATION</small>
          </div>
        </section>
      </section>
    </main>
  );
}

function EngineDiagram({
  engine,
  throttle,
  failed,
}: {
  engine: EngineId;
  throttle: number;
  failed: boolean;
}) {
  const electric = engine === "hall-electric";
  const nuclear = engine === "nuclear-thermal";
  const fusion = engine === "fusion-concept";
  return (
    <svg
      className={`ig-engine ${engine} ${failed ? "fault" : ""}`}
      viewBox="0 0 760 360"
      role="img"
      aria-label={`${ENGINES[engine].name} propulsion flow cutaway`}
    >
      <defs>
        <linearGradient id="igMetal">
          <stop stopColor="#192228" />
          <stop offset=".5" stopColor="#667078" />
          <stop offset="1" stopColor="#11171b" />
        </linearGradient>
        <linearGradient id="igPlume">
          <stop stopColor="#fff3c0" />
          <stop offset=".25" stopColor={electric ? "#62d7ff" : "#ff9a45"} />
          <stop offset="1" stopColor="#de4e3b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="ig-feed" d="M68 90H205M68 270H205" />
      <circle className="ig-tank" cx="68" cy="90" r="35" />
      <circle className="ig-tank" cx="68" cy="270" r="35" />
      <g className="ig-core">
        <rect x="205" y="72" width="176" height="216" rx="28" />
        {electric ? (
          <>
            <path d="M230 110H355M230 145H355M230 180H355M230 215H355M230 250H355" />
            <circle cx="292" cy="180" r="47" />
          </>
        ) : fusion ? (
          <>
            <circle cx="292" cy="180" r="72" />
            <circle cx="292" cy="180" r="43" />
            <path d="M220 180H364M292 108V252" />
          </>
        ) : nuclear ? (
          <>
            <path d="M235 95V265M260 95V265M285 95V265M310 95V265M335 95V265" />
            <path d="M218 130H368M218 180H368M218 230H368" />
          </>
        ) : (
          <>
            <path d="M220 180Q285 92 365 180Q285 268 220 180" />
            <circle cx="292" cy="180" r="24" />
          </>
        )}
      </g>
      <path className="ig-nozzle" d="M381 119H455L550 55V305L455 241H381Z" />
      <path
        className="ig-plume"
        style={{ opacity: 0.18 + throttle / 125 }}
        d="M550 76L744 180 550 284Q610 180 550 76Z"
      />
      <path className="ig-axis" d="M24 180H730" />
      <g className="ig-labels">
        <text x="28" y="35">
          PROPELLANT FEED
        </text>
        <text x="236" y="40">
          {electric
            ? "IONIZATION + FIELD"
            : nuclear
              ? "FISSION HEAT"
              : fusion
                ? "PLASMA CONFINEMENT"
                : "COMBUSTION CHAMBER"}
        </text>
        <text x="430" y="335">
          EXHAUST ACCELERATOR
        </text>
        <text x="640" y="35">
          THRUST VECTOR →
        </text>
      </g>
      {failed && (
        <g className="ig-fault-mark">
          <circle cx="368" cy="80" r="18" />
          <text x="368" y="85">
            !
          </text>
          <text x="395" y="85">
            CLUSTER REBALANCE
          </text>
        </g>
      )}
    </svg>
  );
}

function Title({ n, text }: { n: string; text: string }) {
  return (
    <div className="ig-title">
      <span>{n}</span>
      {text}
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
  change: (value: number) => void;
}) {
  return (
    <label className="ig-range">
      <span>
        {label}
        <b>
          {format(value, 0)}
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
        onChange={(event) => change(Number(event.target.value))}
      />
    </label>
  );
}
function Stepper({
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
  change: (value: number) => void;
}) {
  return (
    <div className="ig-stepper">
      <span>{label}</span>
      <div>
        <button aria-label={`Decrease ${label}`} onClick={() => change(Math.max(min, value - step))}>
          −
        </button>
        <b>
          {format(value, value < 10 ? 2 : 0)}
          <small>{suffix}</small>
        </b>
        <button aria-label={`Increase ${label}`} onClick={() => change(Math.min(max, value + step))}>
          +
        </button>
      </div>
    </div>
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
    <div className={`ig-metric ${accent ? "accent" : ""} ${warning ? "warning" : ""}`}>
      <span>{label}</span>
      <b>
        {value}
        <small>{unit}</small>
      </b>
    </div>
  );
}
function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="ig-gauge">
      <span>
        {label}
        <b>{format(value, 0)}%</b>
      </span>
      <i>
        <em style={{ width: `${value}%` }} />
      </i>
    </div>
  );
}
