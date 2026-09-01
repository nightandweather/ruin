import { useMemo, useState } from "react";
import {
  benefitOf,
  COHORT,
  evaluateValetudo,
  valetudoConfig,
  type AllocationPolicy,
  type ValetudoConfig,
  type ValetudoIncident,
} from "./valetudo";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const POLICIES: ReadonlyArray<{ id: AllocationPolicy; name: string; detail: string }> = [
  { id: "sofa-first", name: "LOWEST SOFA FIRST", detail: "The rule fifteen US states actually use" },
  { id: "benefit-first", name: "GREATEST BENEFIT", detail: "Whoever the resource changes the outcome for" },
  { id: "first-come", name: "FIRST COME", detail: "Order of arrival, and nothing else" },
  { id: "lottery", name: "LOTTERY", detail: "A public draw, arbitrary with respect to clinical facts" },
  {
    id: "counted-first",
    name: "ON THE ROLL FIRST",
    detail: "Counted people before uncounted — refused by the model",
  },
];

const INCIDENTS: ReadonlyArray<{ id: ValetudoIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Full resources; the second check returns in time" },
  { id: "surge", name: "SURGE", detail: "Half the beds, the same admissions" },
  { id: "confirmation-lag", name: "CONFIRMATION LAG", detail: "The independent check needs 95 minutes" },
  { id: "roll-audit", name: "ROLL AUDIT", detail: "Unrolled patients removed before a clinician sees them" },
];

export function ValetudoApp() {
  // `valetudo.html?policy=benefit-first&incident=confirmation-lag`
  const [config, setConfig] = useState<ValetudoConfig>(() => {
    const base = valetudoConfig();
    return {
      ...base,
      policy: readDeepLink(
        "policy",
        POLICIES.map((p) => p.id),
        base.policy,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateValetudo(config), [config]);
  const update = <K extends keyof ValetudoConfig>(key: K, value: ValetudoConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  const treated = new Set(result.treated.map((p) => p.id));
  const held = new Set(result.refusedForConfirmation.map((p) => p.id));

  return (
    <LabShell
      module="valetudo"
      sigil="V//L"
      name="VALETUDO"
      tagline="WHO GETS THE BED, AND WHAT MAKES THAT DEFENSIBLE"
      readiness={result.readiness}
      stateLine="INVENTED COHORT · SOURCED SORTING RULES"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="ALLOCATION RULE" />
        <Options options={POLICIES} active={config.policy} onSelect={(policy) => update("policy", policy)} />

        <Title n="02" text="WHAT THERE IS" />
        <Range
          label="RESOURCES"
          value={config.resources}
          min={1}
          max={16}
          step={1}
          digits={0}
          onChange={(v) => update("resources", v)}
        />

        <Title n="03" text="THE SECOND CHECK" />
        <Range
          label="DECISION WINDOW"
          value={config.decisionWindowMin}
          min={5}
          max={180}
          step={5}
          digits={0}
          suffix=" min"
          onChange={(v) => update("decisionWindowMin", v)}
        />
        <Range
          label="CONFIRMATION ROUND TRIP"
          value={config.confirmationDelayMin}
          min={0}
          max={180}
          step={5}
          digits={0}
          suffix=" min"
          onChange={(v) => update("confirmationDelayMin", v)}
        />

        <Title n="04" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="TONIGHT'S ADMISSIONS" />
        <div className="cs-roll vl-ward">
          {COHORT.map((patient) => (
            <p key={patient.id} className={treated.has(patient.id) ? "counted" : "excluded"}>
              <b>{patient.name}</b>
              <span>
                {held.has(patient.id)
                  ? "HELD · NO SECOND CHECK"
                  : treated.has(patient.id)
                    ? "TREATED"
                    : "NOT TREATED"}
              </span>
              <i>SOFA {patient.sofa}</i>
              <i>+{(benefitOf(patient) * 100).toFixed(0)}</i>
              <em>{patient.onRoll ? "ON ROLL" : "UNROLLED"}</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="ALLOCATION VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.refusals[0] ?? result.constraints[0] ?? "EVERY BED BUYS THE MOST IT COULD BUY"}
        />
        <div className="lb-metrics">
          <Metric label="EXPECTED SURVIVORS" value={fmt(result.expectedSurvivors, 2)} accent />
          <Metric label="BEST POSSIBLE" value={fmt(result.bestPossible, 2)} />
          <Metric label="LIVES FOREGONE" value={fmt(result.foregone, 2)} warning={result.foregone > 0.5} />
          <Metric
            label="SCORE CONCORDANCE"
            value={`${(result.concordance * 100).toFixed(0)}%`}
            warning={result.concordance < 0.7}
          />
          <Metric label="TREATED" value={`${result.treated.length}`} unit={` / ${result.resources}`} />
          <Metric
            label="HELD FOR CHECK"
            value={`${result.refusedForConfirmation.length}`}
            warning={result.refusedForConfirmation.length > 0}
          />
          <Metric
            label="SECOND CHECK"
            value={result.confirmationArrives ? "ARRIVES" : "TOO LATE"}
            warning={!result.confirmationArrives}
          />
          <Metric
            label="UNROLLED TREATED"
            value={`${result.unrolledTreated}`}
            unit={` / ${result.unrolledTotal}`}
            warning={result.unrolledTreated === 0}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="WARD REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>NO IRREVERSIBLE ACT WITHOUT A CHECK THAT COULD HAVE ARRIVED.</b> An independent second
            calculation whose round trip exceeds the decision window did not happen, whatever the record says.
            The Therac-25's defect was a single path to the dose, and this holds the dose instead — which
            costs expected survivors, and is still right. <b>CARE IS NEVER ALLOCATED ON WHO IS COUNTED.</b>{" "}
            Roll membership is not a clinical fact and cannot be written in a record anyone would sign, so the
            model refuses the criterion before it refuses the outcome — even when it would have saved more
            people.
          </p>
          <p className="lb-basis">
            START FIELD SORT · SOFA 0–24 OVER SIX SYSTEMS · FIFTEEN STATES ALLOCATING BY IT · ITS POOR
            PREDICTIVE ACCURACY — SOURCED. THE COHORT AND ITS PROBABILITIES — INVENTED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
