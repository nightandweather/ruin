/**
 * PORTA against the Season 02 canon.
 *
 * The manuscript is the specification here, not the other way round: these
 * assertions are the chronology's numbers, and a failure means the model has
 * drifted from the story rather than that the story is wrong.
 */
import { describe, expect, it } from "vitest";
import {
  DEPOSIT_PJ_PER_MIN,
  evaluatePorta,
  IMPROVISED_LEDGER_COUNT,
  LEGACY_PANEL_EFFICIENCY,
  MANIFESTS,
  portaConfig,
  SAFE_OPENING_MINUTES,
} from "../src/porta";

describe("PORTA reproduces the canon constants", () => {
  it("is deterministic", () => {
    const c = portaConfig();
    expect(evaluatePorta(c)).toEqual(evaluatePorta(c));
  });

  it("deposits 9.58 PJ in a 71-minute opening", () => {
    const r = evaluatePorta({ ...portaConfig(), openingMinutes: 71 });
    expect(r.depositPJ).toBeCloseTo(9.58, 6);
    expect(DEPOSIT_PJ_PER_MIN * 71).toBeCloseTo(9.58, 6);
  });

  it("reopens in 94 days after a full opening, and 211 before the active panels", () => {
    const modern = evaluatePorta({ ...portaConfig(), openingMinutes: SAFE_OPENING_MINUTES });
    expect(modern.cooldownDays).toBeCloseTo(94, 6);
    const legacy = evaluatePorta({
      ...portaConfig(),
      openingMinutes: SAFE_OPENING_MINUTES,
      panelEfficiency: LEGACY_PANEL_EFFICIENCY,
    });
    expect(legacy.cooldownDays).toBeCloseTo(211, 4);
  });

  it("clears sixty-six people in Nina's forty-three seconds", () => {
    const r = evaluatePorta({
      ...portaConfig(),
      manifest: "evacuation",
      incident: "improvised-quorum",
    });
    expect(r.openingSeconds).toBeCloseTo(43, 6);
    // 47 children, 19 wounded, the third ledger, and the navigation core.
    expect(MANIFESTS.find((m) => m.id === "evacuation")!.people).toBe(66);
    expect(r.passed).toBe(66);
    expect(r.leftBehind).toBe(0);
    // The story pins this rate from below: sixty-six in forty-three seconds
    // is not possible under 93 people per minute.
    expect(r.capacity).toBeGreaterThanOrEqual(66);
    // Only because the violation skips quarantine — the throat is the limit.
    expect(r.bottleneck).toBe("THROAT");
  });
});

describe("PORTA invariants", () => {
  it("refuses an opening past the safe ceiling rather than warning about it", () => {
    const r = evaluatePorta({ ...portaConfig(), openingMinutes: 200 });
    expect(r.openingMinutes).toBe(SAFE_OPENING_MINUTES);
    expect(r.constraints.join(" ")).toContain("refused the excess");
    // The heat that would have been deposited is never deposited either.
    expect(r.depositPJ).toBeCloseTo(SAFE_OPENING_MINUTES * DEPOSIT_PJ_PER_MIN, 9);
  });

  it("does not open by itself without quorum at both ends", () => {
    for (const quorum of ["one", "revoked"] as const) {
      const r = evaluatePorta({ ...portaConfig(), quorum });
      expect(r.opens).toBe(false);
      expect(r.passed).toBe(0);
      expect(r.safeMode).toBe("SEALED · NO QUORUM");
      expect(r.readiness).toBe("NO-GO");
    }
    const revoked = evaluatePorta({ ...portaConfig(), incident: "quorum-revoked" });
    expect(revoked.opens).toBe(false);
  });

  it("lets the violation succeed, and charges for it permanently", () => {
    const lawful = evaluatePorta({ ...portaConfig(), manifest: "evacuation" });
    const violation = evaluatePorta({
      ...portaConfig(),
      manifest: "evacuation",
      quorum: "revoked",
      incident: "improvised-quorum",
    });
    // Quorum was revoked at both ends. The lawful path is sealed.
    expect(evaluatePorta({ ...portaConfig(), manifest: "evacuation", quorum: "revoked" }).opens).toBe(false);
    // The improvised quorum opens it anyway — this is not a refusal module.
    expect(violation.opens).toBe(true);
    expect(violation.passed).toBe(66);
    // And the price is a past the two ends can no longer share.
    expect(lawful.causalLedgerIntact).toBe(true);
    expect(violation.causalLedgerIntact).toBe(false);
    expect(violation.attribution).toBe("CAUSE UNASSIGNED");
    expect(violation.safeMode).toBe("LEDGERS FORKED");
    expect(violation.constraints.join(" ")).toContain("cannot be used twice");
    expect(violation.constraints.join(" ")).toContain(String(IMPROVISED_LEDGER_COUNT));
  });

  it("holds when the coolant cannot absorb what the opening deposits", () => {
    const r = evaluatePorta({ ...portaConfig(), incident: "coolant-short" });
    expect(r.coolantHolds).toBe(false);
    expect(r.safeMode).toBe("THERMAL HOLD");
    expect(r.readiness).toBe("NO-GO");
  });
});

describe("the door is never the bottleneck", () => {
  it("leaves people behind at the slowest station, and names it", () => {
    const r = evaluatePorta({ ...portaConfig(), manifest: "bulk", openingMinutes: 80 });
    // Quarantine at three a minute clears 240 in eighty minutes, not 420.
    expect(r.bottleneck).toBe("QUARANTINE");
    expect(r.capacity).toBeCloseTo(240, 6);
    expect(Math.ceil(r.leftBehind)).toBe(180);
    expect(r.safeMode).toBe("PARTIAL TRANSIT");
    expect(r.constraints.join(" ")).toContain("is the limit, not the gate");
  });

  it("moves the limit when the slow station is widened", () => {
    const tight = evaluatePorta({ ...portaConfig(), manifest: "bulk", openingMinutes: 80 });
    const widened = evaluatePorta({
      ...portaConfig(),
      manifest: "bulk",
      openingMinutes: 80,
      quarantinePerMin: 30,
    });
    expect(widened.bottleneck).toBe("DECOMPRESSION");
    expect(widened.passed).toBeGreaterThan(tight.passed);
  });
});
