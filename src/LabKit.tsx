import type { ReactNode } from "react";
import { ModuleBar } from "./ModuleBar";
import "./lab.css";

/**
 * Shared operator-interface pieces for the laboratories built on lab.css.
 * Palette and physics stay in each module; structure lives once here.
 */

export const fmt = (value: number, digits = 1) =>
  Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "∞";

export type Readiness = "GO" | "CONDITIONAL" | "NO-GO";

export function LabShell({
  module,
  sigil,
  name,
  tagline,
  readiness,
  stateLine,
  children,
}: {
  module: string;
  sigil: string;
  name: string;
  tagline: string;
  readiness: Readiness;
  stateLine: string;
  children: ReactNode;
}) {
  return (
    <main className={`lb-shell ${module}`}>
      <header className="lb-top">
        <div className="lb-brand">
          <span>{sigil}</span>
          <div>
            <strong>RUIN // {name}</strong>
            <small>{tagline}</small>
          </div>
        </div>
        <ModuleBar current={module} />
        <div className="lb-state">
          <span>{stateLine}</span>
          <b className={readiness.toLowerCase()}>{readiness}</b>
        </div>
      </header>
      <section className="lb-layout">{children}</section>
    </main>
  );
}

export function Title({ n, text }: { n: string; text: string }) {
  return (
    <div className="lb-title">
      <span>{n}</span>
      {text}
    </div>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  digits = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  digits?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="lb-range">
      <span>
        {label}
        <b>
          {fmt(value, digits)}
          {suffix}
        </b>
      </span>
      <input
        aria-label={label}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function Options<Id extends string>({
  options,
  active,
  onSelect,
}: {
  options: ReadonlyArray<{ id: Id; name: string; detail: string }>;
  active: Id;
  onSelect: (id: Id) => void;
}) {
  return (
    <div className="lb-options">
      {options.map((option) => (
        <button
          key={option.id}
          className={option.id === active ? "active" : ""}
          onClick={() => onSelect(option.id)}
        >
          <b>{option.name}</b>
          <small>{option.detail}</small>
        </button>
      ))}
    </div>
  );
}

export function Metric({
  label,
  value,
  unit = "",
  accent,
  warning,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={`lb-metric ${accent ? "accent" : ""} ${warning ? "warning" : ""}`}>
      <span>{label}</span>
      <b>
        {value}
        <small>{unit}</small>
      </b>
    </div>
  );
}

export function Verdict({
  readiness,
  label,
  detail,
}: {
  readiness: Readiness;
  label: string;
  detail: string;
}) {
  return (
    <div className={`lb-verdict ${readiness.toLowerCase()}`}>
      <span>{label}</span>
      <b>{readiness}</b>
      <small>{detail}</small>
    </div>
  );
}

export function Register({ title, constraints }: { title: string; constraints: readonly string[] }) {
  return (
    <div className="lb-register">
      <Title n="R" text={title} />
      {constraints.length === 0 ? (
        <p className="clear">ALL OPERATING CONTRACTS POSITIVE</p>
      ) : (
        constraints.map((constraint) => <p key={constraint}>{constraint}</p>)
      )}
    </div>
  );
}
