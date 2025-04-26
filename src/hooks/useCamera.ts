
import { useState, useRef, useEffect } from "react";
import { isIOSDevice, isIOSPWA } from "@/utils/deviceDetection";

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
  const streamRef = useRef<MediaStream | null>(null);
  const attemptCountRef = useRef<number>(0);

  const cleanup = () => {
    console.log("Cleaning up camera resources");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("Stopping track:", track.kind, track.readyState);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    // Reset states when retrying
    setCameraError(null);
    setIsLoading(true);
    setCapturedImage(null);
    
    // Clean up any existing stream first
    cleanup();

    // Increment attempt counter
    attemptCountRef.current += 1;
    
    try {
      console.log(`Requesting camera access (attempt ${attemptCountRef.current})...`);
      
      // Check if iOS PWA
      const isIOS = isIOSDevice();
      const isiOSPWA = isIOSPWA();
      console.log("Device detection:", { isIOS, isiOSPWA, attemptCount: attemptCountRef.current });
      
      // iOS PWA specific constraints - absolutely force back camera with minimal constraints
      const constraints = isiOSPWA ? 
        {
          audio: false,
          video: {
            facingMode: "environment", // Force back camera
          }
        } : 
        isIOS ? 
        {
          audio: false,
          video: {
            facingMode: "environment", // Force rear camera
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        } : 
        {
          audio: false,
          video: {
            facingMode: { exact: "environment" }, // More strict on non-iOS
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      
      console.log("Using camera constraints:", JSON.stringify(constraints));
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted:", stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Critical for iOS Safari - must be set directly on the element
        if (isIOS || isiOSPWA) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.muted = true;
          
          if (isiOSPWA) {
            videoRef.current.setAttribute('controls', 'false');
            videoRef.current.style.width = "100%";
            videoRef.current.style.height = "100%";
            videoRef.current.style.objectFit = "cover";
          }
          
          console.log("Set iOS-specific video attributes");
        }
        
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          
          console.log("Video metadata loaded, attempting to play");
          videoRef.current.play()
            .then(() => {
              console.log("Video playback started successfully");
              setHasPermission(true);
              setIsLoading(false);
              setIsCameraInitialized(true);
            })
            .catch(e => {
              console.error("Error playing video:", e);
              setCameraError(`Failed to start video stream: ${e.message}`);
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
      
      // Special handling for iOS PWA
      if (isIOSPWA()) {
        console.log("iOS PWA camera access failed, trying simplified approach");
        try {
          // iOS PWA fallback with absolute minimal constraints
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          streamRef.current = fallbackStream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.muted = true;
            videoRef.current.setAttribute('controls', 'false');
            
            videoRef.current.onloadedmetadata = () => {
              if (!videoRef.current) return;
              
              console.log("iOS PWA fallback: Video metadata loaded, attempting to play");
              videoRef.current.play()
                .then(() => {
                  console.log("iOS PWA fallback: Video playback started successfully");
                  setHasPermission(true);
                  setIsLoading(false);
                  setIsCameraInitialized(true);
                })
                .catch(e => {
                  console.error("iOS PWA fallback: Error playing video:", e);
                  setCameraError("Failed to access camera on iOS. Please check permissions and restart the app from your home screen.");
                  setIsLoading(false);
                });
            };
            return;
          }
        } catch (fallbackError) {
          console.error('iOS PWA fallback camera attempt failed:', fallbackError);
          setCameraError("Camera access failed. Please ensure camera permissions are enabled in Settings → Safari → Camera and restart the app from your home screen.");
          setIsLoading(false);
          return;
        }
      } else if (isIOSDevice()) {
        console.log("iOS camera access failed, trying simplified approach");
        try {
          // iOS fallback with minimal constraints
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
          });
          
          streamRef.current = fallbackStream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.muted = true;
            
            videoRef.current.onloadedmetadata = () => {
              if (!videoRef.current) return;
              
              console.log("iOS fallback: Video metadata loaded, attempting to play");
              videoRef.current.play()
                .then(() => {
                  console.log("iOS fallback: Video playback started successfully");
                  setHasPermission(true);
                  setIsLoading(false);
                  setIsCameraInitialized(true);
                })
                .catch(e => {
                  console.error("iOS fallback: Error playing video:", e);
                  setCameraError("Failed to access camera on iOS. Please check permissions and try again.");
                  setIsLoading(false);
                });
            };
            return;
          }
        } catch (fallbackError) {
          console.error('iOS fallback camera attempt failed:', fallbackError);
          setCameraError("Camera access failed on iOS. Please ensure camera permissions are enabled in Settings → Safari → Camera.");
          setIsLoading(false);
          return;
        }
      }
      
      let errorMessage = "Failed to access camera. Please check permissions.";
      if (String(error).includes("Permission denied")) {
        errorMessage = "Camera permission denied. Please enable camera access in your device settings.";
      } else if (String(error).includes("not found")) {
        errorMessage = "No camera found on your device.";
      } else if (String(error).includes("OverconstrainedError")) {
        errorMessage = "Camera configuration not supported. Trying with default camera.";
        
        try {
          const anyCamera = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          streamRef.current = anyCamera;
          
          if (videoRef.current) {
            videoRef.current.srcObject = anyCamera;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            
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
