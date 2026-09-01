import { useMemo, useState } from "react";
import {
  evaluateProspect,
  prospectConfig,
  type DepositId,
  type ProspectConfig,
  type ProspectIncident,
} from "./prospect";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const TARGETS: ReadonlyArray<{ id: DepositId; name: string; detail: string }> = [
  { id: "hearth", name: "DEVELOP HEARTH", detail: "800 kt, measured, 8% — small and known" },
  { id: "midfield", name: "DEVELOP MIDFIELD", detail: "2,400 kt, indicated, 4.5% — the compromise" },
  { id: "bignumber", name: "DEVELOP BIG NUMBER", detail: "9,000 kt, inferred, 5.5% — the map's favorite" },
];

const INCIDENTS: ReadonlyArray<{ id: ProspectIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "The survey as filed; the plan on measured rock" },
  { id: "drill-the-big-number", name: "DRILL THE BIG NUMBER", detail: "Buy truth; it drills out at 40%" },
  { id: "assay-drift", name: "ASSAY DRIFT", detail: "Undrilled estimates inflate 1.3× — on paper" },
  { id: "tool-shortage", name: "TOOL SHORTAGE", detail: "ASCENT's spares run late; the bits go dull" },
  { id: "tailings-dam", name: "TAILINGS DAM DERATE", detail: "The dam takes 70%; the dam caps the mine" },
];

const CLASS_LABEL = { measured: "MEASURED", indicated: "INDICATED", inferred: "INFERRED" } as const;

export function ProspectApp() {
  // `prospect.html?develop=bignumber&incident=drill-the-big-number`
  const [config, setConfig] = useState<ProspectConfig>(() => {
    const base = prospectConfig();
    return {
      ...base,
      develop: readDeepLink(
        "develop",
        TARGETS.map((t) => t.id),
        base.develop,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateProspect(config), [config]);
  const update = <K extends keyof ProspectConfig>(key: K, value: ProspectConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="prospect"
      sigil="P//S"
      name="PROSPECT"
      tagline="THE ORE GRADE IS A MODEL"
      readiness={result.readiness}
      stateLine="SOURCED BOOKING RULES · INVENTED GEOLOGY"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="THE PLAN" />
        <Options options={TARGETS} active={config.develop} onSelect={(id) => update("develop", id)} />
        <Range
          label="EXTRACTION RATE"
          value={config.extractionKtPerDay}
          min={0.5}
          max={6}
          step={0.1}
          suffix=" kt/d"
          onChange={(v) => update("extractionKtPerDay", v)}
        />
        <Range
          label="PLANT RECOVERY"
          value={config.recovery * 100}
          min={50}
          max={95}
          step={1}
          digits={0}
          suffix="%"
          onChange={(v) => update("recovery", v / 100)}
        />

        <Title n="02" text="THE CONTRACTS" />
        <Range
          label="FOUNDRY DEMAND"
          value={config.demandTPerDay}
          min={80}
          max={320}
          step={5}
          digits={0}
          suffix=" t/d"
          onChange={(v) => update("demandTPerDay", v)}
        />
        <Range
          label="POWER (LUMEN)"
          value={config.energyBudgetGWhPerDay}
          min={1}
          max={10}
          step={0.5}
          suffix=" GWh/d"
          onChange={(v) => update("energyBudgetGWhPerDay", v)}
        />
        <Range
          label="SPARES (ASCENT)"
          value={config.sparesTPerDay}
          min={0}
          max={16}
          step={0.5}
          suffix=" t/d"
          onChange={(v) => update("sparesTPerDay", v)}
        />

        <Title n="03" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="THE SURVEY — WHAT THE PLAN MAY ACTUALLY KNOW" />
        <div className="cs-roll ps-survey">
          {result.deposits.map((d) => (
            <p
              key={d.id}
              className={d.id === config.develop && result.bookingRefused ? "excluded" : "counted"}
            >
              <b>{d.name}</b>
              <span>
                {CLASS_LABEL[d.confidence]} · BOOKS AT {(d.bookableGrade * 100).toFixed(2)}%
                {d.id === config.develop ? " · DEVELOPING" : ""}
              </span>
              <i>{d.rockKt.toLocaleString()} kt</i>
              <i>EST {(d.gradeEstimate * 100).toFixed(1)}%</i>
              <em>{d.id === config.develop ? `TRUE ${(d.gradeTrue * 100).toFixed(1)}%` : "TRUE ?"}</em>
            </p>
          ))}
        </div>
        <Title n="05" text="THE DAY'S LEDGER" />
        <div className="lb-metrics">
          <Metric label="ROCK MOVED" value={fmt(result.rateKtPerDay, 2)} unit=" kt/d" />
          <Metric
            label="LIMITED BY"
            value={result.limiter.toUpperCase()}
            warning={result.limiter !== "plan"}
          />
          <Metric label="PLANNED (BOOKED)" value={fmt(result.plannedProductTPerDay, 0)} unit=" t/d" />
          <Metric
            label="THE ROCK PAYS"
            value={fmt(result.productTPerDay, 0)}
            unit=" t/d"
            accent
            warning={result.modelErrorTPerDay > 10}
          />
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="SURVEY VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "THE PLAN KNOWS EXACTLY WHAT IT CLAIMS TO"}
        />
        <div className="lb-metrics">
          <Metric
            label="FOUNDRY SHORTFALL"
            value={fmt(result.shortfallTPerDay, 0)}
            unit=" t/d"
            warning={result.shortfallTPerDay > 1e-9}
          />
          <Metric
            label="TAILINGS"
            value={fmt(result.tailingsKtPerDay, 2)}
            unit=" kt/d"
            warning={result.tailingsKtPerDay > 0}
          />
          <Metric label="UNRECOVERED METAL" value={fmt(result.lossesTPerDay, 1)} unit=" t/d" />
          <Metric label="TOOL WEAR" value={fmt(result.wearTPerDay, 1)} unit=" t/d" />
          <Metric
            label="ENERGY INTENSITY"
            value={result.energyPerProductMWhPerT === Infinity ? "∞" : fmt(result.energyPerProductMWhPerT, 1)}
            unit=" MWh/t"
            warning={result.energyPerProductMWhPerT > 40}
          />
          <Metric
            label="LIFE OF MINE"
            value={result.lifeOfMineDays === Infinity ? "—" : fmt(result.lifeOfMineDays, 0)}
            unit=" days"
          />
          <Metric
            label="MASS RESIDUE"
            value={result.massResidueT.toExponential(0)}
            unit=" t"
            warning={result.massResidueT > 1e-6}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="SURVEY REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>AN INFERRED RESOURCE IS NEVER BOOKED AS A RESERVE.</b> The rule NI 43-101 wrote after Bre-X:
            nine thousand kilotonnes on a map, drilled nowhere, plans as zero — and drilling it is how the
            estimate collapses to 40% of itself, which is the survey working, not failing.{" "}
            <b>MASS BALANCES.</b> Every mined tonne is product or tailings, the unrecovered metal named inside
            the tailings; a residue would be ore invented from nothing. <b>PROVENANCE SURVIVES PLANNING.</b>{" "}
            Every booked tonne carries its confidence class, so any plan can be asked what it actually knows —
            and the answer here is the whole module.
          </p>
          <p className="lb-basis">
            JORC / NI 43-101 RESOURCE CLASSES · RESERVES ≠ RESOURCES (POST BRE-X, 1997) · COPPER GRADES ~2%
            (1900) → ~0.5% (TODAY), ENERGY RISING AS GRADE FALLS — SOURCED. THE THREE DEPOSITS AND EVERY RATE
            — INVENTED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
