export type EvidenceClass = "demonstrated" | "extrapolated" | "speculative";
export type TechnologyDomain =
  "energy" | "industry" | "mobility" | "communications" | "survivability" | "logistics";

export interface TechnologyNode {
  id: string;
  name: string;
  domain: TechnologyDomain;
  evidence: EvidenceClass;
  prerequisites: readonly string[];
  module: "FOUNDRY" | "HELIOS" | "FLEET" | "GATE" | "SHARED";
  operationalQuestion: string;
  failureMode: string;
}

export const TECHNOLOGY_TREE: readonly TechnologyNode[] = [
  {
    id: "closed-loop-autonomy",
    name: "Closed-loop autonomy",
    domain: "industry",
    evidence: "demonstrated",
    prerequisites: [],
    module: "SHARED",
    operationalQuestion: "Can local controllers remain safe when Earth is unreachable?",
    failureMode: "A delayed command overrides newer local state.",
  },
  {
    id: "in-situ-refining",
    name: "In-situ resource refining",
    domain: "industry",
    evidence: "extrapolated",
    prerequisites: ["closed-loop-autonomy"],
    module: "FOUNDRY",
    operationalQuestion: "Can regolith become certified feedstock without a human laboratory?",
    failureMode: "Contamination silently propagates into every downstream part.",
  },
  {
    id: "machine-replication",
    name: "Partial machine replication",
    domain: "industry",
    evidence: "extrapolated",
    prerequisites: ["in-situ-refining"],
    module: "FOUNDRY",
    operationalQuestion: "Which imported components prevent a factory from reproducing its own capacity?",
    failureMode: "A single scarce component stops exponential growth.",
  },
  {
    id: "rare-material-ledger",
    name: "Rare-material provenance ledger",
    domain: "logistics",
    evidence: "demonstrated",
    prerequisites: ["in-situ-refining"],
    module: "SHARED",
    operationalQuestion: "Can every critical gram be traced from asteroid to installed component?",
    failureMode: "Inventory exists on paper but is stranded or below specification.",
  },
  {
    id: "fusion-grid",
    name: "High-duty fusion grid",
    domain: "energy",
    evidence: "extrapolated",
    prerequisites: ["closed-loop-autonomy"],
    module: "SHARED",
    operationalQuestion: "Can heat rejection and maintenance keep pace with continuous output?",
    failureMode: "The reactor is available while its radiators are not.",
  },
  {
    id: "beamed-power",
    name: "Beamed power network",
    domain: "energy",
    evidence: "extrapolated",
    prerequisites: ["fusion-grid"],
    module: "SHARED",
    operationalQuestion: "Can remote assets share power without creating an unsafe beam corridor?",
    failureMode: "Pointing uncertainty forces the network to fail closed.",
  },
  {
    id: "stellar-collector-grid",
    name: "Stellar collector grid",
    domain: "energy",
    evidence: "speculative",
    prerequisites: ["machine-replication", "beamed-power", "rare-material-ledger"],
    module: "HELIOS",
    operationalQuestion: "Can billions of collectors coordinate without a central clock?",
    failureMode: "Local corrections amplify into a swarm-wide cascade.",
  },
  {
    id: "delay-tolerant-relays",
    name: "Delay-tolerant relay mesh",
    domain: "communications",
    evidence: "demonstrated",
    prerequisites: ["closed-loop-autonomy"],
    module: "SHARED",
    operationalQuestion: "Can commands be authenticated, ordered, and retired across long delays?",
    failureMode: "A valid but stale command is applied twice.",
  },
  {
    id: "interstellar-beacon",
    name: "Interstellar navigation beacon",
    domain: "communications",
    evidence: "extrapolated",
    prerequisites: ["delay-tolerant-relays", "beamed-power"],
    module: "GATE",
    operationalQuestion: "How does a destination publish a trustworthy moving reference frame?",
    failureMode: "Clock drift turns a safe arrival corridor into an occupied one.",
  },
  {
    id: "causal-relay",
    name: "Causality-aware instant relay",
    domain: "communications",
    evidence: "speculative",
    prerequisites: ["interstellar-beacon"],
    module: "GATE",
    operationalQuestion: "What consistency model survives a link that appears instantaneous?",
    failureMode: "Two endpoints both believe they are authoritative.",
  },
  {
    id: "electric-transport",
    name: "High-efficiency electric transport",
    domain: "mobility",
    evidence: "demonstrated",
    prerequisites: ["fusion-grid"],
    module: "FLEET",
    operationalQuestion: "Can a convoy trade transit time against propellant and maintenance?",
    failureMode: "A schedule consumes the reserve needed for collision avoidance.",
  },
  {
    id: "inertial-management",
    name: "Inertial load management",
    domain: "mobility",
    evidence: "extrapolated",
    prerequisites: ["electric-transport", "beamed-power"],
    module: "FLEET",
    operationalQuestion: "Can cargo, radiators, and crew tolerate an emergency maneuver?",
    failureMode: "The ship survives the maneuver while internal systems do not.",
  },
  {
    id: "transit-gate",
    name: "Metric transit gate",
    domain: "mobility",
    evidence: "speculative",
    prerequisites: ["interstellar-beacon", "inertial-management", "causal-relay"],
    module: "GATE",
    operationalQuestion: "Can two endpoints prove that one transit occurred exactly once?",
    failureMode: "Departure commits while arrival cannot be proven.",
  },
  {
    id: "layered-hull",
    name: "Layered radiation and debris hull",
    domain: "survivability",
    evidence: "demonstrated",
    prerequisites: ["rare-material-ledger"],
    module: "FLEET",
    operationalQuestion: "Which layer should be repaired first after an unknown impact?",
    failureMode: "Hidden spall and heat damage outlive the visible breach.",
  },
  {
    id: "adaptive-field",
    name: "Adaptive protective field",
    domain: "survivability",
    evidence: "speculative",
    prerequisites: ["beamed-power", "layered-hull"],
    module: "FLEET",
    operationalQuestion: "How should a limited field budget follow changing hazard directions?",
    failureMode: "Protection saturates or starves life-support power.",
  },
  {
    id: "autonomous-medbay",
    name: "Autonomous medical bay",
    domain: "survivability",
    evidence: "extrapolated",
    prerequisites: ["closed-loop-autonomy", "layered-hull"],
    module: "FLEET",
    operationalQuestion: "Can triage remain explainable when no clinician is reachable?",
    failureMode: "A confident model acts outside its validated envelope.",
  },
  {
    id: "salvage-tug",
    name: "Contactless salvage and capture tug",
    domain: "logistics",
    evidence: "extrapolated",
    prerequisites: ["electric-transport", "delay-tolerant-relays"],
    module: "FLEET",
    operationalQuestion: "Can an uncontrolled object be stabilized without endangering the convoy?",
    failureMode: "Momentum transfer exceeds the tug or docking envelope.",
  },
  {
    id: "guided-capture",
    name: "Guided orbital capture corridor",
    domain: "logistics",
    evidence: "extrapolated",
    prerequisites: ["salvage-tug", "interstellar-beacon"],
    module: "SHARED",
    operationalQuestion: "Can a receiver reject unsafe cargo before it crosses the commitment boundary?",
    failureMode: "Navigation confidence drops after capture becomes irreversible.",
  },
  {
    id: "reconfigurable-fabrication",
    name: "Reconfigurable fabrication cell",
    domain: "industry",
    evidence: "extrapolated",
    prerequisites: ["machine-replication", "rare-material-ledger"],
    module: "FOUNDRY",
    operationalQuestion: "Can one cell change products while preserving calibration and provenance?",
    failureMode: "A reconfiguration creates a plausible but uncertified part.",
  },
];

export interface TechnologyPlan {
  available: readonly TechnologyNode[];
  next: readonly TechnologyNode[];
  blocked: readonly { technology: TechnologyNode; missing: readonly string[] }[];
}

export function planTechnology(completeIds: readonly string[]): TechnologyPlan {
  const complete = new Set(completeIds);
  const available = TECHNOLOGY_TREE.filter((node) => complete.has(node.id));
  const pending = TECHNOLOGY_TREE.filter((node) => !complete.has(node.id));
  const next = pending.filter((node) => node.prerequisites.every((id) => complete.has(id)));
  const blocked = pending
    .filter((node) => !next.includes(node))
    .map((technology) => ({
      technology,
      missing: technology.prerequisites.filter((id) => !complete.has(id)),
    }));
  return { available, next, blocked };
}

export function validateTechnologyTree(nodes: readonly TechnologyNode[] = TECHNOLOGY_TREE): string[] {
  const errors: string[] = [];
  const ids = new Set(nodes.map((node) => node.id));
  if (ids.size !== nodes.length) errors.push("Technology IDs must be unique");
  for (const node of nodes) {
    for (const prerequisite of node.prerequisites) {
      if (!ids.has(prerequisite)) errors.push(`${node.id} references missing prerequisite ${prerequisite}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      errors.push(`Dependency cycle includes ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  };
  for (const node of nodes) visit(node.id);
  return [...new Set(errors)];
}
