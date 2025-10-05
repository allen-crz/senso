import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserCog, User, Lock, Bell, Eye, Shield, Smartphone, Globe } from 'lucide-react';

const AccountSettings = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: "Profile Information",
      description: "Update your personal details and contact information",
      icon: User,
      color: "gray",
      settings: [
        "Name and profile photo",
        "Email address",
        "Phone number",
        "Home address"
      ]
    },
    {
      title: "Security & Privacy",
      description: "Manage your password and privacy preferences",
      icon: Shield,
      color: "gray",
      settings: [
        "Change password",
        "Login activity",
        "Data privacy settings"
      ]
    },
    {
      title: "Notification Preferences",
      description: "Control what notifications you receive",
      icon: Bell,
      color: "gray",
      settings: [
        "Browser notifications",
        "Usage alerts",
        "Reading reminders",
        "Notification sounds"
      ]
    },
    {
      title: "App Preferences",
      description: "Customize your app experience",
      icon: Globe,
      color: "gray",
      settings: [
        "Notification settings",
        "Reading reminders",
        "App preferences"
      ]
    }
  ];

  const securityTips = [
    {
      title: "Use a Strong Password",
      description: "Include uppercase, lowercase, numbers, and special characters",
      icon: Lock
    },
    {
      title: "Keep Your Browser Updated",
      description: "Use the latest version of your browser for security",
      icon: Smartphone
    },
    {
      title: "Review Login Activity",
      description: "Monitor where and when your account is being accessed",
      icon: Eye
    }
  ];

  const quickActions = [
    { action: "Update Profile", path: "/edit-profile", description: "Change your name, photo, and contact details" },
    { action: "Change Password", path: "/change-password", description: "Create a new secure password" },
    { action: "Preferences", path: "/preferences", description: "Manage notification and app preferences" },
    { action: "Privacy Settings", path: "/terms-privacy", description: "View privacy policy and terms" }
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-8 pt-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/help')} 
              className="p-2 -ml-2 rounded-lg transition duration-150 hover:bg-gray-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-gray-200 outline-none"
              aria-label="Back to Help"
            >
              <ChevronLeft className="text-[#212529] w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-[#212529]">Account Settings</h1>
          </div>
          <UserCog className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">Manage Your Account</h2>
            <p className="text-gray-600 mb-4">
              Customize your profile, security settings, and preferences to personalize your Senso experience.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Settings Categories</h3>
            <div className="space-y-4">
              {settingsSections.map((section, index) => {
                const SectionIcon = section.icon;
                const colorClasses = {
                  gray: 'bg-gray-100 text-[#212529]',
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  orange: 'bg-orange-100 text-orange-600'
                };
                
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[section.color as keyof typeof colorClasses]}`}>
                          <SectionIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#212529] mb-2">{section.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{section.description}</p>
                        <ul className="space-y-1">
                          {section.settings.map((setting, settingIndex) => (
                            <li key={settingIndex} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                              <span className="text-gray-600 text-sm">{setting}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Security Best Practices</h3>
            <div className="space-y-4">
              {securityTips.map((tip, index) => {
                const TipIcon = tip.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <TipIcon className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#212529] mb-1">{tip.title}</h4>
                        <p className="text-gray-600 text-sm">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-[#212529] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#212529] text-sm">{action.action}</h4>
                      <p className="text-gray-600 text-xs">{action.description}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-600 transform rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Frequently Asked</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#212529] mb-2">How do I update my email address?</h4>
                <p className="text-gray-600 text-sm">Go to Edit Profile and update your email. You'll need to verify the new email address.</p>
              </div>
              <div>
                <h4 className="font-medium text-[#212529] mb-2">Can I change my username?</h4>
                <p className="text-gray-600 text-sm">Usernames cannot be changed once set. Contact support if you need assistance.</p>
              </div>
              <div>
                <h4 className="font-medium text-[#212529] mb-2">How do I delete my account?</h4>
                <p className="text-gray-600 text-sm">Account deletion requests can be made through Settings → Send Feedback. This action is permanent.</p>
              </div>
              <div>
                <h4 className="font-medium text-[#212529] mb-2">What data do you store?</h4>
                <p className="text-gray-600 text-sm">We store your profile information, usage data, and preferences. See our Privacy Policy for details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;