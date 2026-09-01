import { MODULE_GROUPS, MODULES } from "./modules";
import "./base.css";
import "./gateway.css";

/**
 * The front door.
 *
 * `/` used to load HELIOS, which meant every visitor landed on the least
 * surprising thing in the repository — a Dyson swarm simulator is a genre
 * people believe they already know, and the two findings actually worth
 * arguing with were three clicks away. This page leads with the findings and
 * puts the whole roster underneath, so a reader chooses where to start
 * instead of being handed a default.
 */

interface Finding {
  href: string;
  module: string;
  headline: string;
  body: string;
  figures: Array<{ label: string; value: string; alarm?: boolean }>;
}

const FINDINGS: readonly Finding[] = [
  {
    href: "./census.html",
    module: "CENSUS",
    headline: "A civilization reports 99.97% survival. The real rate is 94.98%. Nobody lied.",
    body: "A survival rate is a fraction, and its denominator is a definition of who counts as a person. Change the definition and the headline moves without a single life improving.",
    figures: [
      { label: "REPORTED", value: "99.97%" },
      { label: "ACTUAL", value: "94.98%", alarm: true },
      { label: "UNREPORTED DEAD", value: "20,321", alarm: true },
    ],
  },
  {
    href: "./veritas.html?model=ignis-fusion",
    module: "VERITAS",
    headline: "An audit of this laboratory's own models, which three of them fail.",
    body: "The years between a model becoming wrong enough to invalidate decisions and anyone being able to say so. Run against RUIN's own portfolio, it does not spare the repository that contains it.",
    figures: [
      { label: "MODELS AUDITED", value: "7" },
      { label: "SILENT WINDOWS", value: "3", alarm: true },
      { label: "LONGEST", value: "12 yr", alarm: true },
    ],
  },
  {
    href: "./watchfloor.html?incident=cry-wolf",
    module: "WATCHFLOOR",
    headline: "A watch that loses interventions with nothing on the board looking wrong.",
    body: "Every fault-response plan here ends with the operator decides. This one prices that step: a crew that has learned not to believe its alarms writes off the real one.",
    figures: [
      { label: "QUEUE PEAK", value: "17 / 40" },
      { label: "AUTHORITY LOST", value: "0 min" },
      { label: "MISSED CRITICALS", value: "1.43", alarm: true },
    ],
  },
];

export function GatewayApp() {
  return (
    <main className="gw">
      <header className="gw-top">
        <div className="gw-brand">
          <span>R//N</span>
          <div>
            <strong>RUIN</strong>
            <small>EXECUTABLE SCIENCE FICTION</small>
          </div>
        </div>
        <p className="gw-lede">
          Thirty-two deterministic simulations of infrastructure that does not exist yet — and of the ways
          such infrastructure fails without anyone noticing. Every module declares what must never happen and
          enforces it in the model rather than warning about it.
        </p>
        <nav className="gw-links" aria-label="Project documents">
          <a href="https://github.com/nightandweather/ruin">SOURCE</a>
          <a href="https://github.com/nightandweather/ruin/blob/main/docs/WHAT-FICTION-ASSUMES.md">
            WHAT FICTION ASSUMES
          </a>
          <a href="https://github.com/nightandweather/ruin/blob/main/docs/ENGINEERING-NOTES.md">
            ENGINEERING NOTES
          </a>
          <a href="https://github.com/nightandweather/ruin/blob/main/concepts/README.md">CONCEPTS</a>
        </nav>
      </header>

      <section className="gw-findings" aria-label="Start here">
        <h2>START HERE</h2>
        <div className="gw-cards">
          {FINDINGS.map((finding) => (
            <a className="gw-card" key={finding.module} href={finding.href}>
              <span className="gw-card-tag">{finding.module}</span>
              <strong>{finding.headline}</strong>
              <p>{finding.body}</p>
              <dl>
                {finding.figures.map((figure) => (
                  <div key={figure.label} className={figure.alarm ? "alarm" : ""}>
                    <dt>{figure.label}</dt>
                    <dd>{figure.value}</dd>
                  </div>
                ))}
              </dl>
              <em>OPEN THE RUNNING MODEL →</em>
            </a>
          ))}
        </div>
      </section>

      <section className="gw-roster" aria-label="All laboratories">
        {MODULE_GROUPS.map((group) => (
          <div key={group.id} className="gw-shelf">
            <h3>
              {group.name}
              <small>{group.detail}</small>
            </h3>
            <ul>
              {MODULES.filter((module) => module.group === group.id).map((module) => (
                <li key={module.id}>
                  <a href={module.href}>
                    <b>{module.label}</b>
                    <span>{module.blurb}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="gw-foot">
        <p>
          Science fiction built from real engineering ideas. It is not a claim that any of it can be built —
          the engineering notes separate the sourced physics from the invented parameters for every module,
          and one module audits the rest.
        </p>
        <p className="gw-foot-meta">MIT LICENSED · CONTRIBUTIONS WELCOME · NIGHTANDWEATHER/RUIN</p>
      </footer>
    </main>
  );
}
