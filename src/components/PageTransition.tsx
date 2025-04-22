
import React, { useEffect, useState } from "react";
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
  const [isVisible, setIsVisible] = useState(false);
  
  // Add fade-in animation when component mounts or route changes
  useEffect(() => {
    // Define a keyframe animation for fade-in if it doesn't exist
    if (!document.getElementById('fade-in-keyframes')) {
      const style = document.createElement('style');
      style.id = 'fade-in-keyframes';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fade-in-custom {
          animation: fadeIn 300ms ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set initial state to invisible
    setIsVisible(false);
    
    // Start fade-in animation after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [location.key]);
  
  return (
    <div
      className={`transition-opacity duration-300 ${isVisible ? 'animate-fade-in-custom' : 'opacity-0'}`}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
