
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Track navigation history globally
const navigationHistory: string[] = [];

/**
 * iOS-style PageTransition - slide left/right based on navigation direction
 */
const PageTransition: React.FC<{ children: React.ReactNode; enableSlide?: boolean }> = ({
  children,
  enableSlide = false
}) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [animate, setAnimate] = useState(true);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (enableSlide && location.pathname !== prevPathRef.current) {
      let isBack = false;

      // Check if this is a POP (browser back/forward)
      if (navigationType === "POP") {
        isBack = true;
      } else {
        // For PUSH navigation, check if we're returning to a previous page
        const currentPathIndex = navigationHistory.lastIndexOf(location.pathname);
        const prevPathIndex = navigationHistory.lastIndexOf(prevPathRef.current);

        console.log("Navigation check:", {
          from: prevPathRef.current,
          to: location.pathname,
          history: [...navigationHistory],
          currentPathIndex,
          prevPathIndex
        });

        // If current path exists earlier in history and previous path is after it, it's a back navigation
        if (currentPathIndex !== -1 && prevPathIndex > currentPathIndex) {
          isBack = true;
          // Remove paths after the current one (including the current path)
          navigationHistory.length = currentPathIndex;
          navigationHistory.push(location.pathname);
        } else {
          // Forward navigation - add to history
          navigationHistory.push(location.pathname);
        }

        console.log("Result:", isBack ? "BACK" : "FORWARD", "Updated history:", [...navigationHistory]);
      }

      setDirection(isBack ? "back" : "forward");

      // Reset animation
      setAnimate(false);

      // Trigger animation after a brief delay
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 10);

      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigationType, enableSlide]);

  const getAnimationClass = () => {
    if (!enableSlide) return "";

    if (!animate) {
      // Start position: forward = from right, back = from left
      return direction === "forward" ? "translate-x-full" : "translate-x-[-100%]";
    }
    // Animation: forward = slide in from right, back = slide in from left
    return direction === "forward" ? "animate-ios-slide-in-right" : "animate-ios-slide-in-left";
  };

  return (
    <div className={`w-full h-full ${getAnimationClass()}`}>
      {children}
    </div>
  );
};

export default PageTransition;
