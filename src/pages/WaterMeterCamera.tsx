
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { CameraOverlay } from "@/components/camera/CameraOverlay";
import { CameraControls } from "@/components/camera/CameraControls";

const WaterMeterCamera: React.FC = () => {
  const navigate = useNavigate();
  const {
    videoRef,
    canvasRef,
    hasPermission,
    capturedImage,
    cameraError,
    isLoading,
    startCamera,
    takePicture,
    cleanup
  } = useCamera();

  const handleBack = () => {
    cleanup();
    navigate("/water-monitoring");
  };

  const handleCapture = () => {
    takePicture();
    toast({
      title: "Success",
      description: "Image captured successfully",
    });
    
    // Delay navigation slightly to allow the user to see the captured image
    setTimeout(() => {
      navigate("/water-monitoring");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Status Bar Area */}
      <div className="h-10"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handleBack} className="text-white">
          <ArrowLeft className="text-2xl" />
        </button>
        <h1 className="text-white text-lg font-medium text-center flex-1">
          Capture Water Meter
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative mx-4 h-[60vh] rounded-3xl overflow-hidden border-4 border-gray-700">
        <div className="absolute inset-0 bg-gray-900">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        <CameraOverlay
          isLoading={isLoading}
          cameraError={cameraError}
          capturedImage={capturedImage}
        />
      </div>

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12">
        <CameraControls
          cameraError={cameraError}
          isLoading={isLoading}
          hasPermission={hasPermission}
          onRetry={startCamera}
          onCapture={handleCapture}
        />
      </div>
    </div>
  );
};

export default WaterMeterCamera;
