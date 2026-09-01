import { useMemo, useState } from "react";
import {
  BINDING_FLOOR,
  evaluateLex,
  LEX_ACTIVITIES,
  lexConfig,
  type LexActivityId,
  type LexConfig,
  type LexIncident,
} from "./lex";
import { readDeepLink } from "./deepLink";
import { LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: LexIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Instruments in force; enforcement reachable" },
  { id: "denunciation", name: "DENUNCIATION", detail: "The acting polity withdraws from the treaty" },
  { id: "successor-lapse", name: "SUCCESSOR LAPSE", detail: "The signatory polity no longer exists" },
  { id: "enforcement-gap", name: "ENFORCEMENT GAP", detail: "No party can act on a breach at any latency" },
];

const STANCE_MARK: Record<string, string> = {
  prohibits: "PROHIBITS",
  restricts: "RESTRICTS",
  permits: "PERMITS",
  silent: "SILENT",
};

export function LexApp() {
  // `lex.html?activity=resource-extraction&incident=successor-lapse`
  const [config, setConfig] = useState<LexConfig>(() => {
    const base = lexConfig();
    return {
      ...base,
      activity: readDeepLink(
        "activity",
        LEX_ACTIVITIES.map((a) => a.id),
        base.activity,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateLex(config), [config]);
  const update = <K extends keyof LexConfig>(key: K, value: LexConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="lex"
      sigil="L//X"
      name="LEX"
      tagline="WHETHER AN ACT IS LAWFUL, AND WHETHER THAT STILL MEANS ANYTHING"
      readiness={result.readiness}
      stateLine="INSTRUMENT REGISTER · A READING, NOT LEGAL ADVICE"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="PROPOSED ACT" />
        <Options
          options={LEX_ACTIVITIES.map((activity) => ({
            id: activity.id,
            name: activity.name,
            detail: `${activity.module} · ${activity.detail}`,
          }))}
          active={config.activity}
          onSelect={(activity) => update("activity", activity as LexActivityId)}
        />

        <Title n="02" text="DISTANCE + TIME" />
        <Range
          label="TO NEAREST PARTY"
          value={config.distanceLs / 499.005}
          min={0.002}
          max={280_000}
          step={0.002}
          digits={2}
          suffix=" AU"
          onChange={(v) => update("distanceLs", v * 499.005)}
        />
        <Range
          label="SINCE SIGNATURE"
          value={config.yearsElapsed}
          min={0}
          max={1000}
          step={5}
          digits={0}
          suffix=" yr"
          onChange={(v) => update("yearsElapsed", v)}
        />
        <Range
          label="SUCCESSOR RECOGNITION"
          value={config.successorRecognition * 100}
          min={0}
          max={100}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("successorRecognition", v / 100)}
        />
        <Range
          label="ENFORCEMENT WINDOW"
          value={config.enforcementWindowYears}
          min={0.5}
          max={60}
          step={0.5}
          suffix=" yr"
          onChange={(v) => update("enforcementWindowYears", v)}
        />

        <Title n="03" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="INSTRUMENT REGISTER" />
        <div className="cs-roll lx-register">
          {result.verdicts.map((verdict) => (
            <p
              key={verdict.instrument.id}
              className={verdict.stance === "prohibits" && verdict.binds ? "excluded" : "counted"}
            >
              <b>
                {verdict.instrument.name} · {verdict.instrument.year}
              </b>
              <span>{STANCE_MARK[verdict.stance]}</span>
              <i>{(verdict.binding * 100).toFixed(0)}%</i>
              {/* A silent instrument does not fail the binding floor — it
                  has nothing to say about this act, which is a different
                  finding and must not read as a near miss. */}
              <em>{verdict.stance === "silent" ? "—" : verdict.binds ? "BINDS" : "BELOW FLOOR"}</em>
            </p>
          ))}
        </div>
        <div className="cc-timeline">
          {result.verdicts
            .filter((verdict) => verdict.stance !== "silent")
            .map((verdict) => (
              <p key={verdict.instrument.id}>
                <b>{verdict.instrument.name}</b>
                {verdict.instrument.provision}
              </p>
            ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="LEGAL VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.verdict}
          detail={result.constraints[0] ?? "NO INSTRUMENT IN THE REGISTER RESTRICTS THIS ACT"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric label="PERFORMED BY" value={result.activity.module} />
          <Metric label="PROHIBITIONS" value={`${result.prohibitions}`} warning={result.prohibitions > 0} />
          <Metric label="RESTRICTIONS" value={`${result.restrictions}`} warning={result.restrictions > 0} />
          <Metric label="PERMISSIONS" value={`${result.permissions}`} />
          <Metric
            label="ENFORCEABLE"
            value={result.enforceable ? "YES" : "NO"}
            warning={!result.lawful && !result.enforceable}
          />
          <Metric
            label="ENFORCER ROUND TRIP"
            value={result.roundTripYears < 0.01 ? "<0.01" : result.roundTripYears.toFixed(2)}
            unit=" yr"
          />
          <Metric
            label="RECOGNITION"
            value={`${(result.recognition * 100).toFixed(0)}%`}
            warning={result.recognition < 0.25}
          />
          <Metric
            label="REVERSIBLE"
            value={result.activity.irreversible ? "NO" : "YES"}
            warning={result.activity.irreversible}
          />
          <Metric label="BINDING FLOOR" value={`${(BINDING_FLOOR * 100).toFixed(0)}%`} />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="LEGAL REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>ENFORCEMENT DECAY IS NOT REPEAL.</b> An act prohibited by an instrument in force when it was
            committed stays prohibited until a successor instrument permits it. Distance is not a defence,
            silence is not consent, and withdrawal binds only prospectively. The model reports impunity — the
            gap between what is prohibited and what anyone can act on — and never converts it into permission.
          </p>
          <p className="lb-basis">
            TREATY TEXT AND PARTY COUNTS · SOURCED — ACTIVITY MAPPING, DECAY MODEL, THRESHOLDS · ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
