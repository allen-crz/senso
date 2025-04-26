import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserTypeToggle from "./UserTypeToggle";
import NewUserResults from "./NewUserResults";

const WaterResults = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'new' | 'existing'>('new');
  const imageCaptured = localStorage.getItem('waterMeterImageCaptured') === 'true';

  const handleScanAgain = () => {
    localStorage.removeItem('waterMeterImageCaptured');
    navigate("/water-monitoring", { 
      replace: true,
      state: { 
        slideIndex: 0,
        resetState: true
      }
    });
  };

  if (userType === 'new') {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 z-10">
          <UserTypeToggle currentType={userType} onTypeChange={setUserType} />
        </div>
        <NewUserResults />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10">
        <UserTypeToggle currentType={userType} onTypeChange={setUserType} />
      </div>

      <div className="space-y-4 pb-10">
        <h2 className="text-2xl font-bold text-[#212529] mb-6">Meter Scan Results</h2>

        {/* Meter Usage/Bill Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Meter Usage This Month</h3>
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-blue-600 mb-2">₱824.50</p>
            <p className="text-sm text-blue-400">Estimated Bill</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">42 m³</p>
                <p className="text-sm text-blue-400">Current Reading</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">+8 m³</p>
                <p className="text-sm text-blue-400">vs Previous</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-blue-400">
            <span>Previous: 34 m³</span>
          </div>
        </div>

        {/* Last Captured Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-600">Last Captured</h3>
            <span className="text-sm text-gray-400">2 hours ago</span>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">42 m³</p>
                <p className="text-sm text-blue-400">Reading</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">11:45 AM</p>
                <p className="text-sm text-blue-400">January 15, 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Detection Card */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-3xl shadow-sm mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Anomaly Detected</h3>
              <p className="text-red-100">High water consumption detected</p>
            </div>
          </div>
        </div>

        {/* Estimated Bill Card */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Estimated Bill</h3>
              <p className="text-4xl font-bold text-white">₱1,124.00</p>
              <span className="text-blue-50 text-sm">Forecast for February 2025</span>
            </div>
          </div>
        </div>

        {/* Scan Again Button - Only shown if image was captured */}
        {imageCaptured && (
          <Button
            onClick={handleScanAgain}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-medium text-lg shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Scan Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default WaterResults;
