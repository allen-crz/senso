
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * usePageTransition
 * Returns:
 * - transitionClass: the CSS classname for animation
 * - triggerTransition: call this to start the transition
 * - isTransitioning: boolean indicating if transition is in progress
 */
export function usePageTransition(
  durationMs: number = 300,
  onTransitionEnd?: () => void
) {
  const [transitioning, setTransitioning] = useState(false);
  const location = useLocation();

  // Reset transitioning state on location change
  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => {
      setTransitioning(false);
      if (onTransitionEnd) onTransitionEnd();
    }, durationMs);
    
    return () => clearTimeout(timer);
  }, [location.key, durationMs, onTransitionEnd]);

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

  return { 
    transitionClass, 
    triggerTransition, 
    isTransitioning: transitioning 
  };
}

