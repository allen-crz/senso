
import React from 'react';
import { Camera } from 'lucide-react';

const WaterCapture = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#212529]">Capture Meter Reading</h2>
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl shadow-lg mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Camera className="text-white" size={38} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Scan Water Meter</h3>
          <p className="text-blue-50 mb-6">Tap to capture a photo of your meter</p>
          <button
            className="w-full bg-white text-blue-600 py-4 rounded-full font-medium text-lg shadow-md hover:bg-opacity-90 transition-colors"
            onClick={() => window.alert("Camera functionality coming soon!")}
          >
            Open Camera
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaterCapture;
