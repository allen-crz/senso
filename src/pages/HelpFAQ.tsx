
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
  ChevronLeft  // Add this import
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
        <div className="flex justify-between items-center mb-8 pt-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/settings')} 
              className="p-2 -ml-2"
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
              className="w-full bg-white rounded-2xl py-6 pl-12 pr-4"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Popular Topics</h2>
          <div className="grid grid-cols-2 gap-4">
            {popularTopics.map((topic, index) => {
              const TopicIcon = topic.icon;
              return (
                <button key={index} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3">
                  <TopicIcon className="text-purple-500 w-5 h-5" />
                  <span className="font-medium">{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {faqSections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button className="w-full flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <SectionIcon className="text-purple-500 w-5 h-5" />
                    <div className="text-left">
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

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
            <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1">
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

export default HelpFAQ;

