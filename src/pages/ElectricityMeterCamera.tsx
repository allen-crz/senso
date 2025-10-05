import React from "react";
import { useNavigate } from "react-router-dom";
import { useMeterCamera } from "@/hooks/useMeterCamera";
import { X, ArrowLeft, RotateCcw, Check, Camera, Upload } from 'lucide-react';

const ElectricityMeterCamera: React.FC = () => {
  const navigate = useNavigate();

  const {
    capture,
    pickFromGallery,
    isCapturing,
    error,
    lastCaptured,
    clear
  } = useMeterCamera({
    quality: 85,
    preprocessForML: true, // Auto-creates 640x640 for YOLOv8
    allowGallery: true
  });

  const handleClose = () => {
    navigate("/electricity-monitoring");
  };

  const handleCapture = async () => {
    await capture();
    // Don't navigate here - let the image review screen show first
    // Navigation happens in handleConfirm after user reviews the image
  };

  const handleGallery = async () => {
    await pickFromGallery();
    // Don't navigate here - let the image review screen show first
    // Navigation happens in handleConfirm after user reviews the image
  };

  const handleRetake = () => {
    clear();
  };

  const handleConfirm = () => {
    if (lastCaptured) {
      // Store the captured image
      sessionStorage.setItem('temp_captured_image', lastCaptured.dataUrl);
      sessionStorage.setItem('temp_image_captured', 'true');

      // Navigate back
      navigate("/electricity-monitoring", {
        state: {
          imageCaptured: true,
          imageData: lastCaptured.dataUrl,
          slideIndex: 0,
          slideDirection: 'right'
        }
      });
    }
  };

  // Image review screen
  if (lastCaptured) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Top bar */}
        <div className="bg-black safe-area-top">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={handleRetake}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-white text-sm sm:text-base font-semibold">Review Capture</h1>
              <p className="text-white/60 text-xs hidden sm:block">Check image quality</p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex-1 relative bg-black overflow-hidden min-h-0">
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
            <div className="w-full h-full bg-gray-900 overflow-hidden relative flex items-center justify-center">
              <img
                src={lastCaptured.dataUrl}
                alt="Captured electricity meter"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {/* Quality indicator */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-500/90 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Optimized for YOLOv8</span>
              <span className="sm:hidden">Ready</span>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="bg-black safe-area-bottom pt-3 sm:pt-4 pb-4 sm:pb-6">
          <div className="flex gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto px-4 sm:px-6">
            <button
              onClick={handleRetake}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 border border-white/10 backdrop-blur-sm"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Retake</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 shadow-lg"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Use Image</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera capture screen
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 bg-black safe-area-top z-10">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={handleClose}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-white text-sm sm:text-base font-semibold">Electricity Meter</h1>
            <p className="text-white/60 text-xs hidden sm:block">Capture or upload</p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="text-center text-white px-6 max-w-md">
        {error ? (
          <>
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
            <p className="text-white/80 mb-6 text-sm leading-relaxed">{error}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Capture Electricity Meter</h3>
            <p className="text-white/80 mb-6 text-sm leading-relaxed">
              {isCapturing ? 'Opening camera...' : 'Choose how to capture your electricity meter reading'}
            </p>
          </>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {isCapturing ? 'Opening Camera...' : 'Take Photo'}
          </button>
          <button
            onClick={handleGallery}
            disabled={isCapturing}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Choose from Gallery
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectricityMeterCamera;