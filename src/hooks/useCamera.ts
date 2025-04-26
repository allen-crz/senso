
import { useState, useRef, useEffect } from "react";
import { isIOSDevice } from "@/utils/deviceDetection";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasPermission: boolean;
  capturedImage: string | null;
  cameraError: string | null;
  isLoading: boolean;
  startCamera: () => Promise<void>;
  takePicture: () => void;
  cleanup: () => void;
}

export const useCamera = (): UseCameraResult => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startCamera = async () => {
    // Reset states when retrying
    setCameraError(null);
    setIsLoading(true);
    setIsCameraInitialized(false);
    setCapturedImage(null);
    
    // Clean up any existing stream
    cleanup();
    
    try {
      console.log("Requesting camera access...");
      
      // Specific constraints for iOS devices
      const isIOS = isIOSDevice();
      console.log("Is iOS device:", isIOS);
      
      let constraints = {};
      
      if (isIOS) {
        // iOS specific constraints - explicitly require back camera
        constraints = {
          video: {
            facingMode: "environment", // Force environment (rear) camera
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          },
          audio: false
        };
      } else {
        // Default constraints for other devices
        constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
      }
      
      console.log("Using camera constraints:", JSON.stringify(constraints));
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted:", stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // For iOS, we need to set playsinline again to make sure it works
        if (isIOS) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
        }
        
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          
          console.log("Video metadata loaded");
          videoRef.current.play()
            .then(() => {
              console.log("Video playback started successfully");
              setHasPermission(true);
              setIsLoading(false);
              setIsCameraInitialized(true);
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
      
      // Special handling for iOS devices
      if (isIOSDevice()) {
        console.log("iOS camera access failed, trying fallback approach");
        try {
          // iOS fallback - try with simpler constraints
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            
            videoRef.current.onloadedmetadata = () => {
              if (!videoRef.current) return;
              
              videoRef.current.play()
                .then(() => {
                  console.log("Fallback video playback started successfully");
                  setHasPermission(true);
                  setIsLoading(false);
                  setIsCameraInitialized(true);
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
          console.error('iOS fallback camera attempt failed:', fallbackError);
        }
      }
      
      let errorMessage = "Failed to access camera. Please check permissions.";
      if (String(error).includes("Permission denied")) {
        errorMessage = "Camera permission denied. Please enable camera access in your device settings.";
      } else if (String(error).includes("not found")) {
        errorMessage = "No camera found on your device.";
      } else if (String(error).includes("OverconstrainedError")) {
        errorMessage = "Camera configuration not supported. Trying with default camera.";
        
        // Try one more time with any camera
        try {
          const anyCamera = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = anyCamera;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play()
                .then(() => {
                  setHasPermission(true);
                  setIsLoading(false);
                  setIsCameraInitialized(true);
                })
                .catch(() => {
                  setCameraError("Failed to access any camera");
                  setIsLoading(false);
                });
            };
            return;
          }
        } catch {
          errorMessage = "No camera available on this device";
        }
      }
      
      setCameraError(errorMessage);
      setHasPermission(false);
      setIsLoading(false);
    }
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current || !hasPermission) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      cleanup();
    }
  };

  // Initialize camera once when component mounts
  useEffect(() => {
    if (!isCameraInitialized) {
      console.log("Initializing camera on component mount");
      startCamera();
    }
    
    // Cleanup when component unmounts
    return () => {
      console.log("Cleaning up camera on unmount");
      cleanup();
    };
  }, [isCameraInitialized]);

  return {
    videoRef,
    canvasRef,
    hasPermission,
    capturedImage,
    cameraError,
    isLoading,
    startCamera,
    takePicture,
    cleanup
  };
};
