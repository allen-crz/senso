
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WaterSection from '@/components/WaterSection';
import { useUserData } from '@/hooks/useUserData';

const Water = () => {
  const navigate = useNavigate();
  const { firstName, avatarUrl, isLoading } = useUserData();

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-8 pt-6">
          <div>
            <h1 className="text-2xl font-bold text-[#212529] mb-1">Hi, {firstName} 👋</h1>
            <p className="text-gray-500">Welcome to Senso</p>
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatarUrl || ''} alt="Profile" />
            <AvatarFallback>{firstName?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap">All</button>
            <button className="px-6 py-3 bg-[#212529] text-white rounded-full whitespace-nowrap">Water</button>
            <button onClick={() => navigate('/electricity')} className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap border-2 border-amber-200">Electricity</button>
          </div>
        </div>

        <div className="space-y-4">
          <WaterSection variant="water" />

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
        </div>
      </div>

      <div className="fixed bottom-6 left-6 right-6">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 relative">
              <div className="w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-house text-white"></i>
              </div>
              <span className="text-xs font-medium text-white">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-droplet text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Water</span>
            </button>
            <button onClick={() => navigate('/electricity')} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-bolt text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Electric</span>
            </button>
            <button className="flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-gear text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Water;
