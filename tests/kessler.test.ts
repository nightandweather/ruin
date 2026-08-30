import { describe, expect, it } from "vitest";
import { evaluateKessler, kesslerConfig, MORATORIUM_DENSITY } from "../src/kessler";

describe("KESSLER debris population dynamics", () => {
  it("is deterministic — same configuration, same trajectory", () => {
    const c = kesslerConfig();
    expect(evaluateKessler(c).trajectory).toEqual(evaluateKessler(c).trajectory);
  });

  it("accumulates more debris the less is actively removed from a dragless band", () => {
    const noRemoval = evaluateKessler({ ...kesslerConfig(), adrPerYear: 0 });
    const heavyRemoval = evaluateKessler({ ...kesslerConfig(), adrPerYear: 400 });
    expect(noRemoval.endTracked + noRemoval.endUntracked).toBeGreaterThan(
      heavyRemoval.endTracked + heavyRemoval.endUntracked,
    );
    expect(noRemoval.constraints.some((x) => x.includes("dragless"))).toBe(true);
  });

  it("makes untracked debris strictly more dangerous than tracked", () => {
    const base = { ...kesslerConfig(), initialTracked: 0, initialUntracked: 0 };
    const tracked = evaluateKessler({ ...base, initialTracked: 2000 });
    const untracked = evaluateKessler({ ...base, initialUntracked: 2000 });
    expect(untracked.totalCollisions).toBeGreaterThan(tracked.totalCollisions);
  });

  it("collapses avoidance during a tracking outage", () => {
    const c = kesslerConfig();
    const blind = evaluateKessler({ ...c, incident: "tracking-outage" });
    expect(blind.totalCollisions).toBeGreaterThan(evaluateKessler(c).totalCollisions);
    expect(blind.runawayYear).not.toBeNull();
    expect(blind.runawayYear!).toBeLessThan(evaluateKessler(c).runawayYear ?? Infinity);
  });

  it("answers a catastrophic breakup with an immediate moratorium", () => {
    const quiet = evaluateKessler(kesslerConfig());
    const broken = evaluateKessler({ ...kesslerConfig(), incident: "breakup" });
    // The fragment cloud raises the immediate collision rate...
    expect(broken.trajectory[0].collisions).toBeGreaterThan(quiet.trajectory[0].collisions);
    // ...and crosses the density cap at year zero, so installs stop at once.
    // Freezing its own growth is what keeps the wounded band from getting
    // hotter than the healthy one — the invariant doing visible work.
    expect(broken.moratoriumYear).toBe(0);
    expect(broken.trajectory.every((y) => !y.installsAllowed)).toBe(true);
  });

  it("enforces the install moratorium inside the model — fail-closed and latched", () => {
    const r = evaluateKessler({
      ...kesslerConfig(),
      initialUntracked: 4000,
      initialTracked: 3000,
      adrPerYear: 0,
    });
    expect(r.moratoriumYear).not.toBeNull();
    const firstBlocked = r.trajectory.findIndex((y) => !y.installsAllowed);
    expect(firstBlocked).toBeGreaterThanOrEqual(0);
    // Once engaged, the moratorium never silently lifts.
    expect(r.trajectory.slice(firstBlocked).every((y) => !y.installsAllowed)).toBe(true);
    const at = r.trajectory[firstBlocked];
    expect((at.tracked + at.untracked) / Math.max(1, at.swarm)).toBeGreaterThan(MORATORIUM_DENSITY);
  });

  it("keeps a well-budgeted band out of runaway for the whole horizon", () => {
    const r = evaluateKessler({
      ...kesslerConfig(),
      initialTracked: 300,
      initialUntracked: 100,
      adrPerYear: 400,
      installFailureRate: 0.005,
    });
    expect(r.runawayYear).toBeNull();
    expect(r.readiness).not.toBe("NO-GO");
  });

  it("lets the expanding swarm raise its own encounter rate", () => {
    // Same debris field: a band that keeps installing sees more collisions
    // than one that never grows — expansion is itself a hazard driver.
    const growing = evaluateKessler({ ...kesslerConfig(), installsPerYear: 400 });
    const frozen = evaluateKessler({ ...kesslerConfig(), installsPerYear: 0 });
    expect(growing.totalCollisions).toBeGreaterThan(frozen.totalCollisions);
  });
});
