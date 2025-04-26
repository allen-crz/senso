
import React from "react";
import { ArrowLeft, Camera, Bolt } from "lucide-react";

interface CameraViewProps {
  onClose: () => void;
}

const CameraView = ({ onClose }: CameraViewProps) => {
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Status Bar Area */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="text-sm text-white">9:41</div>
        <div className="flex items-center gap-2 text-white">
          <i className="fa-solid fa-signal"></i>
          <i className="fa-solid fa-wifi"></i>
          <i className="fa-solid fa-battery-full"></i>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button 
          onClick={onClose}
          className="text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-white text-lg font-medium text-center flex-1">
          Capture Water Meter
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative mx-4 h-[60vh] rounded-3xl overflow-hidden border-4 border-gray-700">
        <div className="absolute inset-0 bg-gray-900">
          {/* Placeholder for camera feed */}
          <div className="w-full h-full object-cover opacity-50 bg-gray-800" />
        </div>
        
        {/* Overlay Guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4/5 h-40 border-2 border-blue-400 rounded-lg">
            <div className="absolute -top-8 w-full text-center">
              <span className="text-blue-400 text-sm">Align meter display here</span>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12">
        {/* Additional Controls */}
        <div className="flex justify-center gap-32 mb-8">
          <button className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <Bolt className="text-white h-5 w-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <Camera className="text-white h-5 w-5" />
          </button>
        </div>

        {/* Capture Button */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => {
              // Handle capture
              console.log("Capturing image...");
            }}
            className="w-20 h-20 rounded-full bg-blue-400 flex items-center justify-center"
          >
            <i className="fa-solid fa-droplet text-white text-2xl"></i>
          </button>
          <p className="text-white text-sm">Tap to capture image</p>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
