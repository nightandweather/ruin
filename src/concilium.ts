import { censusConfig, type CensusCohortId } from "./census";
/**
 * CONCILIUM — who can afford the infrastructure, and who decides about it.
 *
 * THEMIS's council has always been a number: nine nodes, five reachable,
 * quorum met. Nodes that never wanted different things. This module gives the
 * council members worlds, and gives the worlds budgets — because a council's
 * power is its jurisdiction times its money, and RUIN has never priced either.
 *
 * The currency is energy. A dollar figure for a Dyson swarm is fake precision
 * of exactly the kind VERITAS exists to catch — there is no price series to
 * extrapolate from and no market that has ever cleared one. Terawatt-years of
 * delivered energy is a unit this repository actually computes, so systems are
 * priced in what it costs to run them and worlds are rich in what they
 * generate.
 *
 * Grounded anchors: none. Every figure below is a RUIN scenario parameter.
 * What is defensible is the *structure* — that capital cost, upkeep, and
 * dependency between systems produce an ownership pattern no world chose, and
 * that the pattern and the population are not the same shape. The numbers are
 * chosen to make that legible, not to predict anything.
 *
 * The non-negotiable invariant is that dependency without exit is not consent.
 * A world that relies on a system it cannot build, and that could not reach
 * the vote in time, is not counted as having agreed. The proposal is refused
 * rather than carried over its silence — the same rule CENSUS applies to an
 * excluded cohort and LEX applies to an unreachable signatory.
 */

export type WorldId = "terra" | "helios" | "ceres" | "jovian" | "kuiper" | "odyssey" | "proxima";
export type SystemId =
  | "foundry"
  | "agraria"
  | "reliquary"
  | "prometheus"
  | "mender"
  | "gravitas"
  | "datacore"
  | "helios-swarm"
  | "odyssey-corridor";
export type SeatBasis = "population" | "counted" | "revenue" | "holdings";
export type ConciliumIncident =
  "none" | "light-lag-vote" | "output-collapse" | "dependency-cascade" | "embargo";

/** What a world sells. Energy is the numéraire; the rest are priced against it. */
export type ResourceId = "energy" | "rare-metals" | "fissile" | "designs" | "manufactures" | "biomass";

/**
 * Price per unit, in terawatt-years of delivered energy.
 *
 * Licensed designs are the highest-margin export and take no mass to ship,
 * which is why the research station is rich at twelve thousand people. Bulk
 * manufactures are the lowest margin and the largest volume, which is why the
 * world with nine billion people is not.
 */
export const RESOURCE_PRICE: Record<ResourceId, number> = {
  energy: 1,
  "rare-metals": 3.2,
  fissile: 2.6,
  designs: 4.5,
  manufactures: 1.8,
  biomass: 1.4,
};

export const RESOURCE_META: Record<ResourceId, { name: string; detail: string }> = {
  energy: { name: "ENERGY", detail: "Delivered power; the unit everything else is priced in" },
  "rare-metals": { name: "RARE METALS", detail: "Refined actinide-free alloys and trace metals" },
  fissile: { name: "FISSILE", detail: "Enriched fuel and separated actinides" },
  designs: {
    name: "LICENSED DESIGNS",
    detail: "Certified engineering, sold by the copy and shipped as bits",
  },
  manufactures: { name: "MANUFACTURES", detail: "Finished goods everyone uses and nobody prices highly" },
  biomass: { name: "BIOMASS", detail: "Closed-loop food and life-support stock" },
};

export interface World {
  id: WorldId;
  name: string;
  detail: string;
  /** Distance from the council seat, in light-seconds. */
  distanceLs: number;
  population: number;
  /**
   * Which CENSUS cohorts live here. A world is not one kind of person, and the
   * "counted" seat basis only counts the cohorts the personhood definition
   * admits — so amending the definition moves the council without a vote.
   */
  cohorts: CensusCohortId[];
  /** Annual production by resource. Energy is in TW; the rest in TW-year units. */
  produces: Partial<Record<ResourceId, number>>;
}

export interface CivSystem {
  id: SystemId;
  name: string;
  module: string;
  /** Capital cost in terawatt-years of delivered energy. */
  capitalTWy: number;
  /** Continuous draw once operating, in terawatts. */
  upkeepTW: number;
  /** Systems that must already be owned before this one can be built. */
  requires: SystemId[];
  /**
   * Resources the build consumes. Money is not enough: a world that cannot
   * produce or import rare metals cannot build a collector swarm at any price,
   * which is what makes the extraction world a chokepoint rather than a market.
   */
  inputs: ResourceId[];
}

/**
 * Seven worlds, at the distances CHRONOS uses, with populations and the α Cen
 * landfall taken from the Season 02 canon.
 *
 * The asymmetry is the whole subject: most of the species lives on the world
 * that generates almost nothing, and the world that generates almost
 * everything is a station of a quarter of a million people.
 */
export const WORLDS: readonly World[] = [
  {
    id: "terra",
    name: "TERRA HOLDFAST",
    detail: "Most of the species, and the goods everyone uses at the lowest margin in the system",
    distanceLs: 1.28,
    population: 3_900_000,
    cohorts: ["charter", "contract", "stateless"],
    produces: { energy: 40, manufactures: 22, biomass: 14 },
  },
  {
    id: "helios",
    name: "HELIOS STATION",
    detail: "A quarter of a million people operating the swarm they own",
    distanceLs: 299.4,
    population: 240_000,
    cohorts: ["charter", "contract"],
    produces: { energy: 3_400 },
  },
  {
    id: "ceres",
    name: "CERES EXTRACTION",
    detail: "Fifty thousand miners holding the only rare-metal stream anyone can reach",
    distanceLs: 1_250,
    population: 54_000,
    cohorts: ["contract", "stateless"],
    produces: { energy: 9, "rare-metals": 46 },
  },
  {
    id: "jovian",
    name: "JOVIAN WAYSTATION",
    detail: "Transfer port and separation plant; enriched fuel and everyone's traffic",
    distanceLs: 2_095.8,
    population: 86_000,
    cohorts: ["charter", "contract"],
    produces: { energy: 90, fissile: 31 },
  },
  {
    id: "kuiper",
    name: "KUIPER RESEARCH",
    detail: "Twelve thousand people selling certified engineering, eleven hours out",
    distanceLs: 19_960.2,
    population: 12_000,
    cohorts: ["charter", "forks"],
    produces: { energy: 6, designs: 28 },
  },
  {
    id: "odyssey",
    name: "ODYSSEY CONVOY",
    detail: "In transit on stored power, still licensing what it works out on the way",
    distanceLs: 3.787e7,
    population: 41_000,
    cohorts: ["sleepers", "forks"],
    produces: { energy: 18, designs: 7 },
  },
  {
    id: "proxima",
    name: "α CEN LANDFALL",
    detail: "Four light-years out, with no neighbour close enough to buy from",
    distanceLs: 1.3717e8,
    population: 38_000,
    cohorts: ["unchartered", "charter"],
    produces: { energy: 2.5, biomass: 5 },
  },
];

/**
 * What each of RUIN's systems costs to own. Dependencies are the reason a
 * budget is not the whole story: a world can be rich enough for a datacore
 * and still unable to hold one, because it cannot build the swarm that feeds it.
 */
export const SYSTEMS: readonly CivSystem[] = [
  {
    id: "reliquary",
    name: "CENTURY ARCHIVE",
    module: "RELIQUARY",
    capitalTWy: 25,
    upkeepTW: 0.4,
    requires: [],
    inputs: ["designs"],
  },
  {
    id: "agraria",
    name: "CROP DECKS",
    module: "AGRARIA",
    capitalTWy: 60,
    upkeepTW: 3,
    requires: [],
    inputs: ["biomass"],
  },
  {
    id: "prometheus",
    name: "FISSION PLANT",
    module: "PROMETHEUS",
    capitalTWy: 90,
    upkeepTW: 2,
    requires: [],
    inputs: ["fissile"],
  },
  {
    id: "foundry",
    name: "SURFACE FOUNDRY",
    module: "FOUNDRY",
    capitalTWy: 180,
    upkeepTW: 4,
    requires: [],
    inputs: ["rare-metals"],
  },
  {
    id: "mender",
    name: "REPAIR FLEET",
    module: "MENDER",
    capitalTWy: 45,
    upkeepTW: 1.5,
    requires: ["foundry"],
    inputs: ["manufactures"],
  },
  {
    id: "gravitas",
    name: "ROTATING HABITAT",
    module: "GRAVITAS",
    capitalTWy: 220,
    upkeepTW: 6,
    requires: ["foundry"],
    inputs: ["manufactures", "biomass"],
  },
  {
    id: "helios-swarm",
    name: "COLLECTOR SWARM",
    module: "HELIOS",
    capitalTWy: 12_000,
    upkeepTW: 30,
    requires: ["foundry"],
    inputs: ["rare-metals"],
  },
  {
    id: "datacore",
    name: "ORBITAL DATACORE",
    module: "DATACORE",
    capitalTWy: 400,
    upkeepTW: 25,
    requires: ["helios-swarm"],
    inputs: ["designs", "rare-metals"],
  },
  {
    id: "odyssey-corridor",
    name: "BEAM CORRIDOR",
    module: "ODYSSEY",
    capitalTWy: 3_000,
    upkeepTW: 40,
    requires: ["helios-swarm"],
    inputs: ["designs", "rare-metals"],
  },
];

export interface Proposal {
  id: string;
  name: string;
  detail: string;
  /** The system the proposal is about, if any. */
  system: SystemId | null;
  irreversible: boolean;
}

export const PROPOSALS: readonly Proposal[] = [
  {
    id: "expand-swarm",
    name: "EXPAND THE SWARM",
    detail: "More collectors: the owner captures the output, everyone shares the debris band",
    system: "helios-swarm",
    irreversible: true,
  },
  {
    id: "fund-archive",
    name: "FUND THE ARCHIVE",
    detail: "A century archive held in common, paid for in common",
    system: "reliquary",
    irreversible: false,
  },
  {
    id: "meter-the-beam",
    name: "METER THE BEAM CORRIDOR",
    detail: "Price the corridor its owner already controls",
    system: "odyssey-corridor",
    irreversible: false,
  },
  {
    id: "evacuate-outer",
    name: "EVACUATE THE OUTER SETTLEMENTS",
    detail: "Withdraw support past the Kuiper line",
    system: null,
    irreversible: true,
  },
];

export interface ConciliumConfig {
  /** Which cohorts the definition admits. Defaults to CENSUS's own roll. */
  roll: Record<CensusCohortId, boolean>;
  proposal: string;
  seatBasis: SeatBasis;
  /** Years of surplus a world may commit to capital projects. */
  accumulationYears: number;
  /** Round-trip years within which a world can source an input by trade. */
  tradeWindowYears: number;
  /** Share of output a world can divert from survival into capital. */
  investableFraction: number;
  /** How long the vote stays open, in years of council time. */
  voteWindowYears: number;
  incident: ConciliumIncident;
}

const LY_LS = 3.15576e7;

/**
 * The personhood definition the council is drawn against.
 *
 * CONCILIUM reads CENSUS's default roll rather than keeping its own, so the
 * two cannot disagree about who exists. Passing a different roll is how a
 * campaign runner replays a council under an amended definition.
 */
export const defaultRoll = (): Record<CensusCohortId, boolean> => censusConfig().counted;
/** Output retained by the richest world under `output-collapse` (scenario). */
const COLLAPSE_RETAINED = 0.15;
/** Share of seats needed to carry. */
export const CARRY_THRESHOLD = 0.5;

export function conciliumConfig(): ConciliumConfig {
  return {
    roll: defaultRoll(),
    proposal: "expand-swarm",
    seatBasis: "revenue",
    accumulationYears: 40,
    tradeWindowYears: 1,
    investableFraction: 0.3,
    voteWindowYears: 10,
    incident: "none",
  };
}

export type Vote = "for" | "against" | "abstain" | "unreachable";

export interface WorldStanding {
  world: World;
  outputTW: number;
  /** Everything the world sells, priced in terawatt-years. */
  revenueTWy: number;
  /** Share of this world's people the personhood definition admits. */
  countedFraction: number;
  /** Resources it can obtain: its own production plus reachable trade. */
  access: ResourceId[];
  /** Resources it needs for the systems it could otherwise afford. */
  missing: ResourceId[];
  /** Capital the world can commit over the accumulation horizon. */
  budgetTWy: number;
  owns: SystemId[];
  /** Systems it could pay for but cannot hold, for want of input or prerequisite. */
  blocked: SystemId[];
  /** Systems it could pay for and cannot run: generation, not capital, is short. */
  upkeepBlocked: SystemId[];
  selfSufficient: boolean;
  /** Relies on the proposal's system without owning it. */
  dependent: boolean;
  roundTripYears: number;
  reachable: boolean;
  seatShare: number;
  populationShare: number;
  vote: Vote;
}

/**
 * What a world can hold, given a budget and the dependency graph.
 *
 * Systems are considered cheapest-first within dependency order, so a world
 * buys the foundry that unlocks the rest before it buys a habitat. Upkeep is
 * checked against generation as well as capital against savings: a world can
 * be rich enough to build something it cannot afford to run.
 */
function portfolio(
  budgetTWy: number,
  outputTW: number,
  access: readonly ResourceId[],
): {
  owns: SystemId[];
  blocked: SystemId[];
  missing: ResourceId[];
  /** Systems refused for want of generation rather than for want of capital. */
  upkeepBlocked: SystemId[];
} {
  const owns: SystemId[] = [];
  const blocked: SystemId[] = [];
  const upkeepBlocked: SystemId[] = [];
  const missing = new Set<ResourceId>();
  let capital = budgetTWy;
  let upkeep = outputTW;
  // Dependency depth first, then cost — a deterministic, explainable order.
  const depth = (system: CivSystem): number =>
    system.requires.reduce(
      (deepest, id) => Math.max(deepest, 1 + depth(SYSTEMS.find((s) => s.id === id)!)),
      0,
    );
  const ordered = [...SYSTEMS].sort(
    (a, b) => depth(a) - depth(b) || a.capitalTWy - b.capitalTWy || (a.id < b.id ? -1 : 1),
  );
  for (const system of ordered) {
    const canPay = system.capitalTWy <= capital;
    const short = system.inputs.filter((input) => !access.includes(input));
    if (short.length > 0) {
      // Money is not the binding constraint here, and the register should not
      // let that read as poverty. The world simply cannot get the material.
      if (canPay) {
        blocked.push(system.id);
        for (const input of short) missing.add(input);
      }
      continue;
    }
    if (!system.requires.every((id) => owns.includes(id))) {
      if (canPay) blocked.push(system.id);
      continue;
    }
    if (!canPay) continue;
    if (system.upkeepTW > upkeep) {
      // Bought and unusable: the distinction the council keeps missing.
      upkeepBlocked.push(system.id);
      continue;
    }
    owns.push(system.id);
    capital -= system.capitalTWy;
    upkeep -= system.upkeepTW;
  }
  return { owns, blocked, missing: [...missing], upkeepBlocked };
}

export function evaluateConcilium(c: ConciliumConfig) {
  const proposal = PROPOSALS.find((p) => p.id === c.proposal) ?? PROPOSALS[0];
  const collapse = c.incident === "output-collapse";
  const cascade = c.incident === "dependency-cascade";
  const lagVote = c.incident === "light-lag-vote";
  const voteWindow = lagVote ? Math.min(c.voteWindowYears, 1e-4) : Math.max(0, c.voteWindowYears);

  const embargo = c.incident === "embargo";
  const tradeWindow = Math.max(0, c.tradeWindowYears);
  const roundTrip = (world: World) => (2 * world.distanceLs) / LY_LS;

  const production = (world: World): Partial<Record<ResourceId, number>> =>
    collapse && world.id === "helios"
      ? { ...world.produces, energy: (world.produces.energy ?? 0) * COLLAPSE_RETAINED }
      : world.produces;

  /**
   * A resource is available to a world if it makes it, or if a world that
   * makes it is close enough to ship from inside the trade window. Distance,
   * not price, is what puts the α Cen landfall out of the market.
   */
  const accessFor = (world: World): ResourceId[] => {
    const own = Object.keys(production(world)) as ResourceId[];
    const imported = WORLDS.filter((partner) => {
      if (partner.id === world.id) return false;
      // An embargo withholds the chokepoint stream from everyone else.
      if (embargo && partner.id === "ceres") return false;
      const separation = Math.abs(partner.distanceLs - world.distanceLs);
      return (2 * separation) / LY_LS <= tradeWindow;
    }).flatMap((partner) => Object.keys(production(partner)) as ResourceId[]);
    return [...new Set([...own, ...imported])].filter(
      (r) => (production(world)[r] ?? 0) > 0 || imported.includes(r),
    );
  };

  const standings: WorldStanding[] = WORLDS.map((world) => {
    const produced = production(world);
    const outputTW = produced.energy ?? 0;
    const revenueTWy = (Object.entries(produced) as Array<[ResourceId, number]>).reduce(
      (sum, [resource, amount]) => sum + amount * RESOURCE_PRICE[resource],
      0,
    );
    const access = accessFor(world);
    const budgetTWy =
      revenueTWy * Math.max(0, c.accumulationYears) * Math.min(1, Math.max(0, c.investableFraction));
    let { owns, blocked, missing, upkeepBlocked } = portfolio(budgetTWy, outputTW, access);
    // A prerequisite failure takes the dependent holdings with it: the world
    // did not become poorer, it became unable to keep what it had.
    if (cascade) {
      const lost = SYSTEMS.filter(
        (sys) => sys.requires.includes("foundry") || sys.requires.includes("helios-swarm"),
      );
      blocked = [...blocked, ...owns.filter((id) => lost.some((sys) => sys.id === id))];
      owns = owns.filter((id) => !lost.some((sys) => sys.id === id));
    }
    const roundTripYears = roundTrip(world);
    // The counted population is the people the definition admits: a world of
    // sleepers and forks can be fully alive and mostly invisible to a council
    // drawn from the roll.
    const countedFraction =
      world.cohorts.length > 0
        ? world.cohorts.filter((cohort) => c.roll[cohort]).length / world.cohorts.length
        : 0;
    return {
      world,
      outputTW,
      revenueTWy,
      countedFraction,
      access,
      missing,
      budgetTWy,
      owns,
      blocked,
      upkeepBlocked,
      selfSufficient: owns.length === SYSTEMS.length,
      dependent: proposal.system !== null && !owns.includes(proposal.system),
      roundTripYears,
      reachable: roundTripYears <= voteWindow,
      seatShare: 0,
      populationShare: 0,
      vote: "abstain" as Vote,
    };
  });

  const totalPopulation = standings.reduce((sum, s) => sum + s.world.population, 0);
  const totalOutput = standings.reduce((sum, s) => sum + s.outputTW, 0);
  const totalRevenue = standings.reduce((sum, s) => sum + s.revenueTWy, 0);
  const countedTotal = standings.reduce((sum, s) => sum + s.world.population * s.countedFraction, 0);
  const totalHoldings = standings.reduce((sum, s) => sum + s.owns.length, 0);
  for (const standing of standings) {
    standing.populationShare = standing.world.population / Math.max(1, totalPopulation);
    standing.seatShare =
      c.seatBasis === "population"
        ? standing.populationShare
        : c.seatBasis === "counted"
          ? (standing.world.population * standing.countedFraction) / Math.max(1, countedTotal)
          : c.seatBasis === "revenue"
            ? standing.outputTW / Math.max(1e-9, totalOutput)
            : standing.owns.length / Math.max(1, totalHoldings);
  }

  // A world votes for a proposal about a system it owns — it captures the
  // benefit. It votes against one about a system it depends on and does not
  // own — it pays without controlling. Unaffected worlds abstain.
  for (const standing of standings) {
    if (!standing.reachable) {
      standing.vote = "unreachable";
    } else if (proposal.system === null) {
      // The evacuation proposal: the worlds being withdrawn from vote against.
      standing.vote = standing.world.distanceLs > 1e4 ? "against" : "for";
    } else if (standing.owns.includes(proposal.system)) {
      standing.vote = "for";
    } else if (standing.blocked.includes(proposal.system) || standing.owns.length > 0) {
      standing.vote = "against";
    } else {
      standing.vote = "abstain";
    }
  }

  const participating = standings.filter((s) => s.reachable && s.vote !== "abstain");
  const participatingSeats = participating.reduce((sum, s) => sum + s.seatShare, 0);
  const forSeats = participating.filter((s) => s.vote === "for").reduce((sum, s) => sum + s.seatShare, 0);
  const forShare = participatingSeats > 0 ? forSeats / participatingSeats : 0;
  const carried = forShare > CARRY_THRESHOLD;

  // INVARIANT: dependency without exit is not consent. A world bound by the
  // outcome, dependent on the system, and unable to reach the vote has not
  // agreed to anything, and the proposal cannot be carried over its silence.
  const silenced = standings.filter((s) => !s.reachable && s.dependent);
  const consentValid = silenced.length === 0;

  /**
   * Total variation between who is affected and who is represented — half the
   * summed absolute difference between population share and seat share.
   */
  const representationGap =
    standings.reduce((sum, s) => sum + Math.abs(s.seatShare - s.populationShare), 0) / 2;

  /**
   * A resource only one world produces is a chokepoint: everyone else holds
   * their portfolio at that world's discretion, whatever their budget says.
   */
  const chokepoints = (Object.keys(RESOURCE_PRICE) as ResourceId[])
    .map((resource) => ({
      resource,
      suppliers: WORLDS.filter((w) => (w.produces[resource] ?? 0) > 0).map((w) => w.name),
    }))
    .filter((entry) => entry.suppliers.length === 1);

  /**
   * Worlds whose portfolio is capped by generation rather than by savings —
   * the extraction world sells the alloys the swarm is made of and cannot
   * power a foundry of its own. Money is not the same resource as watts.
   */
  const upkeepBound = standings.filter((s) => s.upkeepBlocked.length > 0);

  const selfSufficient = standings.filter((s) => s.selfSufficient);
  const dependent = standings.filter((s) => s.dependent);
  const outcome = !consentValid ? "REFUSED" : carried ? "CARRIED" : "FAILED";

  const constraints = [
    ...(silenced.length > 0
      ? [
          `${silenced.map((s) => s.world.name).join(", ")} depend on this system and could not reach the vote; dependency without exit is not consent`,
        ]
      : []),
    ...(representationGap > 0.5
      ? [
          `Representation gap ${(representationGap * 100).toFixed(1)} pt: seats and people are not the same shape`,
        ]
      : []),
    ...(selfSufficient.length <= 1
      ? [
          `${selfSufficient.length} world can build the whole civilization alone; the rest hold what they were left`,
        ]
      : []),
    ...(dependent.length > 0 && proposal.system !== null
      ? [`${dependent.length} world(s) rely on ${proposal.system} without owning it`]
      : []),
    ...chokepoints.map(
      (entry) =>
        `${RESOURCE_META[entry.resource].name} comes from ${entry.suppliers[0]} alone; every other world holds its portfolio at that world's discretion`,
    ),
    ...upkeepBound.map(
      (s) =>
        `${s.world.name} can pay for ${s.upkeepBlocked.length} system(s) it cannot run: ${s.budgetTWy.toFixed(0)} TW·yr of capital against ${s.outputTW} TW of generation`,
    ),
    ...(c.seatBasis === "counted" && standings.some((s) => s.countedFraction < 1)
      ? [
          `Seats drawn from the counted roll: ${
            standings
              .filter((s) => s.countedFraction < 0.5)
              .map((s) => s.world.name)
              .join(", ") || "no world"
          } mostly outside the definition`,
        ]
      : []),
    ...(embargo
      ? ["Rare-metal embargo: no world outside Ceres can build or replace a foundry, at any budget"]
      : []),
    ...(collapse ? ["Richest world's revenue cut to 15%; seats move with it under a revenue basis"] : []),
    ...(cascade ? ["Prerequisite failure: dependent holdings lost across every world that had them"] : []),
    ...(lagVote ? [`Vote window shortened to ${voteWindow} yr; the outer worlds cannot answer`] : []),
  ];

  const readiness = !consentValid ? "NO-GO" : constraints.length > 0 ? "CONDITIONAL" : "GO";
  const safeMode = !consentValid
    ? "CONSENT NOT ESTABLISHED"
    : carried && proposal.irreversible
      ? "IRREVERSIBLE ACT CARRIED"
      : carried
        ? "CARRIED"
        : "PROPOSAL FAILED";

  return {
    proposal,
    standings,
    totalPopulation,
    totalOutput,
    totalRevenue,
    chokepoints,
    forShare,
    carried,
    consentValid,
    silenced: silenced.map((s) => s.world.name),
    representationGap,
    selfSufficientCount: selfSufficient.length,
    upkeepBound: upkeepBound.map((s) => s.world.name),
    dependentCount: dependent.length,
    outcome,
    readiness,
    safeMode,
    constraints,
  } as const;
}
