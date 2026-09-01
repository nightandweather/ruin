import { describe, expect, it } from "vitest";
import {
  CARRY_THRESHOLD,
  conciliumConfig,
  evaluateConcilium,
  RESOURCE_PRICE,
  SYSTEMS,
  WORLDS,
  type SeatBasis,
} from "../src/concilium";

const world = (r: ReturnType<typeof evaluateConcilium>, id: string) =>
  r.standings.find((s) => s.world.id === id)!;

describe("CONCILIUM economy", () => {
  it("is deterministic", () => {
    const c = conciliumConfig();
    expect(evaluateConcilium(c).standings).toEqual(evaluateConcilium(c).standings);
  });

  it("prices revenue from what a world actually sells", () => {
    const r = evaluateConcilium(conciliumConfig());
    for (const standing of r.standings) {
      const expected = Object.entries(standing.world.produces).reduce(
        (sum, [resource, amount]) => sum + amount * RESOURCE_PRICE[resource as keyof typeof RESOURCE_PRICE],
        0,
      );
      // Only the collapse incident alters production, and this is the quiet run.
      expect(standing.revenueTWy).toBeCloseTo(expected, 6);
    }
  });

  it("makes a small rich world out of a high-margin export", () => {
    const r = evaluateConcilium(conciliumConfig());
    const kuiper = world(r, "kuiper");
    const terra = world(r, "terra");
    // Twelve thousand people selling certified designs out-earn nine billion
    // selling finished goods, because margin is not volume.
    expect(kuiper.world.population).toBeLessThan(terra.world.population / 100_000);
    expect(kuiper.revenueTWy).toBeGreaterThan(terra.revenueTWy);
  });

  it("separates being able to pay from being able to run", () => {
    const r = evaluateConcilium(conciliumConfig());
    const ceres = world(r, "ceres");
    // The extraction world sells the alloys the swarm is made of, and cannot
    // power a foundry of its own: capital is not the binding constraint.
    expect(ceres.budgetTWy).toBeGreaterThan(world(r, "terra").budgetTWy);
    expect(ceres.owns.length).toBeLessThan(world(r, "terra").owns.length);
    expect(ceres.outputTW).toBeLessThan(world(r, "terra").outputTW);
    expect(r.upkeepBound).toContain(ceres.world.name);
  });

  it("puts a world out of the market by distance, not by price", () => {
    const r = evaluateConcilium(conciliumConfig());
    const proxima = world(r, "proxima");
    // Proxima has money for something. It has no neighbour to buy from.
    expect(proxima.budgetTWy).toBeGreaterThan(SYSTEMS[0].capitalTWy * 2);
    expect(proxima.owns).toEqual([]);
    expect(proxima.missing.length).toBeGreaterThan(0);
  });

  it("names a single-supplier resource as a chokepoint", () => {
    const r = evaluateConcilium(conciliumConfig());
    const resources = r.chokepoints.map((entry) => entry.resource);
    expect(resources).toContain("rare-metals");
    for (const entry of r.chokepoints) expect(entry.suppliers).toHaveLength(1);
  });

  it("lets the chokepoint world bring the richest one down", () => {
    const quiet = evaluateConcilium(conciliumConfig());
    const embargoed = evaluateConcilium({ ...conciliumConfig(), incident: "embargo" });
    const owned = (r: typeof quiet, id: string) => world(r, id).owns.length;
    expect(owned(quiet, "helios")).toBe(SYSTEMS.length);
    // Fifty thousand miners withholding one stream cost the swarm owner most
    // of its portfolio, and no budget substitutes for the material.
    expect(owned(embargoed, "helios")).toBeLessThan(owned(quiet, "helios"));
    expect(world(embargoed, "helios").revenueTWy).toBe(world(quiet, "helios").revenueTWy);
    expect(embargoed.constraints.join(" ")).toContain("at any budget");
  });
});

describe("CONCILIUM council", () => {
  it("returns opposite outcomes on the same proposal depending on how seats are counted", () => {
    const outcomes = (["population", "revenue", "holdings"] as SeatBasis[]).map((seatBasis) =>
      evaluateConcilium({ ...conciliumConfig(), seatBasis }),
    );
    const [byPeople, byMoney, byHoldings] = outcomes;
    // Identical worlds, identical proposal, identical evidence.
    expect(byMoney.carried).toBe(true);
    expect(byPeople.carried).toBe(false);
    expect(byHoldings.carried).toBe(false);
    expect(byMoney.forShare).toBeGreaterThan(CARRY_THRESHOLD);
    expect(byPeople.forShare).toBeLessThan(CARRY_THRESHOLD);
  });

  it("measures how far the seats are from the people", () => {
    const byPeople = evaluateConcilium({ ...conciliumConfig(), seatBasis: "population" });
    const byMoney = evaluateConcilium({ ...conciliumConfig(), seatBasis: "revenue" });
    // Seats drawn from population are the population, by construction.
    expect(byPeople.representationGap).toBeCloseTo(0, 9);
    // Drawn from revenue, a station of 240,000 holds most of the council.
    expect(byMoney.representationGap).toBeGreaterThan(0.9);
    expect(world(byMoney, "helios").seatShare).toBeGreaterThan(0.9);
    expect(world(byMoney, "helios").populationShare).toBeLessThan(0.001);
  });

  it("refuses a landslide when the worlds it binds could not answer", () => {
    const patient = evaluateConcilium(conciliumConfig());
    const rushed = evaluateConcilium({ ...conciliumConfig(), incident: "light-lag-vote" });
    expect(patient.outcome).toBe("CARRIED");
    // The rushed vote would have carried by more, and is refused instead.
    expect(rushed.forShare).toBeGreaterThan(patient.forShare);
    expect(rushed.consentValid).toBe(false);
    expect(rushed.outcome).toBe("REFUSED");
    expect(rushed.readiness).toBe("NO-GO");
    expect(rushed.safeMode).toBe("CONSENT NOT ESTABLISHED");
    expect(rushed.constraints[0]).toContain("dependency without exit is not consent");
  });

  it("only silences a world that both depends on the system and cannot answer", () => {
    const rushed = evaluateConcilium({ ...conciliumConfig(), incident: "light-lag-vote" });
    for (const name of rushed.silenced) {
      const standing = rushed.standings.find((s) => s.world.name === name)!;
      expect(standing.reachable).toBe(false);
      expect(standing.dependent).toBe(true);
    }
    // The world that owns the system is never counted as silenced, however
    // far away it is — it is not bound by someone else's decision about it.
    expect(rushed.silenced).not.toContain("HELIOS STATION");
  });

  it("moves the seats when the money moves", () => {
    const quiet = evaluateConcilium(conciliumConfig());
    const collapsed = evaluateConcilium({ ...conciliumConfig(), incident: "output-collapse" });
    expect(world(collapsed, "helios").seatShare).toBeLessThan(world(quiet, "helios").seatShare);
    // Losing the majority loses the vote, without anyone changing their mind.
    expect(quiet.carried).toBe(true);
    expect(collapsed.carried).toBe(false);
  });

  it("keeps one world able to build the whole civilization, and only one", () => {
    const r = evaluateConcilium(conciliumConfig());
    expect(r.selfSufficientCount).toBe(1);
    expect(world(r, "helios").selfSufficient).toBe(true);
    expect(r.dependentCount).toBe(WORLDS.length - 1);
  });
});
