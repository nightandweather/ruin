import { describe, expect, it } from "vitest";
import {
  BOOKING_FACTOR,
  DEPOSITS,
  evaluateProspect,
  prospectConfig,
  type DepositId,
  type ProspectIncident,
} from "../src/prospect";

const INCIDENTS: ProspectIncident[] = [
  "none",
  "drill-the-big-number",
  "assay-drift",
  "tool-shortage",
  "tailings-dam",
];
const TARGETS: DepositId[] = ["hearth", "midfield", "bignumber"];

const sweep = () =>
  TARGETS.flatMap((develop) => INCIDENTS.map((incident) => ({ ...prospectConfig(), develop, incident })));

describe("PROSPECT survey", () => {
  it("is deterministic across every target and incident", () => {
    for (const config of sweep()) expect(evaluateProspect(config)).toEqual(evaluateProspect(config));
  });

  it("meets the FOUNDRY contract from the measured deposit on a nominal day", () => {
    const r = evaluateProspect(prospectConfig());
    expect(r.shortfallTPerDay).toBeCloseTo(0, 9);
    expect(r.limiter).toBe("plan");
    expect(r.safeMode).toBe("SURVEY HONEST");
    expect(r.readiness).toBe("CONDITIONAL");
    // The standing note is the tailings bank: over 93% of everything mined.
    expect(r.constraints.join(" ")).toContain("tailings banked");
  });
});

describe("INVARIANT — an inferred resource is never booked as a reserve", () => {
  it("refuses the plan that develops the big number undrilled", () => {
    const r = evaluateProspect({ ...prospectConfig(), develop: "bignumber" });
    expect(r.bookingRefused).toBe(true);
    expect(r.rateKtPerDay).toBeCloseTo(0, 12);
    expect(r.productTPerDay).toBeCloseTo(0, 12);
    expect(r.readiness).toBe("NO-GO");
    expect(r.safeMode).toBe("PLAN REFUSED — UNMEASURED");
    expect(r.constraints.join(" ")).toContain("drill it before you plan on it");
    expect(BOOKING_FACTOR.inferred).toBe(0);
  });

  it("lets drilling buy the right to plan — and the truth that comes with it", () => {
    const r = evaluateProspect({
      ...prospectConfig(),
      develop: "bignumber",
      incident: "drill-the-big-number",
    });
    expect(r.bookingRefused).toBe(false);
    expect(r.target.confidence).toBe("indicated");
    // The filed 5.5% grade drills out at 40% of itself.
    expect(r.target.gradeEstimate).toBeCloseTo(0.055 * 0.4, 9);
    expect(r.productTPerDay).toBeLessThan(prospectConfig().demandTPerDay * 0.5);
    expect(r.readiness).toBe("NO-GO");
    expect(r.constraints.join(" ")).toContain("the survey worked; the number was the failure");
  });
});

describe("INVARIANT — mass balances", () => {
  it("turns every mined tonne into product, tailings, or named losses", () => {
    for (const config of sweep()) {
      const r = evaluateProspect(config);
      expect(r.massResidueT).toBeLessThan(1e-6);
    }
  });
});

describe("INVARIANT — provenance survives planning", () => {
  it("books every deposit through its confidence class, never past it", () => {
    for (const config of sweep()) {
      for (const deposit of evaluateProspect(config).deposits) {
        expect(deposit.bookableGrade).toBeCloseTo(
          deposit.gradeEstimate * BOOKING_FACTOR[deposit.confidence],
          12,
        );
      }
    }
  });

  it("shows assay drift inflating estimates without changing what the rock pays", () => {
    const nominal = evaluateProspect(prospectConfig());
    const drifted = evaluateProspect({ ...prospectConfig(), incident: "assay-drift" });
    // HEARTH is measured, so the plan's own numbers are untouched…
    expect(drifted.productTPerDay).toBeCloseTo(nominal.productTPerDay, 9);
    // …while the undrilled estimates inflate on the board.
    const big = (r: typeof nominal) => r.deposits.find((d) => d.id === "bignumber")!;
    expect(big(drifted).gradeEstimate).toBeGreaterThan(big(nominal).gradeEstimate);
    expect(big(drifted).gradeTrue).toBe(big(nominal).gradeTrue);
  });
});

describe("the bottleneck names itself", () => {
  it("caps the day at the tool spares when ASCENT's delivery is short", () => {
    const r = evaluateProspect({ ...prospectConfig(), incident: "tool-shortage" });
    expect(r.limiter).toBe("tool spares");
    expect(r.rateKtPerDay).toBeLessThan(prospectConfig().extractionKtPerDay);
    expect(r.shortfallTPerDay).toBeGreaterThan(0);
    expect(r.readiness).toBe("CONDITIONAL");
  });

  it("caps the day at the dam when the dam is derated", () => {
    const r = evaluateProspect({ ...prospectConfig(), incident: "tailings-dam" });
    expect(r.limiter).toBe("tailings dam");
    expect(r.shortfallTPerDay).toBeGreaterThan(0);
  });

  it("caps the drilled big number at the power contract, not the plan", () => {
    const r = evaluateProspect({
      ...prospectConfig(),
      develop: "bignumber",
      incident: "drill-the-big-number",
    });
    expect(r.limiter).toBe("power contract");
    // Low grade is an energy sentence: MWh per tonne of product multiplies.
    const hearth = evaluateProspect(prospectConfig());
    expect(r.energyPerProductMWhPerT).toBeGreaterThan(3 * hearth.energyPerProductMWhPerT);
  });

  it("keeps the map's biggest number the worst plan even when it is legal", () => {
    // The finding, stated as arithmetic: drilled and booked, BIG NUMBER
    // still produces less than small, measured HEARTH.
    const big = evaluateProspect({
      ...prospectConfig(),
      develop: "bignumber",
      incident: "drill-the-big-number",
    });
    const hearth = evaluateProspect(prospectConfig());
    expect(big.productTPerDay).toBeLessThan(hearth.productTPerDay);
    expect(DEPOSITS.find((d) => d.id === "bignumber")!.rockKt).toBeGreaterThan(
      10 * DEPOSITS.find((d) => d.id === "hearth")!.rockKt,
    );
  });
});
