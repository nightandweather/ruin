/**
 * Scene cassettes — running a chapter instead of reading it.
 *
 * The cassette format was already module-agnostic; only the runner was
 * HELIOS-specific. HELIOS is a stepping simulation, so its cassettes carry a
 * timeline of operator actions at control ticks. Most laboratories are pure
 * functions of a configuration instead, and for those a cassette is a scene:
 * the module, the configuration the scene occurs in, and nothing else.
 *
 * That is enough to make a chapter checkable. `tests/season02.test.ts` loads
 * every scene in `fiction/season-02`, runs it, and asserts the figures the
 * manuscript commits to — so a change to a module that would contradict the
 * novel fails CI rather than being discovered by a reader.
 *
 * The direction of authority is the same as PORTA's: the manuscript is the
 * specification. A failure here means a module drifted, not that a chapter
 * is wrong.
 */

import type { IncidentCassette } from "./cassette";
import { censusConfig, evaluateCensus } from "./census";
import { chronosConfig, evaluateChronos } from "./chronos";
import { conciliumConfig, evaluateConcilium } from "./concilium";
import { evaluateLex, lexConfig } from "./lex";
import { evaluateLumen, lumenConfig } from "./lumen";
import { evaluatePorta, portaConfig } from "./porta";
import { evaluateValetudo, valetudoConfig } from "./valetudo";
import { evaluateVeritas, veritasConfig } from "./veritas";
import { evaluateWatchfloor, watchfloorConfig } from "./watchfloor";

/**
 * Laboratories a scene can be set in: the ones whose whole state is a
 * configuration. Adding one is a single line, and the test that every scene
 * names a runnable module keeps this honest.
 */
const SCENES = {
  census: { base: censusConfig, run: evaluateCensus },
  chronos: { base: chronosConfig, run: evaluateChronos },
  concilium: { base: conciliumConfig, run: evaluateConcilium },
  lex: { base: lexConfig, run: evaluateLex },
  lumen: { base: lumenConfig, run: evaluateLumen },
  porta: { base: portaConfig, run: evaluatePorta },
  valetudo: { base: valetudoConfig, run: evaluateValetudo },
  veritas: { base: veritasConfig, run: evaluateVeritas },
  watchfloor: { base: watchfloorConfig, run: evaluateWatchfloor },
} as const satisfies Record<string, { base: () => object; run: (config: never) => unknown }>;

export type SceneModuleId = keyof typeof SCENES;

export const SCENE_MODULES = Object.keys(SCENES) as SceneModuleId[];

export const isSceneModule = (module: string): module is SceneModuleId => module in SCENES;

export type SceneResult =
  { ok: true; module: SceneModuleId; config: object; result: unknown } | { ok: false; errors: string[] };

/**
 * Run one scene cassette.
 *
 * The cassette's `config` is merged over the module's own defaults, so a scene
 * records only what the chapter changes and stays readable as a diff. A
 * timeline is accepted and ignored: stepping simulations use it, scenes do not.
 */
export function runScene(cassette: IncidentCassette): SceneResult {
  if (!isSceneModule(cassette.module)) {
    return {
      ok: false,
      errors: [`"${cassette.module}" is not a scene module; expected one of ${SCENE_MODULES.join(", ")}`],
    };
  }
  const scene = SCENES[cassette.module];
  const config = { ...scene.base(), ...(cassette.config ?? {}) };
  return {
    ok: true,
    module: cassette.module,
    config,
    result: (scene.run as (c: object) => unknown)(config),
  };
}
