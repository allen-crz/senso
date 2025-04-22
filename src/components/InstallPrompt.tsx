
import React from "react";

const InstallPrompt: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-gray-800 to-black text-white p-6">
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* App Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-bolt-lightning text-[#212529] text-4xl"></i>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 text-center">Install Senso</h1>
        
        {/* Installation Card */}
        <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Install to Continue</h2>
          <p className="text-white/80 mb-6">
            Please install Senso to your home screen to access the full experience.
          </p>
          
          {/* Installation Instructions - iOS Only */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white/5 p-4">
              <h3 className="font-medium mb-2">iOS Installation:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
                <li>Tap the share icon <i className="fa-solid fa-share-from-square"></i></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-white/60 text-sm text-center">
          After installation, please open Senso from your home screen.
        </p>
      </div>
    </div>
  );
};

export default InstallPrompt;
