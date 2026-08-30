import { describe, expect, it } from "vitest";
import { evaluateReliquary, MEDIA_META, reliquaryConfig } from "../src/reliquary";

describe("RELIQUARY century-scale preservation", () => {
  it("is deterministic — same configuration, same trajectory", () => {
    const c = reliquaryConfig();
    expect(evaluateReliquary(c).trajectory).toEqual(evaluateReliquary(c).trajectory);
  });

  it("survives longer with more independent copies", () => {
    const c = reliquaryConfig();
    expect(evaluateReliquary({ ...c, copies: 5 }).survivalAtHorizon).toBeGreaterThan(
      evaluateReliquary({ ...c, copies: 2 }).survivalAtHorizon,
    );
  });

  it("survives longer on century-class media than on disks", () => {
    const c = reliquaryConfig();
    expect(evaluateReliquary({ ...c, media: "fused-silica" }).survivalAtHorizon).toBeGreaterThan(
      evaluateReliquary({ ...c, media: "hard-disk" }).survivalAtHorizon,
    );
    expect(MEDIA_META["fused-silica"].halfLifeYears).toBeGreaterThan(MEDIA_META["hard-disk"].halfLifeYears);
  });

  it("rewards frequent scrubbing — corruption caught is corruption repaired", () => {
    const c = { ...reliquaryConfig(), media: "hard-disk" as const };
    expect(evaluateReliquary({ ...c, scrubIntervalYears: 1 }).survivalAtHorizon).toBeGreaterThan(
      evaluateReliquary({ ...c, scrubIntervalYears: 8 }).survivalAtHorizon,
    );
  });

  it("counts unrehearsed backups as zero copies — the invariant", () => {
    const r = evaluateReliquary({ ...reliquaryConfig(), rehearsalIntervalYears: 0 });
    expect(r.countedCopies).toBe(0);
    expect(r.readiness).toBe("NO-GO");
    expect(r.constraints.some((x) => x.includes("rumor"))).toBe(true);
  });

  it("fails readability when migration cannot outpace reader extinction", () => {
    const r = evaluateReliquary({
      ...reliquaryConfig(),
      migrationIntervalYears: 40,
      formatLifeYears: 25,
    });
    expect(r.readabilityHeld).toBe(false);
    expect(r.survivalAtHorizon).toBeLessThan(
      evaluateReliquary({ ...reliquaryConfig(), migrationIntervalYears: 10 }).survivalAtHorizon,
    );
  });

  it("halves the remaining format life under reader extinction", () => {
    const r = evaluateReliquary({
      ...reliquaryConfig(),
      migrationIntervalYears: 20,
      formatLifeYears: 30,
      incident: "reader-extinction",
    });
    expect(r.readabilityHeld).toBe(false);
    expect(r.safeMode).toBe("EMERGENCY MIGRATION");
  });

  it("decays institutional memory when curators are lost", () => {
    const c = reliquaryConfig();
    const lost = evaluateReliquary({ ...c, incident: "curator-loss" });
    expect(lost.knowledgeAtHorizon).toBeLessThan(evaluateReliquary(c).knowledgeAtHorizon);
    expect(lost.constraints.some((x) => x.includes("Curator coverage"))).toBe(true);
  });
});
