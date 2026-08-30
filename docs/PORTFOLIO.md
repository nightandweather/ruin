# RUIN portfolio brief

## One-line positioning

I build mission-critical operational systems in domains where silent failure is unacceptable—first in radiotherapy, then as an open simulation laboratory for autonomous space infrastructure.

## Watch the 72-second walkthrough

[![RUIN // HELIOS FIRST LIGHT evidence screen](assets/helios-first-light.png)](https://nightandweather.github.io/ruin/ruin-first-light-72s.mp4)

The silent walkthrough is intentionally short enough for a first portfolio review. It moves from the 10,000-node operator surface to the commissioned FIRST LIGHT campaign, its six checkpoints, five executable invariants, deterministic replay hash, and safe-state recovery.

## What the project demonstrates

- **Simulation engineering:** explicit seeded state, incident timelines, node-level control modes, and reproducible outcomes.
- **Fault-tolerant control:** uncommandable nodes fail closed, unsafe capacity is removed before dispatch, and recovery changes real system state.
- **Full-stack delivery:** a browser-independent TypeScript engine, React operator interface, automated tests, CI, and GitHub Pages deployment.
- **Engineering judgment:** grounded physical kernels are separated from speculative assumptions and documented as such.
- **Operational thinking:** failures become observable events, bounded evidence, testable invariants, and recovery decisions rather than decorative alerts.

## 100-word application answer

> I build mission-critical operational systems in domains where silent failure is unacceptable. In radiotherapy, I built Orcadose to turn complex clinical workflows into inspectable, recoverable operations. I then created RUIN, an open-source civilization-operations laboratory. Its HELIOS reference scenario models 10,000 autonomous solar collectors and executes communication loss, demand spikes, manufacturing requests, thermal events, debris avoidance, and recovery under a deterministic seed. Every run checks five safety invariants and verifies a second execution against the same replay hash. The project demonstrates how I prototype unfamiliar physical systems, expose their assumptions, and convert failure behavior into testable software.

## Interview opening

“RUIN began as a question: what would operations software look like for infrastructure larger than a planet? I narrowed that into one inspectable scenario. FIRST LIGHT runs the same 10,000-node failure campaign twice and refuses to call the system safe unless every checkpoint preserves its invariants and both traces agree. The science-fiction scale makes it memorable; the engineering work is ordinary in the best sense—state modeling, failure isolation, deterministic tests, operator evidence, and deployment.”

## Technical review path

1. Run **FIRST LIGHT** in the [public demo](https://nightandweather.github.io/ruin/).
2. Read the [HELIOS deep dive](HELIOS-DEEP-DIVE.md).
3. Inspect `src/firstLight.ts`, `src/simulation.ts`, and `tests/firstLight.test.ts`.
4. Check the CI and Pages workflows under `.github/workflows/`.

The video can be regenerated from the two public-demo captures with `./scripts/render-demo.sh` on macOS with FFmpeg installed.
