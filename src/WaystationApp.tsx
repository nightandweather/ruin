import { useMemo, useState } from "react";
import {
  evaluateWaystation,
  waystationConfig,
  type WaystationConfig,
  type WaystationIncident,
} from "./waystation";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: WaystationIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Every collar verifies; every window is made" },
  { id: "collar-fault", name: "COLLAR FAULT", detail: "The tanker fails hard-capture verification" },
  { id: "boiloff", name: "BOILOFF", detail: "The propellant farm wakes up 65% empty" },
  { id: "radiator-outage", name: "RADIATOR OUTAGE", detail: "Half the port's hands, same manifest" },
  { id: "unidentified-cargo", name: "PROVENANCE FAULT", detail: "A sealed hold fails its manifest check" },
  { id: "debris-corridor", name: "DEBRIS CORRIDOR", detail: "Every approach holds four hours" },
  { id: "disabled-vessel", name: "DISABLED VESSEL", detail: "The emergency tug and berth are committed" },
];

export function WaystationApp() {
  // `waystation.html?incident=collar-fault`
  const [config, setConfig] = useState<WaystationConfig>(() => {
    const base = waystationConfig();
    return {
      ...base,
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluateWaystation(config), [config]);
  const update = <K extends keyof WaystationConfig>(key: K, value: WaystationConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="waystation"
      sigil="W//S"
      name="WAYSTATION"
      tagline="WHICH VESSEL MISSES A SAFE DEPARTURE WINDOW"
      readiness={result.readiness}
      stateLine="SOURCED PORT RULES · INVENTED MANIFEST"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="THE PORT'S HANDS" />
        <Range
          label="STANDARD BERTHS"
          value={config.standardBerths}
          min={1}
          max={6}
          step={1}
          digits={0}
          suffix=" (1 reserved)"
          onChange={(v) => update("standardBerths", v)}
        />
        <Range
          label="INSPECTION DRONES"
          value={config.inspectionDrones}
          min={1}
          max={4}
          step={1}
          digits={0}
          onChange={(v) => update("inspectionDrones", v)}
        />
        <Range
          label="REPAIR CELLS"
          value={config.repairCells}
          min={1}
          max={3}
          step={1}
          digits={0}
          onChange={(v) => update("repairCells", v)}
        />
        <Range
          label="PUMP RATE"
          value={config.pumpRateTPerH}
          min={5}
          max={40}
          step={1}
          digits={0}
          suffix=" t/h"
          onChange={(v) => update("pumpRateTPerH", v)}
        />

        <Title n="02" text="THE FARM AND THE FLOOR" />
        <Range
          label="PROPELLANT STOCK"
          value={config.propellantStockT}
          min={100}
          max={400}
          step={10}
          digits={0}
          suffix=" t"
          onChange={(v) => update("propellantStockT", v)}
        />
        <Range
          label="CONFIDENCE FLOOR"
          value={config.confidenceFloor * 100}
          min={95}
          max={99.9}
          step={0.1}
          suffix="%"
          onChange={(v) => update("confidenceFloor", v / 100)}
        />

        <Title n="03" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="THE SHIFT BOARD — EIGHT ARRIVALS, ONE PORT" />
        <div className="cs-roll ws-board">
          {result.vessels.map((v) => (
            <p key={v.vessel.id} className={v.missedWindow || !v.cleared ? "excluded" : "counted"}>
              <b>{v.vessel.name}</b>
              <span>
                {!v.cleared
                  ? `HELD · ${(v.holdReason ?? "").toUpperCase()}`
                  : v.missedWindow
                    ? `MISSED · ${v.bottleneck.toUpperCase()} · +${fmt(v.delayH, 1)} H`
                    : `DEPARTS H+${fmt(v.departureH ?? 0, 1)}`}
              </span>
              <i>{v.dockH === null ? "—" : `D ${fmt(v.dockH, 1)}`}</i>
              <i>{v.readyH === null ? "—" : `R ${fmt(v.readyH, 1)}`}</i>
              <em>{`W ${fmt(v.vessel.windowOpenH, 0)}–${fmt(v.vessel.windowCloseH, 1)}`}</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="PORT VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "EVERY VESSEL MAKES ITS FIRST WINDOW"}
        />
        <div className="lb-metrics">
          <Metric
            label="WINDOWS MADE"
            value={`${8 - result.missedCount - result.heldCount}`}
            unit=" / 8"
            accent
          />
          <Metric label="WINDOWS MISSED" value={`${result.missedCount}`} warning={result.missedCount > 0} />
          <Metric label="VESSELS HELD" value={`${result.heldCount}`} warning={result.heldCount > 0} />
          <Metric
            label="FAULTLESS MISSED"
            value={`${result.faultlessMissed.length}`}
            warning={result.faultlessMissed.length > 0}
          />
          <Metric
            label="EMERGENCY PATH"
            value={result.reservePreserved ? "PRESERVED" : "COMMITTED"}
            warning={!result.reservePreserved}
          />
          <Metric
            label="FARM MARGIN"
            value={fmt(result.propellantMarginT, 0)}
            unit=" t"
            warning={result.propellantMarginT < 20}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="PORT REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>NO DOCKING WITHOUT IDENTITY, CONFIDENCE, AND A COMPATIBLE BERTH.</b> The keep-out sphere is a
            fact before it is a courtesy: a vessel below the floor holds outside it, and an unidentified hold
            gets a quarantine berth or none. <b>NO PROPELLANT ACROSS AN UNVERIFIED INTERFACE</b> — a collar
            that failed hard-capture gets a repair cell, not a fuel line, and everyone queued behind it pays.{" "}
            <b>THE EMERGENCY PATH IS NEVER SOLD.</b> One berth and the tug stay out of every schedule; the
            shift that commits them is a NO-GO shift.{" "}
            <b>A MISSED WINDOW IS HOLDING, NOT A FORCED DEPARTURE.</b> Nothing in this model can depart a
            vessel before it is ready.
          </p>
          <p className="lb-basis">
            ISS VISITING-VEHICLE RULES: APPROACH ELLIPSOID, 200 M KEEP-OUT SPHERE, GO/NO-GO POLLS · IDSS
            CAPTURE VERIFICATION · THE LIFEBOAT RULE · LH₂ BOILOFF — SOURCED. THE MANIFEST, THE BERTHS, AND
            EVERY RATE — INVENTED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
