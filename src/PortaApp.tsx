import { useMemo, useState } from "react";
import {
  evaluatePorta,
  MANIFESTS,
  portaConfig,
  SAFE_OPENING_MINUTES,
  type PortaConfig,
  type PortaIncident,
  type PortaQuorum,
} from "./porta";
import { readDeepLink } from "./deepLink";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const QUORA: ReadonlyArray<{ id: PortaQuorum; name: string; detail: string }> = [
  { id: "both", name: "BOTH ENDS", detail: "Standing quorum; the gate opens on schedule" },
  { id: "one", name: "ONE END", detail: "Half an authority is not an authority" },
  { id: "revoked", name: "REVOKED", detail: "Neither end will answer; nothing opens automatically" },
];

const INCIDENTS: ReadonlyArray<{ id: PortaIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Quorum held, coolant on hand" },
  { id: "quorum-revoked", name: "QUORUM REVOKED", detail: "Both ends withdraw the standing authority" },
  { id: "coolant-short", name: "COOLANT SHORT", detail: "Reserve cut to 35% before the opening" },
  {
    id: "improvised-quorum",
    name: "IMPROVISED QUORUM",
    detail: "125 discarded ledgers bound as a temporary causal proof — 43 seconds",
  },
];

export function PortaApp() {
  // `porta.html?incident=improvised-quorum&manifest=evacuation`
  const [config, setConfig] = useState<PortaConfig>(() => {
    const base = portaConfig();
    return {
      ...base,
      manifest: readDeepLink(
        "manifest",
        MANIFESTS.map((m) => m.id),
        base.manifest,
      ),
      quorum: readDeepLink(
        "quorum",
        QUORA.map((q) => q.id),
        base.quorum,
      ),
      incident: readDeepLink(
        "incident",
        INCIDENTS.map((i) => i.id),
        base.incident,
      ),
    };
  });
  const result = useMemo(() => evaluatePorta(config), [config]);
  const update = <K extends keyof PortaConfig>(key: K, value: PortaConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="porta"
      sigil="P//T"
      name="PORTA"
      tagline="THE TRANSIT GATE, AND WHAT A VIOLATION COSTS FOREVER"
      readiness={result.readiness}
      stateLine="SEASON 02 CANON · THE MANUSCRIPT IS THE SPECIFICATION"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="MANIFEST" />
        <Options
          options={MANIFESTS.map((m) => ({
            id: m.id,
            name: m.name,
            detail: `${m.people} through · ${m.detail}`,
          }))}
          active={config.manifest}
          onSelect={(manifest) => update("manifest", manifest)}
        />

        <Title n="02" text="AUTHORITY" />
        <Options options={QUORA} active={config.quorum} onSelect={(quorum) => update("quorum", quorum)} />

        <Title n="03" text="THE OPENING" />
        <Range
          label="OPENING"
          value={config.openingMinutes}
          min={1}
          max={140}
          step={1}
          digits={0}
          suffix=" min"
          onChange={(v) => update("openingMinutes", v)}
        />
        <Range
          label="RECOVERY PANELS"
          value={config.panelEfficiency * 100}
          min={20}
          max={100}
          step={1}
          digits={0}
          suffix="%"
          onChange={(v) => update("panelEfficiency", v / 100)}
        />
        <Range
          label="COOLANT RESERVE"
          value={config.coolantReservePJ}
          min={1}
          max={40}
          step={0.5}
          suffix=" PJ"
          onChange={(v) => update("coolantReservePJ", v)}
        />

        <Title n="04" text="STATIONS" />
        <Range
          label="QUARANTINE"
          value={config.quarantinePerMin}
          min={0.5}
          max={40}
          step={0.5}
          suffix="/min"
          onChange={(v) => update("quarantinePerMin", v)}
        />
        <Range
          label="DECOMPRESSION"
          value={config.decompressionPerMin}
          min={1}
          max={60}
          step={1}
          digits={0}
          suffix="/min"
          onChange={(v) => update("decompressionPerMin", v)}
        />

        <Title n="05" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="06" text="ONE OPENING" />
        <div className="cs-roll pt-roll">
          <p className={result.opens ? "counted" : "excluded"}>
            <b>AUTHORITY</b>
            <span>{result.authorized ? "QUORUM AT BOTH ENDS" : "NO STANDING QUORUM"}</span>
            <i>{result.opens ? "OPENS" : "SEALED"}</i>
          </p>
          <p className={result.openingMinutes <= SAFE_OPENING_MINUTES ? "counted" : "excluded"}>
            <b>OPENING</b>
            <span>CEILING {SAFE_OPENING_MINUTES} MIN</span>
            <i>{fmt(result.openingSeconds, 0)} s</i>
          </p>
          <p className={result.coolantHolds ? "counted" : "excluded"}>
            <b>THERMAL DEPOSIT</b>
            <span>AGAINST {fmt(result.coolantPJ, 2)} PJ OF COOLANT</span>
            <i>{fmt(result.depositPJ, 2)} PJ</i>
          </p>
          <p className="counted">
            <b>REOPENS IN</b>
            <span>STANDING INTERVAL 94 DAYS</span>
            <i>{fmt(result.cooldownDays, 0)} d</i>
          </p>
          <p className={result.leftBehind > 0.5 ? "excluded" : "counted"}>
            <b>{result.bottleneck}</b>
            <span>THE SLOWEST STATION, NOT THE DOOR</span>
            <i>{fmt(result.capacity, 0)}</i>
          </p>
          <p className={result.causalLedgerIntact ? "counted" : "excluded"}>
            <b>CAUSAL LEDGER</b>
            <span>
              {result.causalLedgerIntact ? "SHARED PAST INTACT" : "FORKED AT BOTH ENDS, PERMANENTLY"}
            </span>
            <i>{result.attribution}</i>
          </p>
        </div>
        <div className="cc-timeline">
          <p>
            <b>CANON</b>9.58 PJ in 71 minutes · 80-minute ceiling · 94-day interval, 211 before the active
            panels · 43 seconds, once
          </p>
        </div>
      </section>

      <aside className="lb-panel lb-output">
        <Title n="07" text="TRANSIT VERDICT" />
        <Verdict
          readiness={result.readiness}
          label={result.safeMode}
          detail={result.constraints[0] ?? "MANIFEST CLEARS INSIDE THE OPENING; THE SHARED PAST HOLDS"}
        />
        <div className="lb-metrics">
          <Metric
            label="THROUGH"
            value={fmt(result.passed, 0)}
            unit={` / ${result.manifest.people}`}
            accent
          />
          <Metric
            label="LEFT BEHIND"
            value={fmt(Math.ceil(result.leftBehind), 0)}
            warning={result.leftBehind > 0.5}
          />
          <Metric label="OPENING" value={fmt(result.openingSeconds, 0)} unit=" s" />
          <Metric label="DEPOSIT" value={fmt(result.depositPJ, 2)} unit=" PJ" />
          <Metric
            label="REOPEN"
            value={fmt(result.cooldownDays, 0)}
            unit=" d"
            warning={result.cooldownDays > 94}
          />
          <Metric label="BOTTLENECK" value={result.bottleneck} />
          <Metric label="AUTHORISED" value={result.authorized ? "YES" : "NO"} warning={!result.authorized} />
          <Metric
            label="SHARED PAST"
            value={result.causalLedgerIntact ? "INTACT" : "FORKED"}
            warning={!result.causalLedgerIntact}
          />
        </div>
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="TRANSIT REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANTS" />
          <p className="lb-invariant">
            <b>THE CEILING AND THE QUORUM ARE ENFORCED.</b> No opening past {SAFE_OPENING_MINUTES} minutes,
            and nothing opens automatically without quorum at both ends.{" "}
            <b>THE VIOLATION IS POSSIBLE AND PERMANENT.</b> Binding discarded ledgers into a temporary causal
            proof does open the door — the children go through — and forks the record at both ends forever.
            The method cannot be used twice, and the act itself is recorded as cause unassigned. This module
            does not forbid it. It prices it.
          </p>
          <p className="lb-basis">
            NOT PHYSICS · THE GATE IS FICTION AND SO ARE ITS CONSTANTS — WHAT IS MODELLED IS THE OPERATIONS
            AROUND ONE
          </p>
        </div>
      </section>
    </LabShell>
  );
}
