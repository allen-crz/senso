
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const WaterMeterCamera: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startCamera();
    
    // Cleanup function to stop camera when component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // First clear any previous errors
      setCameraError(null);
      setIsLoading(true);
      
      console.log("Requesting camera access...");
      
      // Try environment camera first, but as preference not requirement
      const constraints = {
        video: {
          facingMode: "environment", // Preference, not strict requirement
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted:", stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play()
            .then(() => {
              console.log("Video playback started successfully");
              setHasPermission(true);
              setIsLoading(false);
            })
            .catch(e => {
              console.error("Error playing video:", e);
              setCameraError("Failed to play video stream");
              setIsLoading(false);
            });
        };
      } else {
        console.error("Video reference not available");
        setCameraError("Video element not ready");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Try again with any available camera
      try {
        console.log("Trying with any available camera...");
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play()
              .then(() => {
                console.log("Fallback video playback started successfully");
                setHasPermission(true);
                setIsLoading(false);
              })
              .catch(e => {
                console.error("Error playing fallback video:", e);
                setCameraError("Failed to play video stream");
                setIsLoading(false);
              });
          };
          return;
        }
      } catch (fallbackError) {
        console.error('All camera attempts failed:', fallbackError);
      }
      
      let errorMessage = "Failed to access camera. Please check permissions.";
      if (String(error).includes("Permission denied")) {
        errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
      } else if (String(error).includes("not found")) {
        errorMessage = "No camera found on your device.";
      } else if (String(error).includes("OverconstrainedError")) {
        errorMessage = "Camera configuration not supported. Please try a different browser or device.";
      }
      
      setCameraError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      setHasPermission(false);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Stop camera stream when navigating away
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    navigate("/water-monitoring");
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current || !hasPermission) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Match canvas size to video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      
      toast({
        title: "Success",
        description: "Image captured successfully",
      });
      
      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      
      // Navigate after a short delay to ensure image is processed
      setTimeout(() => {
        navigate("/water-monitoring");
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Status Bar Area */}
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
            <>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white mt-4">Initializing camera...</p>
                </div>
              ) : cameraError ? (
                <div className="flex items-center justify-center h-full text-center p-4">
                  <p className="text-white">{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </>
          )}
        </div>
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay Guide */}
        {!isLoading && !cameraError && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4/5 h-40 border-2 border-blue-400 rounded-lg">
              <div className="absolute -top-8 w-full text-center">
                <span className="text-blue-400 text-sm">Align meter display here</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12">
        {cameraError ? (
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={startCamera}
              className="bg-blue-400 text-white px-6 py-3 rounded-full"
            >
              Retry Camera Access
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white text-sm">
              Waiting for camera...
            </p>
          </div>
        ) : (
          /* Capture Button */
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
        )}
      </div>
    </div>
  );
};

export default WaterMeterCamera;
