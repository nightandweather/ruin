import { useMemo, useState } from "react";
import { arkConfig, evaluateArk, type ArkConfig, type ArkIncident } from "./ark";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: ArkIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Every loop closing; resupply on schedule" },
  { id: "curing-structure", name: "CURING STRUCTURE", detail: "Biosphere 2: the walls eat the evidence" },
  { id: "scrubber-fault", name: "SCRUBBER FAULT", detail: "CO₂ removal at 45% — a loud failure" },
  { id: "crop-collapse", name: "CROP COLLAPSE", detail: "AGRARIA quarantined to 40% output" },
  { id: "leak-growth", name: "SEAL FAILURE", detail: "Cabin leak ×40 — an atmosphere problem" },
  { id: "water-processor-down", name: "PROCESSOR DEGRADED", detail: "Water recovery falls to 87%" },
];

export function ArkApp() {
  // `ark.html?incident=curing-structure`
  const [config, setConfig] = useState<ArkConfig>(() => {
    const base = arkConfig();
    return {
      ...base,
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateArk(config), [config]);
  const update = <K extends keyof ArkConfig>(key: K, value: ArkConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="ark"
      sigil="A//K"
      name="ARK"
      tagline="WHICH LOOPS RECOVER, AND WHICH FAILURES SILENTLY COMPOUND"
      readiness={result.readiness}
      stateLine="SOURCED CLOSURE RECORDS · INVENTED HABITAT"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="THE HABITAT" />
        <Range
          label="CREW"
          value={config.crew}
          min={8}
          max={40}
          step={1}
          digits={0}
          onChange={(v) => update("crew", v)}
        />
        <Range
          label="WATER RECOVERY"
          value={config.waterRecovery * 100}
          min={80}
          max={99}
          step={0.5}
          suffix="%"
          onChange={(v) => update("waterRecovery", v / 100)}
        />
        <Range
          label="EVA SORTIES"
          value={config.evaPerWeek}
          min={0}
          max={14}
          step={1}
          digits={0}
          suffix=" /wk"
          onChange={(v) => update("evaPerWeek", v)}
        />

        <Title n="02" text="STORES AND SCHEDULE" />
        <Range
          label="O₂ RESERVE"
          value={config.o2StoreKg}
          min={400}
          max={4000}
          step={100}
          digits={0}
          suffix=" kg"
          onChange={(v) => update("o2StoreKg", v)}
        />
        <Range
          label="RESUPPLY PERIOD"
          value={config.resupplyPeriodDays}
          min={30}
          max={180}
          step={15}
          digits={0}
          suffix=" d"
          onChange={(v) => update("resupplyPeriodDays", v)}
        />
        <Range
          label="TREND ALARM"
          value={config.trendAlarmDays}
          min={3}
          max={60}
          step={1}
          digits={0}
          suffix=" d"
          onChange={(v) => update("trendAlarmDays", v)}
        />

        <Title n="03" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="FOUR LOOPS, ONE YEAR" />
        <div className="cs-roll ak-loops">
          {result.loops.map((l) => (
            <p key={l.loop} className={l.compounding || l.failureDay !== null ? "excluded" : "counted"}>
              <b>{l.loop.toUpperCase()}</b>
              <span>
                {l.failureDay !== null
                  ? `EXHAUSTED DAY ${l.failureDay}`
                  : l.compounding
                    ? "COMPOUNDING"
                    : "RECOVERS"}
                {l.trendAlarmDay !== null ? ` · TREND D${l.trendAlarmDay}` : ""}
                {l.thresholdAlarmDay !== null ? ` · THRESHOLD D${l.thresholdAlarmDay}` : ""}
              </span>
              <i>{fmt(l.finalLevel, 0)}</i>
              <em>{l.unit}</em>
            </p>
          ))}
        </div>
        <Title n="05" text="DAILY NETS" />
        <div className="lb-metrics">
          <Metric
            label="OXYGEN"
            value={fmt(result.o2NetKgPerDay, 2)}
            unit=" kg/d"
            warning={result.o2NetKgPerDay < 0}
          />
          <Metric
            label="CO₂"
            value={fmt(result.co2NetKgPerDay, 2)}
            unit=" kg/d"
            warning={result.co2NetKgPerDay > 0}
          />
          <Metric label="WATER" value={fmt(result.waterNetKgPerDay, 2)} unit=" kg/d" />
          <Metric
            label="FOOD"
            value={fmt(result.foodNetCrewDaysPerDay * config.crew, 1)}
            unit=" cd/d"
            warning={result.foodNetCrewDaysPerDay < 0}
          />
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="YEAR VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "EVERY LOOP CLOSES OR IS COVERED"}
        />
        <div className="lb-metrics">
          <Metric label="WATER CLOSURE" value={`${fmt(result.closurePercent, 1)}%`} accent />
          <Metric
            label="SILENT WINDOW"
            value={result.silentWindowDays === null ? "—" : `${result.silentWindowDays}`}
            unit=" days"
            warning={(result.silentWindowDays ?? 0) > 30}
          />
          <Metric label="O₂ INJECTIONS" value={`${result.o2Injections}`} warning={result.o2Injections > 0} />
          <Metric label="RESUPPLY CALLS" value={`${result.resupplies}`} />
          <Metric
            label="AGRARIA FEEDS"
            value={fmt(result.peopleFed, 1)}
            unit={` / ${config.crew}`}
            warning={result.peopleFed < config.crew}
          />
          <Metric
            label="LEDGER RESIDUE"
            value={result.ledgerResidueKg.toExponential(0)}
            unit=" kg"
            warning={result.ledgerResidueKg > 1e-6}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="HABITAT REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>EVERY LOOP'S LEDGER CLOSES DAILY.</b> Production plus makeup equals consumption plus loss plus
            the store's change; a residue would be air invented from nothing.{" "}
            <b>ON THE ATMOSPHERE, A TREND IS AN ALARM.</b> Biosphere 2's oxygen did not fall silently — it
            fell unwatched-for, its CO₂ signal eaten by curing concrete. Fourteen declining days raises this
            register whatever the absolute level reads; the hundred-day silent window belongs to the alarm,
            not the failure. <b>MAKEUP IS FINITE AND COUNTED.</b> Every injection comes from a store ASCENT
            has to refill; closure has never reached 100 for anyone, and pretending otherwise is the failure
            mode this module exists to refuse.
          </p>
          <p className="lb-basis">
            BIOSPHERE 2: O₂ 20.9%→14.2% OVER 16 MONTHS, CO₂ MASKED BY CURING CONCRETE, TWO INJECTIONS · ISS
            ECLSS 98% WATER RECOVERY (2023) · 0.84 KG O₂/PERSON·DAY (BVAD) · BIOS-3 ~85% CLOSURE — SOURCED.
            THE HABITAT AND ITS STORES — INVENTED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
