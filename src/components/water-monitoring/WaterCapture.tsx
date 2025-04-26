
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
      
      {/* Last Reading Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
        <h3 className="text-lg font-semibold text-[#212529] mb-4">Last Reading</h3>
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">34 m³</p>
              <p className="text-sm text-blue-400">Previous Reading</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">January 5</p>
              <p className="text-sm text-blue-400">10 days ago</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tips Card */}
      <div className="bg-amber-50 p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-amber-700">Meter Reading Tips</h3>
        </div>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start gap-2">
            <div className="min-w-4 mt-0.5">•</div>
            <p>Ensure the meter face is clearly visible</p>
          </li>
          <li className="flex items-start gap-2">
            <div className="min-w-4 mt-0.5">•</div>
            <p>Clean the meter surface if needed</p>
          </li>
          <li className="flex items-start gap-2">
            <div className="min-w-4 mt-0.5">•</div>
            <p>Provide good lighting for accurate reading</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WaterCapture;
