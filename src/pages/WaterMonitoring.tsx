
import React, { useState, useEffect, useRef } from "react";
import { Droplet, Info, Home, Bolt, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import WaterCapture from "@/components/water-monitoring/WaterCapture";
import WaterResults from "@/components/water-monitoring/WaterResults";
import WaterConfirmation from "@/components/water-monitoring/WaterConfirmation";

const WaterMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  // Use effect to handle carousel events
  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentStep(api.selectedScrollSnap() || 0);
    });
  }, [api]);

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative font-sans pt-8">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="text-sm text-[#212529]">9:41</div>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-signal"></i>
          <i className="fa-solid fa-wifi"></i>
          <i className="fa-solid fa-battery-full"></i>
        </div>
      </div>

      <div className="px-6 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Droplet className="text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-[#212529]">Water Monitoring</h1>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center">
            <Info className="text-gray-400" />
          </button>
        </div>

        {/* Progress Bars */}
        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full ${
                step === currentStep ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent>
            <CarouselItem>
              <WaterCapture />
            </CarouselItem>
            <CarouselItem>
              <WaterResults />
            </CarouselItem>
            <CarouselItem>
              <WaterConfirmation />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-4 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Home */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
            >
              <div className="w-10 h-10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Home</span>
            </button>

            {/* Water */}
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Droplet className="text-blue-400" />
              </div>
              <span className="text-xs font-medium text-blue-400">Water</span>
            </button>

            {/* Electric */}
            <button
              onClick={() => navigate("/electricity-monitoring")}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
            >
              <div className="w-10 h-10 group-hover:bg-amber-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Bolt className="text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">Electric</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate("/settings")}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
            >
              <div className="w-10 h-10 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-150">
                <Settings className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterMonitoring;
