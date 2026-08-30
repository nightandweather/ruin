import { describe, expect, it } from "vitest";
import {
  advanceHorizon,
  createHorizonState,
  horizonProjection,
  injectHorizonIncident,
  recoverHorizonSystem,
  setHorizonPolicy,
} from "../src/horizons";

describe("HORIZONS civilization network", () => {
  it("commissions all fourteen connected systems", () => {
    const state = createHorizonState();
    expect(state.systems).toHaveLength(14);
    expect(
      state.systems.every((node) =>
        node.dependencies.every((id) => state.systems.some((candidate) => candidate.id === id)),
      ),
    ).toBe(true);
  });
  it("propagates a failure only to direct dependents", () => {
    const state = createHorizonState();
    const next = injectHorizonIncident(state, "darklight");
    expect(next.systems.find((n) => n.id === "darklight")?.status).toBe("critical");
    expect(next.systems.find((n) => n.id === "chronos")!.integrity).toBeLessThan(
      state.systems.find((n) => n.id === "chronos")!.integrity,
    );
    expect(next.systems.find((n) => n.id === "terraform")!.integrity).toBe(
      state.systems.find((n) => n.id === "terraform")!.integrity,
    );
  });
  it("denies recovery when a prerequisite is below its safety floor", () => {
    let state = createHorizonState();
    state = injectHorizonIncident(state, "darklight");
    state = injectHorizonIncident(state, "chronos");
    const before = state.systems.find((n) => n.id === "wormway")!.integrity;
    const next = recoverHorizonSystem(state, "wormway");
    expect(next.systems.find((n) => n.id === "wormway")!.integrity).toBe(before);
    expect(next.events[0].message).toContain("denied");
  });
  it("policy changes produce distinct decade outcomes", () => {
    const initial = createHorizonState();
    const continuity = advanceHorizon(initial);
    const expansion = advanceHorizon(setHorizonPolicy(initial, "expansion"));
    expect(expansion.populationB).toBeGreaterThan(continuity.populationB);
    expect(expansion.systems[0].load).toBeGreaterThan(continuity.systems[0].load);
  });
  it("projects bounded causal outcomes", () => {
    const projection = horizonProjection(injectHorizonIncident(createHorizonState(), "matrioshka"));
    expect(projection.map((point) => point.years)).toEqual([10, 50, 100]);
    expect(projection.every((point) => point.trust >= 0 && point.trust <= 100)).toBe(true);
  });
});
