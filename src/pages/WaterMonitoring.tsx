
import React from "react";
import { Droplet, Info, Home, Bolt, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import WaterCapture from "@/components/water-monitoring/WaterCapture";
import WaterResults from "@/components/water-monitoring/WaterResults";
import WaterConfirmation from "@/components/water-monitoring/WaterConfirmation";
import type { CarouselApi } from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";

const WaterMonitoring: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <div className="flex flex-col h-screen bg-[#f5f6f7] font-sans">
      <div className="flex-none px-6 pt-8 pb-4">
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
      </div>

      <div className="flex-grow overflow-hidden">
        <Carousel 
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
          }}
          className="h-full"
        >
          <CarouselContent className="h-full">
            <CarouselItem className="h-full">
              <div className="px-6 pb-24 h-full overflow-auto">
                <WaterCapture />
              </div>
            </CarouselItem>
            <CarouselItem className="h-full">
              <div className="px-6 pb-24 h-full overflow-auto">
                <WaterResults />
              </div>
            </CarouselItem>
            <CarouselItem className="h-full">
              <div className="px-6 pb-24 h-full overflow-auto">
                <WaterConfirmation />
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      {/* Bottom Navigation */}
      <div className="flex-none px-6 pb-4 bg-[#f5f6f7]">
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
