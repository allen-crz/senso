
import React from "react";
import { Camera, Droplet, Info } from "lucide-react";

const WaterCapture = () => {
  return (
    <div className="space-y-4 -mt-2">
      {/* Current Water Price */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-3xl shadow-sm mb-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Current Water Price</h3>
          <p className="text-4xl font-bold text-white mb-2">
            ₱15.00
            <span className="text-lg font-normal align-top">/m³</span>
          </p>
          <p className="text-sm text-blue-50">Last updated: January 15, 2025</p>
        </div>
      </div>

      {/* Meter Scan Section */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl shadow-lg mb-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Camera className="text-3xl text-white" size={38} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Scan Water Meter</h3>
          <p className="text-blue-50 mb-6">Tap to capture a photo of your meter</p>
          <button
            className="w-full bg-white text-blue-600 py-4 rounded-full font-medium text-lg shadow-md hover:bg-opacity-90 transition-colors"
            onClick={() => window.alert("Open Camera functionality coming soon!")}
          >
            Open Camera
          </button>
        </div>
      </div>

      {/* Manual Input Section */}
      <form 
        className="bg-white p-6 rounded-3xl shadow-sm" 
        onSubmit={(e) => { e.preventDefault(); window.alert("Reading submitted!"); }}
      >
        <h3 className="text-lg font-semibold text-[#212529] mb-2">Manual Input (Optional)</h3>
        <p className="text-sm text-gray-500 mb-4">Scroll horizontally to enter all digits</p>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 mb-4 min-w-[24rem] sm:min-w-[28rem] md:min-w-[32rem] lg:min-w-[36rem]">
            {[...Array(5)].map((_, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                className="w-10 h-12 rounded-lg border text-center text-lg focus:ring-2 focus:ring-blue-400 transition"
                inputMode="numeric"
              />
            ))}
            <div className="w-4 flex items-center justify-center text-lg">.</div>
            {[...Array(4)].map((_, idx) => (
              <input
                key={5 + idx}
                type="text"
                maxLength={1}
                className="w-10 h-12 rounded-lg border text-center text-lg focus:ring-2 focus:ring-blue-400 transition"
                inputMode="numeric"
              />
            ))}
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-400 text-white py-3 rounded-full font-medium">
          Submit Reading
        </button>
      </form>
    </div>
  );
};

export default WaterCapture;
