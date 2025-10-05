import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wrench, Camera, Wifi, Battery, AlertTriangle, CheckCircle, RefreshCw, HelpCircle } from 'lucide-react';

const Troubleshooting = () => {
  const navigate = useNavigate();
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const commonIssues = [
    {
      title: "Camera Not Working",
      icon: Camera,
      description: "Issues with meter reading camera functionality",
      solutions: [
        "Ensure camera permissions are enabled in device settings",
        "Clean your camera lens with a soft cloth",
        "Close and restart the app",
        "Check if other apps can access the camera",
        "Update the app to the latest version"
      ]
    },
    {
      title: "App Won't Load or Crashes",
      icon: RefreshCw,
      description: "App freezing, crashing, or failing to start",
      solutions: [
        "Force close the app and restart it",
        "Restart your device",
        "Clear the app cache (Android: Settings > Apps > Senso > Storage > Clear Cache)",
        "Ensure you have enough storage space on your device",
        "Update the app if available",
        "Reinstall the app as a last resort"
      ]
    },
    {
      title: "No Internet Connection",
      icon: Wifi,
      description: "Unable to sync data or connect to servers",
      solutions: [
        "Check your WiFi or mobile data connection",
        "Try switching between WiFi and mobile data",
        "Restart your router if using WiFi",
        "Check if other apps can connect to the internet",
        "Disable VPN if you're using one",
        "Wait a few minutes and try again"
      ]
    },
    {
      title: "Battery Drains Quickly",
      icon: Battery,
      description: "App consuming too much battery power",
      solutions: [
        "Close the app when not in use",
        "Disable background app refresh for Senso",
        "Reduce notification frequency",
        "Update to the latest app version",
        "Check battery optimization settings",
        "Restart your device"
      ]
    },
    {
      title: "Readings Not Accurate",
      icon: AlertTriangle,
      description: "Meter readings are incorrect or not recognized",
      solutions: [
        "Ensure proper lighting when taking photos",
        "Hold the camera steady and at the right distance",
        "Clean the meter display before photographing",
        "Try taking the photo from different angles",
        "Manually verify and edit readings if needed",
        "Report persistent issues through feedback"
      ]
    },
    {
      title: "Login or Account Issues",
      icon: HelpCircle,
      description: "Cannot log in or access account features",
      solutions: [
        "Check your email and password are correct",
        "Use 'Forgot Password' to reset your password",
        "Ensure your internet connection is stable",
        "Clear browser cache if using web version",
        "Check if your account is verified",
        "Contact support if the issue persists"
      ]
    }
  ];

  const diagnosticSteps = [
    {
      step: 1,
      title: "Identify the Problem",
      description: "Note when the issue occurs and what triggers it"
    },
    {
      step: 2,
      title: "Check Basic Settings",
      description: "Verify app permissions, internet connection, and device settings"
    },
    {
      step: 3,
      title: "Try Simple Solutions",
      description: "Restart the app, check for updates, or clear cache"
    },
    {
      step: 4,
      title: "Contact Support",
      description: "If issues persist, report them through the app with details"
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
            <h1 className="text-2xl font-bold text-[#212529]">Troubleshooting</h1>
          </div>
          <Wrench className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">Common Issues & Solutions</h2>
            <p className="text-gray-600 mb-4">
              Find quick solutions to the most frequently encountered problems with the Senso app.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Quick Diagnostic Steps</h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="space-y-4">
                {diagnosticSteps.map((step, index) => (
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
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Common Problems</h3>
            <div className="space-y-4">
              {commonIssues.map((issue, index) => {
                const IssueIcon = issue.icon;
                const isExpanded = expandedIssue === index;
                
                return (
                  <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedIssue(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <IssueIcon className="w-5 h-5 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#212529] mb-1">{issue.title}</h4>
                          <p className="text-gray-600 text-sm">{issue.description}</p>
                        </div>
                      </div>
                      <ChevronLeft className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <div className="ml-14">
                          <h5 className="font-medium text-[#212529] mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#212529]" />
                            Solutions to Try:
                          </h5>
                          <ul className="space-y-2">
                            {issue.solutions.map((solution, solutionIndex) => (
                              <li key={solutionIndex} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-gray-600 text-sm">{solution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Still Having Issues?</h3>
            </div>
            <p className="text-amber-700 text-sm mb-4">
              If none of these solutions work, try these additional steps:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-700 text-sm">Update your device's operating system</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-700 text-sm">Check if your device meets minimum requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-700 text-sm">Try using the app on a different device temporarily</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Contact Support</h3>
            <p className="text-gray-600 text-sm mb-4">
              When contacting support, please include the following information:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#212529] mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">Your device model and operating system version</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#212529] mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">App version number (found in Settings)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#212529] mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">Detailed description of the problem</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#212529] mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">Steps you've already tried to fix the issue</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/send-feedback')}
                className="w-full bg-[#212529] text-white py-3 rounded-xl font-medium hover:bg-[#303338] transition-colors"
              >
                Send Support Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Troubleshooting;