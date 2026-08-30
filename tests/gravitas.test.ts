import { describe, expect, it } from "vitest";
import { ARCHITECTURE_PRESETS, DEFAULT_GRAVITAS_CONFIG, GravitasSimulation } from "../src/gravitas";

describe("GRAVITAS artificial gravity architecture", () => {
  it("calculates rotational gravity deterministically", () => {
    expect(new GravitasSimulation().snapshot()).toEqual(new GravitasSimulation().snapshot());
  });

  it("requires less rotation at a larger radius for the same target gravity", () => {
    const small = new GravitasSimulation({ ...DEFAULT_GRAVITAS_CONFIG, radiusM: 20 }).snapshot();
    const large = new GravitasSimulation({ ...DEFAULT_GRAVITAS_CONFIG, radiusM: 200 }).snapshot();
    expect(large.rpm!).toBeLessThan(small.rpm!);
    expect(large.gravityGradientPercent!).toBeLessThan(small.gravityGradientPercent!);
  });

  it("exposes the head-to-foot gradient of a short-arm centrifuge", () => {
    const short = new GravitasSimulation({
      ...DEFAULT_GRAVITAS_CONFIG,
      ...ARCHITECTURE_PRESETS["short-arm"],
      architecture: "short-arm",
    }).snapshot();
    expect(short.footG).toBe(1);
    expect(short.headG!).toBeLessThan(short.footG!);
    expect(short.comfort).toBe("HIGH-RISK");
  });

  it("does not pretend that a field core has a known physical mechanism", () => {
    const field = new GravitasSimulation({
      ...DEFAULT_GRAVITAS_CONFIG,
      architecture: "field-core",
    }).snapshot();
    expect(field.feasibility).toBe("UNSUPPORTED");
    expect(field.rpm).toBeNull();
    expect(field.readiness).toBe("NO-GO");
  });

  it("forces controlled despin after a mass imbalance", () => {
    const sim = new GravitasSimulation();
    const state = sim.inject("mass-imbalance");
    expect(state.mode).toBe("despin");
    expect(state.readiness).toBe("NO-GO");
  });

  it("counter rotation reduces residual angular momentum", () => {
    const none = new GravitasSimulation({ ...DEFAULT_GRAVITAS_CONFIG, counterRotationPercent: 0 }).snapshot();
    const balanced = new GravitasSimulation({
      ...DEFAULT_GRAVITAS_CONFIG,
      counterRotationPercent: 100,
    }).snapshot();
    expect(balanced.residualAngularMomentumMNs!).toBeLessThan(none.residualAngularMomentumMNs!);
  });
});
