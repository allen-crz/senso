
import React, { useState, useEffect } from "react";
import { RefreshCw, ChevronUp, ChevronDown, TriangleAlert } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import UserTypeToggle from "./UserTypeToggle";
import NewUserResults from "./NewUserResults";

const WaterResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState<'new' | 'existing'>('new');
  const [isAnomalyOpen, setIsAnomalyOpen] = useState(true);
  const [isBillOpen, setIsBillOpen] = useState(true);
  const imageCaptured = localStorage.getItem('waterMeterImageCaptured') === 'true';

  useEffect(() => {
    const hasScannedBefore = localStorage.getItem('hasScannedMeterBefore') === 'true';
    
    if ((hasScannedBefore && imageCaptured) || location.state?.imageCaptured) {
      setUserType('existing');
      if (imageCaptured || location.state?.imageCaptured) {
        localStorage.setItem('hasScannedMeterBefore', 'true');
      }
    } else {
      setUserType('new');
    }
  }, [location.state, imageCaptured]);

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

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10">
        <UserTypeToggle currentType={userType} onTypeChange={setUserType} />
      </div>
      
      {userType === 'new' ? (
        <NewUserResults />
      ) : (
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

          {/* Anomaly Detection Card - Now Collapsible */}
          <Collapsible open={isAnomalyOpen} onOpenChange={setIsAnomalyOpen} className="mb-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-3xl shadow-sm">
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Anomaly Detected</h3>
                    <p className="text-red-100">High water consumption detected</p>
                  </div>
                  {isAnomalyOpen ? (
                    <ChevronUp className="text-white" size={24} />
                  ) : (
                    <ChevronDown className="text-white" size={24} />
                  )}
                </div>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="bg-white p-6 rounded-b-3xl shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TriangleAlert className="text-red-500" size={24} />
                    <div>
                      <p className="font-semibold text-[#212529]">Usage Spike Detected</p>
                      <p className="text-sm text-gray-500">32% increase from average</p>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-sm text-red-600 mb-2">Possible causes:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      <li>Leaking pipes</li>
                      <li>Running toilet</li>
                      <li>Meter malfunction</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Estimated Bill Card - Now Collapsible */}
          <Collapsible open={isBillOpen} onOpenChange={setIsBillOpen}>
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-t-3xl shadow-sm">
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Estimated Bill</h3>
                    <p className="text-4xl font-bold text-white">₱1,124.00</p>
                    <span className="text-blue-50 text-sm">Forecast for February 2025</span>
                  </div>
                  {isBillOpen ? (
                    <ChevronUp className="text-white" size={24} />
                  ) : (
                    <ChevronDown className="text-white" size={24} />
                  )}
                </div>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="bg-white p-6 rounded-b-3xl shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-blue-700">Current Rate</p>
                      <p className="text-sm text-blue-600">₱25.00 / m³</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">Expected Rate</p>
                      <p className="text-sm text-blue-600">₱26.50 / m³</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-blue-700">Projected Usage</p>
                      <p className="text-sm text-blue-600">45 m³</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">Difference</p>
                      <p className="text-sm text-blue-600">+3 m³</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 italic text-center">
                    *Forecast based on your consumption from the last 3 months
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Scan Again Button */}
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
      )}
    </div>
  );
};

export default WaterResults;
