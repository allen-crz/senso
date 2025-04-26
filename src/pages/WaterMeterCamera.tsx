import React, { useState, useEffect } from "react";
import { ArrowLeft, Camera, Flashlight, FlashlightOff, SwitchCamera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Camera as CapacitorCamera, 
  CameraResultType, 
  CameraDirection,
  CameraSource
} from '@capacitor/camera';
import { toast } from "@/hooks/use-toast";

const WaterMeterCamera: React.FC = () => {
  const navigate = useNavigate();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraDirection, setCameraDirection] = useState(CameraDirection.Rear);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const permission = await CapacitorCamera.checkPermissions();
      if (permission.camera !== 'granted') {
        const request = await CapacitorCamera.requestPermissions();
        setHasPermission(request.camera === 'granted');
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate("/water-monitoring");
  };

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev);
    toast({
      title: isFlashOn ? "Flash Disabled" : "Flash Enabled",
      description: isFlashOn ? "Camera flash has been turned off" : "Camera flash has been turned on",
    });
  };

  const toggleCamera = () => {
    setCameraDirection(prev => {
      const newDirection = prev === CameraDirection.Rear ? CameraDirection.Front : CameraDirection.Rear;
      // Disable flash for front camera
      if (newDirection === CameraDirection.Front && isFlashOn) {
        setIsFlashOn(false);
      }
      return newDirection;
    });

    toast({
      title: "Camera Switched",
      description: cameraDirection === CameraDirection.Rear ? 
        "Switched to front camera" : 
        "Switched to back camera",
    });
  };

  const takePicture = async () => {
    try {
      // Use Capacitor Camera's built-in camera interface
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera, // This ensures the native camera is used
        direction: cameraDirection,
        saveToGallery: false,
        // Flash isn't directly controllable via this API, but keeping the state for UI
      });
      
      if (image.base64String) {
        // Store captured image
        setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
        
        toast({
          title: "Success",
          description: "Image captured successfully",
        });

        // Here you would handle the captured image
        console.log('Captured image:', image);
        
        // Navigate back with the captured image data
        // You could implement a state management solution to pass this data
        navigate("/water-monitoring");
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Status Bar Area - Now empty */}
      <div className="h-10"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button 
          onClick={handleBack} 
          className="text-white"
        >
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
            <div className="w-full h-full object-cover opacity-50 bg-gray-800" />
          )}
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
          <button 
            onClick={toggleFlash}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              !hasPermission || cameraDirection === CameraDirection.Front
                ? 'bg-gray-600 opacity-50'
                : 'bg-gray-800'
            }`}
            disabled={!hasPermission || cameraDirection === CameraDirection.Front}
          >
            {isFlashOn ? (
              <Flashlight className="text-white h-5 w-5" />
            ) : (
              <FlashlightOff className="text-white h-5 w-5" />
            )}
          </button>
          <button 
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              !hasPermission ? 'bg-gray-600 opacity-50' : 'bg-gray-800'
            }`}
            disabled={!hasPermission}
          >
            <SwitchCamera className="text-white h-5 w-5" />
          </button>
        </div>

        {/* Capture Button */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={takePicture}
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              !hasPermission ? 'bg-gray-400' : 'bg-blue-400'
            }`}
            disabled={!hasPermission}
          >
            <Camera className="text-white h-8 w-8" />
          </button>
          <p className="text-white text-sm">
            {hasPermission ? 'Tap to capture image' : 'Camera permission required'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaterMeterCamera;
