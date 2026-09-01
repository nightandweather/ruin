/**
 * The civilization state bus — first slice: the power ledger.
 *
 * A ruin-state/1 document is the shared, deterministic world that modules
 * read from and write to without importing each other's engines. Producers
 * post supply, consumers post demand, and a settlement pass turns them into
 * allocations under one explicit policy. Modules never meet; they meet the
 * ledger.
 *
 * Bus invariants (enforced here, not advised):
 * 1. CONSERVATION — allocations never exceed supply; settlement that would
 *    create power from nothing is impossible by construction, and
 *    `assertPowerConservation` rejects any hand-built document that tries.
 * 2. DETERMINISM — settlement is a pure function of the document; the same
 *    world settles identically every time.
 * 3. EXPLICIT PRIORITY — when supply cannot cover demand, survival load is
 *    served before discretionary load, in a declared order rather than a
 *    hidden one. Curtailment is visible in the ledger, not silent.
 * 4. AUTHORITY IS MONOTONE — the authority ledger only ever narrows. A module
 *    can post a restriction; nothing on the bus can widen one. Settlement
 *    returns the most restrictive claim posted, so an executive reading the
 *    bus cannot be talked into more authority by adding modules to it.
 *
 * See concepts/civilization-state-bus.md for the full architecture.
 */

export const STATE_FORMAT = "ruin-state/1" as const;

export interface PowerLedger {
  unit: "MW";
  /** Producer module id → MW offered this tick. */
  supply: Record<string, number>;
  /** Consumer module id → MW requested this tick. */
  demand: Record<string, number>;
  /** Consumer module id → MW granted by settlement. Empty until settled. */
  allocations: Record<string, number>;
  /**
   * Consumers served in this order; earlier entries are survival load.
   * Consumers absent from the list are served last, alphabetically.
   */
  priority: string[];
}

/**
 * What a module's own state permits the executive to do.
 *
 * Ordered from permissive to restrictive; settlement takes the maximum, so a
 * single module in trouble narrows the whole civilization's envelope. That
 * asymmetry is the point: the modules that know something is wrong are the
 * ones with standing to restrict, and no quorum of comfortable modules can
 * outvote them.
 */
export type AuthorityLimit = "none" | "no-irreversible" | "advisory-only" | "hold";

/** Restrictiveness order. Settlement is `max` over this scale. */
export const AUTHORITY_ORDER: readonly AuthorityLimit[] = [
  "none",
  "no-irreversible",
  "advisory-only",
  "hold",
];

export interface AuthorityClaim {
  limit: AuthorityLimit;
  /** Why this module is restricting, in the operator's language. */
  reason: string;
}

export interface AuthorityLedger {
  /** Module id → the restriction that module's own state imposes. */
  claims: Record<string, AuthorityClaim>;
  /** Settled envelope: the most restrictive claim posted. Null until settled. */
  envelope: { limit: AuthorityLimit; source: string; reason: string } | null;
}

export interface CivilizationState {
  format: typeof STATE_FORMAT;
  seed: number;
  tick: number;
  ledgers: { power: PowerLedger; authority: AuthorityLedger };
  /** Opaque module snapshots, keyed by module id. Modules read only their own. */
  snapshots: Record<string, unknown>;
}

export function createState(seed: number, tick: number): CivilizationState {
  return {
    format: STATE_FORMAT,
    seed,
    tick,
    ledgers: {
      power: { unit: "MW", supply: {}, demand: {}, allocations: {}, priority: [] },
      authority: { claims: {}, envelope: null },
    },
    snapshots: {},
  };
}

export type StateValidation = { ok: true; state: CivilizationState } | { ok: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNonNegativeMap = (value: unknown): value is Record<string, number> =>
  isRecord(value) && Object.values(value).every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0);

export function validateState(value: unknown): StateValidation {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["State must be a JSON object"] };
  if (value.format !== STATE_FORMAT)
    errors.push(`format must be "${STATE_FORMAT}", got ${JSON.stringify(value.format)}`);
  if (!Number.isInteger(value.seed)) errors.push("seed must be an integer");
  if (!Number.isInteger(value.tick) || Number(value.tick) < 0)
    errors.push("tick must be a non-negative integer");
  const ledgers = isRecord(value.ledgers) ? value.ledgers : undefined;
  const power = ledgers && isRecord(ledgers.power) ? ledgers.power : undefined;
  if (!power) {
    errors.push("ledgers.power is required");
  } else {
    if (power.unit !== "MW") errors.push('power ledger unit must be "MW"');
    for (const key of ["supply", "demand", "allocations"] as const)
      if (!isFiniteNonNegativeMap(power[key]))
        errors.push(`power.${key} must map module ids to finite non-negative numbers`);
    if (!Array.isArray(power.priority) || power.priority.some((p) => typeof p !== "string"))
      errors.push("power.priority must be an array of module ids");
  }
  if (value.snapshots !== undefined && !isRecord(value.snapshots))
    errors.push("snapshots must be an object when present");
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, state: value as unknown as CivilizationState };
}

/** INVARIANT 1 — rejects any document whose allocations exceed its supply. */
export function assertPowerConservation(state: CivilizationState): void {
  const ledger = state.ledgers.power;
  const supplied = Object.values(ledger.supply).reduce((sum, v) => sum + v, 0);
  const allocated = Object.values(ledger.allocations).reduce((sum, v) => sum + v, 0);
  if (allocated > supplied + 1e-9)
    throw new Error(
      `Power conservation violated: ${allocated.toFixed(3)} MW allocated from ${supplied.toFixed(3)} MW supplied`,
    );
  for (const [consumer, granted] of Object.entries(ledger.allocations))
    if (granted > (ledger.demand[consumer] ?? 0) + 1e-9)
      throw new Error(`Allocation to "${consumer}" exceeds its own demand`);
}

/**
 * Settle the power ledger: serve consumers in priority order until supply
 * runs out. Pure — returns a new state; the input is never mutated.
 */
export function settlePowerLedger(state: CivilizationState): CivilizationState {
  const ledger = state.ledgers.power;
  const listed = ledger.priority.filter((consumer) => consumer in ledger.demand);
  const unlisted = Object.keys(ledger.demand)
    .filter((consumer) => !ledger.priority.includes(consumer))
    .sort();
  const order = [...listed, ...unlisted];

  let remaining = Object.values(ledger.supply).reduce((sum, v) => sum + v, 0);
  const allocations: Record<string, number> = {};
  for (const consumer of order) {
    // Full precision, no rounding: fc-driven fuzzing caught toFixed(6)
    // rounding a 5e-7 MW grant UP past a 5e-7 MW supply — a settlement
    // that invents half a microwatt would eventually invent a reactor.
    const granted = Math.min(ledger.demand[consumer], remaining);
    allocations[consumer] = granted;
    remaining -= granted;
  }

  const settled: CivilizationState = {
    ...state,
    ledgers: { ...state.ledgers, power: { ...ledger, allocations } },
  };
  assertPowerConservation(settled);
  return settled;
}

/** Rank of a limit on the restrictiveness scale. */
export const authorityRank = (limit: AuthorityLimit): number => AUTHORITY_ORDER.indexOf(limit);

/**
 * INVARIANT 4: a settled envelope is never less restrictive than the strictest
 * claim on the bus. Rejects any hand-built document that tries.
 */
export function assertAuthorityMonotone(state: CivilizationState): void {
  const ledger = state.ledgers.authority;
  if (!ledger.envelope) return;
  for (const [module, claim] of Object.entries(ledger.claims)) {
    if (authorityRank(ledger.envelope.limit) < authorityRank(claim.limit)) {
      throw new Error(
        `Authority widened past a posted restriction: "${module}" requires ${claim.limit}, envelope is ${ledger.envelope.limit}`,
      );
    }
  }
}

/**
 * Settle the authority ledger: the envelope is the most restrictive claim, and
 * it names the module that made it. Ties break by module id so the attribution
 * is deterministic rather than dependent on insertion order.
 */
export function settleAuthority(state: CivilizationState): CivilizationState {
  const ledger = state.ledgers.authority;
  const posted = Object.entries(ledger.claims).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  let envelope: AuthorityLedger["envelope"] = {
    limit: "none",
    source: "bus",
    reason: "No module is restricting",
  };
  for (const [module, claim] of posted) {
    if (authorityRank(claim.limit) > authorityRank(envelope.limit)) {
      envelope = { limit: claim.limit, source: module, reason: claim.reason };
    }
  }
  const settled: CivilizationState = {
    ...state,
    ledgers: { ...state.ledgers, authority: { ...ledger, envelope } },
  };
  assertAuthorityMonotone(settled);
  return settled;
}
