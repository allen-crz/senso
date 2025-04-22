import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WaterSection from '@/components/WaterSection';

const Dashboard = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Extract first name from full name
        const firstName = profile.full_name?.split(' ')[0] || 'User';
        setFirstName(firstName);
        setAvatarUrl(profile.avatar_url);
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative pt-6">
      <div className="px-6 pb-32">
        {/* Greeting Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#212529] mb-1">Hi, {firstName} 👋</h1>
            <p className="text-gray-500">Welcome to Senso</p>
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatarUrl || ''} alt="Profile" />
            <AvatarFallback>{firstName?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        </div>

        {/* Utility Toggle */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button className="px-6 py-3 bg-[#212529] text-white rounded-full whitespace-nowrap">All</button>
            <button className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap border-2 border-blue-200">Water</button>
            <button className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap border-2 border-amber-200">Electricity</button>
          </div>
        </div>

        {/* Replace the old water card with the new WaterSection component */}
        <div className="space-y-4">
          <WaterSection />

          {/* Empty State Cards */}
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
              <button className="px-6 py-2 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold">Add Reading</button>
            </div>
          </div>

          {/* Electricity Usage Empty Card */}
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
              <button className="px-6 py-2 bg-amber-50 text-amber-500 rounded-full text-sm font-semibold">Add Reading</button>
            </div>
          </div>

          {/* Cost Forecast Empty Card */}
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
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button className="flex flex-col items-center gap-1 relative">
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
            <button className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-bolt text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Electric</span>
            </button>
            <button className="flex flex-col items-center gap-1">
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

export default Dashboard;
