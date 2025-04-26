import React, { useEffect } from "react";
import { ArrowLeft, Camera, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageTransitionTrigger } from "@/hooks/usePageTransitionTrigger";

const WaterMeterCamera: React.FC = () => {
  const navigate = useNavigate();
  const { transitionAndNavigate } = usePageTransitionTrigger();
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
    localStorage.removeItem('waterMeterImageCaptured');
    transitionAndNavigate(() => navigate("/water-monitoring"));
  };

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Image captured successfully",
    });
    
    localStorage.setItem('waterMeterImageCaptured', 'true');
    
    transitionAndNavigate(() => {
      navigate("/water-monitoring", { 
        state: { 
          imageCaptured: true,
          slideIndex: 0
        } 
      });
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          handleSuccess();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 relative flex flex-col animate-fade-in">
      <div className="h-safe-top bg-blue-50/80 backdrop-blur-lg border-b border-blue-100/40"></div>

      <div className="sticky top-0 z-10 bg-blue-50/80 backdrop-blur-lg border-b border-blue-100/40">
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="text-blue-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-blue-900 text-lg font-semibold">
            Capture Water Meter
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <p className="text-blue-900 text-center mb-8">
              Please capture your water meter reading or select an image from your gallery
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={takePicture}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Capture Image
              </Button>

              <Button
                onClick={selectFromGallery}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                <Image className="mr-2 h-5 w-5" />
                Choose from Gallery
              </Button>
            </div>
          </CardContent>
        </Card>

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
