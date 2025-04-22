import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WaterSection from '@/components/WaterSection';
import ElectricitySection from '@/components/ElectricitySection';
import { useUserData } from '@/hooks/useUserData';
import { toast } from "@/hooks/use-toast";
import { Home, Droplet, Bolt, Settings } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { firstName, avatarUrl, isLoading } = useUserData();

  // Capitalize the first letter of the first name
  const capitalizedFirstName = firstName 
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1) 
    : 'User';

  // Handler for "Add Reading" button for water
  const handleAddWaterReading = () => {
    toast({
      title: "Add Water Reading",
      description: "Coming soon: take and submit a water meter photo!",
    });
  };

  // Handler for "Add Reading" button for electricity
  const handleAddElectricityReading = () => {
    toast({
      title: "Add Electricity Reading",
      description: "Coming soon: take and submit an electric meter photo!",
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative pt-6">
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#212529] mb-1">Hi, {capitalizedFirstName} 👋</h1>
            <p className="text-gray-500">Welcome to Senso</p>
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatarUrl || ''} alt="Profile" />
            <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button
              className="px-6 py-3 bg-[#212529] text-white rounded-full whitespace-nowrap cursor-pointer transition-colors duration-150 hover:bg-[#303338] active:scale-95 focus:outline-none"
              type="button"
              tabIndex={0}
            >
              All
            </button>
            <button 
              onClick={() => navigate('/water')}
              className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap border-2 border-blue-200 cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:border-blue-400 active:scale-95 focus:outline-none"
              type="button"
              tabIndex={0}
            >
              Water
            </button>
            <button 
              onClick={() => navigate('/electricity')}
              className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap border-2 border-amber-200 cursor-pointer transition-colors duration-150 hover:bg-amber-50 hover:border-amber-400 active:scale-95 focus:outline-none"
              type="button"
              tabIndex={0}
            >
              Electricity
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <WaterSection variant="dashboard" onAddReading={handleAddWaterReading} />
          <ElectricitySection variant="dashboard" onAddReading={handleAddElectricityReading} />

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
                className="px-6 py-2 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold cursor-pointer transition transform duration-100 hover:bg-blue-100 hover:text-blue-600 active:scale-95 focus:outline-none"
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
                className="px-6 py-2 bg-amber-50 text-amber-500 rounded-full text-sm font-semibold cursor-pointer transition transform duration-100 hover:bg-amber-100 hover:text-amber-600 active:scale-95 focus:outline-none"
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
        </div>
      </div>

      {/* Fixed footer nav bar */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <div className="bg-[#212529] rounded-full px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-white group-hover:text-white/80" />
              </div>
              <span className="text-xs font-medium text-white group-hover:text-white/80">Home</span>
            </button>
            <button
              onClick={() => navigate('/water')}
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
              onClick={() => navigate('/electricity')}
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

export default Dashboard;
