import { useMemo, useState } from "react";
import { readDeepLink } from "./deepLink";
import {
  AUTHORITY_QUEUE_CAP,
  BASE_CRITICAL_WINDOW,
  evaluateWatchfloor,
  MISSED_CRITICAL_LIMIT,
  watchfloorConfig,
  type WatchfloorConfig,
  type WatchfloorIncident,
} from "./watchfloor";
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

const INCIDENTS: ReadonlyArray<{ id: WatchfloorIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL WATCH", detail: "Bursty but tractable alarm stream" },
  { id: "alarm-flood", name: "ALARM FLOOD", detail: "Six-fold arrival rate for seventy minutes" },
  { id: "console-loss", name: "CONSOLE LOSS", detail: "Half the crew off station from minute ninety" },
  { id: "cry-wolf", name: "CRY WOLF", detail: "False-alarm exposure teaches the crew to defer" },
  { id: "handover-collision", name: "HANDOVER COLLISION", detail: "Shift change lands on a burst peak" },
];

function WatchChart({ result }: { result: ReturnType<typeof evaluateWatchfloor> }) {
  const points = result.trajectory;
  const w = 620;
  const h = 250;
  const maxQueue = Math.max(AUTHORITY_QUEUE_CAP * 1.4, ...points.map((p) => p.queue));
  const x = (minute: number) => 34 + (minute / Math.max(1, points.length - 1)) * (w - 64);
  // Log scale: a floor that is holding and a floor that has collapsed differ
  // by three orders of magnitude, and the interesting part is the low end.
  const y = (queue: number) => h - 52 - (Math.log10(1 + queue) / Math.log10(1 + maxQueue)) * (h - 92);
  const attentionY = (a: number) => h - 44 + (1 - a) * 14;
  const line = (pick: (p: (typeof points)[number]) => number, project: (v: number) => number) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.minute).toFixed(1)} ${project(pick(p)).toFixed(1)}`)
      .join(" ");

  // Contiguous runs of withdrawn authority, drawn as one band each.
  const bands: Array<[number, number]> = [];
  for (const point of points) {
    if (point.authority) continue;
    const last = bands.at(-1);
    if (last && last[1] === point.minute - 1) last[1] = point.minute;
    else bands.push([point.minute, point.minute]);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Unacknowledged alarm queue and crew attention">
      <text x={34} y={19} fill="#a08088" fontSize="10">
        UNACKNOWLEDGED QUEUE · LOG SCALE · {points.length} MINUTE WATCH
      </text>
      {bands.map(([from, to]) => (
        <rect
          key={from}
          x={x(from)}
          y={28}
          width={Math.max(1, x(to) - x(from))}
          height={h - 80}
          fill="#ff6b7c1e"
        />
      ))}
      <line
        x1={34}
        y1={y(AUTHORITY_QUEUE_CAP)}
        x2={w - 30}
        y2={y(AUTHORITY_QUEUE_CAP)}
        stroke="#ff6b7c"
        strokeDasharray="3 4"
        opacity="0.7"
      />
      <text x={w - 132} y={y(AUTHORITY_QUEUE_CAP) - 4} fill="#ff6b7c" fontSize="9">
        AUTHORITY CAP {AUTHORITY_QUEUE_CAP}
      </text>
      <path d={line((p) => p.queue, y)} fill="none" stroke="#ffc4c9" strokeWidth="1.7" />
      <path
        d={line((p) => p.criticals * 40, y)}
        fill="none"
        stroke="#ff6b7c"
        strokeWidth="1.3"
        strokeDasharray={SERIES_DASH.dashed}
      />
      <path
        d={line((p) => p.attention, attentionY)}
        fill="none"
        stroke="#8fd0ff"
        strokeWidth="1.2"
        strokeDasharray={SERIES_DASH.dotted}
      />
      <line x1={34} y1={h - 52} x2={w - 30} y2={h - 52} stroke="#552c32" />
      <SeriesKey
        right={w - 30}
        y={h - 8}
        items={[
          { label: "QUEUE", color: "#ffc4c9" },
          { label: "OPEN CRITICALS \u00d740", color: "#ff6b7c", dash: SERIES_DASH.dashed },
          { label: "ATTENTION", color: "#8fd0ff", dash: SERIES_DASH.dotted },
        ]}
      />
    </svg>
  );
}

export function WatchfloorApp() {
  // `watchfloor.html?incident=cry-wolf` opens on the watch that loses
  // interventions with nothing on the board looking wrong.
  const [config, setConfig] = useState<WatchfloorConfig>(() => {
    const base = watchfloorConfig();
    return {
      ...base,
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((option) => option.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateWatchfloor(config), [config]);
  const update = <K extends keyof WatchfloorConfig>(key: K, value: WatchfloorConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="watchfloor"
      sigil="W//F"
      name="WATCHFLOOR"
      tagline="THE CONTROL ROOM AS A MODELLED SYSTEM"
      readiness={result.readiness}
      stateLine="OPERATOR-LOADING MODEL · NOT A STAFFING STANDARD"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="CREW ON CONSOLE" />
        <Range
          label="OPERATORS"
          value={config.operators}
          min={1}
          max={8}
          step={1}
          digits={0}
          onChange={(v) => update("operators", v)}
        />
        <Range
          label="TRIAGE RATE"
          value={config.triagePerOperator}
          min={0.4}
          max={4}
          step={0.1}
          suffix="/min"
          onChange={(v) => update("triagePerOperator", v)}
        />
        <Range
          label="SHIFT LENGTH"
          value={config.shiftMinutes}
          min={30}
          max={480}
          step={10}
          digits={0}
          suffix=" min"
          onChange={(v) => update("shiftMinutes", v)}
        />
        <Range
          label="HANDOVER CONTEXT LOSS"
          value={config.handoverLossRate * 100}
          min={0}
          max={60}
          step={1}
          digits={0}
          suffix="%"
          onChange={(v) => update("handoverLossRate", v / 100)}
        />

        <Title n="02" text="ALARM STREAM" />
        <Range
          label="ALARM RATE"
          value={config.alarmRate}
          min={0.5}
          max={12}
          step={0.5}
          suffix="/min"
          onChange={(v) => update("alarmRate", v)}
        />
        <Range
          label="FALSE-ALARM SHARE"
          value={config.falseAlarmRate * 100}
          min={0}
          max={90}
          step={1}
          digits={0}
          suffix="%"
          onChange={(v) => update("falseAlarmRate", v / 100)}
        />
        <Range
          label="CRITICAL SHARE"
          value={config.criticalFraction * 100}
          min={0.1}
          max={5}
          step={0.1}
          suffix="%"
          onChange={(v) => update("criticalFraction", v / 100)}
        />

        <Title n="03" text="COMMAND ENVELOPE" />
        <Range
          label="SIGNAL DELAY"
          value={config.signalDelayMinutes}
          min={0}
          max={24}
          step={1}
          digits={0}
          suffix=" min"
          onChange={(v) => update("signalDelayMinutes", v)}
        />
        <Range
          label="MACHINE AUTHORITY"
          value={config.automationAuthority * 100}
          min={0}
          max={95}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("automationAuthority", v / 100)}
        />
        <Range
          label="WATCH LENGTH"
          value={config.watchMinutes}
          min={60}
          max={600}
          step={20}
          digits={0}
          suffix=" min"
          onChange={(v) => update("watchMinutes", v)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="ONE WATCH, MINUTE BY MINUTE" />
        <WatchChart result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="WATCH VERDICT" />
        <Verdict
          readiness={result.readiness}
          label="FLOOR CAPACITY"
          detail={result.constraints[0] ?? "EVERY CRITICAL ACKNOWLEDGED INSIDE ITS WINDOW"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric
            label="MISSED CRITICALS"
            value={fmt(result.missedCriticals, 2)}
            warning={result.missedCriticals >= MISSED_CRITICAL_LIMIT}
          />
          <Metric label="AGED OUT" value={fmt(result.agedOutCriticals, 2)} />
          <Metric
            label="DISMISSED"
            value={fmt(result.dismissedCriticals, 2)}
            warning={result.dismissedCriticals > 0}
          />
          <Metric label="DECISION WINDOW" value={`${result.window}`} unit=" min" />
          <Metric label="MEAN ACK" value={fmt(result.meanAckLatency, 1)} unit=" min" />
          <Metric
            label="PEAK QUEUE"
            value={fmt(result.peakQueue, 0)}
            warning={result.peakQueue > AUTHORITY_QUEUE_CAP}
          />
          <Metric
            label="AUTHORITY LOST"
            value={`${result.authorityWithdrawnMinutes}`}
            unit=" min"
            warning={result.authorityWithdrawnMinutes > 0}
          />
          <Metric
            label="ATTENTION FLOOR"
            value={`${(result.minAttention * 100).toFixed(0)}%`}
            warning={result.minAttention < 0.5}
          />
          <Metric label="HANDOVERS" value={`${result.handovers}`} />
        </div>
        <Title n="06" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="WATCH REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>SATURATED FLOOR, NO IRREVERSIBLE ACTION.</b> While unacknowledged alarms exceed{" "}
            {AUTHORITY_QUEUE_CAP}, authority for irreversible commands is withdrawn by the model and returns
            only after the queue is genuinely drained. A saturated crew may still safe, isolate, and observe.
            The decision window is {BASE_CRITICAL_WINDOW} minutes minus the signal delay — a command that
            cannot arrive in time was never available.
          </p>
          <p className="lb-basis">
            ALARM FLOODING · HANDOVER LOSS · CRY-WOLF EFFECT — GROUNDED FAILURE MODES; ALL COEFFICIENTS
            ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
