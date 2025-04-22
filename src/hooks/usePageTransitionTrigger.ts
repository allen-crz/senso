
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
    // Add a more noticeable fade-out animation to the entire page
    document.body.classList.add("animate-fade-out");
    
    // Define a keyframe animation for fade-out if it doesn't exist
    if (!document.getElementById('fade-out-keyframes')) {
      const style = document.createElement('style');
      style.id = 'fade-out-keyframes';
      style.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
        
        .animate-fade-out {
          animation: fadeOut ${durationMs}ms ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      document.body.classList.remove("animate-fade-out");
      navigateFn();
    }, durationMs);
  }

  return { transitionAndNavigate };
}
