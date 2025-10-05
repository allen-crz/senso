
import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#212529] via-gray-800 to-black">
      {/* Main Content */}
      <div className="relative z-10 h-[800px] flex flex-col items-center justify-center px-6">
        {/* App Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-bolt-lightning text-[#212529] text-4xl"></i>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-12">Senso</h1>

        {/* Standard Loading Spinner */}
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>

        {/* Loading Text */}
        <p className="text-white/60 mt-8 text-sm animate-pulse">Loading your experience...</p>
      </div>

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default LoadingScreen;
