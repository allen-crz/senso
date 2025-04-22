
import React from "react";
import { useLocation } from "react-router-dom";

/**
 * PageTransition will animate children in/out on route changes.
 * Uses fade/scale Tailwind + animate.css classes.
 */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Use location.key as the key so React remounts and re-animates transitions
  return (
    <div
      key={location.key}
      className="transition-all duration-300 animate-fade-in"
      // You could swap animate-fade-in for animate-slide-in-right for slide effect!
    >
      {children}
    </div>
  );
};

export default PageTransition;
