
import React, { useEffect, useState } from "react";
import { Camera, Droplet, CheckCircle, RefreshCw, LoaderCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const WaterCapture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isImageCaptured, setIsImageCaptured] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Check localStorage on component mount
    const storedCaptureState = localStorage.getItem('waterMeterImageCaptured');
    if (storedCaptureState === 'true' || location.state?.imageCaptured) {
      // Only start analyzing if we're not coming from the results view
      if (!location.state?.showResults) {
        // Simulate CNN analysis
        setIsAnalyzing(true);
        const timer = setTimeout(() => {
          setIsAnalyzing(false);
          setIsImageCaptured(true);
        }, 2000); // 2 second delay
        
        return () => clearTimeout(timer);
      } else {
        // Skip analysis if coming from results view
        setIsImageCaptured(true);
      }
      
      // Store in localStorage when coming from camera
      if (location.state?.imageCaptured) {
        localStorage.setItem('waterMeterImageCaptured', 'true');
      }
    }
  }, [location.state?.imageCaptured, location.state?.showResults]);

  const handleOpenCamera = () => {
    navigate("/water-meter-camera");
  };

  const handleViewResults = () => {
    navigate("/water-monitoring", { 
      state: { 
        imageCaptured: true,
        showResults: true 
      } 
    });
  };

  const handleScanAgain = () => {
    localStorage.removeItem('waterMeterImageCaptured');
    setIsImageCaptured(false);
    // Force reload the component state
    navigate("/water-monitoring", { replace: true });
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Current Water Price Card */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-3xl shadow-sm mb-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Current Water Price</h3>
          <p className="text-4xl font-bold text-white mb-2">
            ₱15.00
            <span className="text-lg font-normal align-top">/m³</span>
          </p>
          <p className="text-sm text-blue-50">Last updated: January 15, 2025</p>
        </div>
      </div>

      {/* Meter Scan Section */}
      {isImageCaptured || isAnalyzing ? (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${isAnalyzing ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'} p-8 rounded-3xl shadow-lg mb-6 transition-colors duration-500`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300`}>
                {isAnalyzing ? (
                  <LoaderCircle className="text-3xl text-white w-10 h-10 animate-spin" />
                ) : (
                  <CheckCircle className="text-3xl text-white w-10 h-10" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isAnalyzing ? "Analyzing Meter..." : "Meter Scanned by CNN"}
              </h3>
              <p className="text-green-50 mb-6">
                {isAnalyzing ? "Please wait..." : "Analysis complete"}
              </p>
              {!isAnalyzing && (
                <button
                  className="w-full bg-white text-green-600 py-4 rounded-full font-medium text-lg shadow-md hover:bg-opacity-90 transition-colors"
                  onClick={handleViewResults}
                >
                  View Results
                </button>
              )}
            </div>
          </div>
          {!isAnalyzing && (
            <button
              onClick={handleScanAgain}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-medium text-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Scan Again
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl shadow-lg mb-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Camera className="text-3xl text-white" size={38} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Scan Water Meter</h3>
            <p className="text-blue-50 mb-6">Tap to capture a photo of your meter</p>
            <button
              className="w-full bg-white text-blue-600 py-4 rounded-full font-medium text-lg shadow-md hover:bg-opacity-90 transition-colors active:scale-95"
              onClick={handleOpenCamera}
            >
              Open Camera
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-semibold text-[#212529] mb-2">Manual Input {isImageCaptured ? "" : "(Optional)"}</h3>
        {isImageCaptured ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-500 w-6 h-6" />
              <p className="text-green-600">Input Scanned</p>
            </div>
            <button 
              onClick={handleViewResults}
              className="w-full bg-blue-400 text-white py-3 rounded-full font-medium"
            >
              View Results
            </button>
          </>
        ) : (
          <form 
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); window.alert("Reading submitted!"); }}
          >
            <p className="text-sm text-gray-500 mb-4">Scroll horizontally to enter all digits</p>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 mb-4 min-w-[24rem] sm:min-w-[28rem] md:min-w-[32rem] lg:min-w-[36rem]">
                {[...Array(5)].map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    className="w-10 h-12 rounded-lg border text-center text-lg focus:ring-2 focus:ring-blue-400 transition"
                    inputMode="numeric"
                  />
                ))}
                <div className="w-4 flex items-center justify-center text-lg">.</div>
                {[...Array(4)].map((_, idx) => (
                  <input
                    key={5 + idx}
                    type="text"
                    maxLength={1}
                    className="w-10 h-12 rounded-lg border text-center text-lg focus:ring-2 focus:ring-blue-400 transition"
                    inputMode="numeric"
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-400 text-white py-3 rounded-full font-medium">
              Submit Reading
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WaterCapture;
