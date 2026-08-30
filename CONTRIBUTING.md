# Contributing to RUIN

RUIN is an open-source laboratory for turning speculative civilization infrastructure into inspectable, testable software. Contributions are welcome from programmers, researchers, designers, science-fiction readers, and people who simply have a strange operational question worth exploring.

## Good ways to contribute

- Propose a system or failure mode with the [concept issue form](https://github.com/nightandweather/ruin/issues/new?template=concept_proposal.yml).
- Improve a physical assumption or replace a weak source with a primary reference.
- Add tests for a safety invariant or an overlooked edge case.
- Improve accessibility, responsive layout, performance, or documentation.
- Implement an accepted roadmap issue in a small, reviewable slice.
- Try a simulator, inject failures, and report where its behavior is surprising or unclear.

You do not need aerospace credentials. Clearly separating what is observed, extrapolated, and invented is more important than pretending to have certainty.

## Before writing code

For a new module or a large behavior change, open an issue first. Describe:

1. The operational question the simulation will expose.
2. The state, resources, and actors that must be modeled.
3. At least three failures or difficult tradeoffs.
4. Safety invariants—what the system must never do.
5. Primary sources for real-world anchors.
6. Which coefficients or mechanisms are deliberately speculative.

Small fixes, tests, and documentation improvements can go directly to a pull request.

## Development setup

Requirements: Node.js 22 or newer and npm.

```bash
git clone https://github.com/nightandweather/ruin.git
cd ruin
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run format:check
npm test
npm run build
```

`npm run format` rewrites the tree with Prettier. CI rejects unformatted code, so
that every diff stays readable.

## Project shape

- `src/*.ts` contains deterministic simulation engines with no browser dependency.
- `src/*App.tsx` and `src/*.css` contain the operator interfaces.
- `tests/` asserts system behavior and safety invariants.
- `concepts/` separates sourced assumptions from proposed software behavior.
- `ROADMAP.md` explains current priorities and dependency order.

New executable modules normally include:

```text
src/example.ts
src/ExampleApp.tsx
src/example-main.tsx
src/example.css
tests/example.test.ts
concepts/example.md
example.html
```

Register the module in `src/modules.ts`. That one entry drives both the Vite build
inputs and the module bar on every page, so navigation and the bundler stay in sync
without further edits. Prefer a small engine with explicit state over a large UI
component containing hidden simulation logic.

## Modeling rules

- Keep deterministic engines reproducible with a fixed configuration and seed.
- Put units in names where ambiguity is possible: `massKg`, `powerMW`, `durationHours`.
- Return immutable snapshots rather than UI-specific mutable objects.
- Bound event logs and queues.
- Make resource conservation, fail-closed behavior, and recovery limits testable.
- Do not present a scenario coefficient as measured fact.
- Cite primary sources close to the assumption they support.

## Scope and safety

RUIN accepts survival, logistics, manufacturing, energy, computation, habitats, exploration, rescue, and governance simulations. It does not accept weapon construction, targeting, munition optimization, destructive biological or chemical processes, or instructions that materially enable real-world harm.

Fictional military inspiration should be transformed into protective shielding, collision avoidance, damage control, evacuation, rescue, or supply-chain reliability.

## Pull requests

Keep pull requests focused. Include:

- The operational question or bug being addressed.
- The important modeling assumptions.
- Tests added or changed.
- Screenshots for visible interface changes.
- Sources for new scientific claims.
- Known simplifications and follow-up work.

By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).
