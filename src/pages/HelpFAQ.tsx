import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { 
  Search,
  Camera,
  Bell,
  LineChart,
  Wallet,
  Rocket,
  UserCog,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Home, Droplet, Bolt, Settings as SettingsIcon,
} from "lucide-react";

const HelpFAQ = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const popularTopics = [
    { icon: Camera, label: 'Meter Reading' },
    { icon: Bell, label: 'Notifications' },
    { icon: LineChart, label: 'Usage Stats' },
    { icon: Wallet, label: 'Billing' }
  ];

  const faqSections = [
    { 
      icon: Rocket,
      title: 'Getting Started',
      description: 'Basic guide and tutorials'
    },
    {
      icon: UserCog,
      title: 'Account Settings',
      description: 'Profile and preferences'
    },
    {
      icon: Wrench,
      title: 'Troubleshooting',
      description: 'Common issues and solutions'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-8 pt-6">
          <div className="flex items-center gap-2">
            {/* Back button */}
            <button 
              onClick={() => navigate('/settings')} 
              className="p-2 -ml-2 rounded-lg transition duration-150 hover:bg-gray-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-purple-200 outline-none"
              aria-label="Back to Settings"
            >
              <ChevronLeft className="text-[#212529] w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-[#212529]">Help & FAQs</h1>
          </div>
          <i className="fa-solid fa-circle-question text-purple-500 text-xl"></i>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search help articles"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-2xl py-6 pl-12 pr-4 transition focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Popular Topics</h2>
          <div className="grid grid-cols-2 gap-4">
            {popularTopics.map((topic, index) => {
              const TopicIcon = topic.icon;
              return (
                <button
                  key={index}
                  className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3 transition hover:bg-purple-50 hover:scale-105 hover:shadow-md active:scale-95 group focus:outline-none focus:ring-2 focus:ring-purple-100"
                  type="button"
                >
                  <TopicIcon className="text-purple-500 w-5 h-5 group-hover:text-purple-600 transition" />
                  <span className="font-medium group-hover:text-purple-700 transition">{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-4">
          {faqSections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-6 transition hover:bg-purple-50 hover:scale-[1.03] hover:shadow-md active:scale-95 group focus:outline-none focus:ring-2 focus:ring-purple-100"
                  type="button"
                >
                  <div className="flex items-center gap-4">
                    <SectionIcon className="text-purple-500 w-5 h-5 group-hover:text-purple-600 transition" />
                    <div className="text-left">
                      <h3 className="font-semibold group-hover:text-purple-700 transition">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 w-5 h-5 group-hover:text-purple-400 transition" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Fixed footer nav bar, Dashboard-style */}
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
                <SettingsIcon className="text-gray-400 group-hover:text-gray-600" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQ;
