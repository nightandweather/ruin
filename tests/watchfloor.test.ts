import { describe, expect, it } from "vitest";
import {
  AUTHORITY_QUEUE_CAP,
  AUTHORITY_RECOVERY,
  BASE_CRITICAL_WINDOW,
  evaluateWatchfloor,
  MISSED_CRITICAL_LIMIT,
  watchfloorConfig,
} from "../src/watchfloor";

describe("WATCHFLOOR operator-loading model", () => {
  it("is deterministic — same watch, same minute-by-minute record", () => {
    const c = watchfloorConfig();
    expect(evaluateWatchfloor(c).trajectory).toEqual(evaluateWatchfloor(c).trajectory);
  });

  it("holds a nominal watch without losing an intervention", () => {
    const r = evaluateWatchfloor(watchfloorConfig());
    expect(r.missedCriticals).toBeLessThan(MISSED_CRITICAL_LIMIT);
    expect(r.peakQueue).toBeLessThan(AUTHORITY_QUEUE_CAP);
    expect(r.authorityWithdrawnMinutes).toBe(0);
    expect(r.readiness).toBe("GO");
  });

  it("withdraws irreversible authority while the floor is saturated — fail-closed", () => {
    const r = evaluateWatchfloor({ ...watchfloorConfig(), incident: "alarm-flood" });
    expect(r.saturationMinute).not.toBeNull();
    expect(r.withdrawnAt).not.toBeNull();
    expect(r.authorityWithdrawnMinutes).toBeGreaterThan(0);
    // Authority is never held while the queue is over the cap...
    for (const minute of r.trajectory) {
      if (minute.queue > AUTHORITY_QUEUE_CAP) expect(minute.authority).toBe(false);
    }
    // ...and never returns until the queue is genuinely drained (hysteresis).
    for (let i = 1; i < r.trajectory.length; i += 1) {
      if (!r.trajectory[i - 1].authority && r.trajectory[i].authority) {
        expect(r.trajectory[i].queue).toBeLessThan(AUTHORITY_RECOVERY);
      }
    }
  });

  it("buries a critical alarm under volume rather than under a decision", () => {
    const quiet = evaluateWatchfloor(watchfloorConfig());
    const flood = evaluateWatchfloor({ ...watchfloorConfig(), incident: "alarm-flood" });
    expect(flood.agedOutCriticals).toBeGreaterThan(quiet.agedOutCriticals);
    expect(flood.meanAckLatency).toBeGreaterThan(quiet.meanAckLatency);
    expect(flood.readiness).toBe("NO-GO");
  });

  it("loses real criticals to a crew that stopped believing the alarms", () => {
    const r = evaluateWatchfloor({ ...watchfloorConfig(), incident: "cry-wolf" });
    // The queue never saturates: nothing on the board looks wrong at all.
    expect(r.peakQueue).toBeLessThan(AUTHORITY_QUEUE_CAP);
    expect(r.authorityWithdrawnMinutes).toBe(0);
    expect(r.dismissedCriticals).toBeGreaterThan(MISSED_CRITICAL_LIMIT);
    expect(r.readiness).toBe("NO-GO");
    expect(r.constraints.some((x) => x.includes("written off as spurious"))).toBe(true);
  });

  it("shortens the decision window by the signal delay, not the schedule", () => {
    const near = evaluateWatchfloor({ ...watchfloorConfig(), signalDelayMinutes: 0 });
    const far = evaluateWatchfloor({ ...watchfloorConfig(), signalDelayMinutes: 14 });
    expect(near.window).toBe(BASE_CRITICAL_WINDOW);
    expect(far.window).toBe(BASE_CRITICAL_WINDOW - 14);
    expect(far.window).toBeLessThan(near.window);
    const hopeless = evaluateWatchfloor({ ...watchfloorConfig(), signalDelayMinutes: BASE_CRITICAL_WINDOW });
    expect(hopeless.constraints.some((x) => x.includes("no command can arrive in time"))).toBe(true);
  });

  it("makes handover cost work rather than save it", () => {
    const c = { ...watchfloorConfig(), alarmRate: 5 };
    const oneShift = evaluateWatchfloor({ ...c, shiftMinutes: 1000 });
    const changing = evaluateWatchfloor({ ...c, shiftMinutes: 60 });
    expect(changing.handovers).toBeGreaterThan(oneShift.handovers);
    expect(changing.peakQueue).toBeGreaterThan(oneShift.peakQueue);
    // Losing context is not free even when nothing else goes wrong.
    const clean = evaluateWatchfloor({ ...c, shiftMinutes: 60, handoverLossRate: 0 });
    expect(clean.peakQueue).toBeLessThan(changing.peakQueue);
  });

  it("degrades with the crew, not just with the plant", () => {
    const full = evaluateWatchfloor(watchfloorConfig());
    const thin = evaluateWatchfloor({ ...watchfloorConfig(), operators: 1 });
    // Identical alarm stream; only the number of people changed.
    expect(thin.trajectory.map((m) => m.arrivals)).toEqual(full.trajectory.map((m) => m.arrivals));
    expect(thin.peakQueue).toBeGreaterThan(full.peakQueue);
    expect(thin.minAttention).toBeLessThan(full.minAttention);
  });

  it("lets automation buy back routine load without ever touching criticals", () => {
    const manual = evaluateWatchfloor({ ...watchfloorConfig(), automationAuthority: 0 });
    const assisted = evaluateWatchfloor({ ...watchfloorConfig(), automationAuthority: 0.8 });
    expect(assisted.peakQueue).toBeLessThan(manual.peakQueue);
    // Raising machine authority never reduces the critical arrival stream:
    // the machine is not permitted to close an irreversible alarm alone.
    const criticals = (r: typeof manual) => r.trajectory.reduce((sum, m) => sum + m.arrivals, 0);
    expect(criticals(assisted)).toBeCloseTo(criticals(manual), 9);
  });

  it("never reports negative queues or acknowledges alarms it did not receive", () => {
    for (const incident of [
      "none",
      "alarm-flood",
      "console-loss",
      "cry-wolf",
      "handover-collision",
    ] as const) {
      const r = evaluateWatchfloor({ ...watchfloorConfig(), incident });
      for (const minute of r.trajectory) {
        expect(minute.queue).toBeGreaterThanOrEqual(0);
        expect(minute.criticals).toBeGreaterThanOrEqual(0);
        expect(minute.attention).toBeGreaterThan(0);
        expect(minute.attention).toBeLessThanOrEqual(1);
      }
      expect(r.missedCriticals).toBeCloseTo(r.agedOutCriticals + r.dismissedCriticals, 9);
    }
  });
});
