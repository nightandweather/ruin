export type CaptureMode = "non-invasive" | "implant-array" | "destructive-em";
export type MnemosyneIncident = "none" | "state-corruption" | "sensory-loss" | "fork-conflict";
export interface MnemosyneConfig {
  captureMode: CaptureMode;
  structuralCoveragePercent: number;
  synapseResolutionPercent: number;
  dynamicStatePercent: number;
  glialStatePercent: number;
  molecularStatePercent: number;
  recordingHours: number;
  memoryProbes: number;
  memoryAgreementPercent: number;
  behaviorAgreementPercent: number;
  sensoryEmbodimentPercent: number;
  consentVerified: boolean;
  originalAlive: boolean;
  instances: number;
  elapsedYears: number;
  incident: MnemosyneIncident;
}
export function mnemosyneConfig(): MnemosyneConfig {
  return {
    captureMode: "implant-array",
    structuralCoveragePercent: 18,
    synapseResolutionPercent: 8,
    dynamicStatePercent: 42,
    glialStatePercent: 5,
    molecularStatePercent: 2,
    recordingHours: 72,
    memoryProbes: 120,
    memoryAgreementPercent: 84,
    behaviorAgreementPercent: 78,
    sensoryEmbodimentPercent: 75,
    consentVerified: true,
    originalAlive: true,
    instances: 1,
    elapsedYears: 0,
    incident: "none",
  };
}
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export function evaluateMnemosyne(c: MnemosyneConfig) {
  const structural = clamp(c.structuralCoveragePercent),
    synaptic = clamp(c.synapseResolutionPercent),
    dynamic = clamp(c.dynamicStatePercent) * (c.incident === "state-corruption" ? 0.55 : 1),
    glial = clamp(c.glialStatePercent),
    molecular = clamp(c.molecularStatePercent),
    memory = clamp(c.memoryAgreementPercent),
    behavior = clamp(c.behaviorAgreementPercent),
    embodiment = clamp(c.sensoryEmbodimentPercent) * (c.incident === "sensory-loss" ? 0.2 : 1);
  const evidenceCoverage =
    Math.pow(
      Math.max(
        0.000001,
        ((((((((structural / 100) * synaptic) / 100) * dynamic) / 100) * glial) / 100) * molecular) / 100,
      ),
      1 / 5,
    ) * 100;
  const validationConfidence =
    Math.min(memory, behavior) *
    Math.min(1, Math.sqrt(Math.max(0, c.memoryProbes) / 500)) *
    Math.min(1, Math.log10(1 + Math.max(0, c.recordingHours)) / 3) *
    Math.min(1, embodiment / 70);
  const divergencePercent = clamp(
    (100 - behavior) * 0.35 +
      (100 - memory) * 0.25 +
      (100 - dynamic) * 0.18 +
      (100 - embodiment) * 0.12 +
      Math.max(0, c.elapsedYears) * 1.2 +
      (c.instances - 1) * 4 +
      (c.incident === "fork-conflict" ? 18 : 0),
  );
  const destructive = c.captureMode === "destructive-em",
    forked = c.instances > 1 || c.incident === "fork-conflict";
  const constraints = [
    ...(structural < 99 ? ["Whole-human structural capture is incomplete"] : []),
    ...(synaptic < 99 ? ["Synapse-scale wiring is incomplete"] : []),
    ...(dynamic < 90 ? ["Fast neural state is under-observed"] : []),
    ...(glial < 80 ? ["Glial and metabolic state is under-observed"] : []),
    ...(molecular < 80 ? ["Molecular and plasticity state is under-observed"] : []),
    ...(memory < 95 || behavior < 95 ? ["Behavioral identity tests do not meet continuity threshold"] : []),
    ...(embodiment < 70 || c.incident === "sensory-loss"
      ? ["Embodied sensory loop is insufficient for stable activation"]
      : []),
    ...(!c.consentVerified ? ["No verified consent exists for capture or activation"] : []),
    ...(forked ? ["Multiple active instances require independent personhood and authority"] : []),
    ...(destructive ? ["Capture destroys the biological specimen; continuity cannot be demonstrated"] : []),
    ...(c.incident === "state-corruption" ? ["State ledger integrity failed; snapshot is quarantined"] : []),
  ];
  const activationAllowed =
    c.consentVerified &&
    embodiment >= 70 &&
    memory >= 90 &&
    behavior >= 90 &&
    dynamic >= 80 &&
    c.incident !== "state-corruption";
  const identityStatus = !c.consentVerified
    ? "CONSENT HOLD"
    : c.incident === "state-corruption"
      ? "SNAPSHOT QUARANTINE"
      : forked
        ? "FORKED PERSONHOOD"
        : !activationAllowed
          ? "IDENTITY UNVERIFIED"
          : divergencePercent > 15
            ? "MEMORY DIVERGENCE"
            : "EVIDENCE-CANDIDATE";
  const readiness =
    identityStatus === "EVIDENCE-CANDIDATE"
      ? "CONDITIONAL"
      : identityStatus === "FORKED PERSONHOOD"
        ? "CONDITIONAL"
        : "NO-GO";
  return {
    structural,
    synaptic,
    dynamic,
    glial,
    molecular,
    memory,
    behavior,
    embodiment,
    evidenceCoverage,
    validationConfidence,
    divergencePercent,
    destructive,
    forked,
    activationAllowed,
    identityStatus,
    readiness,
    constraints,
    missingInformationPercent: 100 - evidenceCoverage,
  };
}
