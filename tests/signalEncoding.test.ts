/**
 * The redundant-encoding gate.
 *
 * HUD-DESIGN.md assigns meaning to hue — amber for bounded uncertainty, red
 * for irreversible loss. A hue alone is not a signal: it is invisible to a
 * red-green colour-vision difference, to a greyscale print of an incident
 * report, and to a failing display. So every rule that says "this state is
 * amber" or "this state is red" must be joined by a rule that says what shape
 * it is.
 *
 * This test derives the list of state selectors from the stylesheets rather
 * than from a hand-kept list, so a new colour-only state fails CI the moment
 * it is written. Selectors whose element already carries its state as text
 * are exempt, and each exemption has to name its redundant channel below.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLESHEETS = [
  "src/styles.css",
  "src/civilization.css",
  "src/lab.css",
  "src/module-bar.css",
  "src/signal.css",
] as const;

/**
 * Hues that carry "something is wrong" in this interface. Teal and bone are
 * deliberately absent: nominal state is the baseline a mark departs from, and
 * requiring a glyph for "fine" would put a symbol on every quiet reading.
 */
const STATE_COLORS = [
  "#ff4f68",
  "#ff6b7c",
  "#ff8a94",
  "#d85955",
  "#ffb456",
  "#ff8b33",
  "#d7a65f",
  "#edb45f",
  "#8c7cff",
  "#d49a50",
];

/**
 * Selectors that set a state colour but need no shape, because the element
 * already states its condition in words. Each entry names that channel.
 */
const TEXT_REDUNDANT: Record<string, string> = {
  ".lb-state b.no-go": "renders the literal text NO-GO",
  ".lb-verdict.no-go b": "renders the literal text NO-GO",
  ".lb-verdict.conditional b": "renders the literal text CONDITIONAL",
  ".cx-state b.conditional": "renders the literal readiness word",
  ".cx-state b.fragile": "renders the literal readiness word",
  ".cx-state b.bootstrapping": "renders the literal readiness word",
  ".cx-verdict.no-go b": "renders the literal text NO-GO",
  ".system-status.warning": "renders SYSTEM <label> beside the mark",
  ".system-status.critical": "renders SYSTEM <label> beside the mark",
  ".local-composition em.isolated": "bar segment labelled with its mode name",
  ".local-composition em.offline": "bar segment labelled with its mode name",
  ".local-composition em.thermal": "bar segment labelled with its mode name",
  ".local-composition em.curtailed": "bar segment labelled with its mode name",
  ".satellite-inspector.isolated .inspection-status > b": "the status word itself",
  ".satellite-inspector.offline .inspection-status > b": "the status word itself",
  ".satellite-inspector.thermal .inspection-status > b": "the status word itself",
  ".satellite-inspector.curtailed .inspection-status > b": "the status word itself",
};

/**
 * Amber is doing two jobs in this interface: HUD-DESIGN.md assigns it to
 * bounded uncertainty, and the HELIOS chassis also uses it as the accent for
 * identity and interaction — section numerals, the active module, a hovered
 * control, a progress fill. Those are not claims about system state, and
 * marking them would put a caution glyph on furniture. Each is listed rather
 * than pattern-matched, so a genuinely new state cannot hide among them.
 */
const ACCENT_NOT_STATE: Record<string, string> = {
  ".module-bar > b": "active module; also marked by <b> and aria-current",
  ".module-bar > a:hover": "pointer interaction, not system state",
  ".module-bar > a:focus-visible": "focus ring, not system state",
  ".section-title span": "panel numeral",
  ".scenario-list button b": "control label",
  ".bearing-control b": "control label",
  ".production-request:hover": "pointer interaction, not system state",
  ".controls .selected": "selection, also marked by the .selected class",
  ".campaign-launch": "primary action button",
  ".campaign-evidence > header b": "panel heading",
  ".campaign-sequence article": "sequence row accent",
  ".campaign-sequence i": "step numeral",
  ".demand-dot": "demand-curve marker; the axis carries the value",
  ".elevator-status i": "progress fill; the adjacent number carries the value",
  ".elevator-status b": "readout label",
  ".horizon-track::before": "the connecting rule between horizons",
};

const REDUNDANCY =
  /(content\s*:\s*var\(--sig-|clip-path\s*:|transform\s*:\s*rotate|border-radius\s*:|repeating-linear-gradient)/;

interface Rule {
  selector: string;
  body: string;
  file: string;
}

function rules(): Rule[] {
  const all: Rule[] = [];
  for (const file of STYLESHEETS) {
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = match[2];
      for (const selector of match[1].split(",")) {
        const trimmed = selector.trim();
        if (trimmed) all.push({ selector: trimmed, body, file });
      }
    }
  }
  return all;
}

describe("signal semantics carry a channel besides colour", () => {
  const all = rules();

  it("finds the stylesheets it is meant to police", () => {
    expect(all.length).toBeGreaterThan(200);
    for (const file of STYLESHEETS) expect(all.some((rule) => rule.file === file)).toBe(true);
  });

  it("defines the shape vocabulary once and loads it on every page", () => {
    const signal = readFileSync("src/signal.css", "utf8");
    for (const token of ["--sig-nominal", "--sig-caution", "--sig-terminal"]) {
      expect(signal).toContain(token);
    }
    // ModuleBar imports base.css on every page, and base.css pulls in the
    // vocabulary — so no page can render without it.
    expect(readFileSync("src/base.css", "utf8")).toContain('@import "./signal.css"');
    expect(readFileSync("src/ModuleBar.tsx", "utf8")).toContain('import "./base.css"');
  });

  it("gives every state colour a shape, a glyph, or a stated word", () => {
    const colored = all.filter(
      (rule) =>
        /(^|[^-])\b(color|background)\s*:/.test(rule.body) &&
        STATE_COLORS.some((hex) => rule.body.toLowerCase().includes(hex)),
    );
    expect(colored.length).toBeGreaterThan(8);

    const undeclared = colored
      .filter((rule) => !(rule.selector in TEXT_REDUNDANT) && !(rule.selector in ACCENT_NOT_STATE))
      .filter(
        (rule) =>
          !all.some((other) => other.selector.startsWith(rule.selector) && REDUNDANCY.test(other.body)),
      )
      .map((rule) => `${rule.file} ${rule.selector}`);

    expect(undeclared, "state colour with no shape, glyph, or documented text channel").toEqual([]);
  });

  it("keeps every exemption pointing at a selector that still exists", () => {
    for (const selector of [...Object.keys(TEXT_REDUNDANT), ...Object.keys(ACCENT_NOT_STATE)]) {
      expect(
        all.some((rule) => rule.selector === selector),
        `stale exemption: ${selector}`,
      ).toBe(true);
    }
  });
});

describe("chart series carry a pattern besides colour", () => {
  it("never draws two data series in the same chart as identical strokes", async () => {
    const { SERIES_DASH } = await import("../src/LabKit");
    const patterns = Object.values(SERIES_DASH);
    // Distinct patterns, including the undefined "solid" baseline.
    expect(new Set(patterns.map(String)).size).toBe(patterns.length);
  });

  it("uses the shared legend wherever a chart names more than one series", () => {
    for (const file of [
      "src/CensusApp.tsx",
      "src/VeritasApp.tsx",
      "src/WatchfloorApp.tsx",
      "src/KesslerApp.tsx",
      "src/ReliquaryApp.tsx",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} should draw its legend with SeriesKey`).toContain("<SeriesKey");
      // A legend drawn as coloured text alone is the failure mode this
      // replaced: an em-dash is the same mark for every series.
      expect(source).not.toMatch(/<text[^>]*>\s*[—-]{1,2}\s*[A-Z]/);
    }
  });
});
