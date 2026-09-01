export interface ModuleDefinition {
  /** Stable identifier, also used as the Rollup input name. */
  id: string;
  /** HTML entry point, relative to the repository root. */
  page: string;
  /** Link target from any other page of the site. */
  href: string;
  /** Short label shown in the module bar. */
  label: string;
}

/**
 * The single source of truth for the RUIN laboratory's executable modules.
 *
 * Adding a module means adding one entry here plus its page, app, and stylesheet.
 * The module bar and the Vite build inputs both read from this list, so no
 * navigation or bundler configuration has to be updated by hand.
 */
export const MODULES: readonly ModuleDefinition[] = [
  { id: "helios", page: "index.html", href: "./", label: "HELIOS" },
  { id: "concord", page: "concord.html", href: "./concord.html", label: "CONCORD" },
  { id: "foundry", page: "foundry.html", href: "./foundry.html", label: "FOUNDRY" },
  { id: "collector", page: "collector.html", href: "./collector.html", label: "COLLECTOR" },
  { id: "datacore", page: "datacore.html", href: "./datacore.html", label: "DATACORE" },
  { id: "agraria", page: "agraria.html", href: "./agraria.html", label: "AGRARIA" },
  { id: "aegis", page: "aegis.html", href: "./aegis.html", label: "AEGIS" },
  { id: "hygeia", page: "hygeia.html", href: "./hygeia.html", label: "HYGEIA" },
  { id: "progenitor", page: "progenitor.html", href: "./progenitor.html", label: "PROGENITOR" },
  { id: "gravitas", page: "gravitas.html", href: "./gravitas.html", label: "GRAVITAS" },
  { id: "atlas", page: "atlas.html", href: "./atlas.html", label: "ATLAS" },
  { id: "navis", page: "navis.html", href: "./navis.html", label: "NAVIS" },
  { id: "ignis", page: "ignis.html", href: "./ignis.html", label: "IGNIS" },
  { id: "odyssey", page: "odyssey.html", href: "./odyssey.html", label: "ODYSSEY" },
  { id: "mender", page: "mender.html", href: "./mender.html", label: "MENDER" },
  { id: "corvus", page: "corvus.html", href: "./corvus.html", label: "CORVUS" },
  { id: "kessler", page: "kessler.html", href: "./kessler.html", label: "KESSLER" },
  { id: "prometheus", page: "prometheus.html", href: "./prometheus.html", label: "PROMETHEUS" },
  { id: "genesis", page: "genesis.html", href: "./genesis.html", label: "GENESIS" },
  { id: "mnemosyne", page: "mnemosyne.html", href: "./mnemosyne.html", label: "MNEMOSYNE" },
  { id: "themis", page: "themis.html", href: "./themis.html", label: "THEMIS" },
  { id: "sentinel", page: "sentinel.html", href: "./sentinel.html", label: "SENTINEL" },
  { id: "watchfloor", page: "watchfloor.html", href: "./watchfloor.html", label: "WATCHFLOOR" },
  { id: "veritas", page: "veritas.html", href: "./veritas.html", label: "VERITAS" },
  { id: "census", page: "census.html", href: "./census.html", label: "CENSUS" },
  { id: "chronos", page: "chronos.html", href: "./chronos.html", label: "CHRONOS" },
  { id: "lex", page: "lex.html", href: "./lex.html", label: "LEX" },
  { id: "reliquary", page: "reliquary.html", href: "./reliquary.html", label: "RELIQUARY" },
  { id: "horizons", page: "horizons.html", href: "./horizons.html", label: "HORIZONS" },
];

export type ModuleId = (typeof MODULES)[number]["id"];

/** Rollup `build.rollupOptions.input` map, derived from the module registry. */
export const buildInputs = (): Record<string, string> =>
  Object.fromEntries(MODULES.map((module) => [module.id, module.page]));
