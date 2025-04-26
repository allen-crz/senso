
import React from "react";
import { Droplet, Info, Home, Bolt, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import WaterCapture from "@/components/water-monitoring/WaterCapture";
import WaterResults from "@/components/water-monitoring/WaterResults";
import WaterConfirmation from "@/components/water-monitoring/WaterConfirmation";
import type { CarouselApi } from "@/components/ui/carousel";

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
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="px-6 pt-8 pb-20">
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

          <ScrollArea className="h-[calc(100vh-180px)]">
            <Carousel 
              setApi={setApi}
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
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
          </ScrollArea>
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
