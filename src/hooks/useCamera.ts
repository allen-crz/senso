
import { useState, useRef } from "react";

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
  inputRef: React.RefObject<HTMLInputElement>;
}

export const useCamera = (): UseCameraResult => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = async () => {
    setHasPermission(true);
    setCameraError(null);
  };

  const takePicture = () => {
    if (inputRef.current) {
      inputRef.current.click();
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
    cleanup,
    inputRef
  };
};
