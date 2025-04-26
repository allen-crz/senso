
import React from "react";

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
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center h-full text-center p-4 bg-black bg-opacity-70">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white mt-4">Initializing camera...</p>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center h-full text-center p-4 bg-black bg-opacity-70">
        <p className="text-white bg-red-500 bg-opacity-70 p-4 rounded-lg max-w-xs">
          {cameraError}
        </p>
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
