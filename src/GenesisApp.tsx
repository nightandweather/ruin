import { useMemo, useState } from "react";
import { genesisConfig, simulateGenesis, type GenesisConfig, type GenesisIncident } from "./genesis";
const f = (v: number, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d });
export function GenesisApp() {
  const [c, setC] = useState<GenesisConfig>(() => genesisConfig()),
    r = useMemo(() => simulateGenesis(c), [c]);
  const u = <K extends keyof GenesisConfig>(k: K, v: GenesisConfig[K]) => setC((x) => ({ ...x, [k]: v }));
  return (
    <main className="cx-shell genesis">
      <header className="cx-top">
        <div className="cx-brand">
          <span>G//N</span>
          <div>
            <strong>RUIN // GENESIS</strong>
            <small>STELLAR CIVILIZATION BOOTSTRAP CAMPAIGN</small>
          </div>
        </div>
        <nav>
          <a href="./atlas.html">ATLAS</a>
          <a href="./prometheus.html">PROMETHEUS</a>
          <a href="./progenitor.html">PROGENITOR</a>
          <a href="./sentinel.html">SENTINEL</a>
        </nav>
        <div className="cx-state">
          YEAR {c.years} · <b className={r.readiness.toLowerCase()}>{r.readiness}</b>
        </div>
      </header>
      <section className="cx-layout">
        <aside className="cx-panel cx-left">
          <Title n="01" t="SEED MISSION" />
          <Step
            label="CAMPAIGN HORIZON"
            value={c.years}
            min={10}
            max={500}
            step={10}
            unit="yr"
            change={(v) => u("years", v)}
          />
          <Step
            label="SEED MASS"
            value={c.seedMassT}
            min={50}
            max={5000}
            step={50}
            unit="t"
            change={(v) => u("seedMassT", v)}
          />
          <Step
            label="PROMETHEUS CORES"
            value={c.reactorUnits}
            min={1}
            max={12}
            step={1}
            change={(v) => u("reactorUnits", v)}
          />
          <Step
            label="CORVUS DRONES"
            value={c.corvusDrones}
            min={1}
            max={100}
            step={2}
            change={(v) => u("corvusDrones", v)}
          />
          <Title n="02" t="INDUSTRIAL CLOSURE" />
          <Range
            label="ORE GRADE"
            value={c.oreGradePercent}
            min={0.2}
            max={20}
            step={0.2}
            unit="%"
            change={(v) => u("oreGradePercent", v)}
          />
          <Range
            label="LOCAL PRODUCTION"
            value={c.factoryClosurePercent}
            min={20}
            max={98}
            step={1}
            unit="%"
            change={(v) => u("factoryClosurePercent", v)}
          />
          <Range
            label="COLLECTOR GROWTH"
            value={c.collectorGrowthPercent}
            min={1}
            max={80}
            step={1}
            unit="%/yr"
            change={(v) => u("collectorGrowthPercent", v)}
          />
        </aside>
        <section className="cx-panel cx-stage">
          <Title n="03" t="CIVILIZATION BOOT SEQUENCE" />
          <Bootstrap r={r} />
          <div className="cx-metric-row">
            <Metric l="FACTORIES" v={f(r.factories)} u="" />
            <Metric l="COLLECTORS" v={f(r.collectors)} u="" />
            <Metric l="POWER" v={f(r.powerKW)} u="kW" a />
            <Metric l="POPULATION" v={f(r.population)} u="" />
          </div>
        </section>
        <aside className="cx-panel cx-right">
          <Title n="04" t="CAMPAIGN OUTCOME" />
          <div className={`cx-verdict ${r.readiness.toLowerCase()}`}>
            <span>STELLAR FOOTHOLD</span>
            <b>{r.readiness}</b>
            <small>
              {r.selfSufficient
                ? `SELF-SUFFICIENCY IN YEAR ${r.selfSufficient}`
                : (r.bottlenecks[0] ?? "BOOTSTRAP IN PROGRESS")}
            </small>
          </div>
          <div className="cx-metrics">
            <Metric l="FIRST ORE" v={year(r.firstOre)} u="" />
            <Metric l="FIRST REPLICATION" v={year(r.firstReplication)} u="" />
            <Metric l="ENERGY INDEPENDENCE" v={year(r.energyIndependence)} u="" />
            <Metric l="HABITAT ONLINE" v={year(r.habitatOnline)} u="" />
            <Metric l="LOCAL STOCK" v={f(r.stockT, 1)} u="t" />
            <Metric l="REACTOR STATE" v={r.reactor.safeState} u="" a />
          </div>
          <Title n="05" t="CRISIS INJECTION" />
          <div className="cx-incidents">
            {(["none", "ore-poor", "metrology-drift", "reactor-trip", "pathogen"] as GenesisIncident[]).map(
              (x) => (
                <button className={c.incident === x ? "active" : ""} key={x} onClick={() => u("incident", x)}>
                  {x.replace("-", " ").toUpperCase()}
                </button>
              ),
            )}
          </div>
        </aside>
        <section className="cx-panel cx-bottom">
          <div>
            <Title n="06" t="MILESTONE LEDGER" />
            <div className="gn-events">
              {r.events.map((e) => (
                <p key={e.label}>
                  <time>Y{e.year}</time>
                  <b>{e.label}</b>
                  <small>{e.system}</small>
                </p>
              ))}
            </div>
          </div>
          <div>
            <Title n="07" t="REPLICATION POLICY" />
            <Step
              label="REPLICATION CYCLE"
              value={c.replicationMonths}
              min={6}
              max={120}
              step={6}
              unit="mo"
              change={(v) => u("replicationMonths", v)}
            />
            <Step
              label="HABITAT TARGET"
              value={c.habitatPopulation}
              min={0}
              max={10000}
              step={20}
              unit="people"
              change={(v) => u("habitatPopulation", v)}
            />
          </div>
          <div className="gn-chain">
            <Title n="08" t="SYSTEM CONTRACT" />
            <p>
              ATLAS → NAVIS → PROMETHEUS → CORVUS → FOUNDRY → PROGENITOR → HELIOS → AGRARIA + GRAVITAS →
              ODYSSEY
            </p>
            <small>
              No global present exists after departure. Every milestone is evidence-gated locally.
            </small>
          </div>
          <div className="cx-register">
            <Title n="09" t="BOTTLENECKS" />
            {r.bottlenecks.length ? (
              r.bottlenecks.map((x, i) => (
                <p key={x}>
                  <span>B-{i + 1}</span>
                  {x}
                </p>
              ))
            ) : (
              <p className="pass">
                <span>PASS</span>Local civilization closes its survival and production loops.
              </p>
            )}
            <small>SCENARIO MODEL · NOT A COLONIZATION FORECAST</small>
          </div>
        </section>
      </section>
    </main>
  );
}
function Bootstrap({ r }: { r: ReturnType<typeof simulateGenesis> }) {
  const stages = [
    { n: "01", name: "ARRIVAL", ok: true },
    { n: "02", name: "ORE", ok: r.firstOre !== null },
    { n: "03", name: "REPLICATE", ok: r.firstReplication !== null },
    { n: "04", name: "STELLAR POWER", ok: r.energyIndependence !== null },
    { n: "05", name: "HABITAT", ok: r.habitatOnline !== null },
    { n: "06", name: "SELF-RULE", ok: r.selfSufficient !== null },
  ];
  return (
    <div className="gn-boot">
      {stages.map((s, i) => (
        <div key={s.name} className={s.ok ? "done" : "pending"}>
          <i>{s.n}</i>
          <span>{s.name}</span>
          {i < stages.length - 1 && <em />}
        </div>
      ))}
    </div>
  );
}
function year(v: number | null) {
  return v === null ? "—" : `Y${v}`;
}
function Title({ n, t }: { n: string; t: string }) {
  return (
    <div className="cx-title">
      <span>{n}</span>
      {t}
    </div>
  );
}
function Step({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  change: (v: number) => void;
}) {
  return (
    <div className="cx-step">
      <span>{label}</span>
      <div>
        <button aria-label={`Decrease ${label}`} onClick={() => change(Math.max(min, value - step))}>
          −
        </button>
        <b>
          {f(value)}
          <small>{unit}</small>
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
  unit,
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  change: (v: number) => void;
}) {
  return (
    <label className="cx-range">
      <span>
        {label}
        <b>
          {f(value, 1)}
          {unit}
        </b>
      </span>
      <input
        type="range"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => change(+e.target.value)}
      />
    </label>
  );
}
function Metric({ l, v, u, a }: { l: string; v: string; u: string; a?: boolean }) {
  return (
    <div className={`cx-metric ${a ? "accent" : ""}`}>
      <span>{l}</span>
      <b>
        {v}
        <small>{u}</small>
      </b>
    </div>
  );
}
