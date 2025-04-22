
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserData } from '@/hooks/useUserData';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const Settings = () => {
  const navigate = useNavigate();
  const { firstName, email, phone, address, avatarUrl, isLoading } = useUserData();

  const capitalizedFirstName = firstName 
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1) 
    : 'User';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] pb-20">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#212529]">Settings</h1>
          <i className="fa-solid fa-cog text-purple-500 text-xl"></i>
        </div>
        {/* Profile Card with Details */}
        <Card className="p-4 mb-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl || ''} alt="Profile" />
              <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#212529] mb-1">{capitalizedFirstName}</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 truncate">{email}</p>
                {phone && <p className="text-sm text-gray-500 truncate">{phone}</p>}
                {address && <p className="text-sm text-gray-500 truncate">{address}</p>}
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/edit-profile')}
            className="w-full mt-4 py-2.5 px-4 bg-gray-50 text-[#212529] rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium">Edit Profile</span>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </button>
        </Card>

        {/* Preferences Section */}
        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <h3 className="px-6 pt-6 pb-2 text-sm font-medium text-gray-500">Preferences</h3>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-between px-6 py-4"
            >
              <span className="font-medium">Change Password</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <h3 className="px-6 pt-6 pb-2 text-sm font-medium text-gray-500">Support</h3>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-purple-50 active:bg-purple-100 group focus:outline-none focus:ring-2 focus:ring-purple-100"
              type="button"
              tabIndex={0}
            >
              <span className="font-medium group-hover:text-purple-700 transition-colors">Help & FAQs</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
            <button 
              onClick={() => navigate('/send-feedback')}
              className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-purple-50 active:bg-purple-100 group focus:outline-none focus:ring-2 focus:ring-purple-100"
              type="button"
              tabIndex={0}
            >
              <span className="font-medium group-hover:text-purple-700 transition-colors">Send Feedback</span>
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
          className="w-full py-4 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg mb-8 focus:outline-none focus:ring-2 focus:ring-red-300"
          type="button"
          tabIndex={0}
        >
          Log Out
        </button>
      </div>
      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition group-hover:bg-gray-800">
                <i className="fa-solid fa-house text-gray-400 text-2xl group-hover:text-purple-400 transition" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-purple-400 transition underline decoration-transparent group-hover:decoration-purple-400 group-hover:underline-offset-2">Home</span>
            </button>
            <button
              onClick={() => navigate('/water')}
              className="flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition group-hover:bg-blue-50">
                <i className="fa-solid fa-droplet text-gray-400 text-2xl group-hover:text-blue-500 transition" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition underline decoration-transparent group-hover:decoration-blue-400 group-hover:underline-offset-2">Water</span>
            </button>
            <button
              onClick={() => navigate('/electricity')}
              className="flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition group-hover:bg-yellow-100">
                <i className="fa-solid fa-bolt text-gray-400 text-2xl group-hover:text-yellow-500 transition" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-yellow-600 transition underline decoration-transparent group-hover:decoration-yellow-500 group-hover:underline-offset-2">Electric</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 cursor-default"
              type="button"
              tabIndex={-1}
            >
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition">
                <i className="fa-solid fa-gear text-white text-2xl transition" />
              </div>
              <span className="text-xs font-medium text-purple-500 group-hover:text-purple-700 transition underline decoration-transparent group-hover:decoration-purple-700 group-hover:underline-offset-2">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
