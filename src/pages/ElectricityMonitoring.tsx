import React, { useEffect } from "react";
import { Bolt, Info, Home, Droplet, Settings as SettingsIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ElectricityCapture from "@/components/electricity-monitoring/ElectricityCapture";
import ElectricityResults from "@/components/electricity-monitoring/ElectricityResults";
import ElectricityConfirmation from "@/components/electricity-monitoring/ElectricityConfirmation";
import type { CarouselApi } from "@/components/ui/carousel";

const ElectricityMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isEntering, setIsEntering] = React.useState(true);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);
  
  React.useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => setIsEntering(false), 500);
    return () => clearTimeout(timer);
  }, [location.key]);
  
  React.useEffect(() => {
    if (!api) return;

    const slideIndex = location.state?.slideIndex;
    
    if (slideIndex !== undefined) {
      setTimeout(() => {
        api.scrollTo(slideIndex);
        console.log(`Scrolling to slide ${slideIndex}`);
      }, 100);
      
      navigate("/electricity-monitoring", { replace: true, state: {} });
    }
    else if (location.state?.showResults) {
      setTimeout(() => {
        api.scrollTo(1);
        console.log("Scrolling to results view");
      }, 100);
    }
  }, [api, location.state, navigate]);

  const animationClass = location.state?.slideDirection === 'right' 
    ? "animate-slide-in-right" 
    : "animate-fade-in";

  const handleProgressBarClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f5f6f7] relative font-sans pt-8 ${animationClass}`}>
      <div className="px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
              <Bolt className="text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-[#212529]">Electric Monitoring</h1>
          </div>
          <button
            aria-label="Info"
            className="w-10 h-10 rounded-full flex items-center justify-center focus:outline-none"
          >
            <Info className="text-gray-400" />
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => handleProgressBarClick(index)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-colors hover:opacity-80 ${
                index === current ? "bg-yellow-500" : "bg-gray-200"
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
                <ElectricityCapture />
              </CarouselItem>
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <ElectricityResults />
              </CarouselItem>
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <ElectricityConfirmation />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pb-4 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
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

            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => navigate("/water-monitoring")}
              type="button"
            >
              <div className="w-10 h-10 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Droplet className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                Water
              </span>
            </button>

            <button className="flex flex-col items-center gap-1 group cursor-default">
              <div className="w-10 h-10 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Bolt className="text-yellow-400" />
              </div>
              <span className="text-xs font-medium text-yellow-400">Electric</span>
            </button>

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

export default ElectricityMonitoring;
