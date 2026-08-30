export type StarKind = "home" | "landmark" | "planet-host" | "survey-target";

export interface AtlasStar {
  id: string;
  name: string;
  raDeg: number;
  decDeg: number;
  distancePc: number;
  spectralType: string;
  planetCount: number;
  kind: StarKind;
  source: "SIMBAD" | "NASA Exoplanet Archive" | "NASA";
}

export interface CartesianStar extends AtlasStar {
  xLy: number;
  yLy: number;
  zLy: number;
  distanceLy: number;
}

const PC_TO_LY = 3.26156;
const fromParallax = (milliarcseconds: number) => 1000 / milliarcseconds;

// Curated map snapshot queried 2026-08-30. It is not the full Gaia nearby-star catalogue.
// ICRS coordinates and parallax landmarks: SIMBAD. Confirmed hosts: NASA Exoplanet Archive pscomppars.
export const ATLAS_STARS: readonly AtlasStar[] = [
  {
    id: "sol",
    name: "Sol",
    raDeg: 0,
    decDeg: 0,
    distancePc: 0,
    spectralType: "G2 V",
    planetCount: 8,
    kind: "home",
    source: "NASA",
  },
  {
    id: "proxima",
    name: "Proxima Centauri",
    raDeg: 217.428942,
    decDeg: -62.67949,
    distancePc: fromParallax(768.0665),
    spectralType: "M5.5 Ve",
    planetCount: 2,
    kind: "survey-target",
    source: "SIMBAD",
  },
  {
    id: "alpha-cen",
    name: "Alpha Centauri AB",
    raDeg: 219.902083,
    decDeg: -60.833972,
    distancePc: fromParallax(750.81),
    spectralType: "G2 V + K1 V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "barnard",
    name: "Barnard's Star",
    raDeg: 269.452077,
    decDeg: 4.693365,
    distancePc: fromParallax(546.9759),
    spectralType: "M4 V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "wolf-359",
    name: "Wolf 359",
    raDeg: 164.120504,
    decDeg: 7.014723,
    distancePc: fromParallax(415.1794),
    spectralType: "M6",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "lalande-21185",
    name: "Lalande 21185",
    raDeg: 165.834145,
    decDeg: 35.969882,
    distancePc: fromParallax(392.7529),
    spectralType: "M2 V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "sirius",
    name: "Sirius",
    raDeg: 101.287155,
    decDeg: -16.716116,
    distancePc: fromParallax(379.21),
    spectralType: "A1 V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "procyon",
    name: "Procyon",
    raDeg: 114.825498,
    decDeg: 5.224988,
    distancePc: fromParallax(284.56),
    spectralType: "F5 IV-V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "ross-154",
    name: "Ross 154",
    raDeg: 282.455682,
    decDeg: -23.836235,
    distancePc: fromParallax(336.0266),
    spectralType: "M3.5 Ve",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "ross-248",
    name: "Ross 248",
    raDeg: 355.479318,
    decDeg: 44.17745,
    distancePc: fromParallax(316.4812),
    spectralType: "M5 V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "epsilon-eri",
    name: "Epsilon Eridani",
    raDeg: 53.232685,
    decDeg: -9.458261,
    distancePc: fromParallax(310.5773),
    spectralType: "K2 V",
    planetCount: 1,
    kind: "survey-target",
    source: "SIMBAD",
  },
  {
    id: "lacaille-9352",
    name: "Lacaille 9352 / GJ 887",
    raDeg: 346.502757,
    decDeg: -35.847349,
    distancePc: 3.28679,
    spectralType: "M1 V",
    planetCount: 4,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "ross-128",
    name: "Ross 128",
    raDeg: 176.937604,
    decDeg: 0.79929,
    distancePc: 3.37454,
    spectralType: "M4",
    planetCount: 1,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "tau-ceti",
    name: "Tau Ceti",
    raDeg: 26.017013,
    decDeg: -15.93748,
    distancePc: fromParallax(273.8097),
    spectralType: "G8 V",
    planetCount: 3,
    kind: "survey-target",
    source: "SIMBAD",
  },
  {
    id: "epsilon-indi",
    name: "Epsilon Indi",
    raDeg: 330.840223,
    decDeg: -56.785979,
    distancePc: fromParallax(274.8431),
    spectralType: "K5 V",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "teegarden",
    name: "Teegarden's Star",
    raDeg: 43.253716,
    decDeg: 16.881287,
    distancePc: fromParallax(260.9884),
    spectralType: "M6",
    planetCount: 0,
    kind: "landmark",
    source: "SIMBAD",
  },
  {
    id: "gj-273",
    name: "Luyten's Star / GJ 273",
    raDeg: 111.852091,
    decDeg: 5.225807,
    distancePc: 5.921535,
    spectralType: "M3.5",
    planetCount: 2,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-876",
    name: "GJ 876",
    raDeg: 343.323974,
    decDeg: -14.266596,
    distancePc: 4.67517,
    spectralType: "M2.5 V",
    planetCount: 4,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-581",
    name: "GJ 581",
    raDeg: 229.856473,
    decDeg: -7.722694,
    distancePc: 6.2981,
    spectralType: "M3 V",
    planetCount: 3,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-667c",
    name: "GJ 667 C",
    raDeg: 259.751061,
    decDeg: -34.997765,
    distancePc: 7.24396,
    spectralType: "M1.5 V",
    planetCount: 5,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-674",
    name: "GJ 674",
    raDeg: 262.170048,
    decDeg: -46.898983,
    distancePc: 4.54896,
    spectralType: "M2.5",
    planetCount: 1,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-687",
    name: "GJ 687",
    raDeg: 264.104173,
    decDeg: 68.333674,
    distancePc: 4.54939,
    spectralType: "M3 V",
    planetCount: 2,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-251",
    name: "GJ 251",
    raDeg: 103.70025,
    decDeg: 33.266463,
    distancePc: 5.58057,
    spectralType: "M3 V",
    planetCount: 2,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "kapteyn",
    name: "Kapteyn's Star",
    raDeg: 77.958661,
    decDeg: -45.04302,
    distancePc: 3.93305,
    spectralType: "M2 V",
    planetCount: 1,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gl-725b",
    name: "Gliese 725 B",
    raDeg: 280.695353,
    decDeg: 59.62706,
    distancePc: 6.842357,
    spectralType: "M4",
    planetCount: 2,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-180",
    name: "GJ 180",
    raDeg: 73.460097,
    decDeg: -17.776194,
    distancePc: 11.9407,
    spectralType: "M3",
    planetCount: 3,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-436",
    name: "GJ 436",
    raDeg: 175.550536,
    decDeg: 26.703066,
    distancePc: 9.75321,
    spectralType: "M2.5 V",
    planetCount: 1,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-367",
    name: "GJ 367",
    raDeg: 146.121464,
    decDeg: -45.779017,
    distancePc: 9.41263,
    spectralType: "M1 V",
    planetCount: 3,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "gj-1132",
    name: "GJ 1132",
    raDeg: 153.70907,
    decDeg: -47.154936,
    distancePc: 12.613,
    spectralType: "M4.5 V",
    planetCount: 2,
    kind: "planet-host",
    source: "NASA Exoplanet Archive",
  },
  {
    id: "trappist-1",
    name: "TRAPPIST-1",
    raDeg: 346.626392,
    decDeg: -5.043462,
    distancePc: 12.429889,
    spectralType: "M8 V",
    planetCount: 7,
    kind: "survey-target",
    source: "NASA Exoplanet Archive",
  },
];

export function toCartesian(star: AtlasStar): CartesianStar {
  const distanceLy = star.distancePc * PC_TO_LY;
  const ra = (star.raDeg * Math.PI) / 180,
    dec = (star.decDeg * Math.PI) / 180;
  return {
    ...star,
    distanceLy,
    xLy: distanceLy * Math.cos(dec) * Math.cos(ra),
    yLy: distanceLy * Math.cos(dec) * Math.sin(ra),
    zLy: distanceLy * Math.sin(dec),
  };
}

export const CARTESIAN_STARS: readonly CartesianStar[] = ATLAS_STARS.map(toCartesian);

export function starsWithin(radiusLy: number, kind: StarKind | "all" = "all") {
  return CARTESIAN_STARS.filter(
    (star) => star.distanceLy <= radiusLy && (kind === "all" || star.kind === kind),
  );
}

export function routeMetrics(distanceLy: number, cruiseFractionC: number) {
  return {
    oneWaySignalYears: distanceLy,
    roundTripSignalYears: distanceLy * 2,
    cruiseYears: distanceLy / Math.max(0.001, cruiseFractionC),
  };
}
