
import React from "react";

const HomeContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-gray-800 to-black text-white">
      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="text-sm text-white">9:41</div>
        <div className="flex items-center gap-2 text-white">
          <i className="fa-solid fa-signal"></i>
          <i className="fa-solid fa-wifi"></i>
          <i className="fa-solid fa-battery-full"></i>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center px-6 pt-8">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <i className="fa-solid fa-bolt-lightning text-[#212529] text-2xl"></i>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Senso</h1>
        
        <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Senso</h2>
          <p className="text-white/80 mb-4">
            Your mobile-optimized application is ready to use.
          </p>
          <p className="text-white/60 text-sm">
            Install this app on your home screen for the full experience without an address bar.
          </p>
        </div>
        
        <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">PWA Features</h2>
          <ul className="text-white/80 mb-4 list-disc pl-5 space-y-2">
            <li>Works offline</li>
            <li>Full-screen experience</li>
            <li>No address bar</li>
            <li>Fast loading times</li>
          </ul>
        </div>
        
        <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">How to Install</h2>
          <div className="text-white/80 space-y-4">
            <div>
              <h3 className="font-medium mb-1">iOS:</h3>
              <p className="text-sm">Tap the share icon, then "Add to Home Screen"</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Android:</h3>
              <p className="text-sm">Tap the menu, then "Install App" or "Add to Home Screen"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
