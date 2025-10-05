import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

const MeterReading = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Position Your Camera",
      description: "Align your camera with the meter display for best results",
      icon: Camera
    },
    {
      title: "Ensure Good Lighting",
      description: "Make sure the meter display is well-lit and clearly visible",
      icon: Lightbulb
    },
    {
      title: "Hold Steady",
      description: "Keep your device steady while taking the reading",
      icon: CheckCircle
    }
  ];

  const tips = [
    "Clean your camera lens before taking readings",
    "Avoid reflections and glare on the meter display",
    "Take readings during daylight for best accuracy",
    "If reading fails, try adjusting the angle or distance"
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
            <h1 className="text-2xl font-bold text-[#212529]">Meter Reading</h1>
          </div>
          <Camera className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">How to Take Accurate Readings</h2>
            <p className="text-gray-600 mb-4">
              Follow these simple steps to capture accurate meter readings using your camera.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <StepIcon className="w-5 h-5 text-[#212529]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#212529] mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Pro Tips</h3>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-amber-700 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#212529] mb-4">Common Issues</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-[#212529] mb-2">Reading Not Recognized</h4>
              <p className="text-gray-600 text-sm">Ensure the meter display is clearly visible and try adjusting your distance or angle.</p>
            </div>
            <div>
              <h4 className="font-medium text-[#212529] mb-2">Poor Image Quality</h4>
              <p className="text-gray-600 text-sm">Clean your camera lens and ensure adequate lighting conditions.</p>
            </div>
            <div>
              <h4 className="font-medium text-[#212529] mb-2">Incorrect Values</h4>
              <p className="text-gray-600 text-sm">Manually verify readings and retake if necessary. You can always edit readings after capture.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeterReading;