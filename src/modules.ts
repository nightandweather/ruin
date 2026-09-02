export interface ModuleDefinition {
  /** Stable identifier, also used as the Rollup input name. */
  id: string;
  /** HTML entry point, relative to the repository root. */
  page: string;
  /** Link target from any other page of the site. */
  href: string;
  /** Short label shown in the module bar. */
  label: string;
  /** Which shelf of the gateway this laboratory sits on. */
  group: ModuleGroup;
  /** One line describing what an operator does here, for the gateway. */
  blurb: string;
}

export type ModuleGroup = "energy" | "life" | "movement" | "hazard" | "govern" | "campaign";

/** Shelf headings, in the order the gateway presents them. */
export const MODULE_GROUPS: ReadonlyArray<{ id: ModuleGroup; name: string; detail: string }> = [
  { id: "energy", name: "ENERGY AND INDUSTRY", detail: "What generates, refines, and builds" },
  { id: "life", name: "LIFE AND PEOPLE", detail: "What keeps people alive, and who is counted as one" },
  { id: "movement", name: "MOVEMENT", detail: "What crosses the distance, and what it costs" },
  {
    id: "hazard",
    name: "HAZARD AND MEMORY",
    detail: "What accumulates, decays, and has to be recovered from",
  },
  {
    id: "govern",
    name: "GOVERNANCE AND TIME",
    detail: "Who may act, on what evidence, and whether the record is true",
  },
  { id: "campaign", name: "CAMPAIGNS", detail: "Whole civilizations across a century or a light-year" },
];

/**
 * The single source of truth for the RUIN laboratory's executable modules.
 *
 * Adding a module means adding one entry here plus its page, app, and stylesheet.
 * The module bar and the Vite build inputs both read from this list, so no
 * navigation or bundler configuration has to be updated by hand.
 */
export const MODULES: readonly ModuleDefinition[] = [
  {
    id: "helios",
    page: "helios.html",
    href: "./helios.html",
    label: "HELIOS",
    group: "energy",
    blurb: "Operate a 10,000-collector Dyson swarm through partitions, heat, and cascading failure",
  },
  {
    id: "concord",
    page: "concord.html",
    href: "./concord.html",
    label: "CONCORD",
    group: "energy",
    blurb: "Replay one blackout into food and compute, cause by cause, on the state bus",
  },
  {
    id: "foundry",
    page: "foundry.html",
    href: "./foundry.html",
    label: "FOUNDRY",
    group: "energy",
    blurb: "Excavate, refine, machine, and assemble lunar regolith into replacement hardware",
  },
  {
    id: "collector",
    page: "collector.html",
    href: "./collector.html",
    label: "COLLECTOR",
    group: "energy",
    blurb: "Size one collector's wings, radiators, shielding, and orbit against each other",
  },
  {
    id: "datacore",
    page: "datacore.html",
    href: "./datacore.html",
    label: "DATACORE",
    group: "energy",
    blurb: "Schedule verified compute against power, heat, radiation, and link availability",
  },
  {
    id: "agraria",
    page: "agraria.html",
    href: "./agraria.html",
    label: "AGRARIA",
    group: "life",
    blurb: "Turn light, carbon, water, and nutrients into food, oxygen, and a power bill",
  },
  {
    id: "aegis",
    page: "aegis.html",
    href: "./aegis.html",
    label: "AEGIS",
    group: "life",
    blurb: "Design a pressure suit and expose what its mission choice costs everywhere else",
  },
  {
    id: "hygeia",
    page: "hygeia.html",
    href: "./hygeia.html",
    label: "HYGEIA",
    group: "life",
    blurb: "Hold a crew inside a career dose that refuses over-limit assignments outright",
  },
  {
    id: "progenitor",
    page: "progenitor.html",
    href: "./progenitor.html",
    label: "PROGENITOR",
    group: "energy",
    blurb: "Grow a self-producing factory while imports and lineage drift stay explicit",
  },
  {
    id: "gravitas",
    page: "gravitas.html",
    href: "./gravitas.html",
    label: "GRAVITAS",
    group: "life",
    blurb: "Trade habitat radius, RPM, Coriolis, and spin energy for tolerable gravity",
  },
  {
    id: "atlas",
    page: "atlas.html",
    href: "./atlas.html",
    label: "ATLAS",
    group: "movement",
    blurb: "Rotate a heliocentric map of 30 real stars and read the latency to each",
  },
  {
    id: "navis",
    page: "navis.html",
    href: "./navis.html",
    label: "NAVIS",
    group: "movement",
    blurb: "Couple mass, propulsion, heat, comms, and autonomy into one ship that closes",
  },
  {
    id: "ignis",
    page: "ignis.html",
    href: "./ignis.html",
    label: "IGNIS",
    group: "movement",
    blurb: "Admit or refuse a burn against thrust, power, heat, and ignition authority",
  },
  {
    id: "odyssey",
    page: "odyssey.html",
    href: "./odyssey.html",
    label: "ODYSSEY",
    group: "movement",
    blurb: "Fly a beam-powered corridor through diffraction, pointing, and light-time",
  },
  {
    id: "mender",
    page: "mender.html",
    href: "./mender.html",
    label: "MENDER",
    group: "movement",
    blurb: "Hold a repair robot still while it applies the force the job needs",
  },
  {
    id: "corvus",
    page: "corvus.html",
    href: "./corvus.html",
    label: "CORVUS",
    group: "movement",
    blurb: "Keep a civilian drone swarm in quorum, separation, power, and heat",
  },
  {
    id: "kessler",
    page: "kessler.html",
    href: "./kessler.html",
    label: "KESSLER",
    group: "hazard",
    blurb: "Run fifty years of debris cascade in a band where removal is the only sink",
  },
  {
    id: "prometheus",
    page: "prometheus.html",
    href: "./prometheus.html",
    label: "PROMETHEUS",
    group: "energy",
    blurb: "Couple fission heat to survival load, radiators, and nuclear-electric thrust",
  },
  {
    id: "genesis",
    page: "genesis.html",
    href: "./genesis.html",
    label: "GENESIS",
    group: "campaign",
    blurb: "Run a century-scale seed campaign from survey to local self-sufficiency",
  },
  {
    id: "mnemosyne",
    page: "mnemosyne.html",
    href: "./mnemosyne.html",
    label: "MNEMOSYNE",
    group: "life",
    blurb: "Test ten classes of neural evidence without claiming a mind was transferred",
  },
  {
    id: "themis",
    page: "themis.html",
    href: "./themis.html",
    label: "THEMIS",
    group: "govern",
    blurb: "Operate an executive whose authority is an inspectable envelope",
  },
  {
    id: "sentinel",
    page: "sentinel.html",
    href: "./sentinel.html",
    label: "SENTINEL",
    group: "hazard",
    blurb: "Inspect 63 failure-response plans across every executable module",
  },
  {
    id: "watchfloor",
    page: "watchfloor.html",
    href: "./watchfloor.html",
    label: "WATCHFLOOR",
    group: "govern",
    blurb: "Price the operator step every fault-response plan leaves free",
  },
  {
    id: "veritas",
    page: "veritas.html",
    href: "./veritas.html",
    label: "VERITAS",
    group: "govern",
    blurb: "Measure the years between a model becoming wrong and anyone being able to say so",
  },
  {
    id: "census",
    page: "census.html",
    href: "./census.html",
    label: "CENSUS",
    group: "life",
    blurb: "Settle the ledger a survival rate is divided by: who counts as a person",
  },
  {
    id: "chronos",
    page: "chronos.html",
    href: "./chronos.html",
    label: "CHRONOS",
    group: "govern",
    blurb: "Record what happened in what order when no two sites share a present",
  },
  {
    id: "lex",
    page: "lex.html",
    href: "./lex.html",
    label: "LEX",
    group: "govern",
    blurb: "Read an act against six real treaties, and against who can still enforce them",
  },
  {
    id: "concilium",
    page: "concilium.html",
    href: "./concilium.html",
    label: "CONCILIUM",
    group: "govern",
    blurb: "Price every system, give seven worlds economies, and draw the council's seats",
  },
  {
    id: "porta",
    page: "porta.html",
    href: "./porta.html",
    label: "PORTA",
    group: "movement",
    blurb: "Open a transit gate against heat, quorum, and a violation that forks the past",
  },
  {
    id: "valetudo",
    page: "valetudo.html",
    href: "./valetudo.html",
    label: "VALETUDO",
    group: "life",
    blurb: "Allocate scarce beds, and price what the rule in official use costs in lives",
  },
  {
    id: "reliquary",
    page: "reliquary.html",
    href: "./reliquary.html",
    label: "RELIQUARY",
    group: "hazard",
    blurb: "Keep a century of records against media decay, format death, and forgetting",
  },
  {
    id: "horizons",
    page: "horizons.html",
    href: "./horizons.html",
    label: "HORIZONS",
    group: "campaign",
    blurb: "Operate fourteen connected post-stellar systems on one causal map",
  },
  {
    id: "lumen",
    page: "lumen.html",
    href: "./lumen.html",
    label: "LUMEN",
    group: "energy",
    blurb: "Dispatch beamed power through relays that fail closed, and see who browns out",
  },
  {
    id: "ascent",
    page: "ascent.html",
    href: "./ascent.html",
    label: "ASCENT",
    group: "movement",
    blurb: "Move a foundry's output to orbit under custody rules that refuse an unsafe launch",
  },
  {
    id: "ark",
    page: "ark.html",
    href: "./ark.html",
    label: "ARK",
    group: "life",
    blurb: "Run four recycling loops for a year and catch the decline the telemetry reads as nominal",
  },
  {
    id: "prospect",
    page: "prospect.html",
    href: "./prospect.html",
    label: "PROSPECT",
    group: "energy",
    blurb: "Plan a mine on three surveyed deposits where the biggest number is the least measured",
  },
  {
    id: "patron",
    page: "patron.html",
    href: "./patron.html",
    label: "PATRON",
    group: "govern",
    blurb: "Fund 24 honest studies and watch the money, not the data, choose the answer",
  },
  {
    id: "waystation",
    page: "waystation.html",
    href: "./waystation.html",
    label: "WAYSTATION",
    group: "movement",
    blurb: "Run one port shift and learn which faultless vessel the shared queues cost a window",
  },
];

export type ModuleId = (typeof MODULES)[number]["id"];

/**
 * Rollup `build.rollupOptions.input` map.
 *
 * The gateway is not a laboratory and is deliberately absent from `MODULES` —
 * it has no module bar entry of its own — so it is added here by hand.
 */
export const buildInputs = (): Record<string, string> => ({
  gateway: "index.html",
  ...Object.fromEntries(MODULES.map((module) => [module.id, module.page])),
});
