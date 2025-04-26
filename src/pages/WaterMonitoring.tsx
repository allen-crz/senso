
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Info, Home, Bolt, Settings, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import WaterScanResults from "@/components/water/WaterScanResults";

const WaterMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [api, setApi] = useState<CarouselApi>();

  // Set up the carousel when the API is available
  useCallback(() => {
    if (!api) return;
    
    // Set initial slide
    api.scrollTo(currentStep);
    
    // Listen to carousel changes
    const onSelect = () => {
      setCurrentStep(api.selectedScrollSnap());
    };
    
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, currentStep]);

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative font-sans">
      {/* Status Bar Area */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="text-sm text-[#212529]">9:41</div>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-signal"></i>
          <i className="fa-solid fa-wifi"></i>
          <i className="fa-solid fa-battery-full"></i>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Droplet className="text-blue-400 h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-[#212529]">Water Monitoring</h1>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center">
            <Info className="text-gray-400 h-5 w-5" />
          </button>
        </div>

        {/* Progress Bars */}
        <div className="mb-6 px-6">
          <div className="flex gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${currentStep === 0 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${currentStep === 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${currentStep === 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {/* Carousel for swipeable content */}
        <Carousel 
          className="w-full"
          setApi={setApi}
          opts={{
            startIndex: 1, // Start at the middle item (scan results)
            dragFree: true,
            containScroll: "trimSnaps",
          }}
        >
          <CarouselContent>
            <CarouselItem>
              <div className="px-6 pb-32">
                <h2 className="text-2xl font-bold text-[#212529] mb-6">Capture Meter</h2>
                {/* Add camera capture UI here */}
              </div>
            </CarouselItem>
            <CarouselItem>
              <WaterScanResults />
            </CarouselItem>
            <CarouselItem>
              <div className="px-6 pb-32">
                <h2 className="text-2xl font-bold text-[#212529] mb-6">Confirmation</h2>
                {/* Add confirmation UI here */}
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-4 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <Home className="text-gray-400 h-6 w-6" />
              </div>
              <span className="text-xs text-gray-400">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 relative">
              <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Droplet className="text-blue-400 h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-blue-400">Water</span>
            </button>
            <button
              onClick={() => navigate('/electricity-monitoring')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <Bolt className="text-gray-400 h-6 w-6" />
              </div>
              <span className="text-xs text-gray-400">Electric</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <Settings className="text-gray-400 h-6 w-6" />
              </div>
              <span className="text-xs text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterMonitoring;
