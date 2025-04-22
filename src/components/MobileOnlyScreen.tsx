
import React from "react";

const MobileOnlyScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#212529] via-gray-800 to-black text-white p-8 text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg mx-auto">
          <i className="fa-solid fa-bolt-lightning text-[#212529] text-4xl"></i>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Mobile Only</h1>
      
      <p className="text-white/70 mb-8">
        Senso is designed exclusively for mobile devices. Please visit this site on your smartphone or tablet.
      </p>
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-lg bg-white/10 max-w-xs">
          <i className="fa-solid fa-mobile-screen-button text-3xl mb-3"></i>
          <p className="text-sm text-white/90">
            For the best experience, please open this website on a mobile device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileOnlyScreen;
