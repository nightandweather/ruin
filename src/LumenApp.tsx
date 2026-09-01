import { useMemo, useState } from "react";
import {
  evaluateLumen,
  lumenConfig,
  RECTENNA_RECORD,
  type DispatchPolicy,
  type LumenConfig,
  type LumenIncident,
} from "./lumen";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const POLICIES: ReadonlyArray<{ id: DispatchPolicy; name: string; detail: string }> = [
  { id: "survival-first", name: "SURVIVAL FIRST", detail: "CONCORD's rule: life support is shed last" },
  { id: "price-first", name: "PRICE FIRST", detail: "Whoever pays most is served first" },
  { id: "contract-share", name: "PRO-RATA", detail: "Every contract shaved by the same fraction" },
];

const INCIDENTS: ReadonlyArray<{ id: LumenIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Both strings up; every beam locked to its pilot" },
  { id: "pointing-fog", name: "POINTING FOG", detail: "Jitter ×8 — the far links lose pilot lock" },
  { id: "relay-loss", name: "RELAY LOSS", detail: "One string down; N-1 is now the whole margin" },
  { id: "receiver-overheat", name: "RECEIVER OVERHEAT", detail: "Habitat radiators casualty — 40% retained" },
  { id: "demand-surge", name: "DEMAND SURGE", detail: "Foundry production campaign at 1.8× contract" },
];

export function LumenApp() {
  // `lumen.html?policy=price-first&incident=relay-loss`
  const [config, setConfig] = useState<LumenConfig>(() => {
    const base = lumenConfig();
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
  const result = useMemo(() => evaluateLumen(config), [config]);
  const update = <K extends keyof LumenConfig>(key: K, value: LumenConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="lumen"
      sigil="L//M"
      name="LUMEN"
      tagline="WHO LOSES POWER WHEN THE BEAM FAILS CLOSED"
      readiness={result.readiness}
      stateLine="SOURCED BEAM PHYSICS · INVENTED GRID"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="DISPATCH RULE" />
        <Options options={POLICIES} active={config.policy} onSelect={(policy) => update("policy", policy)} />

        <Title n="02" text="SOURCE AND GEOMETRY" />
        <Range
          label="SOURCE AT HUB"
          value={config.sourceGW}
          min={10}
          max={70}
          step={1}
          digits={0}
          suffix=" GW"
          onChange={(v) => update("sourceGW", v)}
        />
        <Range
          label="ARRAY APERTURE"
          value={config.apertureM}
          min={800}
          max={4000}
          step={100}
          digits={0}
          suffix=" m"
          onChange={(v) => update("apertureM", v)}
        />
        <Range
          label="POINTING JITTER"
          value={config.jitterUrad}
          min={0.5}
          max={20}
          step={0.5}
          suffix=" µrad"
          onChange={(v) => update("jitterUrad", v)}
        />

        <Title n="03" text="CORRIDOR TRAFFIC" />
        <Range
          label="TRANSITS PER DAY"
          value={config.corridorTransitsPerDay}
          min={0}
          max={24}
          step={1}
          digits={0}
          onChange={(v) => update("corridorTransitsPerDay", v)}
        />

        <Title n="04" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="05" text="DISPATCH GRAPH — EVERY SHORTFALL EXPLAINED" />
        <div className="cs-roll lm-grid">
          {result.customers.map((r) => (
            <p key={r.contract.id} className={r.unmetGW > 1e-9 || !r.authorized ? "excluded" : "counted"}>
              <b>{r.contract.name}</b>
              <span>
                {!r.authorized
                  ? `HELD · WANDER ${r.wanderM.toFixed(0)} M / KEEP-OUT ${r.contract.keepoutM} M`
                  : r.reason === "NONE"
                    ? "MET"
                    : `${r.reason} · STORAGE ${r.autonomyH === Infinity ? "—" : `${fmt(r.autonomyH, 1)} H`}`}
              </span>
              <i>{fmt(r.deliveredGW, 2)}</i>
              <i>/ {fmt(r.demandGW, 1)} GW</i>
              <em>{r.unmetGW > 1e-9 ? `-${fmt(r.unmetGW, 2)}` : "·"}</em>
            </p>
          ))}
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="06" text="GRID VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "EVERY CONTRACT MET, EVERY JOULE ATTRIBUTED"}
        />
        <div className="lb-metrics">
          <Metric label="DELIVERED" value={fmt(result.deliveredGW, 1)} unit=" GW" accent />
          <Metric label="CONTRACTED" value={fmt(result.contractedGW, 1)} unit=" GW" />
          <Metric
            label="SHORTFALL"
            value={fmt(result.shortfallGW, 2)}
            unit=" GW"
            warning={result.shortfallGW > 1e-9}
          />
          <Metric
            label="BEAMS HELD"
            value={`${result.heldCount}`}
            unit=" / 5"
            warning={result.heldCount > 0}
          />
          <Metric
            label="STORAGE COVER"
            value={fmt(result.storageCoverGW, 2)}
            unit=" GW"
            warning={result.storageCoverGW > 1e-9}
          />
          <Metric
            label="STRANDED SOURCE"
            value={fmt(result.strandedGW, 1)}
            unit=" GW"
            warning={result.strandedGW > 1e-9}
          />
          <Metric label="CORRIDOR AVAILABILITY" value={`${(result.availability * 100).toFixed(1)}%`} />
          <Metric
            label="LEDGER RESIDUE"
            value={result.balanceGW.toExponential(0)}
            unit=" GW"
            warning={Math.abs(result.balanceGW) > 1e-6}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="GRID REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>NO PILOT LOCK, NO BEAM.</b> The power beam is the phase conjugate of a pilot sent from the
            rectenna — the 1978 Reference System's architecture — so a link whose wander exceeds its keep-out
            has already defocused. Fail-closed costs delivered gigawatts and does not read the merit order:
            under pointing fog it is the survival-rank-one habitat that goes dark while the cheapest customer
            stays lit. <b>A RECEIVER IS NEVER SENT MORE THAN IT CAN ACCEPT</b> — the thermal cap is applied
            before dispatch, not discovered on arrival. <b>THE LEDGER CLOSES.</b> Every gigawatt is delivered,
            lost in a named stage, curtailed, or stranded; a residue would be a loss nobody can explain.
          </p>
          <p className="lb-basis">
            82.5% RECTENNA CONVERSION (BROWN, 1975) · GOLDSTONE 30 kW ACROSS 1.5 KM · RETRODIRECTIVE PILOT
            (SPS REFERENCE SYSTEM, 1978) · 5.8 GHz (JAXA 2015) · 1.22 λ/D · NERC N-1 — SOURCED. THE FIVE
            CONTRACTS AND EVERY DISTANCE — INVENTED. RECEIVERS SIT BELOW {(RECTENNA_RECORD * 100).toFixed(1)}%
          </p>
        </div>
      </section>
    </LabShell>
  );
}
