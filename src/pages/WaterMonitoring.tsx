
import React, { useEffect } from "react";
import { Droplet, Info, Home, Bolt, Settings as SettingsIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import WaterCapture from "@/components/water-monitoring/WaterCapture";
import WaterResults from "@/components/water-monitoring/WaterResults";
import WaterConfirmation from "@/components/water-monitoring/WaterConfirmation";
import type { CarouselApi } from "@/components/ui/carousel";

const WaterMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);
  
  // Handle direct navigation to results view if requested
  React.useEffect(() => {
    const showResults = location.state?.showResults;
    if (showResults && api) {
      // Small delay to ensure the carousel is fully initialized
      setTimeout(() => {
        api.scrollTo(1);
        console.log("Scrolling to results view");
      }, 100);
    }
  }, [api, location.state?.showResults]);

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative font-sans pt-8">
      <div className="px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Droplet className="text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-[#212529]">Water Monitoring</h1>
          </div>
          <button
            aria-label="Info"
            className="w-10 h-10 rounded-full flex items-center justify-center focus:outline-none"
          >
            <Info className="text-gray-400" />
          </button>
        </div>

        {/* Progress Bars */}
        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index === current ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="pb-[72px]">
          <Carousel 
            setApi={setApi}
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <WaterCapture />
              </CarouselItem>
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <WaterResults />
              </CarouselItem>
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <WaterConfirmation />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-4 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Home */}
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white font-medium transition-colors">
                Home
              </span>
            </button>

            {/* Water */}
            <button className="flex flex-col items-center gap-1 group cursor-default">
              <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Droplet className="text-blue-400" />
              </div>
              <span className="text-xs font-medium text-blue-400">Water</span>
            </button>

            {/* Electric */}
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/electricity-monitoring")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-amber-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Bolt className="text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">
                Electric
              </span>
            </button>

            {/* Settings */}
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/settings")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-150">
                <SettingsIcon className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterMonitoring;
