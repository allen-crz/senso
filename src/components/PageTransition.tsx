
import React from "react";
import { useLocation } from "react-router-dom";

/**
 * PageTransition will animate children in/out on route changes.
 * Uses fade/scale Tailwind + animate.css classes.
 * 
 * The transition now uses CSS animations that won't remount the entire component tree,
 * preserving state between route changes.
 */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div
      className="transition-all duration-300 animate-fade-in w-full h-full"
      style={{
        animation: 'fadeIn 300ms ease-in-out',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
