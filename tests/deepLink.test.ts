import { describe, expect, it } from "vitest";
import { readDeepLink, readDeepLinkFlag } from "../src/deepLink";

const POLICIES = ["counted-first", "uniform", "vulnerable-first"] as const;

describe("deep links", () => {
  it("selects an allowed value and ignores everything else", () => {
    expect(readDeepLink("policy", POLICIES, "counted-first", "?policy=uniform")).toBe("uniform");
    expect(readDeepLink("policy", POLICIES, "counted-first", "?policy=UNIFORM")).toBe("uniform");
    expect(readDeepLink("policy", POLICIES, "counted-first", "?policy=%20uniform%20")).toBe("uniform");
  });

  it("falls back silently rather than leaving a page unable to render", () => {
    for (const search of ["", "?", "?policy=", "?policy=nonsense", "?other=uniform", "?%%%"]) {
      expect(readDeepLink("policy", POLICIES, "counted-first", search)).toBe("counted-first");
    }
  });

  it("never returns a value outside the allowed set", () => {
    const injected = readDeepLink("policy", POLICIES, "counted-first", "?policy=<script>");
    expect(POLICIES).toContain(injected);
  });

  it("reads a switch in the spellings a person would actually type", () => {
    expect(readDeepLinkFlag("disclose", true, "?disclose=off")).toBe(false);
    expect(readDeepLinkFlag("disclose", true, "?disclose=false")).toBe(false);
    expect(readDeepLinkFlag("disclose", true, "?disclose=0")).toBe(false);
    expect(readDeepLinkFlag("disclose", false, "?disclose=on")).toBe(true);
    expect(readDeepLinkFlag("disclose", false, "?disclose=1")).toBe(true);
    // Anything else keeps the module's own default.
    expect(readDeepLinkFlag("disclose", true, "?disclose=maybe")).toBe(true);
    expect(readDeepLinkFlag("disclose", false, "")).toBe(false);
  });

  it("works outside a browser, where there is no location at all", () => {
    // The default argument reads globalThis.location; under the node test
    // environment there is none, and the fallback must still be returned.
    expect(readDeepLink("policy", POLICIES, "uniform")).toBe("uniform");
    expect(readDeepLinkFlag("disclose", true)).toBe(true);
  });
});
