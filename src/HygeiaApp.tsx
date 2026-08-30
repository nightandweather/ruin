import { useMemo, useState } from "react";
import {
  CAREER_LIMIT_MSV,
  evaluateHygeia,
  hygeiaConfig,
  SPE_META,
  type HygeiaConfig,
  type HygeiaIncident,
  type SpeEvent,
} from "./hygeia";
import { fmt, LabShell, Metric, Options, Range, Register, Title, Verdict } from "./LabKit";

const INCIDENTS: ReadonlyArray<{ id: HygeiaIncident; name: string; detail: string }> = [
  { id: "none", name: "NOMINAL", detail: "Dosimetry and shelter systems healthy" },
  { id: "dosimeter-drift", name: "DOSIMETER DRIFT", detail: "Measurements suspect; bound widens" },
  { id: "shelter-power-loss", name: "SHELTER POWER LOSS", detail: "Refuge degraded to hull shielding" },
];

function StormDiagram({ result }: { result: ReturnType<typeof evaluateHygeia> }) {
  const refuges = [
    { label: "SHELTER", dose: result.speShelterMSv, x: 40 },
    { label: "HULL", dose: result.speHabitatMSv, x: 250 },
    { label: "SUIT", dose: result.speSuitMSv, x: 460 },
  ];
  const max = Math.max(1, result.speSuitMSv);
  return (
    <svg viewBox="0 0 640 300" role="img" aria-label="Storm dose by refuge">
      {refuges.map((refuge) => {
        const h = Math.max(3, (refuge.dose / max) * 200);
        const warm = refuge.dose > result.speShelterMSv * 3;
        return (
          <g key={refuge.label}>
            <rect
              x={refuge.x}
              y={250 - h}
              width={140}
              height={h}
              fill={warm ? "#ff6b7c33" : "#7fd8e833"}
              stroke={warm ? "#ff6b7c" : "#7fd8e8"}
            />
            <text x={refuge.x + 70} y={270} textAnchor="middle" fill="#7fa8b0" fontSize="11">
              {refuge.label}
            </text>
            <text x={refuge.x + 70} y={240 - h} textAnchor="middle" fill="#c2eff7" fontSize="13">
              {fmt(refuge.dose, 0)} mSv
            </text>
          </g>
        );
      })}
      <text x={40} y={30} fill="#5f7c83" fontSize="10">
        STORM DOSE PER REFUGE · {fmt(result.shelterShield, 0)} g/cm² SHELTERED
      </text>
      <line x1={40} y1={250} x2={600} y2={250} stroke="#2c4a52" />
    </svg>
  );
}

export function HygeiaApp() {
  const [config, setConfig] = useState<HygeiaConfig>(() => hygeiaConfig());
  const result = useMemo(() => evaluateHygeia(config), [config]);
  const update = <K extends keyof HygeiaConfig>(key: K, value: HygeiaConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <LabShell
      module="hygeia"
      sigil="H//G"
      name="HYGEIA"
      tagline="CREW RADIATION-HEALTH OPERATIONS"
      readiness={result.readiness}
      stateLine="DESIGN TWIN · NOT MEDICAL GUIDANCE"
    >
      <aside className="lb-panel lb-config">
        <Title n="01" text="MISSION PROFILE" />
        <Range
          label="CREW"
          value={config.crewCount}
          min={2}
          max={60}
          step={1}
          digits={0}
          onChange={(v) => update("crewCount", v)}
        />
        <Range
          label="MISSION LENGTH"
          value={config.missionDays}
          min={30}
          max={1200}
          step={10}
          digits={0}
          suffix=" d"
          onChange={(v) => update("missionDays", v)}
        />
        <Range
          label="EVA SCHEDULE"
          value={config.evaHoursPerWeek}
          min={0}
          max={30}
          step={1}
          digits={0}
          suffix=" h/wk"
          onChange={(v) => update("evaHoursPerWeek", v)}
        />
        <Range
          label="PRIOR CAREER DOSE"
          value={config.priorCareerMSv}
          min={0}
          max={550}
          step={10}
          digits={0}
          suffix=" mSv"
          onChange={(v) => update("priorCareerMSv", v)}
        />
        <Title n="02" text="SHIELDING + REFUGE" />
        <Range
          label="HABITAT HULL"
          value={config.habitatShieldGcm2}
          min={2}
          max={80}
          step={1}
          digits={0}
          suffix=" g/cm²"
          onChange={(v) => update("habitatShieldGcm2", v)}
        />
        <Range
          label="SHELTER EXTRA"
          value={config.shelterExtraGcm2}
          min={0}
          max={80}
          step={1}
          digits={0}
          suffix=" g/cm²"
          onChange={(v) => update("shelterExtraGcm2", v)}
        />
        <Range
          label="SHELTER SEATS"
          value={config.shelterCapacity}
          min={0}
          max={60}
          step={1}
          digits={0}
          onChange={(v) => update("shelterCapacity", v)}
        />
        <Title n="03" text="STORM TIMING" />
        <Range
          label="SPE WARNING"
          value={config.speWarningMinutes}
          min={0}
          max={120}
          step={5}
          digits={0}
          suffix=" min"
          onChange={(v) => update("speWarningMinutes", v)}
        />
        <Range
          label="EVA RECALL"
          value={config.evaRecallMinutes}
          min={5}
          max={90}
          step={5}
          digits={0}
          suffix=" min"
          onChange={(v) => update("evaRecallMinutes", v)}
        />
      </aside>

      <section className="lb-panel lb-stage">
        <Title n="04" text="STORM REFUGE LADDER" />
        <StormDiagram result={result} />
      </section>

      <aside className="lb-panel lb-output">
        <Title n="05" text="ASSIGNMENT VERDICT" />
        <Verdict
          readiness={result.readiness}
          label="CREW ASSIGNMENT"
          detail={result.constraints[0] ?? "CAREER, SHELTER, AND RECALL CONTRACTS POSITIVE"}
        />
        <div className="lb-metrics">
          <Metric label="SAFE STATE" value={result.safeMode} accent />
          <Metric
            label="CAREER BOUND"
            value={fmt(result.careerBoundMSv, 0)}
            unit={`/${CAREER_LIMIT_MSV} mSv`}
            warning={result.careerMarginMSv < 0}
          />
          <Metric label="CHRONIC GCR" value={fmt(result.habitatGcrMSvDay, 2)} unit="mSv/d" />
          <Metric label="MISSION BOUND" value={fmt(result.missionBoundMSv, 0)} unit="mSv" />
          <Metric
            label="WORST STORM"
            value={fmt(result.worstStormMSv, 0)}
            unit="mSv"
            warning={result.worstStormMSv > 250}
          />
          <Metric
            label="SHELTER DEFICIT"
            value={fmt(result.shelterDeficit, 0)}
            unit="crew"
            warning={result.shelterDeficit > 0}
          />
          <Metric
            label="RECALL MARGIN"
            value={fmt(result.recallMarginMin, 0)}
            unit="min"
            warning={result.recallMarginMin < 0}
          />
          <Metric label="EVA EXPOSURE" value={fmt(result.evaHours, 0)} unit="h" />
        </div>
        <Title n="06" text="SOLAR PARTICLE EVENT" />
        <Options
          options={(Object.keys(SPE_META) as SpeEvent[]).map((event) => ({
            id: event,
            name: SPE_META[event].name,
            detail: SPE_META[event].detail,
          }))}
          active={config.spe}
          onSelect={(event) => update("spe", event)}
        />
        <Title n="07" text="INCIDENT INJECTION" />
        <Options
          options={INCIDENTS}
          active={config.incident}
          onSelect={(incident) => update("incident", incident)}
        />
      </aside>

      <section className="lb-panel lb-bottom">
        <Register title="EXPOSURE REGISTER" constraints={result.constraints} />
        <div>
          <Title n="I" text="SAFETY INVARIANT" />
          <p className="lb-invariant">
            <b>FAIL-CLOSED ASSIGNMENT.</b> A mission whose conservative upper-bound dose would push any crew
            member past the {CAREER_LIMIT_MSV} mSv career allowance is refused outright — the system never
            proposes it for a human to argue back in. Suspect dosimetry widens the bound; it never narrows it.
          </p>
          <p className="lb-basis">
            GCR RATE + STORM CLASSES + CAREER LIMIT · GROUNDED — ATTENUATION + SUIT FACTORS · ASSUMED
          </p>
        </div>
      </section>
    </LabShell>
  );
}
