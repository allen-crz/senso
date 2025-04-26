import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Users } from "lucide-react";
import WaterSection from '@/components/WaterSection';
import ElectricitySection from '@/components/ElectricitySection';
import { useUserData } from '@/hooks/useUserData';
import { Card } from "@/components/ui/card";
import { Home, Droplet, Bolt, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import DashboardExistingUserView from '@/components/dashboard/DashboardExistingUserView';
import DashboardNewUserView from '@/components/dashboard/DashboardNewUserView';

type TabType = "all" | "water" | "electricity";

const DashboardTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, avatarUrl, isLoading } = useUserData();
  const [userType, setUserType] = useState<'new' | 'existing'>('new');

  // Determine selected tab by path
  const tab: TabType = useMemo(() => {
    if (location.pathname === "/water") return "water";
    if (location.pathname === "/electricity") return "electricity";
    return "all";
  }, [location.pathname]);

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

  const handleAddWaterReading = () => {
    navigate('/water-monitoring');
  };

  const handleAddElectricityReading = () => {
    navigate('/electricity-monitoring');
  };

  const toggleUserType = () => {
    setUserType(prev => prev === 'new' ? 'existing' : 'new');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative pt-6">
      <div className="px-6 pb-32">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-8 pt-0 relative">
          {userAvatar}
          <button 
            onClick={toggleUserType}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Toggle view mode"
          >
            {userType === 'new' ? (
              <ToggleLeft className="w-6 h-6" />
            ) : (
              <ToggleRight className="w-6 h-6" />
            )}
          </button>
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

        {/* Content based on user type */}
        {userType === 'new' ? (
          <DashboardNewUserView onAddWaterReading={handleAddWaterReading} onAddElectricityReading={handleAddElectricityReading} />
        ) : (
          <DashboardExistingUserView onAddWaterReading={handleAddWaterReading} onAddElectricityReading={handleAddElectricityReading} />
        )}
      </div>

      {/* Bottom Navigation */}
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
