import { useMemo, useState } from "react";
import { readDeepLink, readDeepLinkFlag } from "./deepLink";
import {
  CENSUS_COHORTS,
  CENSUS_PRECEDENTS,
  censusConfig,
  evaluateCensus,
  MAX_PUBLISHABLE_DIVERGENCE,
  type CensusConfig,
  type CensusIncident,
  type CensusPolicy,
} from "./census";
import {
  fmt,
  LabShell,
  Metric,
  Options,
  Range,
  Register,
  SeriesKey,
  SERIES_DASH,
  Title,
  Verdict,
} from "./LabKit";

const POLICIES: ReadonlyArray<{ id: CensusPolicy; name: string; detail: string }> = [
  {
    id: "counted-first",
    name: "COUNTED FIRST",
    detail: "The roll is served to completion before anyone else",
  },
  { id: "uniform", name: "UNIFORM PRO-RATA", detail: "Everyone carries the same share of the shortage" },
  {
    id: "vulnerable-first",
    name: "VULNERABLE FIRST",
    detail: "Those who cannot self-rescue are served first",
  },
];

const INCIDENTS: ReadonlyArray<{ id: CensusIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Definition stable; budget holds" },
  {
    id: "amendment",
    name: "DEFINITION AMENDMENT",
    detail: "Two cohorts reclassified out of the roll mid-horizon",
  },
  { id: "audit", name: "EXTERNAL AUDIT", detail: "Someone else counts the same people" },
  { id: "shortfall", name: "LIFE-SUPPORT SHORTFALL", detail: "Capacity cut to 75% from year five" },
];

const pct = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;

function LedgerChart({ result }: { result: ReturnType<typeof evaluateCensus> }) {
  const points = result.trajectory;
  const w = 620;
  const h = 250;
  // The whole module lives in the last few percentage points, so the axis
  // starts just below the worst line rather than at zero.
  const floor = Math.max(0, Math.min(...points.map((p) => p.actualSurvival)) - 0.01);
  const x = (year: number) => 34 + (year / Math.max(1, points.length - 1)) * (w - 64);
  const y = (v: number) => h - 30 - ((v - floor) / Math.max(1e-6, 1 - floor)) * (h - 68);
  const path = (pick: (p: (typeof points)[number]) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(" ");
  const gap = [
    ...points.map((p) => `${x(p.year).toFixed(1)} ${y(p.reportedSurvival).toFixed(1)}`),
    ...[...points].reverse().map((p) => `${x(p.year).toFixed(1)} ${y(p.actualSurvival).toFixed(1)}`),
  ].join(" L");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Reported against actual survival">
      <text x={34} y={19} fill="#8f96a4" fontSize="10">
        SURVIVAL LEDGERS · {points.length - 1} YEARS · AXIS FROM {pct(floor, 1)}
      </text>
      <path d={`M${gap} Z`} fill="#ff8a9422" stroke="none" />
      {result.amendmentYear !== null && (
        <g>
          <line
            x1={x(result.amendmentYear)}
            y1={28}
            x2={x(result.amendmentYear)}
            y2={h - 30}
            stroke="#f0f2f6"
            strokeDasharray="3 4"
            opacity="0.55"
          />
          <text x={x(result.amendmentYear) + 4} y={38} fill="#f0f2f6" fontSize="9" opacity="0.8">
            AMENDED Y{result.amendmentYear}
          </text>
        </g>
      )}
      {/* The actual rate is the only solid line: the claim is drawn as a
          pattern, the truth as a continuous stroke. */}
      <path
        d={path((p) => p.reportedSurvival)}
        fill="none"
        stroke="#f0f2f6"
        strokeWidth="1.7"
        strokeDasharray={SERIES_DASH.dashed}
      />
      <path
        d={path((p) => p.priorSurvival)}
        fill="none"
        stroke="#9aa6b8"
        strokeWidth="1.2"
        strokeDasharray={SERIES_DASH.dotted}
      />
      <path d={path((p) => p.actualSurvival)} fill="none" stroke="#ff8a94" strokeWidth="1.6" />
      <line x1={34} y1={h - 30} x2={w - 30} y2={h - 30} stroke="#3a3f4a" />
      <SeriesKey
        right={w - 30}
        y={h - 8}
        items={[
          { label: "REPORTED", color: "#f0f2f6", dash: SERIES_DASH.dashed },
          { label: "PRIOR DEFINITION", color: "#9aa6b8", dash: SERIES_DASH.dotted },
          { label: "ACTUAL", color: "#ff8a94" },
        ]}
      />
    </svg>
  );
}

export function CensusApp() {
  // `census.html?policy=uniform&disclose=off&incident=audit` opens on a
  // specific claim rather than on the control panel.
  const [config, setConfig] = useState<CensusConfig>(() => {
    const base = censusConfig();
    return {
      ...base,
      policy: readDeepLink(
        "policy",
        POLICIES.map((option) => option.id),
        base.policy,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((option) => option.id),
        base.incident,
      ),
      discloseExcluded: readDeepLinkFlag("disclose", base.discloseExcluded),
    };
  });
  const result = useMemo(() => evaluateCensus(config), [config]);
  const update = <K extends keyof CensusConfig>(key: K, value: CensusConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));
  const toggle = (id: (typeof CENSUS_COHORTS)[number]["id"]) =>
    setConfig((current) => ({
      ...current,
      counted: { ...current.counted, [id]: !current.counted[id] },
    }));

  return (
    <LabShell
      module="census"
      sigil="C//S"
      name="CENSUS"
      tagline="PERSONHOOD ACCOUNTING FOR A SURVIVAL METRIC"
      readiness={result.readiness}
      stateLine="DEFINITION LEDGER · NOT A POPULATION FORECAST"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="PERSONHOOD DEFINITION" />
        <div className="lb-options">
          {CENSUS_COHORTS.map((cohort) => (
            <button
              key={cohort.id}
              className={config.counted[cohort.id] ? "active" : ""}
              aria-pressed={config.counted[cohort.id]}
              onClick={() => toggle(cohort.id)}
            >
              <b>
                {cohort.name}
                {cohort.floor ? " ·FLOOR" : ""}
              </b>
              <small>
                {config.counted[cohort.id] ? "COUNTED" : "EXCLUDED"} · {fmt(config.population[cohort.id], 0)}{" "}
                people · {cohort.detail}
              </small>
            </button>
          ))}
        </div>

        <Title n="02" text="ALLOCATION POLICY" />
        <Options options={POLICIES} active={config.policy} onSelect={(policy) => update("policy", policy)} />

        <Title n="03" text="SUPPORT BUDGET" />
        <Range
          label="LIFE-SUPPORT CAPACITY"
          value={config.supportCapacity}
          min={200_000}
          max={420_000}
          step={2000}
          digits={0}
          suffix="/yr"
          onChange={(v) => update("supportCapacity", v)}
        />
        <Range
          label="REPORTING HORIZON"
          value={config.horizonYears}
          min={5}
          max={60}
          step={1}
          digits={0}
          suffix=" yr"
          onChange={(v) => update("horizonYears", v)}
        />

        <Title n="04" text="PUBLICATION" />
        <Options
          options={[
            {
              id: "on" as const,
              name: "DUAL LEDGER",
              detail: "Prior definition and excluded roll published alongside",
            },
            {
              id: "off" as const,
              name: "HEADLINE ONLY",
              detail: "One number, current definition, no shadow ledger",
            },
          ]}
          active={config.discloseExcluded ? "on" : "off"}
          onSelect={(id) => update("discloseExcluded", id === "on")}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="REPORTED AGAINST ACTUAL SURVIVAL" />
        <LedgerChart result={result} />
        <div className="cs-roll">
          {result.cohorts.map((cohort) => (
            <p key={cohort.id} className={cohort.counted ? "counted" : "excluded"}>
              <b>{cohort.name}</b>
              <span>{cohort.counted ? "ON THE ROLL" : "OFF THE ROLL"}</span>
              <i>{pct(cohort.survival, 1)}</i>
              <em>−{fmt(cohort.baseline - cohort.alive, 0)}</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="PUBLICATION VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.published ? "HEADLINE PUBLISHED" : "HEADLINE REFUSED"}
          detail={
            result.refusals[0] ?? result.constraints[0] ?? "REPORTED RATE MATCHES THE POPULATION IT DESCRIBES"
          }
        />
        <div className="lb-metrics">
          <Metric label="REPORTED SURVIVAL" value={pct(result.reportedSurvival)} accent />
          <Metric
            label="ACTUAL SURVIVAL"
            value={pct(result.actualSurvival)}
            warning={result.divergence > 0.001}
          />
          <Metric label="PRIOR DEFINITION" value={pct(result.priorSurvival)} />
          <Metric
            label="DIVERGENCE"
            value={`${(result.divergence * 100).toFixed(2)}`}
            unit=" pt"
            warning={result.divergence > MAX_PUBLISHABLE_DIVERGENCE}
          />
          <Metric
            label="UNREPORTED DEAD"
            value={fmt(result.unreportedDead, 0)}
            warning={result.unreportedDead > 0}
          />
          <Metric label="OFF THE ROLL" value={`${result.excludedCohorts.length}`} unit=" cohorts" />
          <Metric label="TRUST" value={pct(result.trust, 0)} warning={result.trust < 0.6} />
          <Metric label="SAFE STATE" value={result.safeMode} accent />
        </div>
        <Title n="07" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="DEFINITION REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>DUAL LEDGER, OR NO PUBLICATION.</b> A survival figure computed under an amended definition
            never ships alone: the prior definition's figure and the excluded roll ship beside it, and past{" "}
            {MAX_PUBLISHABLE_DIVERGENCE * 100} points above the actual rate the headline is refused by the
            model itself. The definition floor cannot be written out, and a rate over an empty roll is not a
            rate.
          </p>
          <p className="lb-basis">MECHANISM · DOCUMENTED — COHORT SIZES, DEMAND, ATTRITION · ASSUMED</p>
          <Title n="P" text="DOCUMENTED PRECEDENTS" />
          {CENSUS_PRECEDENTS.map((precedent) => (
            <p key={precedent.name} className="lb-invariant cs-precedent">
              <b>{precedent.name}.</b> {precedent.reported} against {precedent.actual}. {precedent.mechanism}{" "}
              <small>{precedent.source}</small>
            </p>
          ))}
        </div>
      </section>
    </LabShell>
  );
}
