import { useMemo, useState } from "react";
import { readDeepLink } from "./deepLink";
import {
  ACTION_ERROR_LIMIT,
  ALARM_THRESHOLD,
  evaluateVeritas,
  MAX_VALIDATION_AGE,
  veritasConfig,
  veritasPortfolio,
  withModel,
  type VeritasConfig,
  type VeritasIncident,
  type VeritasRegime,
} from "./veritas";
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

const REGIMES: ReadonlyArray<{ id: VeritasRegime; name: string; detail: string }> = [
  { id: "interpolation", name: "INSIDE THE ENVELOPE", detail: "Operating where the model was validated" },
  { id: "edge", name: "AT THE EDGE", detail: "Operating at the boundary of the validated range" },
  { id: "extrapolation", name: "OUTSIDE THE ENVELOPE", detail: "Operating where nothing was ever validated" },
];

const INCIDENTS: ReadonlyArray<{ id: VeritasIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Programme running as configured" },
  { id: "regime-shift", name: "REGIME SHIFT", detail: "The world leaves the envelope; the model stays put" },
  { id: "sensor-bias", name: "SENSOR BIAS", detail: "Systematic bias silences the residuals, not the error" },
  {
    id: "validation-lapse",
    name: "VALIDATION LAPSE",
    detail: "The calibration programme stops being funded",
  },
];

function DivergenceChart({ result }: { result: ReturnType<typeof evaluateVeritas> }) {
  const points = result.trajectory;
  const w = 620;
  const h = 250;
  const top = Math.max(ACTION_ERROR_LIMIT * 1.6, ...points.map((p) => p.trueError)) * 1.05;
  const x = (year: number) => 34 + (year / Math.max(1, points.length - 1)) * (w - 64);
  const y = (v: number) => h - 30 - (v / Math.max(1e-6, top)) * (h - 62);
  const path = (pick: (p: (typeof points)[number]) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(" ");
  const gap = [
    ...points.map((p) => `${x(p.year).toFixed(1)} ${y(p.trueError).toFixed(1)}`),
    ...[...points].reverse().map((p) => `${x(p.year).toFixed(1)} ${y(p.reportedError).toFixed(1)}`),
  ].join(" L");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="True error against reported error">
      <text x={34} y={19} fill="#8f9a68" fontSize="10">
        MODEL ERROR · {points.length - 1} YEARS · SHADED BAND IS WHAT NOBODY CAN SEE
      </text>
      {points
        .filter((p) => p.silent)
        .map((p) => (
          <rect
            key={p.year}
            x={x(p.year)}
            y={28}
            width={Math.max(1, x(1) - x(0))}
            height={h - 58}
            fill="#ff6b7c22"
          />
        ))}
      <path d={`M${gap} Z`} fill="#c3e05a22" stroke="none" />
      <line
        x1={34}
        y1={y(ACTION_ERROR_LIMIT)}
        x2={w - 30}
        y2={y(ACTION_ERROR_LIMIT)}
        stroke="#ff6b7c"
        strokeDasharray="3 4"
      />
      <text x={w - 128} y={y(ACTION_ERROR_LIMIT) - 4} fill="#ff6b7c" fontSize="9">
        ACTION LIMIT {(ACTION_ERROR_LIMIT * 100).toFixed(0)}%
      </text>
      <line
        x1={34}
        y1={y(ALARM_THRESHOLD)}
        x2={w - 30}
        y2={y(ALARM_THRESHOLD)}
        stroke="#c3e05a"
        strokeDasharray="2 4"
        opacity="0.7"
      />
      <text x={w - 138} y={y(ALARM_THRESHOLD) - 4} fill="#c3e05a" fontSize="9" opacity="0.85">
        ALARM THRESHOLD {(ALARM_THRESHOLD * 100).toFixed(0)}%
      </text>
      <path d={path((p) => p.trueError)} fill="none" stroke="#ff8a94" strokeWidth="1.7" />
      <path
        d={path((p) => p.reportedError)}
        fill="none"
        stroke="#c3e05a"
        strokeWidth="1.6"
        strokeDasharray={SERIES_DASH.dashed}
      />
      <line x1={34} y1={h - 30} x2={w - 30} y2={h - 30} stroke="#454e26" />
      <SeriesKey
        right={w - 30}
        y={h - 8}
        items={[
          { label: "TRUE ERROR", color: "#ff8a94" },
          { label: "REPORTED ERROR", color: "#c3e05a", dash: SERIES_DASH.dashed },
        ]}
      />
    </svg>
  );
}

export function VeritasApp() {
  // `veritas.html?model=ignis-fusion&regime=extrapolation` audits a named
  // model straight from a link.
  const [config, setConfig] = useState<VeritasConfig>(() => {
    const base = veritasConfig();
    const withRequested = withModel(
      base,
      readDeepLink(
        "model",
        veritasPortfolio().map((model) => model.id),
        base.modelId,
      ),
    );
    return {
      ...withRequested,
      regime: readDeepLink(
        "regime",
        REGIMES.map((option) => option.id),
        base.regime,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((option) => option.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateVeritas(config), [config]);
  const update = <K extends keyof VeritasConfig>(key: K, value: VeritasConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="veritas"
      sigil="V//T"
      name="VERITAS"
      tagline="WHEN A VALIDATED MODEL STOPS DESCRIBING THE WORLD"
      readiness={result.readiness}
      stateLine="VERIFICATION AUDIT · THIS MODULE AUDITS ITSELF TOO"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="MODEL UNDER AUDIT" />
        <Options
          options={veritasPortfolio().map((model) => ({
            id: model.id,
            name: model.name,
            detail: `${(model.groundedFraction * 100).toFixed(0)}% sourced · ${model.detail}`,
          }))}
          active={config.modelId}
          onSelect={(modelId) => setConfig((current) => withModel(current, modelId))}
        />

        <Title n="02" text="VALIDATION PROGRAMME" />
        <Range
          label="INDEPENDENT OBSERVATIONS"
          value={config.observationRate}
          min={0}
          max={30}
          step={1}
          digits={0}
          suffix="/yr"
          onChange={(v) => update("observationRate", v)}
        />
        <Range
          label="CALIBRATION CADENCE"
          value={config.calibrationCadence}
          min={1}
          max={15}
          step={1}
          digits={0}
          suffix=" yr"
          onChange={(v) => update("calibrationCadence", v)}
        />
        <Range
          label="ANOMALIES WRITTEN OFF"
          value={config.autoAcceptance * 100}
          min={0}
          max={90}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("autoAcceptance", v / 100)}
        />
        <Range
          label="AUDIT HORIZON"
          value={config.horizonYears}
          min={5}
          max={80}
          step={1}
          digits={0}
          suffix=" yr"
          onChange={(v) => update("horizonYears", v)}
        />

        <Title n="03" text="OPERATING REGIME" />
        <Options options={REGIMES} active={config.regime} onSelect={(regime) => update("regime", regime)} />

        <Title n="04" text="MODEL COMPOSITION" />
        <Range
          label="SOURCED FRACTION"
          value={config.groundedFraction * 100}
          min={0}
          max={100}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("groundedFraction", v / 100)}
        />
        <Range
          label="WORLD DRIFT"
          value={config.driftRate * 100}
          min={0}
          max={8}
          step={0.1}
          suffix="%/yr"
          onChange={(v) => update("driftRate", v / 100)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="TRUE ERROR AGAINST REPORTED ERROR" />
        <DivergenceChart result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="AUDIT VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.endCertified ? "CERTIFIED FOR ACTION" : "ADVISORY ONLY"}
          detail={result.constraints[0] ?? "MODEL TRACKS THE WORLD INSIDE ITS VALIDATED ENVELOPE"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric
            label="SILENT WINDOW"
            value={result.silentWindowYears === 0 ? "—" : `${result.silentWindowYears}`}
            unit=" yr"
            warning={result.silentYears > 0}
          />
          <Metric
            label="WRONG FROM"
            value={result.firstTrueBreach === null ? "—" : `Y${result.firstTrueBreach}`}
            warning={result.firstTrueBreach !== null}
          />
          <Metric
            label="VISIBLE FROM"
            value={result.firstReportedBreach === null ? "NEVER" : `Y${result.firstReportedBreach}`}
            warning={result.firstReportedBreach === null && result.firstTrueBreach !== null}
          />
          <Metric
            label="TRUE ERROR"
            value={`${(result.endTrueError * 100).toFixed(1)}`}
            unit="%"
            warning={result.endTrueError > ACTION_ERROR_LIMIT}
          />
          <Metric label="REPORTED" value={`${(result.endReportedError * 100).toFixed(1)}`} unit="%" />
          <Metric
            label="PEAK BLIND GAP"
            value={`${(result.maxBlindGap * 100).toFixed(1)}`}
            unit="pt"
            warning={result.maxBlindGap > ACTION_ERROR_LIMIT}
          />
          <Metric label="CALIBRATIONS" value={fmt(result.calibrations, 0)} />
          <Metric
            label="ADVISORY YEARS"
            value={fmt(result.decertifiedYears, 0)}
            warning={result.decertifiedYears > 0}
          />
          <Metric label="SOURCED" value={`${(config.groundedFraction * 100).toFixed(0)}%`} />
        </div>
        <Title n="07" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="VERIFICATION REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>CERTIFICATION IS SCOPE, NOT REPUTATION.</b> A model validated more than {MAX_VALIDATION_AGE}{" "}
            years ago, or run outside the envelope it was validated in, is refused irreversible-action
            authority by the model itself. It may still advise. Nothing in this module renews a certificate
            quietly, because the failure it exists to expose is precisely a certificate that outlived its
            evidence.
          </p>
          <p className="lb-basis">
            VERIFICATION AND VALIDATION PRACTICE · GROUNDED — DRIFT, DETECTION, GROUNDING COEFFICIENTS ·
            ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
