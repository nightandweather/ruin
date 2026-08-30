import { useMemo, useState } from "react";
import {
  advanceHorizon,
  createHorizonState,
  horizonProjection,
  injectHorizonIncident,
  recoverHorizonSystem,
  setHorizonPolicy,
  type HorizonPolicy,
  type HorizonSystemId,
} from "./horizons";

const fmt = (value: number, digits = 0) => value.toLocaleString(undefined, { maximumFractionDigits: digits });

export function HorizonsApp() {
  const [state, setState] = useState(createHorizonState);
  const [selectedId, setSelectedId] = useState<HorizonSystemId>("first-contact");
  const selected = state.systems.find((node) => node.id === selectedId)!;
  const projection = useMemo(() => horizonProjection(state), [state]);
  const dependentSystems = state.systems.filter((node) => node.dependencies.includes(selectedId));
  const critical = state.systems.filter((node) => node.status === "critical").length;
  const status = critical
    ? "CAUSAL FRACTURE"
    : state.systems.some((node) => node.status !== "nominal")
      ? "DEGRADED"
      : "COHERENT";
  return (
    <main className="hz-shell">
      <header className="hz-top">
        <div className="hz-brand">
          <span>∞</span>
          <div>
            <strong>RUIN // HORIZONS</strong>
            <small>POST-STELLAR CIVILIZATION OPERATING FIELD</small>
          </div>
        </div>
        <nav>
          <a href="./">HELIOS</a>
          <a href="./genesis.html">GENESIS</a>
          <a href="./mnemosyne.html">MNEMOSYNE</a>
          <a href="./sentinel.html">SENTINEL</a>
        </nav>
        <div className={`hz-state ${critical ? "critical" : ""}`}>
          C.E. {2321 + state.year} · <b>{status}</b>
        </div>
      </header>
      <section className="hz-grid">
        <aside className="hz-panel hz-overview">
          <Title n="01" text="CIVILIZATION STATE" />
          <div className="hz-vitals">
            <Metric label="POPULATION" value={fmt(state.populationB, 2)} unit="B" />
            <Metric label="USABLE ENERGY" value={fmt(state.energyZJ, 1)} unit="ZJ" />
            <Metric label="KNOWLEDGE" value={fmt(state.knowledgePB)} unit="PB" />
            <Metric label="INSTITUTIONAL TRUST" value={fmt(state.institutionalTrust)} unit="%" />
          </div>
          <div className="hz-ledger">
            <span>
              CAUSALLY ISOLATED<b>{state.causallyIsolatedColonies} COLONIES</b>
            </span>
            <span>
              CRITICAL SYSTEMS<b className={critical ? "danger" : ""}>{critical} / 14</b>
            </span>
            <span>
              CONSENSUS YEAR<b>+{state.year}</b>
            </span>
          </div>
          <Title n="02" text="CIVILIZATION PRIORITY" />
          <div className="hz-policies">
            {(["continuity", "expansion", "discovery"] as HorizonPolicy[]).map((policy) => (
              <button
                key={policy}
                className={state.policy === policy ? "active" : ""}
                onClick={() => setState((current) => setHorizonPolicy(current, policy))}
              >
                <b>{policy.toUpperCase()}</b>
                <small>
                  {policy === "continuity"
                    ? "Repair margins and public trust"
                    : policy === "expansion"
                      ? "Increase reach at systemic cost"
                      : "Increase knowledge and uncertainty"}
                </small>
              </button>
            ))}
          </div>
          <button className="hz-advance" onClick={() => setState((current) => advanceHorizon(current, 10))}>
            RESOLVE NEXT 10 YEARS <span>→</span>
          </button>
          <button
            className="hz-reset"
            onClick={() => {
              setState(createHorizonState());
              setSelectedId("first-contact");
            }}
          >
            RESTORE COMMISSIONED STATE
          </button>
        </aside>
        <section className="hz-panel hz-map">
          <div className="hz-map-head">
            <Title n="03" text="CAUSAL INFRASTRUCTURE MAP" />
            <div>
              <i className="nominal" />
              NOMINAL <i className="strained" />
              STRAINED <i className="critical" />
              CRITICAL
            </div>
          </div>
          <CausalMap state={state} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="hz-scale">
            <span>LOCAL PRESENT</span>
            <i />
            <span>NO SHARED NOW</span>
            <i />
            <span>DEEP TIME</span>
          </div>
          <div className="hz-futures">
            {projection.map((point) => (
              <article key={point.years} className={point.trust < 50 ? "critical" : ""}>
                <span>+{point.years} YEARS</span>
                <b>{fmt(point.populationB, 2)}B</b>
                <small>POPULATION</small>
                <b>{fmt(point.trust)}%</b>
                <small>TRUST</small>
                <b>{point.isolated}</b>
                <small>ISOLATED</small>
              </article>
            ))}
          </div>
        </section>
        <aside className={`hz-panel hz-inspector ${selected.status}`}>
          <header>
            <div>
              <span>{selected.code} // SYSTEM RECORD</span>
              <b>{selected.name}</b>
              <small>{selected.subtitle}</small>
            </div>
            <em>{selected.evidence.toUpperCase()}</em>
          </header>
          <div className="hz-integrity">
            <span>CONTROL INTEGRITY</span>
            <b>{fmt(selected.integrity, 1)}%</b>
            <i>
              <em style={{ width: `${selected.integrity}%` }} />
            </i>
          </div>
          <div className="hz-metrics">
            <Metric label="SYSTEM LOAD" value={fmt(selected.load)} unit="%" />
            <Metric
              label={selected.metric}
              value={fmt(selected.metricValue, selected.metricValue < 10 ? 1 : 0)}
              unit={selected.unit}
            />
          </div>
          <Record label="CONSTRAINING RESOURCE" text={selected.resource} />
          <Record label="CATASTROPHIC FAILURE" text={selected.failure} tone="danger" />
          <Record label="NON-NEGOTIABLE INVARIANT" text={selected.invariant} tone="safe" />
          <Record label="SAFE RECOVERY" text={selected.recovery} />
          <div className="hz-dependencies">
            <span>REQUIRES</span>
            <div>
              {selected.dependencies.map((id) => {
                const node = state.systems.find((candidate) => candidate.id === id)!;
                return (
                  <button key={id} onClick={() => setSelectedId(id)}>
                    <i className={node.status} />
                    {node.code}
                    <small>{fmt(node.integrity)}%</small>
                  </button>
                );
              })}
            </div>
            <span>BLAST RADIUS</span>
            <div>
              {dependentSystems.length ? (
                dependentSystems.map((node) => (
                  <button key={node.id} onClick={() => setSelectedId(node.id)}>
                    <i className={node.status} />
                    {node.code}
                    <small>{fmt(node.integrity)}%</small>
                  </button>
                ))
              ) : (
                <small>NO DIRECT DEPENDENTS</small>
              )}
            </div>
          </div>
          <div className="hz-actions">
            <button
              className="incident"
              disabled={!!selected.incident}
              onClick={() => setState((current) => injectHorizonIncident(current, selectedId))}
            >
              {selected.incident ? "INCIDENT ACTIVE" : "INJECT SYSTEM FAILURE"}
            </button>
            <button onClick={() => setState((current) => recoverHorizonSystem(current, selectedId))}>
              EXECUTE SAFE RECOVERY
            </button>
          </div>
        </aside>
        <section className="hz-panel hz-events">
          <Title n="04" text="CAUSAL EVENT PROVENANCE" />
          <div>
            {state.events.map((event, index) => (
              <article key={`${event.year}-${event.source}-${index}`} className={event.level}>
                <time>C.E. {2321 + event.year}</time>
                <b>{event.source}</b>
                <p>{event.message}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function CausalMap({
  state,
  selectedId,
  onSelect,
}: {
  state: ReturnType<typeof createHorizonState>;
  selectedId: HorizonSystemId;
  onSelect: (id: HorizonSystemId) => void;
}) {
  return (
    <div className="hz-network">
      <svg viewBox="0 0 100 100" role="img" aria-label="Interactive causal infrastructure network">
        <defs>
          <radialGradient id="core">
            <stop offset="0" stopColor="#ffd993" stopOpacity=".95" />
            <stop offset="1" stopColor="#d18839" stopOpacity="0" />
          </radialGradient>
          <marker id="hz-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6Z" />
          </marker>
        </defs>
        <circle cx="50" cy="50" r="17" fill="url(#core)" />
        <circle className="hz-orbit" cx="50" cy="50" r="31" />
        <circle className="hz-orbit outer" cx="50" cy="50" r="45" />
        {state.systems.flatMap((node) =>
          node.dependencies.map((dependencyId) => {
            const dependency = state.systems.find((candidate) => candidate.id === dependencyId)!;
            return (
              <line
                key={`${dependencyId}-${node.id}`}
                className={`hz-link ${dependency.status === "critical" || node.status === "critical" ? "broken" : ""}`}
                x1={dependency.x}
                y1={dependency.y}
                x2={node.x}
                y2={node.y}
                markerEnd="url(#hz-arrow)"
              />
            );
          }),
        )}
      </svg>
      {state.systems.map((node) => (
        <button
          key={node.id}
          className={`hz-node ${node.status} ${selectedId === node.id ? "selected" : ""}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          onClick={() => onSelect(node.id)}
          aria-label={`Inspect ${node.name}, ${node.status}`}
        >
          <i />
          <b>{node.code}</b>
          <span>{node.name}</span>
          <small>{fmt(node.integrity)}%</small>
        </button>
      ))}
      <div className="hz-core">
        <i />
        <b>
          CIVILIZATION
          <br />
          CONSENSUS
        </b>
        <small>{state.systems.filter((node) => node.status === "nominal").length}/14 VERIFIED</small>
      </div>
    </div>
  );
}
function Title({ n, text }: { n: string; text: string }) {
  return (
    <div className="hz-title">
      <span>{n}</span>
      {text}
      <i />
    </div>
  );
}
function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="hz-metric">
      <span>{label}</span>
      <b>
        {value}
        <small>{unit}</small>
      </b>
    </div>
  );
}
function Record({ label, text, tone = "" }: { label: string; text: string; tone?: string }) {
  return (
    <section className={`hz-record ${tone}`}>
      <span>{label}</span>
      <p>{text}</p>
    </section>
  );
}
