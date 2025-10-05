import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Rocket, User, Camera, Smartphone, CheckCircle, PlayCircle } from 'lucide-react';

const GettingStarted = () => {
  const navigate = useNavigate();

  const setupSteps = [
    {
      step: 1,
      title: "Install as PWA",
      description: "Install Senso on your device for the best experience",
      icon: Smartphone,
      details: ["Open Senso in your browser", "Look for 'Install' or 'Add to Home Screen' option", "Works on all modern browsers and devices"]
    },
    {
      step: 2,
      title: "Create Account",
      description: "Sign up with your email and create a secure password",
      icon: User,
      details: ["Verify your email address", "Set up your profile information", "Complete your account setup"]
    },
    {
      step: 3,
      title: "Take Your First Reading",
      description: "Use the camera to capture your meter readings",
      icon: Camera,
      details: ["Follow the camera guide", "Position your meter clearly in frame", "Confirm readings are accurate"]
    },
    {
      step: 4,
      title: "Track Your Usage",
      description: "Monitor your consumption and trends over time",
      icon: PlayCircle,
      details: ["View usage comparisons with previous readings", "Track consumption patterns", "Monitor monthly trends"]
    }
  ];

  const quickTips = [
    {
      title: "Take readings regularly",
      description: "For best results, capture meter readings at the same time each month"
    },
    {
      title: "Enable notifications",
      description: "Stay informed about high usage, bills, and important updates"
    },
    {
      title: "Check your data",
      description: "Review usage patterns to identify opportunities for savings"
    },
    {
      title: "Update your profile",
      description: "Keep your contact information and preferences up to date"
    }
  ];

  const features = [
    {
      name: "Smart Meter Reading",
      description: "Camera-based meter reading with manual verification"
    },
    {
      name: "Usage Tracking",
      description: "Compare current readings with previous ones to track changes"
    },
    {
      name: "Trend Monitoring",
      description: "View your consumption patterns over time"
    },
    {
      name: "PWA Experience",
      description: "Works offline and can be installed like a native app"
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
            <h1 className="text-2xl font-bold text-[#212529]">Getting Started</h1>
          </div>
          <Rocket className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">Welcome to Senso!</h2>
            <p className="text-gray-600 mb-4">
              Get started with Senso by following these simple steps to set up your account and begin monitoring your utility usage.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Setup Steps</h3>
            <div className="space-y-6">
              {setupSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-[#212529] text-white rounded-full flex items-center justify-center text-lg font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <StepIcon className="w-5 h-5 text-[#212529]" />
                          <h4 className="font-semibold text-[#212529]">{step.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                        <ul className="space-y-1">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-[#212529] mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 text-sm">{detail}</span>
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
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Key Features</h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="grid gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-[#212529] mb-1">{feature.name}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-[#212529] mb-4">Quick Start Tips</h3>
            <div className="space-y-3">
              {quickTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-[#212529] text-sm">{tip.title}</h4>
                    <p className="text-gray-600 text-sm">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Need Help?</h3>
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                If you encounter any issues during setup, here are some resources:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600 text-sm">Check the Troubleshooting section for common solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600 text-sm">Visit our FAQ section for frequently asked questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600 text-sm">Contact support through Settings → Send Feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;