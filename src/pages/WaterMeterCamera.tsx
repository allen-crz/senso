
import React, { useEffect } from "react";
import { ArrowLeft, Camera, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/button";

const WaterMeterCamera: React.FC = () => {
  const navigate = useNavigate();
  const {
    hasPermission,
    capturedImage,
    cameraError,
    isLoading,
    startCamera,
    takePicture,
    selectFromGallery,
    cleanup,
    inputRef,
    galleryRef
  } = useCamera();

  useEffect(() => {
    startCamera();
  }, []);

  const handleBack = () => {
    cleanup();
    navigate("/water-monitoring");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          toast({
            title: "Success",
            description: "Image captured successfully",
          });
          
          setTimeout(() => {
            navigate("/water-monitoring");
          }, 800);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      <div className="h-safe-top"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handleBack} className="text-white">
          <ArrowLeft className="text-2xl" />
        </button>
        <h1 className="text-white text-lg font-medium text-center flex-1">
          Capture Water Meter
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 gap-4">
        <p className="text-white text-center mb-6">
          Please capture your water meter reading or select an image from your gallery
        </p>
        
        <Button
          onClick={takePicture}
          className="w-full max-w-sm bg-blue-500 hover:bg-blue-600"
          size="lg"
        >
          <Camera className="mr-2" />
          Capture Image
        </Button>

        <Button
          onClick={selectFromGallery}
          variant="secondary"
          className="w-full max-w-sm"
          size="lg"
        >
          <Image className="mr-2" />
          Choose from Gallery
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default WaterMeterCamera;
