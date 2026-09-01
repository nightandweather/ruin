import { describe, expect, it } from "vitest";
import {
  CHRONOS_SITES,
  chronosConfig,
  evaluateChronos,
  humanDuration,
  lorentzFactor,
  relate,
  type ChronosEvent,
} from "../src/chronos";

const event = (
  distanceLs: number,
  coordinateS: number,
  id = `${distanceLs}@${coordinateS}`,
): ChronosEvent => ({
  id,
  siteId: id,
  siteName: id,
  coordinateS,
  localS: coordinateS,
  arrivalS: coordinateS + distanceLs,
  distanceLs,
});

describe("CHRONOS simultaneity and causal order", () => {
  it("is deterministic — same network, same ledger", () => {
    const c = chronosConfig();
    expect(evaluateChronos(c).events).toEqual(evaluateChronos(c).events);
  });

  it("calls two events concurrent exactly when no signal could connect them", () => {
    // Ten light-seconds apart, five seconds apart in time: nothing crosses.
    expect(relate(event(0, 0), event(10, 5))).toBe("concurrent");
    // Same separation, twenty seconds apart: light has time, order is real.
    expect(relate(event(0, 0), event(10, 20))).toBe("before");
    expect(relate(event(10, 20), event(0, 0))).toBe("after");
    // Exactly lightlike is still ordered — a signal connects them.
    expect(relate(event(0, 0), event(10, 10))).toBe("before");
    // Same place is always ordered, however small the gap.
    expect(relate(event(7, 0), event(7, 0.001))).toBe("before");
  });

  it("orders by receipt without ever inverting cause and effect", () => {
    const r = evaluateChronos({ ...chronosConfig(), policy: "arrival" });
    // Arrival order is a valid linear extension of causality: a report cannot
    // reach the station before a report of the thing that caused it.
    expect(r.inverted).toBe(0);
    // But it invents an order for every spacelike pair, and there are many.
    expect(r.fabricated).toBe(r.spacelikePairs);
    expect(r.spacelikePairs).toBeGreaterThan(50);
    expect(r.ledgerHonest).toBe(false);
  });

  it("puts effects before their causes when it trusts local timestamps", () => {
    const r = evaluateChronos({ ...chronosConfig(), policy: "timestamp" });
    // A clock running slow reports smaller numbers, so a later event on the
    // cruiser can be filed ahead of an earlier one elsewhere.
    expect(r.inverted).toBeGreaterThan(0);
    expect(r.faults.some((fault) => fault.kind === "inverted")).toBe(true);
    const still = evaluateChronos({ ...chronosConfig(), policy: "timestamp", cruiserVelocityC: 0 });
    // With every clock at the same rate the inversions disappear; they were
    // relativity, not a bug in the recorder.
    expect(still.inverted).toBe(0);
  });

  it("refuses a ledger that claims an order the universe does not have", () => {
    for (const policy of ["arrival", "timestamp"] as const) {
      const r = evaluateChronos({ ...chronosConfig(), policy });
      expect(r.ledgerHonest).toBe(false);
      expect(r.readiness).toBe("NO-GO");
      expect(r.safeMode).toBe("LEDGER REFUSED");
    }
    const partial = evaluateChronos({ ...chronosConfig(), policy: "partial" });
    expect(partial.fabricated).toBe(0);
    expect(partial.inverted).toBe(0);
    expect(partial.ledgerHonest).toBe(true);
    expect(partial.readiness).not.toBe("NO-GO");
    // Honest does not mean comfortable: the network still has no shared now.
    expect(partial.readiness).toBe("CONDITIONAL");
  });

  it("keeps a shared present only inside half the synchronisation tolerance", () => {
    const tight = evaluateChronos({ ...chronosConfig(), policy: "partial", syncToleranceS: 60 });
    expect(tight.nowRadiusLs).toBe(30);
    // Only the Moon is inside thirty light-seconds.
    expect(tight.sharedNowCount).toBe(1);
    const loose = evaluateChronos({ ...chronosConfig(), policy: "partial", syncToleranceS: 86_400 });
    expect(loose.sharedNowCount).toBeGreaterThan(tight.sharedNowCount);
    // No tolerance a civilization would accept reaches Proxima: agreeing on
    // "now" with it requires tolerating more than eight years of disagreement.
    const proxima = CHRONOS_SITES.find((site) => site.id === "proxima")!;
    expect(loose.roster.find((site) => site.id === "proxima")!.sharesNow).toBe(false);
    expect(2 * proxima.distanceLs).toBeGreaterThan(86_400);
  });

  it("admits a command only when the state it answers is inside the window", () => {
    const r = evaluateChronos({ ...chronosConfig(), policy: "partial", decisionWindowS: 3600 });
    const site = (id: string) => r.roster.find((entry) => entry.id === id)!;
    expect(site("foundry").commandAdmitted).toBe(true);
    expect(site("helios").commandAdmitted).toBe(true);
    // Jupiter is seventy minutes of round trip; an hour is not enough.
    expect(site("waystation").commandAdmitted).toBe(false);
    expect(site("waystation").roundTripS).toBeGreaterThan(3600);
    const patient = evaluateChronos({ ...chronosConfig(), policy: "partial", decisionWindowS: 86_400 });
    expect(patient.admittedCount).toBeGreaterThan(r.admittedCount);
  });

  it("expires delegated authority that cannot be refreshed in time", () => {
    const r = evaluateChronos({ ...chronosConfig(), policy: "partial", grantValidityS: 86_400 });
    // A grant is only holdable if a refresh can make the round trip inside it.
    for (const site of r.roster) {
      expect(site.authorityHeld).toBe(site.roundTripS < 86_400);
    }
    expect(r.autonomousCount).toBeGreaterThan(0);
    expect(r.safeMode).toBe("PARTIAL ORDER · LOCAL AUTONOMY");
  });

  it("lets a relay outage make a broken recorder look correct", () => {
    const heard = evaluateChronos({ ...chronosConfig(), policy: "timestamp" });
    const deaf = evaluateChronos({ ...chronosConfig(), policy: "timestamp", incident: "relay-outage" });
    // The recording policy did not change. The distant sites simply stopped
    // arriving, and with them every pair that exposed the policy.
    expect(heard.ledgerHonest).toBe(false);
    expect(deaf.ledgerHonest).toBe(true);
    expect(deaf.eventsLost).toBeGreaterThan(0);
    expect(deaf.spacelikePairs).toBe(0);
    expect(deaf.constraints.some((x) => x.includes("never reached the ledger"))).toBe(true);
  });

  it("breaks timestamp ordering further when a ship changes frame mid-run", () => {
    const steady = evaluateChronos({ ...chronosConfig(), policy: "timestamp" });
    const shifted = evaluateChronos({ ...chronosConfig(), policy: "timestamp", incident: "frame-shift" });
    expect(shifted.inverted).toBeGreaterThan(steady.inverted);
    // The partial order is indifferent: it never depended on the clocks.
    expect(
      evaluateChronos({ ...chronosConfig(), policy: "partial", incident: "frame-shift" }).ledgerHonest,
    ).toBe(true);
  });

  it("takes the last shared present away with a drifting oscillator", () => {
    const clean = evaluateChronos({ ...chronosConfig(), policy: "partial" });
    const drifted = evaluateChronos({ ...chronosConfig(), policy: "partial", incident: "clock-drift" });
    expect(clean.sharedNowCount).toBe(1);
    // A perfect link to a drifting clock buys no shared present at all.
    expect(drifted.sharedNowCount).toBe(0);
    expect(drifted.roster.find((site) => site.id === "foundry")!.roundTripS).toBeLessThan(60);
    expect(drifted.constraints.some((x) => x.includes("no shared present anywhere"))).toBe(true);
  });

  it("accrues less proper time on the moving clock, by the Lorentz factor", () => {
    const r = evaluateChronos({ ...chronosConfig(), policy: "partial", cruiserVelocityC: 0.6 });
    const cruiser = r.roster.find((site) => site.id === "cruiser")!;
    expect(cruiser.gamma).toBeCloseTo(1.25, 6);
    expect(cruiser.properWindowS).toBeCloseTo(r.windowS / 1.25, 3);
    expect(r.maxClockGapS).toBeCloseTo(r.windowS * (1 - 1 / 1.25), 3);
    const still = evaluateChronos({ ...chronosConfig(), policy: "partial", cruiserVelocityC: 0 });
    expect(still.maxClockGapS).toBeCloseTo(0, 6);
    expect(lorentzFactor(0)).toBe(1);
    expect(lorentzFactor(0.8)).toBeCloseTo(1 / 0.6, 6);
  });

  it("renders a duration in a unit an operator can read", () => {
    expect(humanDuration(2.56)).toBe("2.56 s");
    expect(humanDuration(600)).toBe("10.0 min");
    expect(humanDuration(4193)).toBe("69.9 min");
    expect(humanDuration(39_920)).toBe("11.1 h");
    expect(humanDuration(3.15576e7)).toBe("1.00 yr");
    expect(humanDuration(Infinity)).toBe("∞");
  });
});
