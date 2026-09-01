/**
 * The grounding gate.
 *
 * NAVIS and IGNIS quote real articles now — RL10B-2, NASA AEPS, NEXT-C, and
 * the NRX A6 ground test. A citation is only worth having if it is checkable,
 * and the check available here is internal consistency: the specific impulse,
 * thrust, power, and efficiency of a real engine are not four free numbers.
 * They are related, and a mistyped citation breaks the relation.
 *
 * That is what this suite asserts. It cannot tell whether 465.5 s is the right
 * figure for an RL10B-2 — no test can — but it will catch the far more likely
 * failure, which is a number transcribed into the wrong row or drifting when
 * someone tunes the model and forgets that the row claims a source.
 */
import { describe, expect, it } from "vitest";
import { ENGINES, enginesGroundedFraction } from "../src/ignis";
import { PROPULSION, propulsionGroundedFraction } from "../src/navis";

const G0 = 9.80665;
/** Published figures are rounded, so agreement is asserted within 5%. */
const TOLERANCE = 0.05;

const near = (actual: number, expected: number) =>
  Math.abs(actual - expected) / Math.max(1e-12, Math.abs(expected));

describe("propulsion tables declare where their numbers come from", () => {
  it("gives every engine and drive a grounding and a source", () => {
    for (const engine of Object.values(ENGINES)) {
      expect(["sourced", "derived", "scenario"]).toContain(engine.grounding);
      expect(engine.source.length, `${engine.id} has no source`).toBeGreaterThan(20);
    }
    for (const drive of Object.values(PROPULSION)) {
      expect(["sourced", "derived", "scenario"]).toContain(drive.grounding);
      expect(drive.source.length, `${drive.id} has no source`).toBeGreaterThan(20);
    }
  });

  it("never claims maturity for a row it invented, or invention for a flown one", () => {
    for (const engine of Object.values(ENGINES)) {
      // A model with no article behind it cannot be a mature model.
      if (engine.grounding === "scenario") expect(engine.maturity).toBe(0);
      if (engine.maturity === 5) expect(engine.grounding).not.toBe("scenario");
    }
    for (const drive of Object.values(PROPULSION)) {
      if (drive.grounding === "scenario") expect(drive.maturity).toBe(0);
      if (drive.maturity === 5) expect(drive.grounding).not.toBe("scenario");
    }
  });
});

describe("cited engines are internally consistent", () => {
  it("closes the power balance on every cited IGNIS engine", () => {
    for (const engine of Object.values(ENGINES)) {
      if (engine.grounding === "scenario") continue;
      const ve = engine.referenceIspS * G0;
      const sourcePowerW = engine.referencePowerMW * 1e6;

      if (engine.id === "hall-electric") {
        // Power-limited: the thrust follows from power, efficiency, and
        // exhaust velocity. F = 2ηP/v.
        const derived = (2 * engine.efficiency * sourcePowerW) / ve;
        expect(
          near(derived, engine.referenceThrustN),
          `${engine.id}: F = 2ηP/v gives ${derived.toFixed(3)} N against a stated ${engine.referenceThrustN} N`,
        ).toBeLessThan(TOLERANCE);
        continue;
      }

      // Thermal: the jet power carried by the exhaust must equal the source
      // power the engine is credited with, times its efficiency.
      const massFlow = engine.referenceThrustN / ve;
      const jetPowerW = 0.5 * massFlow * ve ** 2;
      expect(
        near(jetPowerW, engine.efficiency * sourcePowerW),
        `${engine.id}: jet power ${(jetPowerW / 1e6).toFixed(1)} MW against ηP ${((engine.efficiency * sourcePowerW) / 1e6).toFixed(1)} MW`,
      ).toBeLessThan(TOLERANCE);
    }
  });

  it("derives every electric NAVIS drive from its own power and efficiency", () => {
    for (const drive of Object.values(PROPULSION)) {
      if (drive.propulsionPowerMW <= 0 || drive.grounding === "scenario") continue;
      const ve = drive.specificImpulseS * G0;
      const derivedKN = (2 * drive.efficiency * drive.propulsionPowerMW * 1e6) / ve / 1000;
      expect(
        near(derivedKN, drive.thrustKN),
        `${drive.id}: F = 2ηP/v gives ${derivedKN.toFixed(3)} kN against a stated ${drive.thrustKN} kN`,
      ).toBeLessThan(TOLERANCE);
    }
  });

  it("builds the chemical cluster out of whole engines", () => {
    const chemical = PROPULSION.chemical;
    const unit = ENGINES["cryo-chemical"].referenceThrustN / 1000;
    // The NAVIS chemical drive is a cluster of the IGNIS reference engine, so
    // the two tables cannot quietly drift apart.
    expect(chemical.specificImpulseS).toBeCloseTo(ENGINES["cryo-chemical"].referenceIspS, 6);
    const count = chemical.thrustKN / unit;
    expect(Math.abs(count - Math.round(count)), "cluster is not a whole number of engines").toBeLessThan(
      0.01,
    );
    expect(Math.round(count)).toBeGreaterThan(1);
  });
});

describe("grounded fractions are read from the tables, not typed in", () => {
  it("counts what the tables actually declare", () => {
    const engines = Object.values(ENGINES);
    expect(enginesGroundedFraction()).toBeCloseTo(
      engines.filter((engine) => engine.grounding === "sourced").length / engines.length,
      12,
    );
    const drives = Object.values(PROPULSION);
    expect(propulsionGroundedFraction()).toBeCloseTo(
      drives.filter((drive) => drive.grounding !== "scenario").length / drives.length,
      12,
    );
    // Both tables retain exactly one invented row: the fusion branch.
    expect(enginesGroundedFraction()).toBeLessThan(1);
    expect(propulsionGroundedFraction()).toBeLessThan(1);
  });
});
