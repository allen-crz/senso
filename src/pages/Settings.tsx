import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Droplet, Bolt, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 mb-8">
        <h1 className="text-2xl font-bold text-[#212529]">Settings</h1>
        <SettingsIcon className="text-gray-500 w-6 h-6" />
      </div>
      {/* Main Content */}
      <div className="px-6 pb-32">
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-[#212529] mb-4">Account</h3>
          <button
            onClick={() => navigate('/profile')}
            className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-200"
            tabIndex={0}
          >
            View Profile
          </button>
          <button
            onClick={() => navigate('/edit-profile')}
            className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-200"
            tabIndex={0}
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate('/change-password')}
            className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-200"
            tabIndex={0}
          >
            Change Password
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-[#212529] mb-4">Support</h3>
          <button
            onClick={() => navigate('/help')}
            className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-200"
            tabIndex={0}
          >
            Help & FAQ
          </button>
          <button
            onClick={() => navigate('/send-feedback')}
            className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-200"
            tabIndex={0}
          >
            Send Feedback
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-[#212529] mb-4">Legal</h3>
          <button
            onClick={() => navigate('/terms-privacy')}
            className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-200"
            tabIndex={0}
          >
            Terms & Privacy
          </button>
        </div>
      </div>
      {/* Fixed footer nav bar, dashboard-style */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <div className="bg-[#212529] rounded-full px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">Home</span>
            </button>
            <button
              onClick={() => navigate('/water-monitoring')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Droplet className="text-gray-400 group-hover:text-blue-500 transition-colors" />
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
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">Electricity</span>
            </button>
            <div className="flex flex-col items-center gap-1 group cursor-default">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <SettingsIcon className="text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Settings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
