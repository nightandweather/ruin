import { useEffect, useRef } from "react";
import { MODULES } from "./modules";
import "./module-bar.css";

/**
 * Navigation across every executable module.
 *
 * Each page renders the complete registry so no laboratory is a dead end;
 * the current module is marked with `<b>` and carries `aria-current`.
 * Per-module stylesheets keep styling their own `nav a` / `nav b`, so each
 * laboratory retains its accent colour while the link set stays identical.
 */
export function ModuleBar({ current }: { current: string }) {
  const barRef = useRef<HTMLElement>(null);
  const currentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const item = currentRef.current;
    if (!bar || !item) return;
    // Centre the active module in the strip. Adjusting scrollLeft directly
    // rather than calling scrollIntoView keeps the surrounding page still.
    const barBox = bar.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    bar.scrollLeft += itemBox.left - barBox.left - (barBox.width - itemBox.width) / 2;
  }, [current]);

  return (
    <nav ref={barRef} className="module-bar" aria-label="RUIN laboratory modules">
      {MODULES.map((module) =>
        module.id === current ? (
          <b key={module.id} ref={currentRef} aria-current="page">
            {module.label}
          </b>
        ) : (
          <a key={module.id} href={module.href}>
            {module.label}
          </a>
        ),
      )}
    </nav>
  );
}
