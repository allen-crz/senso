
import { useState, useRef, useEffect } from "react";

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

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsLoading(true);
      
      console.log("Requesting camera access...");
      
      const constraints = {
        video: {
          facingMode: "environment",
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

  useEffect(() => {
    startCamera();
    return cleanup;
  }, []);

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
