
import { useRef } from "react";
import { usePageTransition } from "./usePageTransition";

/**
 * usePageTransitionTrigger
 * Triggers exit animation before navigation, then calls the given callback.
 */
export function usePageTransitionTrigger(durationMs = 300) {
  const { triggerTransition } = usePageTransition(durationMs);

  /**
   * Animate exit, then navigate.
   */
  function transitionAndNavigate(navigateFn: () => void) {
    // Add a short "fade-out" class to body to trigger visual animation
    document.body.classList.add("animate-fade-out");
    setTimeout(() => {
      document.body.classList.remove("animate-fade-out");
      navigateFn();
    }, durationMs);
  }

  return { transitionAndNavigate };
}
