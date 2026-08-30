export type ActivityLevel = "low" | "moderate" | "high";

export interface StarSystemCandidate {
  id: string;
  name: string;
  distanceLy: number;
  spectralType: string;
  luminositySolar: number;
  ageGyr: number | null;
  confirmedPlanetCount: number;
  activity: ActivityLevel;
  materialAccess: number;
  orbitalSimplicity: number;
  note: string;
  sources: readonly string[];
}

export interface SurveyWeights {
  proximity: number;
  stability: number;
  energy: number;
  materials: number;
  orbitalSimplicity: number;
}

export interface SurveyResult extends StarSystemCandidate {
  score: number;
  strengths: readonly string[];
  cautions: readonly string[];
}

export const DEFAULT_SURVEY_WEIGHTS: SurveyWeights = {
  proximity: 30,
  stability: 25,
  energy: 15,
  materials: 20,
  orbitalSimplicity: 10,
};

// Catalog values are snapshots, not promises of habitability or constructability.
// Distances and stellar parameters: NASA Exoplanet Archive, queried 2026-08-30.
export const STAR_SYSTEMS: readonly StarSystemCandidate[] = [
  {
    id: "sol",
    name: "Solar System",
    distanceLy: 0,
    spectralType: "G2 V",
    luminositySolar: 1,
    ageGyr: 4.6,
    confirmedPlanetCount: 8,
    activity: "low",
    materialAccess: 100,
    orbitalSimplicity: 88,
    note: "The only candidate without an interstellar bootstrap problem; HELIOS baseline.",
    sources: ["https://science.nasa.gov/sun/facts/"],
  },
  {
    id: "epsilon-eridani",
    name: "Epsilon Eridani",
    distanceLy: 10.45,
    spectralType: "K2 V",
    luminositySolar: 0.381,
    ageGyr: 0.6,
    confirmedPlanetCount: 1,
    activity: "high",
    materialAccess: 95,
    orbitalSimplicity: 68,
    note: "Nearby and debris-rich, but its youth and activity make autonomous operations harder.",
    sources: [
      "https://exoplanetarchive.ipac.caltech.edu/overview/eps%20Eri",
      "https://science.nasa.gov/universe/exoplanets/sofia-confirms-nearby-planetary-system-is-similar-to-our-own/",
    ],
  },
  {
    id: "tau-ceti",
    name: "Tau Ceti",
    distanceLy: 11.75,
    spectralType: "G8.5 V",
    luminositySolar: 0.495,
    ageGyr: 12.12,
    confirmedPlanetCount: 3,
    activity: "low",
    materialAccess: 78,
    orbitalSimplicity: 82,
    note: "Old, nearby Sun-like target. Planet signals remain disputed, so resources are uncertain.",
    sources: [
      "https://exoplanetarchive.ipac.caltech.edu/overview/tau%20Cet",
      "https://science.nasa.gov/the-science-behind-project-hail-mary/",
    ],
  },
  {
    id: "proxima-centauri",
    name: "Proxima Centauri",
    distanceLy: 4.24,
    spectralType: "M5.5 V",
    luminositySolar: 0.00151,
    ageGyr: null,
    confirmedPlanetCount: 2,
    activity: "high",
    materialAccess: 48,
    orbitalSimplicity: 72,
    note: "Nearest known planetary system; low luminosity compresses a collector swarm close to a flare star.",
    sources: ["https://exoplanetarchive.ipac.caltech.edu/overview/Proxima%20Cen"],
  },
  {
    id: "trappist-1",
    name: "TRAPPIST-1",
    distanceLy: 40.54,
    spectralType: "M8.0 V",
    luminositySolar: 0.000553,
    ageGyr: 7.6,
    confirmedPlanetCount: 7,
    activity: "moderate",
    materialAccess: 70,
    orbitalSimplicity: 54,
    note: "A compact seven-planet laboratory, but distant and extremely dim with crowded inner orbits.",
    sources: ["https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1"],
  },
];

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function rankStarSystems(weights: SurveyWeights = DEFAULT_SURVEY_WEIGHTS): SurveyResult[] {
  const totalWeight = Math.max(
    1,
    Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0),
  );
  return STAR_SYSTEMS.map((system) => {
    const proximity = 100 * Math.exp(-system.distanceLy / 12);
    const stability = system.activity === "low" ? 94 : system.activity === "moderate" ? 66 : 34;
    // Log scaling prevents a Sun-like star from making dim red dwarfs appear to have zero usable energy.
    const energy = clamp(100 + 20 * Math.log10(system.luminositySolar));
    const score =
      (proximity * weights.proximity +
        stability * weights.stability +
        energy * weights.energy +
        system.materialAccess * weights.materials +
        system.orbitalSimplicity * weights.orbitalSimplicity) /
      totalWeight;
    const strengths = [
      ...(system.distanceLy < 5 ? ["shortest supply latency"] : []),
      ...(system.activity === "low" ? ["quiet-star operations"] : []),
      ...(system.materialAccess >= 75 ? ["strong material inventory signal"] : []),
      ...(system.luminositySolar >= 0.3 ? ["high collector yield per unit area"] : []),
    ];
    const cautions = [
      ...(system.activity === "high" ? ["flare and radiation hardening"] : []),
      ...(system.distanceLy > 20 ? ["multi-decade bootstrap latency"] : []),
      ...(system.luminositySolar < 0.01 ? ["tight, thermally crowded swarm"] : []),
      ...(system.id === "tau-ceti" ? ["planet detections are disputed"] : []),
    ];
    return { ...system, score: Number(score.toFixed(1)), strengths, cautions };
  }).sort((left, right) => right.score - left.score);
}
