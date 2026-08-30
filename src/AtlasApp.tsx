import { useMemo, useState } from "react";
import {
  CARTESIAN_STARS,
  routeMetrics,
  starsWithin,
  type CartesianStar,
  type StarKind,
} from "./stellarAtlas";
import { rankStarSystems } from "./starSurvey";
import { ModuleBar } from "./ModuleBar";

type AtlasFilter = StarKind | "all";
const radii = [10, 20, 50] as const;
const filters: readonly [AtlasFilter, string][] = [
  ["all", "ALL OBJECTS"],
  ["planet-host", "PLANET HOSTS"],
  ["survey-target", "RUIN TARGETS"],
  ["landmark", "LANDMARKS"],
];
const surveyIds: Record<string, string> = {
  sol: "sol",
  "epsilon-eri": "epsilon-eridani",
  "tau-ceti": "tau-ceti",
  proxima: "proxima-centauri",
  "trappist-1": "trappist-1",
};
const palette = (type: string) =>
  type.startsWith("M")
    ? "#ff7b67"
    : type.startsWith("K")
      ? "#ffb75e"
      : type.startsWith("G")
        ? "#ffe989"
        : type.startsWith("F")
          ? "#fff4d7"
          : type.startsWith("A")
            ? "#b8d9ff"
            : "#d8e8ff";
const number = (value: number, digits = 1) =>
  value.toLocaleString(undefined, { maximumFractionDigits: digits });

function project(star: Pick<CartesianStar, "xLy" | "yLy" | "zLy">, azimuth: number, elevation: number) {
  const az = (azimuth * Math.PI) / 180,
    el = (elevation * Math.PI) / 180;
  const x = star.xLy * Math.cos(az) - star.yLy * Math.sin(az);
  const y = star.xLy * Math.sin(az) + star.yLy * Math.cos(az);
  return {
    x,
    y: y * Math.cos(el) - star.zLy * Math.sin(el),
    depth: y * Math.sin(el) + star.zLy * Math.cos(el),
  };
}

export function AtlasApp() {
  const [radius, setRadius] = useState<(typeof radii)[number]>(20);
  const [filter, setFilter] = useState<AtlasFilter>("all");
  const [azimuth, setAzimuth] = useState(28);
  const [elevation, setElevation] = useState(24);
  const [cruiseC, setCruiseC] = useState(0.1);
  const [selectedId, setSelectedId] = useState("epsilon-eri");
  const visible = useMemo(
    () => starsWithin(radius, filter).sort((a, b) => a.distanceLy - b.distanceLy),
    [radius, filter],
  );
  const selected = CARTESIAN_STARS.find((star) => star.id === selectedId) ?? CARTESIAN_STARS[0];
  const metrics = routeMetrics(selected.distanceLy, cruiseC);
  const survey = rankStarSystems().find((system) => system.id === surveyIds[selected.id]);
  const scale = 235 / radius;
  const choose = (star: CartesianStar) => {
    setSelectedId(star.id);
    if (star.distanceLy > radius) setRadius(star.distanceLy <= 20 ? 20 : 50);
  };

  return (
    <main className="at-shell">
      <header className="at-top">
        <div className="at-brand">
          <span>A//X</span>
          <div>
            <strong>RUIN // ATLAS</strong>
            <small>LOCAL STELLAR OPERATIONS MAP</small>
          </div>
        </div>
        <ModuleBar current="atlas" />
        <div className="at-status">
          <span>ICRS · EPOCH CATALOG SNAPSHOT</span>
          <b>30 VERIFIED OBJECTS</b>
        </div>
      </header>
      <section className="at-layout">
        <aside className="at-panel at-controls">
          <Title n="01" text="OBSERVATION VOLUME" />
          <label>
            RADIUS FROM SOL <b>{radius} ly</b>
          </label>
          <div className="at-segments">
            {radii.map((value) => (
              <button
                key={value}
                className={radius === value ? "active" : ""}
                onClick={() => setRadius(value)}
              >
                {value} LY
              </button>
            ))}
          </div>
          <Title n="02" text="CATALOG LAYERS" />
          <div className="at-filters">
            {filters.map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                <i />
                {label}
                <small>{starsWithin(radius, value).length}</small>
              </button>
            ))}
          </div>
          <Title n="03" text="CAMERA ATTITUDE" />
          <Range label="AZIMUTH" value={azimuth} min={0} max={360} suffix="°" change={setAzimuth} />
          <Range label="ELEVATION" value={elevation} min={-70} max={70} suffix="°" change={setElevation} />
          <button
            className="at-reset"
            onClick={() => {
              setAzimuth(28);
              setElevation(24);
            }}
          >
            RESET ICRS VIEW
          </button>
          <div className="at-legend">
            <span>
              <i className="target" />
              RUIN SURVEY
            </span>
            <span>
              <i className="host" />
              PLANET HOST
            </span>
            <span>
              <i className="landmark" />
              STELLAR LANDMARK
            </span>
            <span>
              <i className="home" />
              SOL ORIGIN
            </span>
          </div>
          <p className="at-boundary">
            <b>CATALOG BOUNDARY</b>This is a curated 30-object operational snapshot, not the full Gaia
            Catalogue of Nearby Stars. Positions omit proper-motion propagation and uncertainty ellipsoids.
          </p>
        </aside>
        <section className="at-panel at-map">
          <div className="at-maphead">
            <Title n="04" text="HELIOCENTRIC EQUATORIAL VOLUME" />
            <span>
              {visible.length} OBJECTS IN VIEW · {filter.toUpperCase()}
            </span>
          </div>
          <StellarMap
            stars={visible}
            selected={selectedId}
            radius={radius}
            scale={scale}
            azimuth={azimuth}
            elevation={elevation}
            choose={choose}
          />
          <div className="at-axis">
            <span>
              <b>X</b> RA 00h
            </span>
            <span>
              <b>Y</b> RA 06h
            </span>
            <span>
              <b>Z</b> NORTH CELESTIAL POLE
            </span>
            <span>DISTANCES ARE RADIAL, NOT LIGHT-CONE CORRECTED</span>
          </div>
        </section>
        <aside className="at-panel at-dossier">
          <Title n="05" text="SELECTED SYSTEM" />
          <div className="at-starhead">
            <i
              style={{
                background: palette(selected.spectralType),
                boxShadow: `0 0 18px ${palette(selected.spectralType)}`,
              }}
            />
            <div>
              <small>{selected.kind.replace("-", " ").toUpperCase()}</small>
              <h1>{selected.name}</h1>
              <span>
                {selected.spectralType} · {selected.planetCount} CONFIRMED PLANET
                {selected.planetCount === 1 ? "" : "S"}
              </span>
            </div>
          </div>
          <div className="at-primary">
            <div>
              <span>RADIAL DISTANCE</span>
              <b>
                {number(selected.distanceLy, 2)}
                <small>ly</small>
              </b>
            </div>
            <div>
              <span>ONE-WAY SIGNAL</span>
              <b>
                {number(metrics.oneWaySignalYears, 2)}
                <small>years</small>
              </b>
            </div>
          </div>
          <dl>
            <div>
              <dt>ICRS RIGHT ASCENSION</dt>
              <dd>{number(selected.raDeg, 4)}°</dd>
            </div>
            <div>
              <dt>ICRS DECLINATION</dt>
              <dd>{number(selected.decDeg, 4)}°</dd>
            </div>
            <div>
              <dt>PARSEC DISTANCE</dt>
              <dd>{number(selected.distancePc, 4)} pc</dd>
            </div>
            <div>
              <dt>XYZ FROM SOL</dt>
              <dd>
                {number(selected.xLy)} / {number(selected.yLy)} / {number(selected.zLy)} ly
              </dd>
            </div>
            <div>
              <dt>CATALOG SOURCE</dt>
              <dd>{selected.source}</dd>
            </div>
          </dl>
          <Title n="06" text="CAUSAL HORIZON" />
          <Range
            label="HYPOTHETICAL CRUISE"
            value={Math.round(cruiseC * 100)}
            min={1}
            max={50}
            suffix="% c"
            change={(value) => setCruiseC(value / 100)}
          />
          <div className="at-times">
            <div>
              <span>COMMAND + REPLY</span>
              <b>{number(metrics.roundTripSignalYears, 1)} y</b>
            </div>
            <div>
              <span>IDEAL CRUISE</span>
              <b>{number(metrics.cruiseYears, 1)} y</b>
            </div>
          </div>
          <p className="at-relativity">
            Cruise time is distance ÷ speed only. It excludes acceleration, braking, mass ratio, relativistic
            effects, hazards, and infrastructure bootstrap.
          </p>
          {survey ? (
            <div className="at-score">
              <span>RUIN STELLAR SURVEY</span>
              <b>
                {survey.score}
                <small>/ 100</small>
              </b>
              <p>{survey.note}</p>
            </div>
          ) : (
            <div className="at-score absent">
              <span>RUIN STELLAR SURVEY</span>
              <b>NOT RANKED</b>
              <p>Catalog presence is not a claim that this system is suitable for a swarm.</p>
            </div>
          )}
        </aside>
        <section className="at-panel at-roster">
          <div className="at-rosterhead">
            <Title n="07" text="NEAREST OBJECT REGISTER" />
            <span>SELECT A ROW TO PLOT ROUTE FROM SOL</span>
          </div>
          <div className="at-table">
            <div className="at-row heading">
              <span>OBJECT</span>
              <span>TYPE</span>
              <span>DISTANCE</span>
              <span>PLANETS</span>
              <span>SOURCE</span>
            </div>
            {visible
              .filter((star) => star.id !== "sol")
              .slice(0, 9)
              .map((star) => (
                <button
                  key={star.id}
                  className={`at-row ${selected.id === star.id ? "selected" : ""}`}
                  onClick={() => choose(star)}
                >
                  <span>
                    <i style={{ background: palette(star.spectralType) }} />
                    {star.name}
                  </span>
                  <span>{star.spectralType}</span>
                  <span>{number(star.distanceLy, 2)} ly</span>
                  <span>{star.planetCount}</span>
                  <span>{star.source === "SIMBAD" ? "SIMBAD / CDS" : "NASA EXOPLANET"}</span>
                </button>
              ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function StellarMap({
  stars,
  selected,
  radius,
  scale,
  azimuth,
  elevation,
  choose,
}: {
  stars: readonly CartesianStar[];
  selected: string;
  radius: number;
  scale: number;
  azimuth: number;
  elevation: number;
  choose: (star: CartesianStar) => void;
}) {
  const cx = 350,
    cy = 270;
  const points = stars
    .map((star) => ({ star, ...project(star, azimuth, elevation) }))
    .sort((a, b) => a.depth - b.depth);
  const selectedPoint = points.find((point) => point.star.id === selected);
  return (
    <svg
      className="at-svg"
      viewBox="0 0 700 540"
      role="img"
      aria-label={`Three-dimensional map of stars within ${radius} light years`}
    >
      <defs>
        <radialGradient id="solGlow">
          <stop stopColor="#fff8cf" />
          <stop offset=".16" stopColor="#ffc85d" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffc85d" stopOpacity="0" />
        </radialGradient>
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(${cx} ${cy})`} className="at-gridlines">
        {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
          <ellipse
            key={f}
            rx={radius * f * scale}
            ry={radius * f * scale * Math.cos((elevation * Math.PI) / 180)}
          />
        ))}
        <path
          d={`M-${radius * scale} 0H${radius * scale}M0-${radius * scale * 0.92}V${radius * scale * 0.92}`}
        />
      </g>
      {selectedPoint && selected !== "sol" && (
        <line
          className="at-route"
          x1={cx}
          y1={cy}
          x2={cx + selectedPoint.x * scale}
          y2={cy - selectedPoint.y * scale}
        />
      )}
      <g>
        {points.map(({ star, x, y, depth }) => {
          const px = cx + x * scale,
            py = cy - y * scale,
            active = star.id === selected,
            size = star.id === "sol" ? 7 : Math.max(2.2, 3.8 + (depth / Math.max(10, radius)) * 1.8);
          return (
            <g
              key={star.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${star.name}`}
              className={`at-node ${star.kind} ${active ? "selected" : ""}`}
              transform={`translate(${px} ${py})`}
              onClick={() => choose(star)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") choose(star);
              }}
            >
              {star.id === "sol" && <circle className="sol-glow" r="25" />}
              <circle className="hit" r="11" />
              <circle className="star" r={active ? size + 2 : size} fill={palette(star.spectralType)} />
              {(active || star.kind === "survey-target" || (star.distanceLy < 9 && radius <= 20)) && (
                <>
                  <path d="M8-7h8" />
                  <text x="19" y="-5">
                    {star.name.toUpperCase()}
                  </text>
                  <text x="19" y="5">
                    {number(star.distanceLy, 1)} LY
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>
      <text className="at-range-label" x="365" y="31">
        ±{radius} LIGHT-YEAR OBSERVATION VOLUME
      </text>
    </svg>
  );
}
function Title({ n, text }: { n: string; text: string }) {
  return (
    <div className="at-title">
      <span>{n}</span>
      {text}
    </div>
  );
}
function Range({
  label,
  value,
  min,
  max,
  suffix,
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  change: (value: number) => void;
}) {
  return (
    <label className="at-range">
      <span>
        {label}
        <b>
          {value}
          {suffix}
        </b>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => change(Number(event.target.value))}
      />
    </label>
  );
}
