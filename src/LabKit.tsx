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

/**
 * Dash signatures for chart series.
 *
 * Colour never carries meaning alone in this interface, and a chart legend is
 * the easiest place to break that rule: two series in different hues are one
 * colour-vision difference away from being the same line. Every series takes a
 * pattern as well as a hue, and `SeriesKey` draws the pattern in the legend so
 * the two are matched by shape rather than by memory.
 */
export const SERIES_DASH = {
  solid: undefined,
  dashed: "7 4",
  dotted: "2 3",
  long: "5 3",
  dotDash: "9 3 2 3",
} as const;

export type SeriesDash = (typeof SERIES_DASH)[keyof typeof SERIES_DASH];

export interface SeriesSpec {
  label: string;
  color: string;
  dash?: SeriesDash;
}

/**
 * In-chart legend drawing each series as a line sample in its own pattern.
 * Laid out right-aligned to `right`, in the order given.
 */
export function SeriesKey({ right, y, items }: { right: number; y: number; items: readonly SeriesSpec[] }) {
  const SAMPLE = 16;
  const GAP = 5;
  const CHAR = 5.1;
  const PAD = 14;
  const widths = items.map((item) => SAMPLE + GAP + item.label.length * CHAR + PAD);
  const total = widths.reduce((sum, width) => sum + width, 0);
  let cursor = right - total;
  return (
    <g fontSize="9">
      {items.map((item, index) => {
        const x = cursor;
        cursor += widths[index];
        return (
          <g key={item.label}>
            <line
              x1={x}
              y1={y - 3}
              x2={x + SAMPLE}
              y2={y - 3}
              stroke={item.color}
              strokeWidth="1.6"
              strokeDasharray={item.dash}
            />
            <text x={x + SAMPLE + GAP} y={y} fill={item.color}>
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

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
