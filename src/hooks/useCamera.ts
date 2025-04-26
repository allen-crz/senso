
import { useState, useRef } from "react";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasPermission: boolean;
  capturedImage: string | null;
  cameraError: string | null;
  isLoading: boolean;
  startCamera: () => Promise<void>;
  takePicture: () => Promise<void>;
  cleanup: () => void;
}

export const useCamera = (): UseCameraResult => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = async () => {
    try {
      await Camera.checkPermissions();
      setHasPermission(true);
      setCameraError(null);
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraError('Camera permissions required');
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    setIsLoading(true);
    setCameraError(null);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: {
          camera: 'REAR'
        }
      });
      
      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      setCameraError('Failed to capture image');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    setCapturedImage(null);
    setCameraError(null);
  };

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
