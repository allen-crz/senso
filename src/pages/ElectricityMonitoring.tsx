import React, { useRef, useState } from "react";
import { Bolt, Camera, Info, Home, Droplet, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ElectricityMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [manualDigits, setManualDigits] = useState(Array(5).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleDigitChange = (idx: number, value: string) => {
    if (value.length > 1) return;
    const digits = [...manualDigits];
    digits[idx] = value.replace(/[^0-9]/g, "");
    setManualDigits(digits);
    if (value && idx < 4) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.alert("Reading submitted: " + manualDigits.join(""));
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative font-sans pt-8">
      {/* Header */}
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
              <Bolt className="text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-[#212529]">Electricity Monitoring</h1>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center focus:outline-none">
            <Info className="text-gray-400" />
          </button>
        </div>

        {/* Progress Bars */}
        <div className="mb-6 flex gap-2">
          <div className="h-1.5 flex-1 bg-yellow-500 rounded-full"></div>
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full"></div>
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full"></div>
        </div>

        {/* Current Electric Prices */}
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-3xl shadow-sm mb-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Current Electric Price</h3>
            <p className="text-4xl font-bold text-white mb-2">
              ₱10.50
              <span className="text-lg font-normal align-top">/kWh</span>
            </p>
            <p className="text-sm text-yellow-50">Last updated: January 15, 2025</p>
          </div>
        </div>

        {/* Meter Scan Section */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-8 rounded-3xl shadow-lg mb-6 transform hover:scale-[1.02] transition-transform">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Camera className="text-3xl text-white" size={38} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Scan Electric Meter</h3>
            <p className="text-yellow-50 mb-6">Tap to capture a photo of your meter</p>
            <button
              className="w-full bg-white text-yellow-600 py-4 rounded-full font-medium text-lg shadow-md hover:bg-opacity-90 transition-colors"
              onClick={() => window.alert("Open Camera functionality coming soon!")}
            >
              Open Camera
            </button>
          </div>
        </div>

        {/* Manual Input Section */}
        <form className="bg-white p-6 rounded-3xl shadow-sm" onSubmit={handleSubmit}>
          <h3 className="text-lg font-semibold text-[#212529] mb-2">Manual Input (Optional)</h3>
          <p className="text-sm text-gray-500 mb-4">Enter all digits</p>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 mb-4 min-w-max">
              {[...Array(5)].map((_, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  ref={el => (inputRefs.current[idx] = el)}
                  className="w-10 h-12 rounded-lg border text-center text-lg"
                  value={manualDigits[idx]}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  inputMode="numeric"
                />
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-yellow-400 text-white py-3 rounded-full font-medium">
            Submit Reading
          </button>
        </form>
      </div>

      {/* Bottom Navigation - replicated dashboard tab hover styles */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-4 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Home */}
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white font-medium transition-colors">Home</span>
            </button>
            {/* Water */}
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/water-monitoring")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Droplet className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Water</span>
            </button>
            {/* Electric (current page - highlight) */}
            <div className="flex flex-col items-center gap-1 group cursor-default">
              <div className="w-10 h-10 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Bolt className="text-yellow-400" />
              </div>
              <span className="text-xs font-medium text-yellow-400">Electricity</span>
            </div>
            {/* Settings */}
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/settings")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-150">
                <Settings className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricityMonitoring;
