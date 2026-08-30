import { useMemo, useRef, useState } from "react";
import { parseCassette, type CassetteAction, type IncidentCassette } from "./cassette";
import { heliosCassette } from "./heliosCassette";
import { runPowerCampaign, type PowerCampaignResult } from "./powerCampaign";
import { FIRST_LIGHT_ACTIONS } from "./firstLight";
import { fmt, LabShell, Metric, Options, Register, Title, Verdict, type Readiness } from "./LabKit";

/**
 * CONCORD — the civilization campaign room. The state bus made cross-module
 * causality computable; this page makes it visible: pick (or load) a HELIOS
 * incident cassette, watch the power ledger settle under the survival-first
 * policy, and see exactly which discretionary load pays for the shortfall.
 */

type PresetId = "quiet" | "first-light" | "blackout";

const PRESETS: ReadonlyArray<{ id: PresetId; name: string; detail: string }> = [
  { id: "quiet", name: "QUIET GRID", detail: "No incidents; the surplus covers every contract" },
  { id: "first-light", name: "FIRST LIGHT", detail: "The commissioned five-incident campaign" },
  { id: "blackout", name: "BLACKOUT + SURGE", detail: "Relay partition while demand spikes" },
];

function presetCassette(id: PresetId): IncidentCassette {
  if (id === "quiet") return heliosCassette("Quiet grid", [], { runToTick: 60 });
  if (id === "blackout")
    return heliosCassette(
      "Blackout + surge",
      [
        { atTick: 5, action: "inject", params: { scenario: "communications-blackout" } },
        { atTick: 6, action: "inject", params: { scenario: "demand-spike" } },
      ],
      { runToTick: 12 },
    );
  return heliosCassette(
    "FIRST LIGHT",
    FIRST_LIGHT_ACTIONS.map((action): CassetteAction =>
      action.kind === "inject"
        ? {
            atTick: action.tick,
            action: "inject",
            params:
              action.bearingDeg === undefined
                ? { scenario: action.scenario }
                : { scenario: action.scenario, bearingDeg: action.bearingDeg },
            label: action.label,
          }
        : { atTick: action.tick, action: "production", params: { units: action.units }, label: action.label },
    ),
    { runToTick: 140 },
  );
}

function LedgerDiagram({ result }: { result: PowerCampaignResult }) {
  const power = result.state.ledgers.power;
  const supply = Object.values(power.supply).reduce((sum, v) => sum + v, 0);
  const rows = [
    { label: "GRID CAPABILITY (HELIOS)", mw: supply, color: "#9fd8c8" },
    { label: "SURVIVAL DEMAND", mw: power.demand.civilization ?? 0, color: "#8fd0ff" },
    {
      label: "SURVIVAL ALLOCATION",
      mw: power.allocations.civilization ?? 0,
      color: "#8fd0ff",
      shortfall: (power.allocations.civilization ?? 0) < (power.demand.civilization ?? 0) - 1e-6,
    },
    { label: "DATACORE DEMAND", mw: power.demand.datacore ?? 0, color: "#e0c37a", zoom: true },
    {
      label: "DATACORE ALLOCATION",
      mw: power.allocations.datacore ?? 0,
      color: "#e0c37a",
      zoom: true,
      shortfall: (power.allocations.datacore ?? 0) < (power.demand.datacore ?? 0) - 1e-6,
    },
  ];
  const gridMax = Math.max(supply, power.demand.civilization ?? 0, 1);
  // DATACORE draws megawatts against a grid measured in thousands of them;
  // its rows get a zoomed scale so the shed is visible, with the ratio
  // labeled rather than hidden.
  const zoomMax = Math.max(power.demand.datacore ?? 0, 1e-6);
  const w = 620;
  return (
    <svg viewBox={`0 0 ${w} 300`} role="img" aria-label="Power ledger settlement">
      <text x={30} y={20} fill="#7a938d" fontSize="10">
        POWER LEDGER · SURVIVAL SERVED FIRST · GRID SCALE VS DATACORE ZOOM ×{fmt(gridMax / zoomMax, 0)}
      </text>
      {rows.map((row, index) => {
        const max = row.zoom ? zoomMax : gridMax;
        const width = Math.max(2, (row.mw / max) * (w - 260));
        const y = 44 + index * 46;
        return (
          <g key={row.label}>
            <text x={30} y={y + 11} fill={row.shortfall ? "#ff6b7c" : "#7a938d"} fontSize="9">
              {row.label}
            </text>
            <rect
              x={210}
              y={y}
              width={width}
              height={15}
              fill={`${row.shortfall ? "#ff6b7c" : row.color}2e`}
              stroke={row.shortfall ? "#ff6b7c" : row.color}
            />
            <text x={216 + width} y={y + 11} fill={row.shortfall ? "#ff6b7c" : row.color} fontSize="9">
              {fmt(row.mw, row.zoom ? 2 : 0)} MW{row.zoom ? " (ZOOM)" : ""}
            </text>
          </g>
        );
      })}
      <text x={30} y={292} fill="#7a938d" fontSize="9">
        SETTLEMENT CONSERVES SUPPLY · PRIORITY: {result.state.ledgers.power.priority.join(" → ")} → REST
      </text>
    </svg>
  );
}

function TileField({ result }: { result: PowerCampaignResult }) {
  const total = result.datacore.tileStates.length;
  const columns = 12;
  return (
    <div
      className="cc-tiles"
      role="img"
      aria-label={`${result.datacore.availableTiles} of ${total} tiles lit`}
    >
      {result.datacore.tileStates.map((state, index) => (
        <i key={index} className={state} style={{ gridColumn: (index % columns) + 1 }} />
      ))}
    </div>
  );
}

export function ConcordApp() {
  const [preset, setPreset] = useState<PresetId>("blackout");
  const [loaded, setLoaded] = useState<{ cassette: IncidentCassette; note: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const filePicker = useRef<HTMLInputElement>(null);

  const cassette = loaded?.cassette ?? presetCassette(preset);
  const outcome = useMemo(() => runPowerCampaign(cassette), [cassette]);

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseCassette(await file.text());
    if (!parsed.ok) {
      setLoadError(parsed.errors[0]);
      return;
    }
    setLoadError(null);
    setLoaded({ cassette: parsed.cassette, note: `LOADED "${parsed.cassette.title}"` });
  };

  if (!outcome.ok) {
    return (
      <LabShell
        module="concord"
        sigil="C//D"
        name="CONCORD"
        tagline="CIVILIZATION CAMPAIGN ROOM · STATE BUS"
        readiness="NO-GO"
        stateLine="CASSETTE REFUSED"
      >
        <section className="lb-panel lb-stage" style={{ gridColumn: "1 / 4" }}>
          <Title n="!" text="CASSETTE REFUSED" />
          <p className="lb-invariant">{outcome.errors[0]}</p>
        </section>
      </LabShell>
    );
  }

  const { result } = outcome;
  const grantRatio = result.requestedMW > 0 ? result.grantedMW / result.requestedMW : 1;
  const readiness: Readiness = grantRatio >= 0.999 ? "GO" : grantRatio > 0 ? "CONDITIONAL" : "NO-GO";
  const constraints = [
    ...(grantRatio < 0.999
      ? [
          `Survival demand consumed the surplus: DATACORE granted ${fmt(result.grantedMW, 2)} of ${fmt(result.requestedMW, 2)} MW`,
        ]
      : []),
    ...(result.datacore.mode === "power-cap"
      ? [
          `DATACORE in POWER-CAP: ${result.datacore.availableTiles} of ${result.datacore.tileStates.length} tiles lit`,
        ]
      : []),
    ...(result.helios.metrics.deliveredGW < result.helios.metrics.demandGW - 0.01
      ? [
          `Grid deficit: ${fmt(result.helios.metrics.deliveredGW, 2)} of ${fmt(result.helios.metrics.demandGW, 2)} GW delivered`,
        ]
      : []),
    ...(loadError ? [`Cassette rejected: ${loadError}`] : []),
  ];

  return (
    <LabShell
      module="concord"
      sigil="C//D"
      name="CONCORD"
      tagline="CIVILIZATION CAMPAIGN ROOM · STATE BUS"
      readiness={readiness}
      stateLine={`RUIN-STATE/1 · T${result.state.tick} · DETERMINISTIC`}
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="INCIDENT CASSETTE" />
        <Options
          options={PRESETS}
          active={loaded ? ("" as PresetId) : preset}
          onSelect={(id) => {
            setLoaded(null);
            setPreset(id);
          }}
        />
        <div className="lb-options">
          <button className={loaded ? "active" : ""} onClick={() => filePicker.current?.click()}>
            <b>{loaded ? loaded.note : "LOAD CASSETTE ↑"}</b>
            <small>Any HELIOS ruin-cassette/1 file replays into the campaign</small>
          </button>
        </div>
        <input
          ref={filePicker}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Load incident cassette"
          onChange={(event) => {
            void loadFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Title n="02" text="REPLAYED TIMELINE" />
        <div className="cc-timeline">
          {cassette.timeline.length === 0 ? (
            <p>NO OPERATOR ACTIONS · GRID RUNS CLEAN</p>
          ) : (
            cassette.timeline.map((entry, index) => (
              <p key={index}>
                <b>T{entry.atTick}</b> {entry.label ?? `${entry.action} ${entry.params?.scenario ?? ""}`}
              </p>
            ))
          )}
        </div>
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="03" text="LEDGER SETTLEMENT" />
        <LedgerDiagram result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="04" text="CAMPAIGN VERDICT" />
        <Verdict
          readiness={readiness}
          label="DISCRETIONARY LOAD"
          detail={constraints[0] ?? "SURPLUS COVERS EVERY CONTRACT ON THE LEDGER"}
        />
        <div className="lb-metrics">
          <Metric label="GRID CAPABILITY" value={fmt(result.helios.metrics.potentialGW, 2)} unit="GW" />
          <Metric
            label="SURVIVAL DEMAND"
            value={fmt(result.helios.metrics.demandGW, 2)}
            unit="GW"
            warning={result.helios.metrics.demandGW > result.helios.metrics.potentialGW}
          />
          <Metric label="DATACORE ASK" value={fmt(result.requestedMW, 2)} unit="MW" />
          <Metric
            label="DATACORE GRANT"
            value={fmt(result.grantedMW, 2)}
            unit="MW"
            warning={grantRatio < 0.999}
            accent={grantRatio >= 0.999}
          />
          <Metric
            label="DATACORE MODE"
            value={result.datacore.mode.toUpperCase()}
            warning={result.datacore.mode !== "compute"}
          />
          <Metric
            label="TILES LIT"
            value={`${result.datacore.availableTiles}/${result.datacore.tileStates.length}`}
            warning={result.datacore.availableTiles < result.datacore.tileStates.length}
          />
          <Metric
            label="VERIFIED COMPUTE"
            value={fmt(result.datacore.verifiedComputePflops, 1)}
            unit="PFLOPS"
          />
          <Metric
            label="OFFLINE NODES"
            value={fmt(result.helios.metrics.offlineCount + result.helios.metrics.isolatedCount, 0)}
          />
        </div>
        <Title n="05" text="DATACORE TILE FIELD" />
        <TileField result={result} />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="CAMPAIGN REGISTER" constraints={constraints} />
        <div>
          <Title n="I" text="BUS INVARIANTS" />
          <p className="lb-invariant">
            <b>CONSERVATION.</b> Settlement never allocates more than the grid supplies; a document that mints
            power is rejected. <b>DETERMINISM.</b> The same cassette settles into the same civilization, every
            time. <b>DECLARED PRIORITY.</b> Survival load outranks discretionary load by a visible list, not a
            hidden rule — the shortfall lands where the ledger says it lands.
          </p>
          <p className="lb-basis">RUIN-STATE/1 POWER LEDGER · HELIOS ↔ DATACORE FIRST SLICE</p>
        </div>
      </section>
    </LabShell>
  );
}
