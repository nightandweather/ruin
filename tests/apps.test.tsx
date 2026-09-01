// @vitest-environment jsdom
/**
 * Smoke-renders every operator interface.
 *
 * The engines under src/*.ts are covered by their own suites; until now no
 * test executed a single component, so a module could ship a page that
 * throws on mount with CI green. Each case renders one app inside
 * StrictMode (double-invoking effects, as the entry points do), asserts the
 * module bar names the module as current, and unmounts cleanly.
 */
import { StrictMode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { MODULES } from "../src/modules";
import { App } from "../src/App";
import { AegisApp } from "../src/AegisApp";
import { AgrariaApp } from "../src/AgrariaApp";
import { AtlasApp } from "../src/AtlasApp";
import { CensusApp } from "../src/CensusApp";
import { ChronosApp } from "../src/ChronosApp";
import { CollectorApp } from "../src/CollectorApp";
import { ConciliumApp } from "../src/ConciliumApp";
import { ConcordApp } from "../src/ConcordApp";
import { CorvusApp } from "../src/CorvusApp";
import { DatacoreApp } from "../src/DatacoreApp";
import { FoundryApp } from "../src/FoundryApp";
import { GenesisApp } from "../src/GenesisApp";
import { GravitasApp } from "../src/GravitasApp";
import { HorizonsApp } from "../src/HorizonsApp";
import { HygeiaApp } from "../src/HygeiaApp";
import { IgnisApp } from "../src/IgnisApp";
import { KesslerApp } from "../src/KesslerApp";
import { LexApp } from "../src/LexApp";
import { MenderApp } from "../src/MenderApp";
import { MnemosyneApp } from "../src/MnemosyneApp";
import { NavisApp } from "../src/NavisApp";
import { OdysseyApp } from "../src/OdysseyApp";
import { ProgenitorApp } from "../src/ProgenitorApp";
import { PrometheusApp } from "../src/PrometheusApp";
import { ReliquaryApp } from "../src/ReliquaryApp";
import { SentinelApp } from "../src/SentinelApp";
import { ThemisApp } from "../src/ThemisApp";
import { VeritasApp } from "../src/VeritasApp";
import { WatchfloorApp } from "../src/WatchfloorApp";

const APPS: Array<{ id: string; Component: () => React.JSX.Element }> = [
  { id: "helios", Component: App },
  { id: "aegis", Component: AegisApp },
  { id: "agraria", Component: AgrariaApp },
  { id: "atlas", Component: AtlasApp },
  { id: "census", Component: CensusApp },
  { id: "chronos", Component: ChronosApp },
  { id: "collector", Component: CollectorApp },
  { id: "concilium", Component: ConciliumApp },
  { id: "concord", Component: ConcordApp },
  { id: "corvus", Component: CorvusApp },
  { id: "datacore", Component: DatacoreApp },
  { id: "foundry", Component: FoundryApp },
  { id: "genesis", Component: GenesisApp },
  { id: "gravitas", Component: GravitasApp },
  { id: "horizons", Component: HorizonsApp },
  { id: "hygeia", Component: HygeiaApp },
  { id: "ignis", Component: IgnisApp },
  { id: "kessler", Component: KesslerApp },
  { id: "lex", Component: LexApp },
  { id: "mender", Component: MenderApp },
  { id: "mnemosyne", Component: MnemosyneApp },
  { id: "navis", Component: NavisApp },
  { id: "odyssey", Component: OdysseyApp },
  { id: "progenitor", Component: ProgenitorApp },
  { id: "prometheus", Component: PrometheusApp },
  { id: "reliquary", Component: ReliquaryApp },
  { id: "sentinel", Component: SentinelApp },
  { id: "themis", Component: ThemisApp },
  { id: "veritas", Component: VeritasApp },
  { id: "watchfloor", Component: WatchfloorApp },
];

let root: Root | null = null;
let host: HTMLElement | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("operator interfaces", () => {
  it("registers every app in the module registry, and vice versa", () => {
    expect(APPS.map((app) => app.id).sort()).toEqual(MODULES.map((module) => module.id).sort());
  });

  for (const { id, Component } of APPS) {
    it(`renders ${id.toUpperCase()} with its module bar marking it current`, () => {
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

      const bar = host.querySelector("nav.module-bar");
      expect(bar, "module bar missing").not.toBeNull();
      expect(bar!.children).toHaveLength(MODULES.length);

      const current = bar!.querySelector('[aria-current="page"]');
      expect(current, "no module marked current").not.toBeNull();
      const label = MODULES.find((module) => module.id === id)!.label;
      expect(current!.textContent).toBe(label);

      // Every other module must be reachable as a link.
      const hrefs = [...bar!.querySelectorAll("a")].map((a) => a.getAttribute("href"));
      expect(hrefs).toHaveLength(MODULES.length - 1);
    });
  }
});
