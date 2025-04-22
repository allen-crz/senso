import React from "react";
import { useNavigate } from "react-router-dom";
import { Send, ChevronLeft } from "lucide-react";
import { Home, Droplet, Bolt, Settings } from 'lucide-react';

const SendFeedback = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 mb-8">
        <div className="flex items-center gap-2">
          <button
            aria-label="Back to Settings"
            onClick={() => navigate("/settings")}
            className="p-2 -ml-2 rounded-lg transition duration-150 hover:bg-gray-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-purple-200 outline-none"
            tabIndex={0}
          >
            <ChevronLeft className="text-[#212529] w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#212529]">Send Feedback</h1>
        </div>
        <Send className="text-purple-500 w-6 h-6" />
      </div>
      {/* Main Content */}
      <div className="px-6 pb-32">
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <p className="text-center text-[#212529] mb-4">
            Send us your feedback at:
          </p>
          <a
            href="mailto:support@senso.com"
            className="block w-full text-center text-purple-500 text-lg font-medium hover:text-purple-600 active:text-purple-700 transition-colors duration-150 focus:underline focus:outline-none"
            tabIndex={0}
          >
            support@senso.com
          </a>
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
                <Home className="text-white group-hover:text-white/80" />
              </div>
              <span className="text-xs font-medium text-white group-hover:text-white/80">Home</span>
            </button>
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
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">Electricity</span>
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

export default SendFeedback;
