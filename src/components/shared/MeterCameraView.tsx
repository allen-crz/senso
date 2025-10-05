import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMeterCamera } from "@/hooks/useMeterCamera";
import { X, ArrowLeft, RotateCcw, Check, Camera, Upload } from 'lucide-react';

interface MeterCameraViewProps {
  onClose: () => void;
  meterType: 'electricity' | 'water';
  route: string;
}

const MeterCameraView = ({ onClose, meterType, route }: MeterCameraViewProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    capture,
    pickFromGallery,
    handleFileSelect,
    isCapturing,
    error,
    lastCaptured,
    clear
  } = useMeterCamera({
    quality: 85,
    preprocessForML: true,
    allowGallery: true
  });

  const colors = meterType === 'electricity'
    ? { primary: 'bg-amber-500', hover: 'hover:bg-amber-600' }
    : { primary: 'bg-blue-500', hover: 'hover:bg-blue-600' };

  const handleCapture = () => {
    // Use native file input with camera capture for better iOS compatibility
    fileInputRef.current?.click();
  };

  const handleGallery = () => {
    // Trigger native file input for gallery selection
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
      // Re-add capture attribute for next camera use
      setTimeout(() => {
        fileInputRef.current?.setAttribute('capture', 'environment');
      }, 100);
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = await handleFileSelect(event);
    if (image) {
      sessionStorage.setItem('temp_captured_image', image.dataUrl);
      sessionStorage.setItem('temp_image_captured', 'true');
      onClose();
      navigate(route, {
        state: {
          imageCaptured: true,
          imageData: image.dataUrl
        }
      });
    }
  };

  const handleConfirm = () => {
    if (lastCaptured) {
      sessionStorage.setItem('temp_captured_image', lastCaptured.dataUrl);
      sessionStorage.setItem('temp_image_captured', 'true');
      onClose();
      navigate(route, {
        state: {
          imageCaptured: true,
          imageData: lastCaptured.dataUrl
        }
      });
    }
  };

  // Image review screen
  if (lastCaptured) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-black safe-area-top">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <button onClick={() => clear()} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-white text-sm sm:text-base font-semibold">Review Capture</h1>
            </div>
            <button onClick={onClose} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative bg-black overflow-hidden">
          <img src={lastCaptured.dataUrl} alt="Captured meter" className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span>Ready</span>
          </div>
        </div>
        <div className="bg-black safe-area-bottom pt-3 pb-4">
          <div className="flex gap-3 max-w-sm mx-auto px-4">
            <button onClick={() => clear()} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10">
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Retake</span>
            </button>
            <button onClick={handleConfirm} className={`flex-1 ${colors.primary} ${colors.hover} text-white py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg`}>
              <Check className="w-4 h-4" />
              <span className="text-sm">Use Image</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera capture screen
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 right-0 bg-black safe-area-top z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-sm font-semibold">{meterType === 'electricity' ? 'Electricity' : 'Water'} Meter</h1>
          <div className="w-10 h-10"></div>
        </div>
      </div>
      <div className="text-center text-white px-6 max-w-md">
        {error ? (
          <>
            <div className={`w-16 h-16 ${colors.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
            <p className="text-white/80 mb-6 text-sm">{error}</p>
          </>
        ) : (
          <>
            <div className={`w-16 h-16 ${colors.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Capture Meter</h3>
            <p className="text-white/80 mb-6 text-sm">{isCapturing ? 'Opening camera...' : 'Choose how to capture your meter reading'}</p>
          </>
        )}
        <div className="space-y-3">
          <button onClick={handleGallery} disabled={isCapturing} className={`w-full ${colors.primary} ${colors.hover} disabled:opacity-50 text-white py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2`}>
            <Camera className="w-5 h-5" />
            {isCapturing ? 'Loading...' : 'Take Photo'}
          </button>
          <button onClick={handleGallery} disabled={isCapturing} className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Choose from Gallery
          </button>
          {/* Hidden file input for iOS compatibility */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default MeterCameraView;