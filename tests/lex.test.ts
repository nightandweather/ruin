import { describe, expect, it } from "vitest";
import {
  BINDING_FLOOR,
  DENUNCIATION_NOTICE_YEARS,
  evaluateLex,
  instrumentsGroundedFraction,
  LEX_ACTIVITIES,
  LEX_INSTRUMENTS,
  lexConfig,
} from "../src/lex";

describe("LEX instrument register", () => {
  it("quotes every instrument from a source", () => {
    for (const instrument of LEX_INSTRUMENTS) {
      expect(instrument.grounding).toBe("sourced");
      expect(instrument.provision.length).toBeGreaterThan(30);
      expect(instrument.source.length).toBeGreaterThan(30);
      expect(instrument.year).toBeGreaterThan(1900);
    }
    expect(instrumentsGroundedFraction()).toBe(1);
  });

  it("records how little of the spacefaring world the Moon Agreement binds", () => {
    const ost = LEX_INSTRUMENTS.find((i) => i.id === "ost")!;
    const moon = LEX_INSTRUMENTS.find((i) => i.id === "moon")!;
    // 118 parties including every major spacefaring nation, against 17 that
    // include none of them. The asymmetry is the reason resource extraction
    // is contested in practice and not in the model's verdict.
    expect(ost.partiesFraction).toBeGreaterThan(0.9);
    expect(moon.partiesFraction).toBeLessThan(0.15);
  });

  it("is deterministic", () => {
    const c = lexConfig();
    expect(evaluateLex(c).verdicts).toEqual(evaluateLex(c).verdicts);
  });
});

describe("lawfulness does not depend on who can reach you", () => {
  it("keeps a prohibited act prohibited from one light-second to four light-years", () => {
    const distances = [1, 500, 2e4, 3.15576e7, 1.34e8];
    const verdicts = distances.map((distanceLs) => evaluateLex({ ...lexConfig(), distanceLs }));
    // The invariant: enforcement decay is not repeal.
    for (const r of verdicts) {
      expect(r.lawful).toBe(false);
      expect(r.verdict).toBe("UNLAWFUL");
      expect(r.readiness).toBe("NO-GO");
    }
    // Only enforceability moves, and the model says so in as many words.
    expect(verdicts[0].enforceable).toBe(true);
    expect(verdicts.at(-1)!.enforceable).toBe(false);
    expect(verdicts.at(-1)!.impunity).toBe(true);
    expect(verdicts.at(-1)!.constraints.join(" ")).toContain("Unenforceable is not permitted");
  });

  it("reports impunity without ever converting it into permission", () => {
    const unreachable = evaluateLex({ ...lexConfig(), incident: "enforcement-gap" });
    expect(unreachable.enforceable).toBe(false);
    expect(unreachable.impunity).toBe(true);
    expect(unreachable.lawful).toBe(false);
    expect(unreachable.safeMode).toBe("UNLAWFUL · UNENFORCEABLE");
  });
});

describe("instruments lose force in the ways they actually lose force", () => {
  it("treats denunciation as prospective, and never as retroactive", () => {
    // Inside the notice period the treaty still governs the act outright.
    const inNotice = evaluateLex({ ...lexConfig(), incident: "denunciation", yearsElapsed: 0 });
    expect(inNotice.lawful).toBe(false);
    expect(DENUNCIATION_NOTICE_YEARS).toBe(1);
    // Long after, the withdrawal has taken effect and force is reduced —
    // but the constraint register still says withdrawal is not retroactive.
    const after = evaluateLex({ ...lexConfig(), incident: "denunciation" });
    expect(after.constraints.join(" ")).toContain("never retroactively");
  });

  it("keeps residual force in a treaty nobody is left to recognise", () => {
    const orphaned = evaluateLex({ ...lexConfig(), incident: "successor-lapse" });
    expect(orphaned.recognition).toBe(0);
    // A treaty does not become nothing because its signatory is gone. The
    // Outer Space Treaty still binds the act at zero recognition.
    const ost = orphaned.verdicts.find((v) => v.instrument.id === "ost")!;
    expect(ost.binding).toBeGreaterThanOrEqual(BINDING_FLOOR);
    expect(ost.binds).toBe(true);
    expect(orphaned.lawful).toBe(false);
  });

  it("lets recognition decay carry the weakest instruments below the floor", () => {
    const fresh = evaluateLex({ ...lexConfig(), yearsElapsed: 0, successorRecognition: 1 });
    const ancient = evaluateLex({ ...lexConfig(), yearsElapsed: 900, successorRecognition: 1 });
    expect(ancient.recognition).toBeLessThan(fresh.recognition);
    const binding = (r: typeof fresh, id: string) => r.verdicts.find((v) => v.instrument.id === id)!.binding;
    expect(binding(ancient, "artemis")).toBeLessThan(binding(fresh, "artemis"));
    // The non-binding arrangement goes first; the treaty is the last to fade.
    expect(binding(ancient, "artemis")).toBeLessThan(binding(ancient, "ost"));
  });
});

describe("what the register says about RUIN's own activities", () => {
  it("finds the flagship prima facie unlawful under the treaty it inherited", () => {
    const helios = evaluateLex({ ...lexConfig(), activity: "stellar-collection" });
    expect(helios.verdict).toBe("UNLAWFUL");
    const ost = helios.verdicts.find((v) => v.instrument.id === "ost")!;
    expect(ost.stance).toBe("prohibits");
    expect(ost.instrument.provision).toContain("national appropriation");
    // A star is a celestial body, and a swarm that intercepts its output uses
    // and occupies it — which is what Art. II names.
    expect(ost.instrument.provision).toContain("use or occupation");
  });

  it("lets the national statutes permit what the treaty only restricts", () => {
    const mining = evaluateLex({ ...lexConfig(), activity: "resource-extraction" });
    expect(mining.lawful).toBe(true);
    expect(mining.verdict).toBe("CONDITIONALLY LAWFUL");
    // The Moon Agreement prohibits it and is not in force where it matters,
    // which is why the model does not record it as a binding prohibition.
    const moon = mining.verdicts.find((v) => v.instrument.id === "moon")!;
    expect(moon.stance).toBe("prohibits");
    expect(moon.binds).toBe(false);
  });

  it("refuses to read silence as permission", () => {
    const census = evaluateLex({ ...lexConfig(), activity: "personhood-classification" });
    expect(census.undetermined).toBe(true);
    expect(census.verdict).toBe("UNGOVERNED");
    // Ungoverned is not GO. Nothing in space law reaches who counts as a
    // person, and that absence is a finding rather than a clearance.
    expect(census.readiness).not.toBe("GO");
    expect(census.constraints.join(" ")).toContain("silence is the finding");
  });

  it("gives every activity a laboratory that performs it", () => {
    for (const activity of LEX_ACTIVITIES) {
      expect(activity.module.length).toBeGreaterThan(2);
      expect(activity.detail.length).toBeGreaterThan(20);
      for (const id of Object.keys(activity.stances)) {
        expect(
          LEX_INSTRUMENTS.some((i) => i.id === id),
          `unknown instrument ${id}`,
        ).toBe(true);
      }
    }
  });
});
