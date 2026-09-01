import { useMemo, useState } from "react";
import {
  evaluateReliquary,
  MEDIA_META,
  reliquaryConfig,
  type MediaClass,
  type ReliquaryConfig,
  type ReliquaryIncident,
} from "./reliquary";
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

const INCIDENTS: ReadonlyArray<{ id: ReliquaryIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Stewardship staffed; readers available" },
  { id: "reader-extinction", name: "READER EXTINCTION", detail: "Remaining format lifetime halves" },
  { id: "curator-loss", name: "CURATOR LOSS", detail: "Three stewards leave at once" },
];

function SurvivalChart({ result }: { result: ReturnType<typeof evaluateReliquary> }) {
  const points = result.trajectory;
  const w = 620;
  const h = 280;
  const x = (year: number) => 30 + (year / Math.max(1, points.length - 1)) * (w - 60);
  const y = (v: number) => h - 40 - v * (h - 90);
  const line = (pick: (p: (typeof points)[number]) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Century survival trajectory">
      <text x={30} y={20} fill="#8a7c55" fontSize="10">
        SURVIVAL + INSTITUTIONAL MEMORY · {points.length - 1} YEARS
      </text>
      <line x1={30} y1={y(0.5)} x2={w - 30} y2={y(0.5)} stroke="#4e422b" strokeDasharray="3 5" />
      <text x={w - 120} y={y(0.5) - 4} fill="#8a7c55" fontSize="8">
        50% — ARCHIVE LOST
      </text>
      {result.expectedLossYear !== null && (
        <g>
          <line
            x1={x(result.expectedLossYear)}
            y1={30}
            x2={x(result.expectedLossYear)}
            y2={h - 40}
            stroke="#ff6b7c"
            strokeDasharray="2 3"
          />
          <text x={x(result.expectedLossYear) + 4} y={42} fill="#ff6b7c" fontSize="9">
            EXPECTED LOSS Y{result.expectedLossYear}
          </text>
        </g>
      )}
      <path d={line((p) => p.survival)} fill="none" stroke="#e0c37a" strokeWidth="1.8" />
      <path
        d={line((p) => p.knowledge)}
        fill="none"
        stroke="#b79cff"
        strokeWidth="1.2"
        strokeDasharray={SERIES_DASH.long}
      />
      <line x1={30} y1={h - 40} x2={w - 30} y2={h - 40} stroke="#4e422b" />
      <SeriesKey
        right={w - 30}
        y={h - 14}
        items={[
          { label: "ARCHIVE SURVIVAL", color: "#e0c37a" },
          { label: "RESTORE KNOWLEDGE", color: "#b79cff", dash: SERIES_DASH.long },
        ]}
      />
    </svg>
  );
}

export function ReliquaryApp() {
  const [config, setConfig] = useState<ReliquaryConfig>(() => reliquaryConfig());
  const result = useMemo(() => evaluateReliquary(config), [config]);
  const update = <K extends keyof ReliquaryConfig>(key: K, value: ReliquaryConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="reliquary"
      sigil="R//Q"
      name="RELIQUARY"
      tagline="CENTURY-SCALE KNOWLEDGE PRESERVATION"
      readiness={result.readiness}
      stateLine="STEWARDSHIP TWIN · EXPECTED-VALUE MODEL"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="ARCHIVE" />
        <Range
          label="ARCHIVE SIZE"
          value={config.archivePB}
          min={1}
          max={500}
          step={1}
          digits={0}
          suffix=" PB"
          onChange={(v) => update("archivePB", v)}
        />
        <Range
          label="INDEPENDENT COPIES"
          value={config.copies}
          min={1}
          max={8}
          step={1}
          digits={0}
          onChange={(v) => update("copies", v)}
        />
        <Title n="02" text="STEWARDSHIP CADENCE" />
        <Range
          label="INTEGRITY SCRUB"
          value={config.scrubIntervalYears}
          min={0.5}
          max={10}
          step={0.5}
          suffix=" y"
          onChange={(v) => update("scrubIntervalYears", v)}
        />
        <Range
          label="FORMAT MIGRATION"
          value={config.migrationIntervalYears}
          min={2}
          max={50}
          step={1}
          digits={0}
          suffix=" y"
          onChange={(v) => update("migrationIntervalYears", v)}
        />
        <Range
          label="FORMAT LIFETIME"
          value={config.formatLifeYears}
          min={5}
          max={80}
          step={1}
          digits={0}
          suffix=" y"
          onChange={(v) => update("formatLifeYears", v)}
        />
        <Range
          label="RESTORE REHEARSAL"
          value={config.rehearsalIntervalYears}
          min={0}
          max={30}
          step={1}
          digits={0}
          suffix=" y"
          onChange={(v) => update("rehearsalIntervalYears", v)}
        />
        <Range
          label="CURATORS"
          value={config.curatorFTE}
          min={0}
          max={12}
          step={1}
          digits={0}
          suffix=" FTE"
          onChange={(v) => update("curatorFTE", v)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="HUNDRED-YEAR TRAJECTORY" />
        <SurvivalChart result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="STEWARDSHIP VERDICT" />
        <Verdict
          readiness={result.readiness}
          label="CENTURY ARCHIVE"
          detail={result.constraints[0] ?? "COPIES, CADENCE, AND CUSTODY CONTRACTS POSITIVE"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric
            label="CENTURY SURVIVAL"
            value={fmt(result.survivalAtHorizon * 100, 1)}
            unit="%"
            warning={result.survivalAtHorizon < 0.9}
          />
          <Metric
            label="COUNTED COPIES"
            value={fmt(result.countedCopies, 0)}
            warning={result.countedCopies === 0}
          />
          <Metric label="WINDOW LOSS RISK" value={fmt(result.perCopyWindowLoss * 100, 2)} unit="%/copy" />
          <Metric
            label="READABILITY"
            value={result.readabilityHeld ? "HELD" : "BROKEN"}
            warning={!result.readabilityHeld}
          />
          <Metric
            label="RESTORE KNOWLEDGE"
            value={fmt(result.knowledgeAtHorizon * 100, 0)}
            unit="%"
            warning={result.knowledgeAtHorizon < 0.5}
          />
          <Metric
            label="CURATOR RENEWAL"
            value={fmt(result.renewal * 100, 0)}
            unit="%"
            warning={result.renewal < 1}
          />
          <Metric
            label="EXPECTED LOSS"
            value={result.expectedLossYear === null ? "—" : `Y${result.expectedLossYear}`}
            warning={result.expectedLossYear !== null}
          />
        </div>
        <Title n="06" text="STORAGE MEDIUM" />
        <Options
          options={(Object.keys(MEDIA_META) as MediaClass[]).map((media) => ({
            id: media,
            name: MEDIA_META[media].name,
            detail: `${MEDIA_META[media].detail} · t½ ${MEDIA_META[media].halfLifeYears}y`,
          }))}
          active={config.media}
          onSelect={(media) => update("media", media)}
        />
        <Title n="07" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="CUSTODY REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>VERIFIED RESTORE, OR IT DOESN'T COUNT.</b> A backup that has not been restored in rehearsal
            counts as zero copies, whatever the media. Unverified redundancy is a rumor. Readability and
            restore knowledge gate survival exactly like intact bits — an archive nobody can read has not
            survived.
          </p>
          <p className="lb-basis">
            MEDIA CLASSES + PRESERVATION PRACTICE · GROUNDED — HALF-LIVES + DECAY COMPOSITION · ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
