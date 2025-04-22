
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserData } from '@/hooks/useUserData';
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { firstName, avatarUrl, isLoading } = useUserData();

  // Capitalize the first letter of the first name
  const capitalizedFirstName = firstName 
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1) 
    : 'User';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pt-6">
          <h1 className="text-2xl font-bold text-[#212529]">Settings</h1>
          <i className="fa-solid fa-cog text-purple-500 text-xl"></i>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl || ''} alt="Profile" />
              <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-[#212529]">{capitalizedFirstName}</h3>
              <p className="text-sm text-gray-500">Email address</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-medium ml-auto block hover:bg-blue-600 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <h3 className="px-6 pt-6 pb-2 text-sm font-medium text-gray-500">Preferences</h3>
          <div className="divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between px-6 py-4">
              <span className="font-medium">Change Password</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <h3 className="px-6 pt-6 pb-2 text-sm font-medium text-gray-500">Support</h3>
          <div className="divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between px-6 py-4">
              <span className="font-medium">Help & FAQs</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
            <button className="w-full flex items-center justify-between px-6 py-4">
              <span className="font-medium">Send Feedback</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <div className="divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between px-6 py-4">
              <span className="font-medium">Terms & Privacy Policy</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* App Version */}
        <p className="text-center text-sm text-gray-400 mb-6">Version 1.0.0</p>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-red-500 text-white rounded-full font-semibold mb-20 hover:bg-red-600 transition-colors shadow-lg"
        >
          Log Out
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-house text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Home</span>
            </button>
            <button onClick={() => navigate('/water')} className="flex flex-col items-center gap-1">
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
            <button className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-gear text-white text-2xl"></i>
              </div>
              <span className="text-xs font-medium text-purple-500">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
