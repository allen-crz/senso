import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import WaterSection from '@/components/WaterSection';
import ElectricitySection from '@/components/ElectricitySection';
import { useUserData } from '@/hooks/useUserData';
import { Card } from "@/components/ui/card";
import { Home, Droplet, Bolt, Settings, User } from 'lucide-react';
import DashboardNewUserView from '@/components/dashboard/DashboardNewUserView';
import DashboardExistingUserView from '@/components/dashboard/DashboardExistingUserView';

type TabType = "all" | "water" | "electricity";

const DashboardTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, avatarUrl, isLoading } = useUserData();
  const [showExisting, setShowExisting] = useState(false);

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

        {/* Tabs with Toggle */}
        <div className="mb-8">
          <div className="flex gap-3 items-center overflow-x-auto no-scrollbar">
            <div className="flex gap-3 flex-1">
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
            <Toggle
              pressed={showExisting}
              onPressedChange={setShowExisting}
              className="h-10 w-10 rounded-full hover:bg-gray-100"
              aria-label="Toggle user view"
            >
              <User className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="space-y-4">
          {tab === "all" && (
            showExisting ? <DashboardExistingUserView /> : <DashboardNewUserView />
          )}
          {tab === "water" && (
            <WaterSection variant="water" onAddReading={() => navigate('/water-monitoring')} />
          )}
          {tab === "electricity" && (
            <ElectricitySection variant="electricity" onAddReading={handleAddElectricityReading} />
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
