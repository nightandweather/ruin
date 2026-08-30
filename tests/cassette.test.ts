import { describe, expect, it } from "vitest";
import { CASSETTE_FORMAT, parseCassette, serializeCassette } from "../src/cassette";
import { heliosCassette, runHeliosCassette } from "../src/heliosCassette";
import { FIRST_LIGHT_ACTIONS, runFirstLight } from "../src/firstLight";
import type { CassetteAction } from "../src/cassette";

const firstLightTimeline: CassetteAction[] = FIRST_LIGHT_ACTIONS.map((action) =>
  action.kind === "inject"
    ? {
        atTick: action.tick,
        action: "inject",
        params:
          action.bearingDeg === undefined
            ? { scenario: action.scenario }
            : { scenario: action.scenario, bearingDeg: action.bearingDeg },
        label: action.label,
      }
    : { atTick: action.tick, action: "production", params: { units: action.units }, label: action.label },
);

describe("incident cassette format", () => {
  it("round-trips through serialization", () => {
    const cassette = heliosCassette("Round trip", firstLightTimeline, { runToTick: 140 });
    const parsed = parseCassette(serializeCassette(cassette));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.cassette).toEqual(cassette);
  });

  it("rejects malformed JSON with a readable error", () => {
    const parsed = parseCassette("{not json");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors[0]).toContain("Not valid JSON");
  });

  it("rejects wrong format, empty module, and out-of-order timelines", () => {
    const bad = parseCassette(
      JSON.stringify({
        format: "ruin-cassette/999",
        module: "",
        title: "",
        timeline: [
          { atTick: 10, action: "inject" },
          { atTick: 4, action: "inject" },
          { atTick: -1, action: "" },
        ],
      }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.join("\n")).toContain(CASSETTE_FORMAT);
      expect(bad.errors.some((error) => error.includes("out of order"))).toBe(true);
      expect(bad.errors.some((error) => error.includes("non-negative"))).toBe(true);
    }
  });
});

describe("HELIOS cassette replay", () => {
  it("refuses cassettes addressed to other modules and unknown actions", () => {
    const wrongModule = runHeliosCassette({ ...heliosCassette("x", []), module: "agraria" });
    expect(wrongModule.ok).toBe(false);
    const wrongAction = runHeliosCassette(heliosCassette("x", [{ atTick: 0, action: "self-destruct" }]));
    expect(wrongAction.ok).toBe(false);
    if (!wrongAction.ok) expect(wrongAction.errors[0]).toContain("self-destruct");
  });

  it("replays deterministically — identical cassette, identical world", () => {
    const cassette = heliosCassette("Determinism", firstLightTimeline, { runToTick: 140 });
    const first = runHeliosCassette(cassette);
    const second = runHeliosCassette(cassette);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.replay.snapshot.metrics).toEqual(second.replay.snapshot.metrics);
      expect(first.replay.snapshot.tick).toBe(140);
    }
  });

  it("reproduces the FIRST LIGHT campaign from a cassette", () => {
    const report = runFirstLight();
    const result = runHeliosCassette(heliosCassette("FIRST LIGHT", firstLightTimeline, { runToTick: 140 }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      // FIRST LIGHT steps one extra tick after each action to record its
      // checkpoint; the cassette replay applies the same actions at the same
      // ticks and must land inside the same recovered envelope.
      expect(result.replay.snapshot.tick).toBe(report.finalSnapshot.tick);
      expect(result.replay.snapshot.metrics.availabilityPercent).toBeCloseTo(
        report.finalSnapshot.metrics.availabilityPercent,
        1,
      );
      expect(result.replay.snapshot.metrics.deliveredGW).toBeCloseTo(
        report.finalSnapshot.metrics.deliveredGW,
        1,
      );
    }
  });

  it("honors seed and config overrides", () => {
    const small = runHeliosCassette({
      ...heliosCassette("small swarm", [], { seed: 7, runToTick: 5 }),
      config: { satelliteCount: 500 },
    });
    expect(small.ok).toBe(true);
    if (small.ok) expect(small.replay.snapshot.satellites).toHaveLength(500);
  });
});
