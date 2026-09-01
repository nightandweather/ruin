import { useMemo, useState } from "react";
import {
  chronosConfig,
  evaluateChronos,
  humanDuration,
  relate,
  type ChronosConfig,
  type ChronosIncident,
  type ChronosPolicy,
} from "./chronos";
import { readDeepLink } from "./deepLink";
import { LabShell, Metric, Options, Range, Register, SeriesKey, SERIES_DASH, Title, Verdict } from "./LabKit";

const POLICIES: ReadonlyArray<{ id: ChronosPolicy; name: string; detail: string }> = [
  { id: "arrival", name: "ORDER BY RECEIPT", detail: "First to reach the station is recorded first" },
  { id: "timestamp", name: "ORDER BY LOCAL CLOCK", detail: "Trust the timestamp each site wrote" },
  { id: "partial", name: "PARTIAL ORDER", detail: "Order what is ordered; record the rest as concurrent" },
];

const INCIDENTS: ReadonlyArray<{ id: ChronosIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Every site reporting; clocks as configured" },
  { id: "relay-outage", name: "DEEP RELAY OUTAGE", detail: "The two far sites stop reaching the ledger" },
  { id: "frame-shift", name: "FRAME SHIFT", detail: "The cruiser changes velocity mid-run" },
  { id: "clock-drift", name: "OSCILLATOR DRIFT", detail: "The nearest clock loses the shared present" },
];

/**
 * A spacetime diagram of the run: distance across, ledger-station time down.
 *
 * The apex is the median recorded event. Everything outside its light cone is
 * spacelike-separated from it — no signal connects them, no frame agrees on
 * their order, and any ledger that sequences them is inventing the sequence.
 * The cone is drawn as a sampled curve because the distance axis is
 * logarithmic: six sites spanning 1.28 light-seconds to 4.2 light-years do
 * not share a linear axis.
 */
function SpacetimeDiagram({ result }: { result: ReturnType<typeof evaluateChronos> }) {
  const w = 620;
  const h = 250;
  const left = 40;
  const right = w - 24;
  const top = 32;
  const bottom = h - 34;
  const events = result.events;
  if (events.length === 0) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="No events reached the ledger">
        <text x={left} y={h / 2} fill="#8f86a8" fontSize="11">
          NO EVENTS REACHED THE LEDGER
        </text>
      </svg>
    );
  }

  const minLs = Math.min(...events.map((event) => event.distanceLs));
  const maxLs = Math.max(...events.map((event) => event.distanceLs));
  const lo = Math.log10(Math.max(0.5, minLs));
  const hi = Math.log10(Math.max(lo + 1, maxLs));
  const x = (ls: number) => left + ((Math.log10(Math.max(0.5, ls)) - lo) / (hi - lo)) * (right - left);
  const y = (t: number) => top + (t / Math.max(1, result.windowS)) * (bottom - top);

  const apex = events[Math.floor(events.length / 2)];
  const samples = 90;
  const cone = (sign: 1 | -1) =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const ls = 10 ** (lo + ((hi - lo) * i) / samples);
      return `${i === 0 ? "M" : "L"}${x(ls).toFixed(1)} ${y(apex.coordinateS + sign * Math.abs(ls - apex.distanceLs)).toFixed(1)}`;
    }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Spacetime diagram of the recorded events">
      <text x={left} y={19} fill="#8f86a8" fontSize="10">
        DISTANCE · LOG LIGHT-SECONDS → · LEDGER TIME ↓ {humanDuration(result.windowS)} · CONE FROM{" "}
        {apex.siteName}
      </text>
      {result.roster.map((site) => (
        <g key={site.id}>
          <line
            x1={x(site.distanceLs)}
            y1={top}
            x2={x(site.distanceLs)}
            y2={bottom}
            stroke="#3b3550"
            strokeDasharray={site.reachable ? undefined : "2 4"}
          />
          <text
            x={x(site.distanceLs)}
            y={bottom + 11}
            fill={site.sharesNow ? "#c0a8ff" : "#6d6688"}
            fontSize="6.5"
            textAnchor="middle"
          >
            {site.name.split(" ")[0]}
          </text>
        </g>
      ))}
      <path d={cone(1)} fill="none" stroke="#c0a8ff" strokeWidth="1.1" strokeDasharray={SERIES_DASH.dashed} />
      <path
        d={cone(-1)}
        fill="none"
        stroke="#c0a8ff"
        strokeWidth="1.1"
        strokeDasharray={SERIES_DASH.dashed}
      />
      {events.map((event) => {
        const spacelike = event.id !== apex.id && relate(apex, event) === "concurrent";
        const cx = x(event.distanceLs);
        const cy = y(event.coordinateS);
        if (event.id === apex.id) {
          return <circle key={event.id} cx={cx} cy={cy} r="3.4" fill="#e6dcff" />;
        }
        // Spacelike events take a diamond, ordered ones a circle: the shape
        // carries the distinction, not the colour.
        return spacelike ? (
          <rect
            key={event.id}
            x={cx - 2.4}
            y={cy - 2.4}
            width="4.8"
            height="4.8"
            fill="#ff8a94"
            transform={`rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})`}
          />
        ) : (
          <circle key={event.id} cx={cx} cy={cy} r="2.2" fill="#8fd0ff" />
        );
      })}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#3d3455" />
      <SeriesKey
        right={right}
        y={h - 4}
        items={[
          { label: "LIGHT CONE", color: "#c0a8ff", dash: SERIES_DASH.dashed },
          { label: "ORDERED", color: "#8fd0ff" },
          { label: "CONCURRENT", color: "#ff8a94", dash: SERIES_DASH.dotted },
        ]}
      />
    </svg>
  );
}

export function ChronosApp() {
  // `chronos.html?policy=timestamp&incident=frame-shift` opens on the ledger
  // that records effects before their causes.
  const [config, setConfig] = useState<ChronosConfig>(() => {
    const base = chronosConfig();
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
    };
  });
  const result = useMemo(() => evaluateChronos(config), [config]);
  const update = <K extends keyof ChronosConfig>(key: K, value: ChronosConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="chronos"
      sigil="C//R"
      name="CHRONOS"
      tagline="SIMULTANEITY, CAUSAL ORDER, AND COMMAND FRESHNESS"
      readiness={result.readiness}
      stateLine="ONE REFERENCE FRAME · NOT A RELATIVISTIC SOLVER"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="RECORDING POLICY" />
        <Options options={POLICIES} active={config.policy} onSelect={(policy) => update("policy", policy)} />

        <Title n="02" text="COMMAND ENVELOPE" />
        <Range
          label="DECISION WINDOW"
          value={config.decisionWindowS / 60}
          min={1}
          max={1440}
          step={1}
          digits={0}
          suffix=" min"
          onChange={(v) => update("decisionWindowS", v * 60)}
        />
        <Range
          label="AUTHORITY VALIDITY"
          value={config.grantValidityS / 3600}
          min={1}
          max={8760}
          step={1}
          digits={0}
          suffix=" h"
          onChange={(v) => update("grantValidityS", v * 3600)}
        />
        <Range
          label="SYNC TOLERANCE"
          value={config.syncToleranceS}
          min={0.1}
          max={3600}
          step={0.1}
          suffix=" s"
          onChange={(v) => update("syncToleranceS", v)}
        />

        <Title n="03" text="FRAMES + SCHEDULE" />
        <Range
          label="CRUISER VELOCITY"
          value={config.cruiserVelocityC}
          min={0}
          max={0.95}
          step={0.01}
          digits={2}
          suffix="c"
          onChange={(v) => update("cruiserVelocityC", v)}
        />
        <Range
          label="EVENTS PER SITE"
          value={config.eventsPerSite}
          min={2}
          max={12}
          step={1}
          digits={0}
          onChange={(v) => update("eventsPerSite", v)}
        />
        <Range
          label="RECORDED WINDOW"
          value={config.windowS / 3.15576e7}
          min={1}
          max={40}
          step={1}
          digits={0}
          suffix=" yr"
          onChange={(v) => update("windowS", v * 3.15576e7)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="WHAT IS ORDERED AND WHAT IS NOT" />
        <SpacetimeDiagram result={result} />
        <div className="cs-roll">
          {result.roster.map((site) => (
            <p key={site.id} className={site.sharesNow ? "counted" : "excluded"}>
              <b>{site.name}</b>
              <span>
                {site.sharesNow ? "SHARES A PRESENT" : site.reachable ? "NO SHARED NOW" : "UNREACHABLE"}
              </span>
              <i>{humanDuration(site.roundTripS)}</i>
              <em>{site.authorityHeld ? "SUPERVISED" : "AUTONOMOUS"}</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="LEDGER VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.ledgerHonest ? "LEDGER ADMISSIBLE" : "LEDGER REFUSED"}
          detail={result.constraints[0] ?? "EVERY RECORDED ORDER IS ONE THE UNIVERSE AGREES WITH"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric
            label="INVERTED CAUSALITY"
            value={`${result.inverted}`}
            unit=" pairs"
            warning={result.inverted > 0}
          />
          <Metric
            label="FABRICATED ORDER"
            value={`${result.fabricated}`}
            unit=" pairs"
            warning={result.fabricated > 0}
          />
          <Metric label="CONCURRENT" value={`${result.spacelikePairs}`} unit={` / ${result.pairs}`} />
          <Metric label="SHARED PRESENT" value={humanDuration(result.nowRadiusLs)} unit=" radius" />
          <Metric
            label="SITES IN STEP"
            value={`${result.sharedNowCount}`}
            unit={` / ${result.roster.length}`}
            warning={result.sharedNowCount < result.roster.length}
          />
          <Metric
            label="COMMANDABLE"
            value={`${result.admittedCount}`}
            unit={` / ${result.roster.length}`}
            warning={result.admittedCount < result.roster.length}
          />
          <Metric
            label="ON OWN AUTHORITY"
            value={`${result.autonomousCount}`}
            warning={result.autonomousCount > 0}
          />
          <Metric label="CLOCK DIVERGENCE" value={humanDuration(result.maxClockGapS)} />
          <Metric label="EVENTS LOST" value={`${result.eventsLost}`} warning={result.eventsLost > 0} />
        </div>
        <Title n="06" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register
          title="ORDERING REGISTER"
          constraints={
            result.faults.length > 0 ? result.faults.map((fault) => fault.detail) : result.constraints
          }
        />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>THE LEDGER NEVER LIES ABOUT ORDER.</b> Events separated by more space than light crosses in the
            time between them have no frame-independent sequence, so none is recorded — they are written as
            concurrent. An effect is never recorded before its cause. A policy that produces either is refused
            by the model, and the ledger is withheld rather than annotated.
          </p>
          <p className="lb-basis">
            RELATIVITY OF SIMULTANEITY · TIME DILATION · REAL SITE DISTANCES — GROUNDED; SCHEDULE, DRIFT,
            THRESHOLDS — ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
