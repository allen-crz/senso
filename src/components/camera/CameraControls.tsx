
import React from "react";
import { Camera } from "lucide-react";

interface CameraControlsProps {
  cameraError: string | null;
  isLoading: boolean;
  hasPermission: boolean;
  onRetry: () => void;
  onCapture: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameraError,
  isLoading,
  hasPermission,
  onRetry,
  onCapture,
}) => {
  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={onRetry}
          className="bg-blue-400 text-white px-6 py-3 rounded-full"
        >
          Retry Camera Access
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-white text-sm">
          Waiting for camera...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button 
        onClick={onCapture}
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
  );
};
