import { useMemo, useState } from "react";
import {
  evaluateKessler,
  kesslerConfig,
  MORATORIUM_DENSITY,
  type KesslerConfig,
  type KesslerIncident,
} from "./kessler";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: KesslerIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Catalog current; avoidance armed" },
  { id: "breakup", name: "CATASTROPHIC BREAKUP", detail: "One fragmentation seeds the band at year zero" },
  { id: "tracking-outage", name: "TRACKING OUTAGE", detail: "Every conjunction becomes unavoidable" },
];

function TrajectoryChart({ result }: { result: ReturnType<typeof evaluateKessler> }) {
  const points = result.trajectory;
  const maxPop = Math.max(1, ...points.map((p) => p.tracked + p.untracked));
  const w = 620;
  const h = 250;
  const x = (year: number) => 30 + (year / Math.max(1, points.length - 1)) * (w - 60);
  // Log scale: a cascade is an exponential story, and a linear axis hides
  // the quiet decades that make the runaway look sudden.
  const y = (pop: number) => h - 30 - (Math.log10(1 + pop) / Math.log10(1 + maxPop)) * (h - 70);
  const path = (pick: (p: (typeof points)[number]) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Debris population trajectory">
      <text x={30} y={20} fill="#8a6a5a" fontSize="10">
        BAND POPULATION · LOG SCALE · {points.length - 1} YEARS
      </text>
      {result.moratoriumYear !== null && (
        <g>
          <line
            x1={x(result.moratoriumYear)}
            y1={30}
            x2={x(result.moratoriumYear)}
            y2={h - 30}
            stroke="#ffc9ae"
            strokeDasharray="3 4"
          />
          <text x={x(result.moratoriumYear) + 4} y={40} fill="#ffc9ae" fontSize="9">
            MORATORIUM Y{result.moratoriumYear}
          </text>
        </g>
      )}
      {result.runawayYear !== null && (
        <g>
          <line
            x1={x(result.runawayYear)}
            y1={30}
            x2={x(result.runawayYear)}
            y2={h - 30}
            stroke="#ff6b7c"
            strokeDasharray="2 3"
          />
          <text x={x(result.runawayYear) + 4} y={54} fill="#ff6b7c" fontSize="9">
            RUNAWAY Y{result.runawayYear}
          </text>
        </g>
      )}
      <path d={path((p) => p.tracked)} fill="none" stroke="#ff9a6b" strokeWidth="1.6" />
      <path d={path((p) => p.untracked)} fill="none" stroke="#ff6b7c" strokeWidth="1.6" />
      <path d={path((p) => p.swarm)} fill="none" stroke="#7fd8e8" strokeWidth="1.2" strokeDasharray="5 3" />
      <line x1={30} y1={h - 30} x2={w - 30} y2={h - 30} stroke="#55352b" />
      <g fontSize="9">
        <text x={w - 200} y={h - 8} fill="#ff9a6b">
          — TRACKED
        </text>
        <text x={w - 130} y={h - 8} fill="#ff6b7c">
          — UNTRACKED
        </text>
        <text x={w - 52} y={h - 8} fill="#7fd8e8">
          -- SWARM
        </text>
      </g>
    </svg>
  );
}

export function KesslerApp() {
  const [config, setConfig] = useState<KesslerConfig>(() => kesslerConfig());
  const result = useMemo(() => evaluateKessler(config), [config]);
  const update = <K extends keyof KesslerConfig>(key: K, value: KesslerConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="kessler"
      sigil="K//S"
      name="KESSLER"
      tagline="ORBITAL-BAND DEBRIS POPULATION DYNAMICS"
      readiness={result.readiness}
      stateLine="EXPECTED-VALUE MODEL · NOT AN EPHEMERIS"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="BAND POPULATION" />
        <Range
          label="OPERATING SWARM"
          value={config.swarmCount}
          min={1000}
          max={30000}
          step={500}
          digits={0}
          onChange={(v) => update("swarmCount", v)}
        />
        <Range
          label="TRACKED DEBRIS"
          value={config.initialTracked}
          min={0}
          max={8000}
          step={100}
          digits={0}
          onChange={(v) => update("initialTracked", v)}
        />
        <Range
          label="UNTRACKED LETHAL"
          value={config.initialUntracked}
          min={0}
          max={8000}
          step={100}
          digits={0}
          onChange={(v) => update("initialUntracked", v)}
        />
        <Title n="02" text="TRAFFIC + REMOVAL" />
        <Range
          label="INSTALLS / YEAR"
          value={config.installsPerYear}
          min={0}
          max={1500}
          step={50}
          digits={0}
          onChange={(v) => update("installsPerYear", v)}
        />
        <Range
          label="INSTALL FAILURES"
          value={config.installFailureRate * 100}
          min={0}
          max={10}
          step={0.5}
          suffix="%"
          onChange={(v) => update("installFailureRate", v / 100)}
        />
        <Range
          label="ACTIVE REMOVAL"
          value={config.adrPerYear}
          min={0}
          max={800}
          step={10}
          digits={0}
          suffix="/yr"
          onChange={(v) => update("adrPerYear", v)}
        />
        <Range
          label="AVOIDANCE RELIABILITY"
          value={config.avoidanceReliability * 100}
          min={0}
          max={100}
          step={1}
          digits={0}
          suffix="%"
          onChange={(v) => update("avoidanceReliability", v / 100)}
        />
        <Title n="03" text="FRAGMENTATION YIELD" />
        <Range
          label="TRACKED FRAGMENTS"
          value={config.fragmentsPerCollision}
          min={200}
          max={4000}
          step={100}
          digits={0}
          onChange={(v) => update("fragmentsPerCollision", v)}
        />
        <Range
          label="UNTRACKED FRAGMENTS"
          value={config.untrackedPerCollision}
          min={200}
          max={8000}
          step={100}
          digits={0}
          onChange={(v) => update("untrackedPerCollision", v)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="FIFTY-YEAR CASCADE TRAJECTORY" />
        <TrajectoryChart result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="BAND VERDICT" />
        <Verdict
          readiness={result.readiness}
          label="DEBRIS ENVIRONMENT"
          detail={result.constraints[0] ?? "REMOVAL BUDGET CLOSES; CASCADE STAYS SUBCRITICAL"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric
            label="RUNAWAY YEAR"
            value={result.runawayYear === null ? "—" : `Y${result.runawayYear}`}
            warning={result.runawayYear !== null}
          />
          <Metric
            label="MORATORIUM"
            value={result.moratoriumYear === null ? "—" : `Y${result.moratoriumYear}`}
            warning={result.moratoriumYear !== null}
          />
          <Metric label="COLLISIONS (E)" value={fmt(result.totalCollisions, 1)} unit="Σ" />
          <Metric label="END TRACKED" value={fmt(result.endTracked, 0)} />
          <Metric
            label="END UNTRACKED"
            value={fmt(result.endUntracked, 0)}
            warning={result.endUntracked > config.initialUntracked * 10}
          />
          <Metric label="END SWARM" value={fmt(result.endSwarm, 0)} />
          <Metric
            label="NET GROWTH"
            value={fmt(result.netGrowthPerYear, 0)}
            unit="/yr"
            warning={result.netGrowthPerYear > 0}
          />
        </div>
        <Title n="06" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="CASCADE REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>INSTALL MORATORIUM, FAIL-CLOSED.</b> Once band density crosses {MORATORIUM_DENSITY} objects per
            collector, the model itself refuses new installs and never silently lifts the block — it is not an
            advisory lamp an operator may overrule. A dragless heliocentric band has no natural cleaning: what
            is not removed stays forever.
          </p>
          <p className="lb-basis">
            CASCADE MECHANISM (KESSLER 1978) · GROUNDED — ENCOUNTER + YIELD COEFFICIENTS · ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
