import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, BellRing, BellOff, Settings, Smartphone } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();

  const notificationTypes = [
    {
      title: "Usage Alerts",
      description: "Get notified about significant changes in your consumption",
      icon: BellRing
    },
    {
      title: "Reading Reminders",
      description: "Remind you to take regular meter readings",
      icon: Bell
    },
    {
      title: "Browser Notifications",
      description: "Allow Senso to send notifications through your browser",
      icon: Settings
    }
  ];

  const steps = [
    {
      step: 1,
      title: "Allow Browser Notifications",
      description: "When prompted, click 'Allow' for notifications"
    },
    {
      step: 2,
      title: "Open Preferences",
      description: "Go to Settings → Preferences in the app"
    },
    {
      step: 3,
      title: "Configure Settings",
      description: "Choose which notifications you want to receive"
    },
    {
      step: 4,
      title: "Browser Settings",
      description: "Manage notifications in your browser settings if needed"
    }
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
            <h1 className="text-2xl font-bold text-[#212529]">Notifications</h1>
          </div>
          <Bell className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">Stay Informed</h2>
            <p className="text-gray-600 mb-4">
              Configure your notification preferences to receive browser notifications about your utility usage and reading reminders.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Notification Types</h3>
            <div className="space-y-4">
              {notificationTypes.map((type, index) => {
                const TypeIcon = type.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-[#212529]" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#212529] mb-1">{type.title}</h4>
                          <p className="text-gray-600 text-sm">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-5 h-5 text-[#212529]" />
              <h3 className="font-semibold text-[#212529]">Enable Device Notifications</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              To receive notifications, make sure they're enabled in your device settings:
            </p>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#212529] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-[#212529]">{step.title}</h4>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Troubleshooting</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#212529] mb-2 flex items-center gap-2">
                  <BellOff className="w-4 h-4" />
                  Not Receiving Notifications
                </h4>
                <ul className="text-gray-600 text-sm space-y-1 ml-6">
                  <li>• Check if notifications are enabled in device settings</li>
                  <li>• Ensure the app is not in battery optimization mode</li>
                  <li>• Verify your internet connection</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-[#212529] mb-2">Delayed Notifications</h4>
                <ul className="text-gray-600 text-sm space-y-1 ml-6">
                  <li>• Check your device's power saving settings</li>
                  <li>• Ensure the app has background app refresh enabled</li>
                  <li>• Try restarting the application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;