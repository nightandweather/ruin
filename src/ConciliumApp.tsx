import { useMemo, useState } from "react";
import {
  conciliumConfig,
  evaluateConcilium,
  PROPOSALS,
  RESOURCE_META,
  RESOURCE_PRICE,
  SYSTEMS,
  type ConciliumConfig,
  type ConciliumIncident,
  type ResourceId,
  type SeatBasis,
} from "./concilium";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const BASES: ReadonlyArray<{ id: SeatBasis; name: string; detail: string }> = [
  { id: "revenue", name: "BY REVENUE", detail: "Seats follow what a world earns" },
  { id: "population", name: "BY POPULATION", detail: "Seats follow who lives there" },
  { id: "holdings", name: "BY HOLDINGS", detail: "Seats follow what a world already owns" },
];

const INCIDENTS: ReadonlyArray<{ id: ConciliumIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Every world reporting; the council waits for the outer seats" },
  {
    id: "light-lag-vote",
    name: "RUSHED VOTE",
    detail: "The window closes before the outer worlds can answer",
  },
  { id: "embargo", name: "RARE-METAL EMBARGO", detail: "The single supplier withholds the stream" },
  { id: "output-collapse", name: "REVENUE COLLAPSE", detail: "The richest world loses 85% of its earnings" },
  {
    id: "dependency-cascade",
    name: "DEPENDENCY CASCADE",
    detail: "A prerequisite fails and takes the holdings with it",
  },
];

const pct = (v: number, d = 2) => `${(v * 100).toFixed(d)}%`;

/** The resource contributing the most revenue — what the world trades on. */
const primaryExport = (produces: Partial<Record<ResourceId, number>>): ResourceId =>
  (Object.entries(produces) as Array<[ResourceId, number]>).reduce(
    (best, [resource, amount]) =>
      amount * RESOURCE_PRICE[resource] > best[1] * RESOURCE_PRICE[best[0]] ? [resource, amount] : best,
    ["energy", 0] as [ResourceId, number],
  )[0];

export function ConciliumApp() {
  // `concilium.html?seatBasis=population&incident=light-lag-vote`
  const [config, setConfig] = useState<ConciliumConfig>(() => {
    const base = conciliumConfig();
    return {
      ...base,
      proposal: readDeepLink(
        "proposal",
        PROPOSALS.map((p) => p.id),
        base.proposal,
      ),
      seatBasis: readDeepLink(
        "seatBasis",
        BASES.map((b) => b.id),
        base.seatBasis,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateConcilium(config), [config]);
  const update = <K extends keyof ConciliumConfig>(key: K, value: ConciliumConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="concilium"
      sigil="C//C"
      name="CONCILIUM"
      tagline="WHO CAN AFFORD THE INFRASTRUCTURE, AND WHO DECIDES ABOUT IT"
      readiness={result.readiness}
      stateLine="ENERGY-DENOMINATED · EVERY FIGURE A SCENARIO PARAMETER"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="BEFORE THE COUNCIL" />
        <Options
          options={PROPOSALS.map((proposal) => ({
            id: proposal.id,
            name: proposal.name,
            detail: proposal.detail,
          }))}
          active={config.proposal}
          onSelect={(proposal) => update("proposal", proposal)}
        />

        <Title n="02" text="HOW SEATS ARE DRAWN" />
        <Options options={BASES} active={config.seatBasis} onSelect={(basis) => update("seatBasis", basis)} />

        <Title n="03" text="ECONOMY" />
        <Range
          label="ACCUMULATION HORIZON"
          value={config.accumulationYears}
          min={5}
          max={200}
          step={5}
          digits={0}
          suffix=" yr"
          onChange={(v) => update("accumulationYears", v)}
        />
        <Range
          label="INVESTABLE SHARE"
          value={config.investableFraction * 100}
          min={5}
          max={80}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("investableFraction", v / 100)}
        />
        <Range
          label="TRADE WINDOW"
          value={config.tradeWindowYears}
          min={0.05}
          max={12}
          step={0.05}
          digits={2}
          suffix=" yr"
          onChange={(v) => update("tradeWindowYears", v)}
        />
        <Range
          label="VOTE WINDOW"
          value={config.voteWindowYears}
          min={0.5}
          max={40}
          step={0.5}
          digits={1}
          suffix=" yr"
          onChange={(v) => update("voteWindowYears", v)}
        />

        <Title n="04" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="THE WORLDS" />
        <div className="cs-roll cn-worlds">
          {result.standings.map((standing) => (
            <p key={standing.world.id} className={standing.vote === "for" ? "counted" : "excluded"}>
              <b>{standing.world.name}</b>
              {/* The dominant export by revenue, not the full list: what a
                  world *is* reads better than everything it happens to make. */}
              <span>{RESOURCE_META[primaryExport(standing.world.produces)].name}</span>
              <i>{fmt(standing.revenueTWy, 0)}</i>
              <i>
                {standing.owns.length}/{SYSTEMS.length}
              </i>
              <i>{pct(standing.seatShare, 1)}</i>
              <em>{standing.vote.toUpperCase()}</em>
            </p>
          ))}
        </div>
        <div className="cc-timeline">
          <p>
            <b>SEATS</b>
            {pct(result.forShare, 1)} of participating seats are for the proposal; carrying needs over 50%.
          </p>
          <p>
            <b>PEOPLE</b>
            {fmt(result.totalPopulation / 1e9, 2)} billion across seven worlds, of whom{" "}
            {pct(result.standings[0].populationShare, 3)} live on the world holding{" "}
            {pct(result.standings[0].seatShare, 2)} of the council.
          </p>
          <p>
            <b>PRICES</b>
            {(Object.keys(RESOURCE_PRICE) as ResourceId[])
              .map((r) => `${RESOURCE_META[r].name} ×${RESOURCE_PRICE[r]}`)
              .join(" · ")}
          </p>
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="COUNCIL VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.outcome}
          detail={result.constraints[0] ?? "SEATS AND PEOPLE AGREE; EVERY BOUND WORLD ANSWERED"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric label="FOR" value={pct(result.forShare, 1)} />
          <Metric
            label="REPRESENTATION GAP"
            value={`${(result.representationGap * 100).toFixed(1)}`}
            unit=" pt"
            warning={result.representationGap > 0.5}
          />
          <Metric
            label="SELF-SUFFICIENT"
            value={`${result.selfSufficientCount}`}
            unit={` / ${result.standings.length}`}
            warning={result.selfSufficientCount <= 1}
          />
          <Metric label="DEPENDENT" value={`${result.dependentCount}`} warning={result.dependentCount > 0} />
          <Metric label="SILENCED" value={`${result.silenced.length}`} warning={result.silenced.length > 0} />
          <Metric
            label="CHOKEPOINTS"
            value={`${result.chokepoints.length}`}
            warning={result.chokepoints.length > 0}
          />
          <Metric label="TOTAL REVENUE" value={fmt(result.totalRevenue, 0)} unit=" TW·yr" />
          <Metric
            label="IRREVERSIBLE"
            value={result.proposal.irreversible ? "YES" : "NO"}
            warning={result.proposal.irreversible}
          />
          <Metric
            label="CANNOT RUN"
            value={`${result.upkeepBound.length}`}
            warning={result.upkeepBound.length > 0}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="COUNCIL REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>DEPENDENCY WITHOUT EXIT IS NOT CONSENT.</b> A world that relies on a system it cannot build,
            and that could not reach the vote in time, has not agreed to anything. The proposal is refused
            rather than carried over its silence — however large the majority among the worlds that could
            answer. The same rule CENSUS applies to an excluded cohort and LEX applies to an unreachable
            signatory.
          </p>
          <p className="lb-basis">
            STRUCTURE — CAPITAL, UPKEEP, INPUTS, AND DISTANCE PRODUCE OWNERSHIP NOBODY CHOSE · EVERY FIGURE
            ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
