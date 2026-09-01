import { useMemo, useState } from "react";
import {
  ascentConfig,
  CLIMB_DAYS_TO_GEO,
  CLIMBER_MASS_T,
  DRIVER_ACCEL_G,
  evaluateAscent,
  type AscentConfig,
  type AscentIncident,
} from "./ascent";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: AscentIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Both roads open; the catcher above its floor" },
  { id: "tether-hold", name: "TETHER HOLD", detail: "The one human-rated road is closed" },
  { id: "missed-window", name: "MISSED WINDOW", detail: "One driver window left in the day" },
  { id: "depot-saturation", name: "DEPOT SATURATION", detail: "The port stops taking transfers, depot full" },
  { id: "receiver-uncertainty", name: "RECEIVER UNCERTAINTY", detail: "Catcher confidence drops to 90%" },
];

export function AscentApp() {
  // `ascent.html?incident=receiver-uncertainty`
  const [config, setConfig] = useState<AscentConfig>(() => {
    const base = ascentConfig();
    return {
      ...base,
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateAscent(config), [config]);
  const update = <K extends keyof AscentConfig>(key: K, value: AscentConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  const stages = [
    { label: "ORDERED · FOUNDRY + CREW", tons: result.produced, note: "surface railhead" },
    {
      label: "MANIFESTED · CERTIFIED",
      tons: result.manifested,
      note: result.uncertified > 1e-9 ? `${fmt(result.uncertified, 1)} T UNCERTIFIED HELD` : "all certified",
      warn: result.uncertified > 1e-9,
    },
    {
      label: `ELEVATOR · ${fmt(CLIMBER_MASS_T, 0)} T CLIMBERS`,
      tons: result.crewMoved + result.elevatorBulk,
      note:
        result.crewWaiting > 1e-9
          ? `${fmt(result.crewWaiting, 1)} T CREW WAITING`
          : `crew ${fmt(result.crewMoved, 1)} t aboard`,
      warn: result.crewWaiting > 1e-9,
    },
    {
      label: `MASS DRIVER · ${fmt(DRIVER_ACCEL_G, 0)} G`,
      tons: result.driverLaunched,
      note: result.driverAuthorized
        ? `${fmt(result.missesTPerDay, 1)} T/DAY MISSED → DEBRIS`
        : "REFUSED — FAIL CLOSED",
      warn: !result.driverAuthorized && result.driverWanted > 1e-9,
    },
    {
      label: "CUSTODY · ORBITAL DEPOT",
      tons: result.arrivals,
      note:
        result.installShortfall > 1e-9
          ? `DRAINING · ${result.runwayDays === Infinity ? "—" : fmt(result.runwayDays, 1)} DAYS RUNWAY`
          : `${fmt(result.depotNet, 1)} T/DAY BANKED`,
      warn: result.installShortfall > 1e-9,
    },
    {
      label: "INSTALLED · C-01 + PORT",
      tons: Math.min(result.arrivals + result.depotStock, result.demandOut),
      note: `demand ${fmt(result.demandOut, 0)} t/day`,
    },
  ];

  return (
    <LabShell
      module="ascent"
      sigil="A//T"
      name="ASCENT"
      tagline="WHEN PRODUCTION OUTRUNS SAFE TRANSPORT"
      readiness={result.readiness}
      stateLine="SOURCED ROADS · INVENTED RATES"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="SURFACE PRODUCTION" />
        <Range
          label="FOUNDRY OUTPUT"
          value={config.foundryOutputTPerDay}
          min={40}
          max={400}
          step={5}
          digits={0}
          suffix=" t/d"
          onChange={(v) => update("foundryOutputTPerDay", v)}
        />
        <Range
          label="CREW LIFT"
          value={config.crewTPerDay}
          min={0}
          max={10}
          step={0.5}
          suffix=" t/d"
          onChange={(v) => update("crewTPerDay", v)}
        />

        <Title n="02" text="THE TWO ROADS" />
        <Range
          label="CLIMBERS PER DAY"
          value={config.climbersPerDay}
          min={0}
          max={10}
          step={1}
          digits={0}
          onChange={(v) => update("climbersPerDay", v)}
        />
        <Range
          label="DRIVER WINDOWS"
          value={config.windowsPerDay}
          min={0}
          max={6}
          step={1}
          digits={0}
          suffix=" /day"
          onChange={(v) => update("windowsPerDay", v)}
        />
        <Range
          label="CATCHER CONFIDENCE"
          value={config.catcherConfidence * 100}
          min={85}
          max={99.9}
          step={0.1}
          suffix="%"
          onChange={(v) => update("catcherConfidence", v / 100)}
        />

        <Title n="03" text="ORBITAL CUSTODY" />
        <Range
          label="DEPOT FILL"
          value={config.depotFillPercent * 100}
          min={0}
          max={100}
          step={5}
          digits={0}
          suffix="%"
          onChange={(v) => update("depotFillPercent", v / 100)}
        />
        <Range
          label="C-01 REPLACEMENT DEMAND"
          value={config.replacementDemandTPerDay}
          min={40}
          max={200}
          step={5}
          digits={0}
          suffix=" t/d"
          onChange={(v) => update("replacementDemandTPerDay", v)}
        />

        <Title n="04" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="CUSTODY STATE MACHINE — TONNES PER DAY" />
        <div className="cs-roll as-chain">
          {stages.map((stage) => (
            <p key={stage.label} className={stage.warn ? "excluded" : "counted"}>
              <b>{stage.label}</b>
              <span>{stage.note.toUpperCase()}</span>
              <i>{fmt(stage.tons, 1)}</i>
              <em>t/d</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="CUSTODY VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "EVERY TONNE CERTIFIED, MOVED, AND IN CUSTODY"}
        />
        <div className="lb-metrics">
          <Metric label="PRODUCED" value={fmt(result.produced, 1)} unit=" t/d" />
          <Metric label="IN CUSTODY" value={fmt(result.arrivals, 1)} unit=" t/d" accent />
          <Metric
            label="BACKLOG GROWTH"
            value={fmt(result.backlogGrowth, 1)}
            unit=" t/d"
            warning={result.backlogGrowth > 1e-9}
          />
          <Metric
            label="CREW WAITING"
            value={fmt(result.crewWaiting, 1)}
            unit=" t/d"
            warning={result.crewWaiting > 1e-9}
          />
          <Metric
            label="SPARES RUNWAY"
            value={result.runwayDays === Infinity ? "∞" : fmt(result.runwayDays, 1)}
            unit=" days"
            warning={result.runwayDays < 30}
          />
          <Metric
            label="MISSED BUCKETS"
            value={fmt(result.missesTPerDay, 2)}
            unit=" t/d"
            warning={result.missesTPerDay > 1e-9}
          />
          <Metric
            label="DRIVER STATUS"
            value={result.driverAuthorized ? "AUTHORIZED" : "REFUSED"}
            warning={!result.driverAuthorized}
          />
          <Metric
            label="LEDGER RESIDUE"
            value={result.ledgerResidueT.toExponential(0)}
            unit=" t"
            warning={result.ledgerResidueT > 1e-6}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="CUSTODY REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>NO LAUNCH WITHOUT CORRIDOR, MANIFEST, AND RECEIVER.</b> A catcher below its confidence floor,
            or a depot with no custody to offer, refuses mass at the muzzle — a full receiver is no receiver,
            and the refusal costs delivered tonnes rather than losing them in flight.{" "}
            <b>LIVING CARGO NEVER BOARDS THE DRIVER.</b> {fmt(DRIVER_ACCEL_G, 0)} g over one kilometre is
            physics before it is policy: when the tether holds, bulk reroutes and people wait, even with the
            driver's capacity to spare. <b>THE CARGO LEDGER CLOSES.</b> Every tonne produced is moved,
            waiting, or refused; every tonne launched is caught or counted as debris.
          </p>
          <p className="lb-basis">
            {fmt(CLIMBER_MASS_T, 0)}-TONNE CLIMBERS, ~{fmt(CLIMB_DAYS_TO_GEO, 1)} DAYS TO GEO (EDWARDS, NIAC
            2003) · MASS DRIVER TO AN L2 CATCHER (O'NEILL; NASA AMES 1975) · RANGE-SAFETY CORRIDORS — SOURCED.
            EVERY RATE, DEPOT, AND INCIDENT — INVENTED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
