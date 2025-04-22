
import { useState } from "react";

/**
 * usePageTransition
 * Returns:
 * - transitionClass: the CSS classname for animation
 * - triggerTransition: call this to start the transition
 */
export function usePageTransition(
  durationMs: number = 300,
  onTransitionEnd?: () => void
) {
  const [transitioning, setTransitioning] = useState(false);

  function triggerTransition(cb?: () => void) {
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      if (cb) cb();
      if (onTransitionEnd) onTransitionEnd();
    }, durationMs);
  }

  const transitionClass = transitioning
    ? "opacity-0 transition-opacity duration-300"
    : "opacity-100 transition-opacity duration-300";

  return { transitionClass, triggerTransition, transitioning };
}
