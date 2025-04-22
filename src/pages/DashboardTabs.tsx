
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WaterSection from '@/components/WaterSection';
import ElectricitySection from '@/components/ElectricitySection';
import { useUserData } from '@/hooks/useUserData';
import { Card } from "@/components/ui/card";
import { Home, Droplet, Bolt, Settings } from 'lucide-react';

type TabType = "all" | "water" | "electricity";

const DashboardTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, avatarUrl, isLoading } = useUserData();

  // Determine selected tab by path (so url stays in sync)
  const tab: TabType = useMemo(() => {
    if (location.pathname === "/water") return "water";
    if (location.pathname === "/electricity") return "electricity";
    return "all"; // default is dashboard
  }, [location.pathname]);

  // Strong memoization of user data to prevent UI flickering
  const userAvatar = useMemo(() => {
    const capitalizedFirstName = firstName 
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1) 
      : 'User';
    
    return (
      <>
        <div>
          <h1 className="text-2xl font-bold text-[#212529] mb-1">
            Hi, {capitalizedFirstName} <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-gray-500">Welcome to Senso</p>
        </div>
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatarUrl || ''} alt="Profile" />
          <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
        </Avatar>
      </>
    );
  }, [firstName, avatarUrl]);

  // Redirect to monitoring pages instead of showing toast
  const handleAddWaterReading = () => {
    navigate('/water-monitoring');
  };

  const handleAddElectricityReading = () => {
    navigate('/electricity-monitoring');
  };

  // NAV: Only "Home" is highlighted, Water/Electric/Electricity always default
  return (
    <div className="min-h-screen bg-[#f5f6f7] relative pt-6">
      <div className="px-6 pb-32">
        {/* Shared Top Header - Now fully memoized to prevent refreshing */}
        <div className="flex justify-between items-center mb-8 pt-0">
          {userAvatar}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigate('/dashboard')}
              className={
                "px-6 py-3 rounded-full whitespace-nowrap transition-colors duration-150 " +
                (tab === "all"
                  ? "bg-[#212529] text-white"
                  : "bg-white text-[#212529] border-2 border-gray-200 hover:bg-gray-100")
              }
              type="button"
              tabIndex={0}
            >
              All
            </button>
            <button
              onClick={() => navigate('/water')}
              className={
                "px-6 py-3 rounded-full whitespace-nowrap transition-colors duration-150 " +
                (tab === "water"
                  ? "bg-[#212529] text-white"
                  : "bg-white text-[#212529] border-2 border-blue-200 hover:bg-blue-50")
              }
              type="button"
              tabIndex={0}
            >
              Water
            </button>
            <button
              onClick={() => navigate('/electricity')}
              className={
                "px-6 py-3 rounded-full whitespace-nowrap transition-colors duration-150 " +
                (tab === "electricity"
                  ? "bg-[#212529] text-white"
                  : "bg-white text-[#212529] border-2 border-amber-200 hover:bg-amber-50")
              }
              type="button"
              tabIndex={0}
            >
              Electricity
            </button>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="space-y-4">
          {tab === "all" && (
            <>
              <WaterSection variant="dashboard" onAddReading={handleAddWaterReading} />
              <ElectricitySection variant="dashboard" onAddReading={handleAddElectricityReading} />

              {/* ...Simple sections exactly as Dashboard... */}
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529] mb-1">Water Usage Today</h3>
                    <p className="text-gray-400">No readings yet</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-droplet text-blue-400"></i>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8">
                  <i className="fa-solid fa-camera text-blue-200 text-4xl mb-4"></i>
                  <p className="text-gray-400 text-center mb-2">Take a photo of your water meter</p>
                  <button
                    className="px-6 py-2 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold"
                    type="button"
                    tabIndex={0}
                    onClick={handleAddWaterReading}
                  >
                    Add Reading
                  </button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529] mb-1">Electricity Usage Today</h3>
                    <p className="text-gray-400">No readings yet</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-bolt text-amber-400"></i>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8">
                  <i className="fa-solid fa-camera text-amber-200 text-4xl mb-4"></i>
                  <p className="text-gray-400 text-center mb-2">Take a photo of your electric meter</p>
                  <button
                    className="px-6 py-2 bg-amber-50 text-amber-500 rounded-full text-sm font-semibold"
                    type="button"
                    tabIndex={0}
                    onClick={handleAddElectricityReading}
                  >
                    Add Reading
                  </button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529] mb-1">This Month's Forecast</h3>
                    <p className="text-gray-400">Add readings to see forecast</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-chart-line text-gray-400"></i>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8">
                  <i className="fa-solid fa-calculator text-gray-200 text-4xl mb-4"></i>
                  <p className="text-gray-400 text-center">Start adding meter readings to see cost predictions</p>
                </div>
              </div>
            </>
          )}
          {tab === "water" && (
            <>
              <WaterSection variant="water" onAddReading={() => navigate('/water-monitoring')} />
              <div className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-check text-gray-500"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-1">No anomalies detected</h3>
                    <p className="text-sm text-gray-500">Your water usage is within normal range</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Water Prices</h3>
                    <p className="text-2xl font-bold text-[#212529]">₱25.50/m³</p>
                    <p className="text-sm text-gray-500">Base rate for residential</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-peso-sign text-blue-400"></i>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">First 10m³</span>
                    <span className="text-sm font-semibold">₱25.50/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">11m³ and above</span>
                    <span className="text-sm font-semibold">₱28.00/m³</span>
                  </div>
                </div>
              </div>
            </>
          )}
          {tab === "electricity" && (
            <>
              <ElectricitySection variant="electricity" onAddReading={handleAddElectricityReading} />
              <Card className="bg-red-500 p-6 rounded-3xl shadow-sm border border-red-400">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-triangle-exclamation text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Anomaly Detected</h3>
                    <p className="text-sm text-white text-opacity-90">Unusual spike in electricity consumption</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Electricity Rates</h3>
                    <p className="text-2xl font-bold text-[#212529]">₱9.50/kWh</p>
                    <p className="text-sm text-gray-500">Base rate for residential</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-peso-sign text-amber-400" />
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Peak Hours (9AM-9PM)</span>
                    <span className="text-sm font-semibold">₱11.50/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Off-Peak Hours</span>
                    <span className="text-sm font-semibold">₱8.00/kWh</span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Bottom Nav - Home is always highlighted (active), others are always default */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <div className="bg-[#212529] rounded-full px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div
              className="flex flex-col items-center gap-1 group cursor-default"
              tabIndex={0}
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-white" />
              </div>
              <span className="text-xs font-medium text-white">Home</span>
            </div>
            <button
              onClick={() => navigate('/water-monitoring')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Droplet className="text-gray-400 group-hover:text-blue-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Water</span>
            </button>
            <button
              onClick={() => navigate('/electricity-monitoring')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-amber-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Bolt className="text-gray-400 group-hover:text-amber-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">Electric</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-150">
                <Settings className="text-gray-400 group-hover:text-gray-600" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTabs;

