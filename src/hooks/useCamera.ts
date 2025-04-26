
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
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    cleanup();
    setCameraError(null);
    setIsLoading(true);
    setCapturedImage(null);

    try {
      const isIOS = isIOSDevice();
      const isiOSPWA = isIOSPWA();
      
      // iOS PWA specific constraints - minimal for maximum compatibility
      const constraints = {
        audio: false,
        video: {
          facingMode: 'environment'
        }
      };

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!videoRef.current) return;
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      // Critical iOS attributes
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.muted = true;

      // Wait for loadedmetadata event before playing
      await new Promise<void>((resolve) => {
        if (!videoRef.current) return;
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          videoRef.current.play()
            .then(() => {
              console.log('Video playback started');
              setHasPermission(true);
              setIsLoading(false);
              resolve();
            })
            .catch(error => {
              console.error('Error starting video playback:', error);
              setCameraError('Failed to start camera stream');
              setIsLoading(false);
            });
        };
      });
      
    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Failed to access camera';
      
      if (isIOSPWA()) {
        errorMessage = 'Camera access failed. For iOS home screen app: Please check Settings → Safari → Camera access is enabled, then close and reopen the app.';
      } else if (isIOSDevice()) {
        errorMessage = 'Camera access failed. Please ensure camera permissions are enabled in Settings → Safari → Camera.';
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
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    // Capture frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    cleanup();
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
