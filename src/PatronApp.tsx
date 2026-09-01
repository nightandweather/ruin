import { useMemo, useState } from "react";
import { evaluatePatron, patronConfig, type PatronConfig, type PatronIncident } from "./patron";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: PatronIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Half the studies consortium-funded; the drawer works" },
  { id: "outcome-contingent", name: "OUTCOME-CONTINGENT", detail: "Every next grant is paid by the answer" },
  { id: "registered-reports", name: "REGISTERED REPORTS", detail: "Acceptance precedes results; no drawer" },
  { id: "replication-collapse", name: "REPLICATION COLLAPSE", detail: "Nobody pays to check" },
  { id: "independent-audit", name: "INDEPENDENT AUDIT", detail: "The registry is read — after the decision" },
];

const STATE_LABEL: Record<string, string> = {
  published: "PUBLISHED",
  "published-null": "PUBLISHED · NULL",
  registered: "REGISTERED",
  drawer: "DRAWER",
};

export function PatronApp() {
  // `patron.html?incident=outcome-contingent`
  const [config, setConfig] = useState<PatronConfig>(() => {
    const base = patronConfig();
    return {
      ...base,
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluatePatron(config), [config]);
  const update = <K extends keyof PatronConfig>(key: K, value: PatronConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="patron"
      sigil="P//N"
      name="PATRON"
      tagline="WHO AUDITS A RESULT WHEN EVERYONE WHO COULD IS PAID BY THE ANSWER"
      readiness={result.readiness}
      stateLine="SOURCED PUBLICATION BIAS · INVENTED CONSORTIUM"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="THE MONEY" />
        <Range
          label="CONSORTIUM SHARE"
          value={config.consortiumShare * 100}
          min={0}
          max={100}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("consortiumShare", v / 100)}
        />
        <Range
          label="NULL LEAK RATE"
          value={config.nullPublicationRate * 100}
          min={0}
          max={100}
          step={1}
          digits={0}
          suffix="%"
          onChange={(v) => update("nullPublicationRate", v / 100)}
        />
        <Range
          label="REPLICATION SHARE"
          value={config.replicationShare * 100}
          min={0}
          max={50}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("replicationShare", v / 100)}
        />

        <Title n="02" text="THE QUESTION UNDER STUDY" />
        <Range
          label="TRUE HARM RATE"
          value={config.trueHarm * 100}
          min={5}
          max={20}
          step={0.5}
          suffix="%"
          onChange={(v) => update("trueHarm", v / 100)}
        />
        <Range
          label="DEPLOY THRESHOLD"
          value={config.deployThreshold * 100}
          min={5}
          max={20}
          step={0.5}
          suffix="%"
          onChange={(v) => update("deployThreshold", v / 100)}
        />

        <Title n="03" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="THE LITERATURE — EVERY NUMBER HONEST" />
        <div className="cs-roll pn-shelf">
          {[...result.studies, ...result.replications].map((s) => (
            <p key={s.id} className={s.state === "drawer" ? "excluded" : "counted"}>
              <b>
                {s.id.toUpperCase()} · {s.id.startsWith("r") ? "REPLICATION" : s.funder.toUpperCase()}
              </b>
              <span>{STATE_LABEL[s.state]}</span>
              <i>{(s.estimateHarm * 100).toFixed(1)}%</i>
              <em>{s.estimateHarm < config.deployThreshold ? "FAV" : "UNFAV"}</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="CONSENSUS VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "THE LITERATURE READS WHAT THE REGISTRY READS"}
        />
        <div className="lb-metrics">
          <Metric
            label="PUBLISHED CONSENSUS"
            value={`${(result.publishedConsensus * 100).toFixed(1)}%`}
            accent
          />
          <Metric label="REGISTRY TRUTH" value={`${(result.fullConsensus * 100).toFixed(1)}%`} />
          <Metric
            label="SELECTION BIAS"
            value={fmt(result.biasPp, 2)}
            unit=" pp"
            warning={result.biasPp > 1}
          />
          <Metric
            label="FILE DRAWER"
            value={`${result.fileDrawerCount}`}
            unit={` / ${result.studies.length}`}
            warning={result.fileDrawerCount > 0}
          />
          <Metric
            label="DEPLOYMENT"
            value={result.deployed ? "CLEARED" : "REFUSED"}
            warning={result.wrongDeployment}
          />
          <Metric
            label="EXCESS CASES"
            value={result.excessCases.toLocaleString()}
            warning={result.excessCases > 0}
          />
          <Metric
            label="CONSORTIUM MEAN"
            value={`${(result.decomposition.consortium.mean * 100).toFixed(1)}%`}
            unit={` × ${result.decomposition.consortium.count}`}
          />
          <Metric
            label="INDEPENDENT MEAN"
            value={`${(result.decomposition.independent.mean * 100).toFixed(1)}%`}
            unit={` × ${result.decomposition.independent.count}`}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="CONSENSUS REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>NO PUBLISHED NUMBER IS EVER ALTERED.</b> Selection is the only mechanism this model contains —
            every published estimate equals its measurement, and the bias arrives anyway. That is the finding:
            a literature can be moved without a single dishonest researcher.{" "}
            <b>PROVENANCE SURVIVES PUBLICATION.</b> Every estimate carries its funder, and the consensus
            decomposes by source — the consortium's honest mean sitting below the independents' honest mean is
            the visible seam. <b>THE DRAWER IS COUNTED.</b> This model always reports how many results went
            unpublished — the one number the real literature cannot see about itself.
          </p>
          <p className="lb-basis">
            37/38 POSITIVE TRIALS PUBLISHED VS 3/22 NEGATIVE (TURNER, NEJM 2008) · REGISTERED REPORTS ~96%→
            ~44% POSITIVE (SCHEEL 2021) · 100-STUDY REPLICATION PROJECT (OSC 2015) — SOURCED. THE CONSORTIUM
            AND ITS HARM RATE — INVENTED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
