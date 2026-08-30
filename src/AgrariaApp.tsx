import { useEffect, useState } from "react";
import {
  AgrariaSimulation,
  DEFAULT_AGRARIA_CONFIG,
  type AgrariaConfig,
  type AgrariaIncident,
  type CropStrategy,
} from "./agraria";
const incidents: Record<AgrariaIncident, { code: string; title: string; detail: string }> = {
  "root-dryout": { code: "H₂O", title: "Root dryout", detail: "Isolate racks" },
  "fungal-outbreak": { code: "BIO", title: "Spore outbreak", detail: "Quarantine sector" },
  "co2-shortage": { code: "CO₂", title: "Carbon shortage", detail: "Reduce growth" },
  "lighting-bus-fault": { code: "LED", title: "Lighting bus fault", detail: "Shed photoperiod" },
};
const strategies: Record<CropStrategy, string> = {
  balanced: "BALANCED",
  "calorie-first": "CALORIES",
  "fresh-food": "FRESH",
  "life-support": "LIFE SUPPORT",
};
const num = (v: number, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d });
export function AgrariaApp() {
  const [config, setConfig] = useState<AgrariaConfig>({ ...DEFAULT_AGRARIA_CONFIG });
  const [sim, setSim] = useState(() => new AgrariaSimulation());
  const [snap, setSnap] = useState(() => sim.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(3);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSnap(sim.step(speed)), 340);
    return () => clearInterval(t);
  }, [running, sim, speed]);
  const update = (key: keyof AgrariaConfig, value: number | string) => {
    const next = { ...config, [key]: value } as AgrariaConfig;
    setConfig(next);
    setSnap(sim.updateConfig(next));
  };
  const reset = () => {
    const n = new AgrariaSimulation();
    setConfig({ ...DEFAULT_AGRARIA_CONFIG });
    setSim(n);
    setSnap(n.snapshot());
    setRunning(true);
  };
  return (
    <main className="agraria-shell">
      <header className="agraria-top">
        <div className="agraria-brand">
          <span>A//G</span>
          <div>
            <strong>RUIN // AGRARIA</strong>
            <small>ORBITAL BIOREGENERATIVE FARM</small>
          </div>
        </div>
        <nav>
          <a href="./">HELIOS</a>
          <a href="./collector.html">COLLECTOR</a>
          <a href="./datacore.html">DATACORE</a>
          <b>AGRARIA</b>
        </nav>
        <div className="agraria-state">
          <span>DECK AG-01 · τ{String(snap.tick).padStart(5, "0")}</span>
          <b className={snap.mode}>{snap.mode.replace("-", " ").toUpperCase()}</b>
        </div>
      </header>
      <section className="agraria-layout">
        <aside className="ag-config ag-panel">
          <Title n="01" text="GROWTH CONTRACT" />
          <Step
            label="CROP AREA"
            value={config.areaM2}
            unit="m²"
            step={100}
            min={100}
            max={5000}
            change={(v) => update("areaM2", v)}
          />
          <Step
            label="PHOTON FLUX"
            value={config.ppfd}
            unit="µmol/m²/s"
            step={50}
            min={200}
            max={1000}
            change={(v) => update("ppfd", v)}
          />
          <Step
            label="PHOTOPERIOD"
            value={config.photoperiodHours}
            unit="h/day"
            step={1}
            min={8}
            max={24}
            change={(v) => update("photoperiodHours", v)}
          />
          <Step
            label="CO₂ SETPOINT"
            value={config.co2Ppm}
            unit="ppm"
            step={100}
            min={300}
            max={1600}
            change={(v) => update("co2Ppm", v)}
          />
          <Step
            label="CREW"
            value={config.crew}
            unit="people"
            step={4}
            min={4}
            max={120}
            change={(v) => update("crew", v)}
          />
          <div className="recovery">
            <span>
              WATER RECOVERY <b>{Math.round(config.waterRecovery * 100)}%</b>
            </span>
            <input
              type="range"
              min="70"
              max="99"
              value={config.waterRecovery * 100}
              onChange={(e) => update("waterRecovery", +e.target.value / 100)}
            />
            <span>
              NUTRIENT RECOVERY <b>{Math.round(config.nutrientRecovery * 100)}%</b>
            </span>
            <input
              type="range"
              min="40"
              max="98"
              value={config.nutrientRecovery * 100}
              onChange={(e) => update("nutrientRecovery", +e.target.value / 100)}
            />
          </div>
          <div className="ag-power">
            <span>C-01 POWER DRAW</span>
            <b>{snap.facilityPowerMW} MW</b>
            <small>{((snap.facilityPowerMW / 5.03) * 100).toFixed(1)}% of one collector contract</small>
          </div>
        </aside>
        <section className="grow-deck ag-panel">
          <div className="grow-head">
            <Title n="02" text="CROP DECK DIGITAL TWIN" />
            <span>{snap.productiveAreaPercent}% PRODUCTIVE</span>
          </div>
          <div className="strategy-tabs">
            {(Object.keys(strategies) as CropStrategy[]).map((s) => (
              <button
                key={s}
                className={config.strategy === s ? "selected" : ""}
                onClick={() => update("strategy", s)}
              >
                {strategies[s]}
              </button>
            ))}
          </div>
          <div className="bed-map">
            {snap.beds.flatMap((bed, bi) =>
              Array.from({ length: Math.max(1, Math.round(bed.fraction * 24)) }, (_, i) => (
                <div key={`${bi}-${i}`} className={`crop-bed ${bed.status}`}>
                  <i />
                  <span>{bed.crop}</span>
                  <small>{bed.status}</small>
                </div>
              )),
            )}
          </div>
          <div className="cycle">
            <div>
              <span>HABITAT</span>
              <b>CO₂ + WASTE WATER</b>
            </div>
            <i>→</i>
            <div>
              <span>AGRARIA</span>
              <b>LIGHT + NUTRIENTS</b>
            </div>
            <i>→</i>
            <div>
              <span>CREW</span>
              <b>FOOD + O₂ + CLEAN WATER</b>
            </div>
          </div>
        </section>
        <aside className="ag-output ag-panel">
          <Title n="03" text="DAILY BIO-OUTPUT" />
          <div className="ag-metrics">
            <Metric label="EDIBLE MASS" value={snap.edibleKgDay} unit="kg/day" accent />
            <Metric
              label="DIET COVERAGE"
              value={snap.peopleFed}
              unit="people"
              alert={snap.peopleFed < config.crew}
            />
            <Metric label="O₂ SUPPORT" value={snap.oxygenPeople} unit="people" />
            <Metric label="CALORIES" value={num(snap.caloriesDay)} unit="kcal/day" />
            <Metric label="ENERGY INTENSITY" value={snap.energyKwhPerKg} unit="kWh/kg" />
            <Metric label="CO₂ FIXED" value={snap.co2FixedKgDay} unit="kg/day" />
          </div>
          <div className="crew-cover">
            <span>
              CREW FOOD COVERAGE <b>{Math.min(100, (snap.peopleFed / config.crew) * 100).toFixed(0)}%</b>
            </span>
            <i>
              <em style={{ width: `${Math.min(100, (snap.peopleFed / config.crew) * 100)}%` }} />
            </i>
          </div>
          <div className="water-ledger">
            <div>
              <span>WATER RECOVERED</span>
              <b>{num(snap.waterRecoveredLDay)} L/d</b>
            </div>
            <div>
              <span>MAKE-UP WATER</span>
              <b>{num(snap.waterMakeupLDay)} L/d</b>
            </div>
            <div>
              <span>MAKE-UP NUTRIENT</span>
              <b>{snap.nutrientMakeupKgDay} kg/d</b>
            </div>
          </div>
          <p>
            Yield and resource coefficients are scenario parameters. NASA area estimates anchor the order of
            magnitude; this is not a crop-production guarantee.
          </p>
        </aside>
        <section className="ag-ops ag-panel">
          <div>
            <Title n="04" text="BIOLOGICAL INCIDENTS" />
            <section>
              {(Object.keys(incidents) as AgrariaIncident[]).map((type) => {
                const x = incidents[type],
                  active = snap.activeIncidents.some((i) => i.type === type);
                return (
                  <button
                    key={type}
                    className={active ? "active" : ""}
                    disabled={active}
                    onClick={() => setSnap(sim.inject(type))}
                  >
                    <b>{x.code}</b>
                    <span>
                      {x.title}
                      <small>{x.detail}</small>
                    </span>
                  </button>
                );
              })}
            </section>
          </div>
          <div className="ag-ledger">
            <Title n="05" text="CROP LEDGER" />
            <section>
              {snap.events.slice(0, 7).map((e) => (
                <article key={e.id} className={e.level}>
                  <time>τ{String(e.tick).padStart(5, "0")}</time>
                  <p>{e.message}</p>
                </article>
              ))}
            </section>
          </div>
        </section>
      </section>
      <footer className="agraria-controls">
        <div>
          <button className="run" onClick={() => setRunning((v) => !v)}>
            {running ? "Ⅱ PAUSE" : "▶ RUN"}
          </button>
          {[1, 3, 12].map((v) => (
            <button key={v} className={speed === v ? "selected" : ""} onClick={() => setSpeed(v)}>
              {v}×
            </button>
          ))}
          <button disabled={running} onClick={() => setSnap(sim.step())}>
            STEP
          </button>
          <button onClick={reset}>RESET DECK</button>
        </div>
        <span>
          {snap.peopleFed}/{config.crew} PEOPLE FED · {snap.oxygenPeople} O₂ EQUIVALENT ·{" "}
          {snap.facilityPowerMW} MW
        </span>
      </footer>
    </main>
  );
}
function Title({ n, text }: { n: string; text: string }) {
  return (
    <div className="ag-title">
      <span>{n}</span>
      {text}
    </div>
  );
}
function Step({
  label,
  value,
  unit,
  step,
  min,
  max,
  change,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  change: (v: number) => void;
}) {
  return (
    <div className="ag-step">
      <span>{label}</span>
      <div>
        <button aria-label={`Decrease ${label}`} onClick={() => change(Math.max(min, value - step))}>
          −
        </button>
        <b>
          {num(value)}
          <small>{unit}</small>
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
  alert,
}: {
  label: string;
  value: string | number;
  unit: string;
  accent?: boolean;
  alert?: boolean;
}) {
  return (
    <div className={`ag-metric ${accent ? "accent" : ""} ${alert ? "alert" : ""}`}>
      <span>{label}</span>
      <b>
        {value}
        <small>{unit}</small>
      </b>
    </div>
  );
}
