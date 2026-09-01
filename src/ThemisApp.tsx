import { useMemo, useState } from "react";
import { settleModuleAuthority, type AuthorityInputs } from "./authorityBus";
import { evaluateWatchfloor, watchfloorConfig } from "./watchfloor";
import { evaluateVeritas, veritasConfig, withModel } from "./veritas";
import { censusConfig, evaluateCensus, CENSUS_COHORTS, type CensusCohortId } from "./census";
import { chronosConfig, evaluateChronos } from "./chronos";
import {
  ACTION_META,
  evaluateThemis,
  themisConfig,
  TIER_META,
  type ActionClass,
  type AutonomyTier,
  type ThemisConfig,
  type ThemisIncident,
} from "./themis";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: ThemisIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Council reachable; model verified" },
  { id: "model-drift", name: "MODEL DRIFT", detail: "The executive's own evidence is suspect" },
  { id: "partition", name: "COUNCIL PARTITION", detail: "Majority of nodes unreachable" },
  { id: "command-cross", name: "COMMAND CROSS", detail: "A stale human order arrives mid-event" },
];

function DecisionTimeline({
  config,
  result,
}: {
  config: ThemisConfig;
  result: ReturnType<typeof evaluateThemis>;
}) {
  const w = 620;
  const scaleMax = Math.max(config.decisionWindowS, result.humanLoopS, config.vetoWindowS) * 1.1;
  const px = (seconds: number) => 30 + (seconds / scaleMax) * (w - 60);
  const bar = (y: number, seconds: number, color: string, label: string, over: boolean) => (
    <g>
      <rect
        x={30}
        y={y}
        width={Math.max(2, px(seconds) - 30)}
        height={16}
        fill={`${color}2e`}
        stroke={color}
      />
      <text x={34} y={y + 12} fill={color} fontSize="9">
        {label} · {fmt(seconds, 0)}s{over ? " — EXCEEDS WINDOW" : ""}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 620 300" role="img" aria-label="Decision pathway timing">
      <text x={30} y={22} fill="#7d6f9e" fontSize="10">
        WHO CAN ANSWER BEFORE THE SITUATION EXPIRES
      </text>
      <line
        x1={px(config.decisionWindowS)}
        y1={34}
        x2={px(config.decisionWindowS)}
        y2={240}
        stroke="#ddd0ff"
        strokeDasharray="4 4"
      />
      <text x={px(config.decisionWindowS) + 4} y={46} fill="#ddd0ff" fontSize="9">
        SITUATION EXPIRES · {fmt(config.decisionWindowS, 0)}s
      </text>
      {bar(70, 2 * config.oneWayDelayS, "#b79cff", "LIGHT ROUND TRIP", false)}
      {bar(
        110,
        result.humanLoopS,
        result.humanViable ? "#b79cff" : "#ff6b7c",
        "FULL HUMAN LOOP (RTT + DELIBERATION)",
        !result.humanViable,
      )}
      {bar(
        150,
        config.vetoWindowS,
        result.vetoSatisfied ? "#7fd8e8" : "#ff9a6b",
        "VETO PAUSE THEMIS LEAVES OPEN",
        false,
      )}
      {bar(190, result.handbackS, "#8d82ad", "AUTHORITY HANDBACK (CONFIRMED RTT)", false)}
      <text x={30} y={262} fill="#ddd0ff" fontSize="11">
        PATHWAY → {result.pathway}
      </text>
      <text x={30} y={280} fill="#7d6f9e" fontSize="9">
        AUTHORITY HOLDER: {result.authorityHolder} · EVIDENCE {fmt(result.effectiveEvidence, 0)}/
        {result.requiredEvidence} REQUIRED
      </text>
    </svg>
  );
}

/**
 * The civilization bus, as four switches.
 *
 * Each feed runs its own laboratory at a fixed configuration — nominal, or the
 * incident that module exists to expose — and posts the resulting authority
 * claim. The point the panel makes is that THEMIS does not get a vote: the
 * envelope is settled from what the other modules report, and the executive
 * reads it as a ceiling.
 */
type BusFeedId = "watchfloor" | "veritas" | "census" | "chronos";

const BUS_FEEDS: ReadonlyArray<{ id: BusFeedId; name: string; degraded: string }> = [
  { id: "watchfloor", name: "WATCHFLOOR", degraded: "Cry-wolf watch: a calm board losing interventions" },
  { id: "veritas", name: "VERITAS", degraded: "IGNIS fusion branch: wrong while its residuals stay quiet" },
  { id: "census", name: "CENSUS", degraded: "Survival figure published without its dual ledger" },
  { id: "chronos", name: "CHRONOS", degraded: "Order-by-receipt: a causal record that invents sequence" },
];

const countAllCohorts = () =>
  Object.fromEntries(CENSUS_COHORTS.map((cohort) => [cohort.id, true])) as Record<CensusCohortId, boolean>;

function busEnvelope(feeds: Record<BusFeedId, boolean>) {
  const inputs: AuthorityInputs = {
    watchfloor: evaluateWatchfloor({
      ...watchfloorConfig(),
      ...(feeds.watchfloor ? { incident: "cry-wolf" as const } : {}),
    }),
    veritas: evaluateVeritas(withModel(veritasConfig(), feeds.veritas ? "ignis-fusion" : "helios-thermal")),
    census: evaluateCensus({
      ...censusConfig(),
      ...(feeds.census ? { discloseExcluded: false } : { counted: countAllCohorts() }),
    }),
    chronos: evaluateChronos({
      ...chronosConfig(),
      policy: feeds.chronos ? "arrival" : "partial",
      grantValidityS: 3.2e8,
    }),
  };
  const state = settleModuleAuthority(inputs);
  return { claims: state.ledgers.authority.claims, envelope: state.ledgers.authority.envelope };
}

export function ThemisApp() {
  const [config, setConfig] = useState<ThemisConfig>(() => themisConfig());
  const [feeds, setFeeds] = useState<Record<BusFeedId, boolean>>({
    watchfloor: false,
    veritas: false,
    census: false,
    chronos: false,
  });
  const bus = useMemo(() => busEnvelope(feeds), [feeds]);
  const result = useMemo(() => evaluateThemis(config, bus.envelope ?? undefined), [config, bus]);
  const update = <K extends keyof ThemisConfig>(key: K, value: ThemisConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="themis"
      sigil="T//M"
      name="THEMIS"
      tagline="AUTONOMOUS CIVILIZATION EXECUTIVE · BOUNDED AUTHORITY"
      readiness={result.readiness}
      stateLine="GOVERNANCE TWIN · POLICY, NOT PROPHECY"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="DISTANCE + TIME" />
        <Range
          label="ONE-WAY LIGHT LAG"
          value={config.oneWayDelayS}
          min={1}
          max={18000}
          step={10}
          digits={0}
          suffix=" s"
          onChange={(v) => update("oneWayDelayS", v)}
        />
        <Range
          label="COUNCIL DELIBERATION"
          value={config.humanDeliberationS}
          min={30}
          max={7200}
          step={30}
          digits={0}
          suffix=" s"
          onChange={(v) => update("humanDeliberationS", v)}
        />
        <Range
          label="DECISION WINDOW"
          value={config.decisionWindowS}
          min={60}
          max={36000}
          step={60}
          digits={0}
          suffix=" s"
          onChange={(v) => update("decisionWindowS", v)}
        />
        <Range
          label="VETO PAUSE"
          value={config.vetoWindowS}
          min={0}
          max={36000}
          step={60}
          digits={0}
          suffix=" s"
          onChange={(v) => update("vetoWindowS", v)}
        />
        <Title n="02" text="COUNCIL" />
        <Range
          label="COUNCIL NODES"
          value={config.councilNodes}
          min={1}
          max={25}
          step={1}
          digits={0}
          onChange={(v) => update("councilNodes", v)}
        />
        <Range
          label="PARTITIONED NODES"
          value={config.partitionedNodes}
          min={0}
          max={config.councilNodes}
          step={1}
          digits={0}
          onChange={(v) => update("partitionedNodes", v)}
        />
        <Title n="03" text="EVIDENCE" />
        <Range
          label="VERIFIED EVIDENCE"
          value={config.evidenceScore}
          min={0}
          max={100}
          step={1}
          digits={0}
          suffix="/100"
          onChange={(v) => update("evidenceScore", v)}
        />

        <Title n="04" text="CIVILIZATION BUS" />
        <div className="lb-options">
          {BUS_FEEDS.map((feed) => {
            const claim = bus.claims[feed.id];
            const restricting = claim && claim.limit !== "none";
            return (
              <button
                key={feed.id}
                className={feeds[feed.id] ? "active" : ""}
                aria-pressed={feeds[feed.id]}
                onClick={() => setFeeds((current) => ({ ...current, [feed.id]: !current[feed.id] }))}
              >
                <b>
                  {feed.name} · {restricting ? claim.limit.toUpperCase() : "CLEAR"}
                </b>
                <small>{feeds[feed.id] ? feed.degraded : "Nominal; posting no restriction"}</small>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="DECISION PATHWAY" />
        <DecisionTimeline config={config} result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="EXECUTION VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={`${ACTION_META[config.actionClass].name} ACTION`}
          detail={result.constraints[0] ?? "HUMAN LOOP ANSWERS IN TIME; EXECUTIVE STANDS BY"}
        />
        <div className="lb-metrics">
          <Metric label="PATHWAY" value={result.pathway} accent />
          <Metric label="AUTHORITY" value={result.authorityHolder} />
          <Metric
            label="HUMAN LOOP"
            value={fmt(result.humanLoopS, 0)}
            unit="s"
            warning={!result.humanViable}
          />
          <Metric
            label="STALENESS"
            value={fmt(result.staleness * 100, 0)}
            unit="%"
            warning={result.staleness > 1}
          />
          <Metric
            label="QUORUM"
            value={`${result.reachable}/${result.quorumNeeded}`}
            unit="nodes"
            warning={!result.quorumAvailable}
          />
          <Metric
            label="EVIDENCE"
            value={`${fmt(result.effectiveEvidence, 0)}/${result.requiredEvidence}`}
            warning={!result.evidenceMet}
          />
          <Metric
            label="VETO RTT"
            value={fmt(result.vetoRequiredS, 0)}
            unit="s"
            warning={!result.vetoSatisfied && config.actionClass === "irreversible"}
          />
          <Metric label="HANDBACK" value={fmt(result.handbackS, 0)} unit="s" />
        </div>
        <Title n="07" text="AUTONOMY TIER" />
        <Options
          options={(Object.keys(TIER_META) as AutonomyTier[]).map((tier) => ({
            id: tier,
            name: TIER_META[tier].name,
            detail: TIER_META[tier].detail,
          }))}
          active={config.tier}
          onSelect={(tier) => update("tier", tier)}
        />
        <Title n="08" text="ACTION CLASS" />
        <Options
          options={(Object.keys(ACTION_META) as ActionClass[]).map((action) => ({
            id: action,
            name: ACTION_META[action].name,
            detail: ACTION_META[action].detail,
          }))}
          active={config.actionClass}
          onSelect={(action) => update("actionClass", action)}
        />
        <Title n="09" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="AUTHORITY REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>IRREVERSIBLE + UNPROVEN NEVER EXECUTES.</b> Without verified evidence and a physically
            receivable veto pause, the executive holds safe state — it does not escalate to a human who cannot
            answer in time. <b>NO AUTHORITY GAP:</b> exactly one authority holds at every instant, and
            handback is a confirmed round trip. <b>STALE ORDERS QUARANTINE:</b> a crossing command is
            reconciled, never guessed at. The sovereign tier exists in the interface only to be refused.
          </p>
          <p className="lb-basis">
            LIGHT-TIME + DEFERRED-AUTHORITY PRACTICE · GROUNDED — TIERS + EVIDENCE FLOORS · ASSUMED POLICY
          </p>
        </div>
      </section>
    </LabShell>
  );
}
