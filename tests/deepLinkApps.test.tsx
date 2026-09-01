// @vitest-environment jsdom
/**
 * Deep links are only worth having if the page actually opens in the state
 * the link names. The helper is unit-tested separately; this suite renders
 * the real interfaces against a real query string, so a link that stops being
 * wired up fails here rather than in a README nobody re-checks.
 */
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { CensusApp } from "../src/CensusApp";
import { VeritasApp } from "../src/VeritasApp";
import { WatchfloorApp } from "../src/WatchfloorApp";

let root: Root | null = null;
let host: HTMLElement | null = null;

function renderAt(search: string, Component: () => React.JSX.Element) {
  window.history.replaceState({}, "", search || "/");
  host = document.createElement("div");
  document.body.appendChild(host);
  act(() => {
    root = createRoot(host!);
    root.render(
      <StrictMode>
        <Component />
      </StrictMode>,
    );
  });
  return host;
}

const activeOption = (element: HTMLElement, index = 0) =>
  [...element.querySelectorAll(".lb-options")][index]?.querySelector("button.active")?.textContent ?? "";
const readiness = (element: HTMLElement) => element.querySelector(".lb-state b")?.textContent ?? "";

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
  window.history.replaceState({}, "", "/");
});

describe("deep-linked opening state", () => {
  it("CENSUS opens on the refused headline when disclosure is switched off", () => {
    const withhold = renderAt("?disclose=off", CensusApp);
    // The glyph prefix comes from CSS, so the text node is the word itself.
    expect(readiness(withhold)).toBe("NO-GO");
    expect(withhold.textContent).toContain("HEADLINE REFUSED");
    expect(withhold.textContent).toContain("PUBLICATION WITHHELD");
  });

  it("CENSUS opens on a policy and an incident named by the link", () => {
    const uniform = renderAt("?policy=uniform&incident=audit", CensusApp);
    expect(activeOption(uniform, 1)).toContain("UNIFORM PRO-RATA");
    expect(uniform.textContent).toContain("External audit published the actual rate");
  });

  it("VERITAS audits the model the link names", () => {
    const ignis = renderAt("?model=ignis-fusion", VeritasApp);
    expect(activeOption(ignis)).toContain("IGNIS FUSION BRANCH");
    expect(ignis.textContent).toContain("SILENT DIVERGENCE REVIEW");
  });

  it("WATCHFLOOR opens on the watch that looks calm and is not", () => {
    const cryWolf = renderAt("?incident=cry-wolf", WatchfloorApp);
    expect(readiness(cryWolf)).toBe("NO-GO");
    expect(cryWolf.textContent).toContain("written off as spurious");
  });

  it("ignores an unknown link and renders the module's own default", () => {
    const bogus = renderAt("?model=does-not-exist&incident=nonsense", VeritasApp);
    expect(activeOption(bogus)).toContain("KESSLER CASCADE");
    const plain = renderAt("", CensusApp);
    expect(readiness(plain)).toBe("CONDITIONAL");
  });
});
