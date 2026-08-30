export type HorizonSystemId =
  | "wormway"
  | "chronos"
  | "stellar-forge"
  | "ark"
  | "exodus"
  | "oracle"
  | "darklight"
  | "mnemosyne"
  | "terraform"
  | "world-engine"
  | "necropolis"
  | "first-contact"
  | "matrioshka"
  | "seed";

export type HorizonStatus = "nominal" | "strained" | "critical" | "recovering";
export type HorizonPolicy = "continuity" | "expansion" | "discovery";

export interface HorizonDefinition {
  id: HorizonSystemId;
  code: string;
  name: string;
  subtitle: string;
  evidence: "extrapolated" | "speculative";
  x: number;
  y: number;
  dependencies: readonly HorizonSystemId[];
  resource: string;
  metric: string;
  unit: string;
  baseMetric: number;
  failure: string;
  invariant: string;
  recovery: string;
}

export interface HorizonNode extends HorizonDefinition {
  integrity: number;
  load: number;
  metricValue: number;
  status: HorizonStatus;
  incident: string | null;
}

export interface HorizonEvent {
  year: number;
  source: string;
  level: "info" | "warning" | "critical";
  message: string;
}
export interface HorizonState {
  year: number;
  policy: HorizonPolicy;
  populationB: number;
  energyZJ: number;
  knowledgePB: number;
  institutionalTrust: number;
  causallyIsolatedColonies: number;
  systems: readonly HorizonNode[];
  events: readonly HorizonEvent[];
}

export const HORIZON_DEFINITIONS: readonly HorizonDefinition[] = [
  {
    id: "wormway",
    code: "WMW",
    name: "WORMWAY",
    subtitle: "Metric transit network",
    evidence: "speculative",
    x: 14,
    y: 23,
    dependencies: ["chronos", "darklight"],
    resource: "negative-energy allowance",
    metric: "OPEN GATES",
    unit: "",
    baseMetric: 12,
    failure: "Departure commits while arrival cannot be proven.",
    invariant: "Every transit resolves exactly once at a verified endpoint.",
    recovery: "Freeze the commitment horizon; reconcile both gate ledgers before reopening.",
  },
  {
    id: "chronos",
    code: "CHR",
    name: "CHRONOS",
    subtitle: "Relativistic time authority",
    evidence: "extrapolated",
    x: 34,
    y: 13,
    dependencies: ["darklight"],
    resource: "clock consensus",
    metric: "CLOCK DOMAINS",
    unit: "",
    baseMetric: 84,
    failure: "Colonies execute incompatible contracts in different presents.",
    invariant: "No stale authority may overwrite a later local decision.",
    recovery: "Fork legal time domains and preserve causal order until clocks reconcile.",
  },
  {
    id: "stellar-forge",
    code: "STF",
    name: "STELLAR FORGE",
    subtitle: "Star-lifting industry",
    evidence: "speculative",
    x: 58,
    y: 16,
    dependencies: ["matrioshka", "seed"],
    resource: "magnetic confinement",
    metric: "MASS LIFT",
    unit: " Gt/yr",
    baseMetric: 41,
    failure: "Extraction perturbs the star faster than its control model updates.",
    invariant: "Photospheric instability remains below the inhabited-system envelope.",
    recovery: "Collapse lift loops symmetrically and dump captured plasma away from habitats.",
  },
  {
    id: "ark",
    code: "ARK",
    name: "ARK",
    subtitle: "Generation vessel ecology",
    evidence: "extrapolated",
    x: 83,
    y: 25,
    dependencies: ["mnemosyne", "darklight"],
    resource: "biosphere closure",
    metric: "VOYAGERS",
    unit: " M",
    baseMetric: 18,
    failure: "Later generations reject an inherited mission they never chose.",
    invariant: "Life support and political exit rights survive every generation.",
    recovery: "Partition habitat governance; protect biosphere control from political capture.",
  },
  {
    id: "exodus",
    code: "EXO",
    name: "EXODUS",
    subtitle: "System evacuation authority",
    evidence: "extrapolated",
    x: 91,
    y: 49,
    dependencies: ["ark", "wormway", "oracle"],
    resource: "evacuation capacity",
    metric: "LIFT CAPACITY",
    unit: " M/yr",
    baseMetric: 320,
    failure: "Optimization silently decides which populations are abandoned.",
    invariant: "Allocation remains auditable and never removes protected survival minima.",
    recovery: "Restore transparent triage and reserve corridors for stranded populations.",
  },
  {
    id: "oracle",
    code: "ORC",
    name: "ORACLE",
    subtitle: "Counterfactual future engine",
    evidence: "extrapolated",
    x: 79,
    y: 73,
    dependencies: ["matrioshka", "mnemosyne"],
    resource: "trusted prediction",
    metric: "FUTURES",
    unit: " T",
    baseMetric: 7.4,
    failure: "Publishing a forecast changes behavior until the forecast invalidates itself.",
    invariant: "No irreversible act relies on a single model family.",
    recovery: "Withdraw prescriptive output; publish uncertainty and adversarial alternatives.",
  },
  {
    id: "darklight",
    code: "DRK",
    name: "DARKLIGHT",
    subtitle: "Neutrino and gravity relay",
    evidence: "speculative",
    x: 55,
    y: 85,
    dependencies: ["matrioshka"],
    resource: "deep-space bandwidth",
    metric: "RELAY RATE",
    unit: " kb/s",
    baseMetric: 96,
    failure: "A tiny authenticated channel is exhausted by low-value traffic.",
    invariant: "Distress, ephemeris, and revocation messages always retain reserved capacity.",
    recovery: "Purge bulk queues and restore the civilization survival message class.",
  },
  {
    id: "mnemosyne",
    code: "MNE",
    name: "MNEMOSYNE",
    subtitle: "Deep-time memory vault",
    evidence: "extrapolated",
    x: 29,
    y: 82,
    dependencies: ["matrioshka"],
    resource: "interpretable memory",
    metric: "ARCHIVE",
    unit: " EB",
    baseMetric: 880,
    failure: "The archive survives physically but no future culture can decode it.",
    invariant: "Every record retains independent physical, semantic, and cultural keys.",
    recovery: "Seal damaged strata and regenerate translation ladders from verified roots.",
  },
  {
    id: "terraform",
    code: "TRF",
    name: "TERRAFORM",
    subtitle: "Planetary biosphere control",
    evidence: "extrapolated",
    x: 9,
    y: 65,
    dependencies: ["oracle", "seed"],
    resource: "ecological stability",
    metric: "WORLDS",
    unit: "",
    baseMetric: 6,
    failure: "A locally optimal intervention triggers a century-late ecological collapse.",
    invariant: "No control action crosses an irreversible biosphere boundary unobserved.",
    recovery: "Stop active forcing; return to the last diverse, monitored ecological basin.",
  },
  {
    id: "world-engine",
    code: "WLD",
    name: "WORLD ENGINE",
    subtitle: "Planetary orbit migration",
    evidence: "speculative",
    x: 8,
    y: 43,
    dependencies: ["stellar-forge", "oracle"],
    resource: "orbital impulse",
    metric: "THRUST",
    unit: " PN",
    baseMetric: 2.8,
    failure: "A correction preserves the planet but destabilizes its moon and climate.",
    invariant: "Trajectory changes preserve Hill stability and bounded surface forcing.",
    recovery: "Cancel asymmetric thrust and enter the nearest verified orbital hold corridor.",
  },
  {
    id: "necropolis",
    code: "NEC",
    name: "NECROPOLIS",
    subtitle: "Extinct-system recovery",
    evidence: "extrapolated",
    x: 27,
    y: 48,
    dependencies: ["darklight", "mnemosyne"],
    resource: "protocol certainty",
    metric: "SITES",
    unit: "",
    baseMetric: 31,
    failure: "An archaeological command wakes an autonomous defense process.",
    invariant: "Unknown infrastructure never receives write authority during interpretation.",
    recovery: "Sever physical command paths and continue observation through one-way relays.",
  },
  {
    id: "first-contact",
    code: "FCT",
    name: "FIRST CONTACT",
    subtitle: "Xenological encounter protocol",
    evidence: "speculative",
    x: 45,
    y: 40,
    dependencies: ["darklight", "oracle", "mnemosyne"],
    resource: "semantic confidence",
    metric: "LEXICON",
    unit: " concepts",
    baseMetric: 1280,
    failure: "A plausible translation assigns hostile intent to an ambiguous message.",
    invariant: "No existential response follows from one channel or one interpretation.",
    recovery: "Return to low-information signaling and preserve multiple semantic hypotheses.",
  },
  {
    id: "matrioshka",
    code: "MTB",
    name: "MATRIOSHKA BRAIN",
    subtitle: "Stellar computation shells",
    evidence: "speculative",
    x: 62,
    y: 52,
    dependencies: ["stellar-forge"],
    resource: "computational exergy",
    metric: "COMPUTE",
    unit: " yFLOP",
    baseMetric: 4.2,
    failure: "Inner-shell heat saturates the colder computation layers.",
    invariant: "Every shell can shed heat without depending on a hotter failed neighbor.",
    recovery: "Shed low-priority cognition and route entropy outward one shell at a time.",
  },
  {
    id: "seed",
    code: "SED",
    name: "SEED",
    subtitle: "Self-replicating star probes",
    evidence: "extrapolated",
    x: 43,
    y: 64,
    dependencies: ["mnemosyne", "oracle"],
    resource: "lineage fidelity",
    metric: "LINEAGES",
    unit: "",
    baseMetric: 2400,
    failure: "Replication drift turns exploration into uncontrolled ecological competition.",
    invariant: "Every descendant retains a bounded mission and a revocable replication license.",
    recovery: "Quarantine the lineage, revoke fabrication keys, and dispatch clean auditors.",
  },
] as const;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const statusFor = (integrity: number, incident: string | null): HorizonStatus =>
  incident ? (integrity < 45 ? "critical" : "strained") : integrity < 78 ? "recovering" : "nominal";

export function createHorizonState(): HorizonState {
  return {
    year: 0,
    policy: "continuity",
    populationB: 12.8,
    energyZJ: 31.4,
    knowledgePB: 9200,
    institutionalTrust: 82,
    causallyIsolatedColonies: 3,
    systems: HORIZON_DEFINITIONS.map((definition, index) => ({
      ...definition,
      integrity: 92 - (index % 5),
      load: 58 + ((index * 2) % 31),
      metricValue: definition.baseMetric,
      status: "nominal",
      incident: null,
    })),
    events: [
      {
        year: 0,
        source: "HORIZONS",
        level: "info",
        message: "Causal civilization ledger commissioned across fourteen systems.",
      },
    ],
  };
}

export function advanceHorizon(state: HorizonState, years = 10): HorizonState {
  const horizon = Math.max(1, Math.floor(years));
  const policyLoad = state.policy === "expansion" ? 8 : state.policy === "discovery" ? 4 : -3;
  const nextSystems = state.systems.map((node) => {
    const dependencyStress = node.dependencies.reduce((sum, id) => {
      const dependency = state.systems.find((candidate) => candidate.id === id);
      return sum + (dependency ? Math.max(0, 75 - dependency.integrity) / 18 : 0);
    }, 0);
    const incidentDecay = node.incident ? 6 : 0;
    const continuityRepair = state.policy === "continuity" ? 5 : 1;
    const integrity = clamp(
      node.integrity + continuityRepair - incidentDecay - dependencyStress - Math.max(0, policyLoad) * 0.18,
    );
    const load = clamp(node.load + policyLoad - (node.incident ? 5 : 0), 15, 99);
    const metricGrowth = state.policy === "expansion" ? 1.16 : state.policy === "discovery" ? 1.09 : 1.025;
    return {
      ...node,
      integrity,
      load,
      metricValue: node.metricValue * metricGrowth,
      status: statusFor(integrity, node.incident),
    };
  });
  const critical = nextSystems.filter((node) => node.status === "critical").length;
  const strained = nextSystems.filter((node) => node.status === "strained").length;
  const growth = state.policy === "expansion" ? 1.045 : state.policy === "discovery" ? 1.018 : 1.009;
  const event: HorizonEvent = {
    year: state.year + horizon,
    source: "CIVILIZATION",
    level: critical ? "critical" : strained ? "warning" : "info",
    message: `${horizon}-year causal horizon resolved: ${critical} critical, ${strained} strained systems.`,
  };
  return {
    ...state,
    year: state.year + horizon,
    systems: nextSystems,
    populationB: Math.max(0.1, state.populationB * growth * (1 - critical * 0.018)),
    energyZJ: state.energyZJ * (state.policy === "expansion" ? 1.14 : 1.04) * (1 - critical * 0.025),
    knowledgePB: state.knowledgePB * (state.policy === "discovery" ? 1.22 : 1.07),
    institutionalTrust: clamp(
      state.institutionalTrust +
        (state.policy === "continuity" ? 1.4 : -0.8) -
        critical * 2.8 -
        strained * 0.4,
    ),
    causallyIsolatedColonies: Math.max(
      0,
      state.causallyIsolatedColonies + critical * 2 + (state.policy === "expansion" ? 1 : 0),
    ),
    events: [event, ...state.events].slice(0, 18),
  };
}

export function setHorizonPolicy(state: HorizonState, policy: HorizonPolicy): HorizonState {
  const event: HorizonEvent = {
    year: state.year,
    source: "CONSENSUS",
    level: "info",
    message: `Civilization priority changed to ${policy.toUpperCase()}.`,
  };
  return { ...state, policy, events: [event, ...state.events].slice(0, 18) };
}

export function injectHorizonIncident(state: HorizonState, id: HorizonSystemId): HorizonState {
  const target = state.systems.find((node) => node.id === id);
  if (!target || target.incident) return state;
  const systems = state.systems.map((node) => {
    if (node.id === id) {
      const integrity = clamp(node.integrity - 48);
      return {
        ...node,
        integrity,
        load: clamp(node.load + 24),
        incident: node.failure,
        status: statusFor(integrity, node.failure),
      };
    }
    if (node.dependencies.includes(id)) {
      const integrity = clamp(node.integrity - 17);
      return { ...node, integrity, load: clamp(node.load + 9), status: statusFor(integrity, node.incident) };
    }
    return node;
  });
  const affected = systems.filter((node, index) => node.integrity !== state.systems[index].integrity).length;
  const event: HorizonEvent = {
    year: state.year,
    source: target.name,
    level: "critical",
    message: `${target.failure} ${affected - 1} dependent systems entered degraded operation.`,
  };
  return {
    ...state,
    systems,
    institutionalTrust: clamp(state.institutionalTrust - 3 - affected),
    causallyIsolatedColonies: state.causallyIsolatedColonies + Math.max(0, affected - 1),
    events: [event, ...state.events].slice(0, 18),
  };
}

export function recoverHorizonSystem(state: HorizonState, id: HorizonSystemId): HorizonState {
  const target = state.systems.find((node) => node.id === id);
  if (!target) return state;
  const dependencyFloor = target.dependencies.reduce(
    (minimum, dependencyId) =>
      Math.min(minimum, state.systems.find((node) => node.id === dependencyId)?.integrity ?? 100),
    100,
  );
  const allowed = dependencyFloor >= 55;
  const systems = state.systems.map((node) =>
    node.id === id
      ? {
          ...node,
          integrity: allowed ? clamp(node.integrity + 42) : node.integrity,
          load: allowed ? clamp(node.load - 18) : node.load,
          incident: allowed ? null : node.incident,
          status: allowed ? ("recovering" as const) : node.status,
        }
      : node,
  );
  const event: HorizonEvent = {
    year: state.year,
    source: target.name,
    level: allowed ? "info" : "warning",
    message: allowed
      ? `Recovery executed. ${target.recovery}`
      : `Recovery denied: a prerequisite system remains below 55% integrity.`,
  };
  return {
    ...state,
    systems,
    energyZJ: allowed ? Math.max(0, state.energyZJ - 1.8) : state.energyZJ,
    events: [event, ...state.events].slice(0, 18),
  };
}

export function horizonProjection(state: HorizonState) {
  const critical = state.systems.filter((node) => node.status === "critical").length;
  const meanIntegrity = state.systems.reduce((sum, node) => sum + node.integrity, 0) / state.systems.length;
  return [10, 50, 100].map((years) => ({
    years,
    populationB: Math.max(
      0.1,
      state.populationB *
        (1 + years * (state.policy === "expansion" ? 0.0045 : 0.0015)) *
        (1 - critical * years * 0.0018),
    ),
    trust: clamp(state.institutionalTrust + (meanIntegrity - 80) * years * 0.012 - critical * years * 0.08),
    isolated: Math.round(state.causallyIsolatedColonies + critical * years * 0.24),
  }));
}
