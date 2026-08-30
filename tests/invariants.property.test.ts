import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CAREER_LIMIT_MSV, evaluateHygeia, hygeiaConfig, type SpeEvent } from "../src/hygeia";
import { evaluateKessler, kesslerConfig, type KesslerIncident } from "../src/kessler";
import { evaluateThemis, themisConfig, type ThemisIncident } from "../src/themis";
import { evaluateReliquary, reliquaryConfig, type MediaClass } from "../src/reliquary";
import { createState, settlePowerLedger } from "../src/civilizationState";

/**
 * Property-based defense of the safety invariants.
 *
 * The example-based suites pin behavior at points an author chose; these
 * throw randomized configurations at the engines and assert that the
 * invariants hold at every one of them. An invariant that survives only on
 * hand-picked inputs is a demonstration, not an invariant.
 */

describe("invariants under randomized configuration", () => {
  it("HYGEIA never returns GO or CONDITIONAL past the career allowance", () => {
    fc.assert(
      fc.property(
        fc.record({
          crewCount: fc.integer({ min: 1, max: 100 }),
          missionDays: fc.integer({ min: 1, max: 2000 }),
          habitatShieldGcm2: fc.integer({ min: 0, max: 120 }),
          shelterExtraGcm2: fc.integer({ min: 0, max: 120 }),
          shelterCapacity: fc.integer({ min: 0, max: 120 }),
          evaHoursPerWeek: fc.integer({ min: 0, max: 60 }),
          speWarningMinutes: fc.integer({ min: 0, max: 240 }),
          evaRecallMinutes: fc.integer({ min: 1, max: 240 }),
          priorCareerMSv: fc.integer({ min: 0, max: 800 }),
          spe: fc.constantFrom<SpeEvent>("none", "moderate", "oct-2003", "aug-1972"),
          incident: fc.constantFrom(
            "none" as const,
            "dosimeter-drift" as const,
            "shelter-power-loss" as const,
          ),
        }),
        (config) => {
          const result = evaluateHygeia({ ...hygeiaConfig(), ...config });
          if (result.careerBoundMSv > CAREER_LIMIT_MSV) expect(result.readiness).toBe("NO-GO");
          // The planning bound never sits below the best estimate.
          expect(result.missionBoundMSv).toBeGreaterThanOrEqual(result.missionBestMSv - 1e-9);
          // The shelter never reads worse than the bare hull.
          expect(result.speShelterMSv).toBeLessThanOrEqual(result.speHabitatMSv + 1e-9);
        },
      ),
    );
  });

  it("KESSLER's moratorium never lifts once latched, whatever the traffic", () => {
    fc.assert(
      fc.property(
        fc.record({
          swarmCount: fc.integer({ min: 500, max: 30000 }),
          initialTracked: fc.integer({ min: 0, max: 20000 }),
          initialUntracked: fc.integer({ min: 0, max: 20000 }),
          installsPerYear: fc.integer({ min: 0, max: 2000 }),
          adrPerYear: fc.integer({ min: 0, max: 1000 }),
          avoidanceReliability: fc.double({ min: 0, max: 1, noNaN: true }),
          incident: fc.constantFrom<KesslerIncident>("none", "breakup", "tracking-outage"),
        }),
        (config) => {
          const result = evaluateKessler({ ...kesslerConfig(), ...config });
          const firstBlocked = result.trajectory.findIndex((year) => !year.installsAllowed);
          if (firstBlocked >= 0)
            expect(result.trajectory.slice(firstBlocked).every((year) => !year.installsAllowed)).toBe(true);
          // Populations never go negative, however hostile the band.
          for (const year of result.trajectory) {
            expect(year.tracked).toBeGreaterThanOrEqual(0);
            expect(year.untracked).toBeGreaterThanOrEqual(0);
            expect(year.swarm).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });

  it("THEMIS never executes irreversible-and-unproven, whatever the geometry", () => {
    fc.assert(
      fc.property(
        fc.record({
          oneWayDelayS: fc.integer({ min: 0, max: 50000 }),
          humanDeliberationS: fc.integer({ min: 0, max: 20000 }),
          decisionWindowS: fc.integer({ min: 1, max: 50000 }),
          councilNodes: fc.integer({ min: 1, max: 31 }),
          partitionedNodes: fc.integer({ min: 0, max: 31 }),
          evidenceScore: fc.integer({ min: 0, max: 100 }),
          vetoWindowS: fc.integer({ min: 0, max: 50000 }),
          incident: fc.constantFrom<ThemisIncident>("none", "model-drift", "partition", "command-cross"),
        }),
        (config) => {
          const irreversible = evaluateThemis({
            ...themisConfig(),
            ...config,
            actionClass: "irreversible",
          });
          const acts =
            irreversible.pathway === "AUTONOMOUS ENVELOPE" || irreversible.pathway === "VETO-WINDOW AUTONOMY";
          if (acts) {
            expect(irreversible.effectiveEvidence).toBeGreaterThanOrEqual(irreversible.requiredEvidence);
            expect(irreversible.vetoSatisfied).toBe(true);
          }
          // The sovereign tier is refused under every configuration.
          const sovereign = evaluateThemis({
            ...themisConfig(),
            ...config,
            tier: "sovereign-proposal",
          });
          expect(sovereign.pathway).toBe("HOLD SAFE STATE");
        },
      ),
    );
  });

  it("RELIQUARY counts unrehearsed archives as zero copies at any scale", () => {
    fc.assert(
      fc.property(
        fc.record({
          copies: fc.integer({ min: 0, max: 12 }),
          media: fc.constantFrom<MediaClass>("magnetic-tape", "hard-disk", "archival-film", "fused-silica"),
          scrubIntervalYears: fc.double({ min: 0.5, max: 20, noNaN: true }),
          rehearsalIntervalYears: fc.integer({ min: 0, max: 200 }),
          curatorFTE: fc.integer({ min: 0, max: 20 }),
          horizonYears: fc.integer({ min: 10, max: 150 }),
        }),
        (config) => {
          const result = evaluateReliquary({ ...reliquaryConfig(), ...config });
          const rehearsed =
            config.rehearsalIntervalYears > 0 && config.rehearsalIntervalYears <= config.horizonYears;
          if (!rehearsed) {
            expect(result.countedCopies).toBe(0);
            expect(result.readiness).toBe("NO-GO");
          }
          // Survival is a probability at every point of every trajectory.
          for (const year of result.trajectory) {
            expect(year.survival).toBeGreaterThanOrEqual(0);
            expect(year.survival).toBeLessThanOrEqual(1);
          }
        },
      ),
    );
  });

  it("the power ledger conserves supply under arbitrary markets", () => {
    const mw = fc.double({ min: 0, max: 1e6, noNaN: true });
    fc.assert(
      fc.property(
        fc.dictionary(fc.stringMatching(/^[a-z]{1,12}$/), mw, { maxKeys: 8 }),
        fc.dictionary(fc.stringMatching(/^[a-z]{1,12}$/), mw, { maxKeys: 8 }),
        fc.array(fc.stringMatching(/^[a-z]{1,12}$/), { maxLength: 8 }),
        (supply, demand, priority) => {
          const state = createState(1, 0);
          state.ledgers.power.supply = supply;
          state.ledgers.power.demand = demand;
          state.ledgers.power.priority = priority;
          const settled = settlePowerLedger(state);
          const supplied = Object.values(supply).reduce((sum, value) => sum + value, 0);
          const allocated = Object.values(settled.ledgers.power.allocations).reduce(
            (sum, value) => sum + value,
            0,
          );
          expect(allocated).toBeLessThanOrEqual(supplied + 1e-6);
          for (const [consumer, granted] of Object.entries(settled.ledgers.power.allocations))
            expect(granted).toBeLessThanOrEqual((demand[consumer] ?? 0) + 1e-6);
        },
      ),
    );
  });
});
