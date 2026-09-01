import { describe, expect, it } from "vitest";
import { heliosCassette } from "../src/heliosCassette";
import { MAX_CAMPAIGN_EVENTS, runCivilizationCampaign, type CampaignEvent } from "../src/powerCampaign";

const quietCassette = () => heliosCassette("Quiet grid", [], { runToTick: 60 });
const blackoutCassette = () =>
  heliosCassette(
    "Blackout + surge",
    [
      { atTick: 5, action: "inject", params: { scenario: "communications-blackout" } },
      { atTick: 6, action: "inject", params: { scenario: "demand-spike" } },
    ],
    { runToTick: 12 },
  );

/** Walk an event's causes transitively; the trail must reach the incident. */
const reaches = (events: readonly CampaignEvent[], from: CampaignEvent, module: string): boolean => {
  const byId = new Map(events.map((e) => [e.id, e]));
  const queue = [...from.causes];
  const seen = new Set<number>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const event = byId.get(id);
    if (!event) return false;
    if (event.module === module) return true;
    queue.push(...event.causes);
  }
  return false;
};

describe("the civilization campaign", () => {
  it("replays the same cassette into the same civilization and the same trail", () => {
    const first = runCivilizationCampaign(blackoutCassette());
    const second = runCivilizationCampaign(blackoutCassette());
    expect(first).toEqual(second);
  });

  it("covers every ask on a quiet grid, and says so in the trail", () => {
    const outcome = runCivilizationCampaign(quietCassette());
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const r = outcome.result;
    expect(r.agrariaGrantMW).toBeCloseTo(r.agrariaAskMW, 9);
    expect(r.datacoreGrantMW).toBeCloseTo(r.datacoreAskMW, 9);
    expect(r.agraria.peopleFed).toBeCloseTo(r.agrariaBaseline.peopleFed, 9);
    expect(r.events.some((e) => e.kind === "settlement" && e.detail.includes("surplus"))).toBe(true);
    expect(r.events.filter((e) => e.kind === "consequence")).toEqual([]);
  });

  it("propagates one HELIOS incident into two downstream modules", () => {
    const outcome = runCivilizationCampaign(blackoutCassette());
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const r = outcome.result;
    // The blackout is a HELIOS event; the shortage lands on both consumers.
    expect(r.agrariaGrantMW).toBeLessThan(r.agrariaAskMW - 1e-9);
    expect(r.datacoreGrantMW).toBeLessThan(r.datacoreAskMW - 1e-9);
    // And each pays in its own engine's terms, not just in megawatts.
    expect(r.agraria.peopleFed).toBeLessThan(r.agrariaBaseline.peopleFed);
    expect(r.datacore.mode).not.toBe("compute");
  });

  it("keeps the trail explainable: every consequence walks back to HELIOS", () => {
    const outcome = runCivilizationCampaign(blackoutCassette());
    if (!outcome.ok) throw new Error(outcome.errors[0]);
    const consequences = outcome.result.events.filter((e) => e.kind === "consequence");
    expect(consequences.length).toBeGreaterThanOrEqual(2);
    expect(new Set(consequences.map((e) => e.module)).size).toBeGreaterThanOrEqual(2);
    for (const consequence of consequences) {
      expect(reaches(outcome.result.events, consequence, "helios")).toBe(true);
    }
  });

  it("declares priority at the settlement: food outranks compute", () => {
    const outcome = runCivilizationCampaign(blackoutCassette());
    if (!outcome.ok) throw new Error(outcome.errors[0]);
    const priority = outcome.result.state.ledgers.power.priority;
    expect(priority.indexOf("civilization")).toBeLessThan(priority.indexOf("agraria"));
    expect(priority.indexOf("agraria")).toBeLessThan(priority.indexOf("datacore"));
  });

  it("translates a curtailed grant into the farm's own language", () => {
    const outcome = runCivilizationCampaign(blackoutCassette());
    if (!outcome.ok) throw new Error(outcome.errors[0]);
    const r = outcome.result;
    // The adapter cut light-hours, and the engine computed the food price.
    const grant = r.events.find((e) => e.module === "agraria" && e.kind === "allocation")!;
    expect(grant.detail).toContain("photoperiod cut");
    expect(r.agraria.facilityPowerMW).toBeLessThan(r.agrariaBaseline.facilityPowerMW);
  });

  it("bounds the event queue and refuses cassettes the replay refuses", () => {
    const outcome = runCivilizationCampaign(blackoutCassette());
    if (!outcome.ok) throw new Error(outcome.errors[0]);
    expect(outcome.result.events.length).toBeLessThanOrEqual(MAX_CAMPAIGN_EVENTS);
    const refused = runCivilizationCampaign(heliosCassette("bad", [{ atTick: 0, action: "explode" }]));
    expect(refused.ok).toBe(false);
  });
});
