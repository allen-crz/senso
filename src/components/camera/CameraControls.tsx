
import React from "react";
import { Camera, RefreshCw } from "lucide-react";
import { isIOSDevice, isIOSPWA } from "@/utils/deviceDetection";

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
  const isIOS = isIOSDevice();
  const isiOSPWA = isIOSPWA();

  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={onRetry}
          className="bg-blue-400 text-white px-6 py-3 rounded-full flex items-center gap-2 active:bg-blue-500"
          aria-label="Retry camera access"
        >
          <RefreshCw className="w-5 h-5" />
          Retry Camera Access
        </button>
        {isiOSPWA && (
          <p className="text-white text-xs max-w-xs text-center px-4">
            For iOS home screen app: If camera access was denied, please close the app completely, 
            go to Settings → Safari → Camera and enable camera access. Then restart the app from your home screen.
          </p>
        )}
        {isIOS && !isiOSPWA && (
          <p className="text-white text-xs max-w-xs text-center px-4">
            For iOS devices: If camera access was denied, please close Safari completely, 
            go to Settings → Safari → Camera and enable camera access
          </p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-300 bg-opacity-30 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-white text-sm">
          {isIOS ? "Accessing camera..." : "Waiting for camera..."}
        </p>
        {isLoading && isiOSPWA && (
          <button 
            onClick={onRetry}
            className="mt-2 bg-blue-400 bg-opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button 
        onClick={onCapture}
        className={`w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform ${
          !hasPermission ? 'bg-gray-400' : 'bg-blue-400'
        }`}
        disabled={!hasPermission}
        aria-label="Capture image"
      >
        <Camera className="text-white h-8 w-8" />
      </button>
      <p className="text-white text-sm">
        {hasPermission ? 'Tap to capture image' : 'Camera permission required'}
      </p>
      {isiOSPWA && hasPermission && (
        <p className="text-blue-200 text-xs max-w-xs text-center">
          For best results on iOS home screen app, hold your device steady
        </p>
      )}
    </div>
  );
};
