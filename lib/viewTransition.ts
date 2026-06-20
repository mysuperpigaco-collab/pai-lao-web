import type { MouseEvent } from "react";

/**
 * Native browser View Transitions helper (no React-experimental dependency).
 *
 * Morphs a single "cover" element into the matching hero on the destination
 * page. Used by the place search cards → place detail hero.
 *
 * Behaviour:
 *  - Only the CLICKED cover gets a `view-transition-name` (set transiently),
 *    so the rest of the page swaps instantly instead of all animating.
 *  - The destination hero must render with the same `view-transition-name`
 *    plus `data-vt="<name>"` so we can detect when it has mounted.
 *  - Falls back to normal client navigation when the API is unsupported,
 *    on reduced-motion, or for modified / non-left clicks.
 */
type StartViewTransition = (cb: () => void | Promise<void>) => { finished: Promise<void> };

export function startCoverTransition(
  e: MouseEvent<HTMLAnchorElement>,
  navigate: () => void,
  name: string,
  el: HTMLElement | null,
): void {
  if (typeof document === "undefined") return;
  if (e.defaultPrevented) return;
  // Let the browser handle "open in new tab/window" style clicks.
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const start = (
    document as Document & { startViewTransition?: StartViewTransition }
  ).startViewTransition?.bind(document);

  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Unsupported or reduced-motion → let <Link> navigate normally.
  if (!start || reduce || !el) return;

  e.preventDefault();
  el.style.setProperty("view-transition-name", name);

  const transition = start(async () => {
    navigate();
    await waitForName(name, 700);
  });

  transition.finished.finally(() => {
    el.style.removeProperty("view-transition-name");
  });
}

function waitForName(name: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const selector = `[data-vt="${cssEscape(name)}"]`;
    if (document.querySelector(selector)) return resolve();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) finish();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(finish, timeoutMs);
  });
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}
