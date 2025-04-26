
import React from "react";
import { isIOSDevice, isIOSPWA } from "@/utils/deviceDetection";

interface CameraOverlayProps {
  isLoading: boolean;
  cameraError: string | null;
  capturedImage: string | null;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  isLoading,
  cameraError,
  capturedImage,
}) => {
  const isIOS = isIOSDevice();
  const isiOSPWA = isIOSPWA();

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center h-full text-center p-4 bg-black bg-opacity-70">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white mt-4 font-medium">
          {isIOS 
            ? "Initializing camera... Please allow camera access when prompted" 
            : "Initializing camera..."}
        </p>
        {isIOS && (
          <div className="mt-3 text-blue-100 text-sm max-w-xs">
            <p className="mb-2 font-medium">For iPhone users:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Make sure to grant camera permissions when prompted</li>
              <li>If using as a PWA, try opening the app fresh from your home screen</li>
              <li>Try force-quitting the app and reopening if camera doesn't initialize</li>
              <li className="text-yellow-300 font-medium">Check if Camera access is enabled in Settings → Safari → Camera</li>
            </ul>
          </div>
        )}
        {isiOSPWA && (
          <div className="mt-3 px-4 py-2 bg-yellow-500 bg-opacity-30 rounded-lg">
            <p className="text-yellow-100 text-sm font-medium">
              PWA Mode Detected: If the camera doesn't initialize, please check your iOS settings or try using Safari directly
            </p>
          </div>
        )}
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center h-full text-center p-4 bg-black bg-opacity-70">
        <div className="bg-red-500 bg-opacity-70 p-4 rounded-lg max-w-xs">
          <p className="text-white mb-2 font-medium">
            {cameraError}
          </p>
          {isiOSPWA && cameraError.includes("permission") && (
            <p className="text-white text-sm">
              On iOS home screen apps, go to Settings → Safari → Camera and enable access, then restart the app from your home screen
            </p>
          )}
          {isIOS && cameraError.includes("permission") && (
            <p className="text-white text-sm">
              On iOS, go to Settings → Safari → Camera and enable access for this site
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!capturedImage) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-4/5 h-40 border-2 border-blue-400 rounded-lg">
          <div className="absolute -top-8 w-full text-center">
            <span className="text-blue-400 text-sm bg-black bg-opacity-50 px-4 py-1 rounded-full">
              Align meter display here
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
