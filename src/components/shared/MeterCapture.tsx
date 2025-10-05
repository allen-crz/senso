import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Camera, CheckCircle, RefreshCw, LoaderCircle, AlertCircle, Check, Droplet, Bolt } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/services/api";
import UnifiedAnomalyAlert from "@/components/shared/UnifiedAnomalyAlert";

// Storage cleanup utility
const cleanupStorageSpace = () => {
  const itemsToClean = [
    'capturedWaterMeterImage',
    'capturedElectricityMeterImage',
    'temp_captured_image',
    'waterMeterImageData',
    'electricityMeterImageData',
    'lastWaterReading',
    'lastElectricityReading'
  ];

  itemsToClean.forEach(key => {
    try {
      const item = sessionStorage.getItem(key);
      if (item && item.length > 50000) { // Remove items >50KB
        console.log(`Cleaning large storage item: ${key} (${Math.round(item.length/1024)}KB)`);
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Failed to check/clean ${key}:`, e);
    }
  });
};

interface MeterCaptureConfig {
  utilityType: 'water' | 'electricity';
  unit: string;
  defaultPrice: number;
  colors: {
    primary: string;
    secondary: string;
    gradient: string;
    primaryClass: string;
    secondaryClass: string;
  };
  inputConfig: {
    digitCount: number;
    hasDecimal: boolean;
    decimalPosition?: number;
  };
  sessionKeys: {
    analysisCompleted: string;
    imageData: string;
    readingId: string;
  };
  routes: {
    monitoring: string;
  };
}

interface MeterCaptureProps {
  config: MeterCaptureConfig;
  CameraView: React.ComponentType<{ onClose: () => void }>;
  ImageProcessingResults: React.ComponentType<{
    imageData: string;
    processingResult: any;
    onRetry: () => void;
    onManualEntry: () => void;
    onAccept: () => void;
  }>;
  hooks: {
    useCreateReading: () => {
      createReading: (data: any) => Promise<any>;
      isLoading: boolean;
    };
    useProcessImage: () => {
      processImage: (imageData: string) => Promise<any>;
      isProcessing: boolean;
      error: any;
    };
    useLatestReading: () => {
      data: any;
      isLoading: boolean;
    };
  };
}

const MeterCapture: React.FC<MeterCaptureProps> = ({
  config,
  CameraView,
  ImageProcessingResults,
  hooks
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading } = useAuth();
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [manualDigits, setManualDigits] = useState(Array(config.inputConfig.digitCount).fill(''));
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [processingStep, setProcessingStep] = useState<'uploading' | 'analyzing' | 'extracting' | 'complete' | 'failed'>('uploading');
  const [isProcessingInProgress, setIsProcessingInProgress] = useState(false);
  // Initialize camera attempts from session storage or default to 0
  const [cameraAttempts, setCameraAttempts] = useState(() => {
    const stored = sessionStorage.getItem(`${config.utilityType}_camera_attempts`);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);
  const [showImageProcessingAnimation, setShowImageProcessingAnimation] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);
  const [showAnomalyAlert, setShowAnomalyAlert] = useState(false);
  
  // Constants for flow control
  const MAX_CAMERA_ATTEMPTS = 3;
  const MANUAL_INPUT_THRESHOLD = 1; // Show manual input after 1 failed attempt
  const CAMERA_REQUIRED_FIRST = true;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Use backend hooks
  const { createReading, isLoading: isSubmittingReading } = hooks.useCreateReading();
  const { processImage, isProcessing, error: imageProcessingError } = hooks.useProcessImage();
  const { data: latestReading } = hooks.useLatestReading();

  // Helper function to update camera attempts and persist to session storage
  const updateCameraAttempts = (newAttempts: number) => {
    setCameraAttempts(newAttempts);
    sessionStorage.setItem(`${config.utilityType}_camera_attempts`, newAttempts.toString());
  };

  // Check if user has explicitly confirmed today's reading or has a reading from today
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
  const hasConfirmedToday = useMemo(() => {
    // Check if user confirmed via session storage OR if there's already a reading from today
    const sessionConfirmed = sessionStorage.getItem(`${config.utilityType}_confirmed_${today}`);
    const hasReadingFromToday = latestReading && 
      new Date(latestReading.capture_timestamp).toLocaleDateString('en-CA') === today;
    
    return sessionConfirmed === 'true' || hasReadingFromToday;
  }, [config.utilityType, today, latestReading]);
  
  // Show if there's already a reading today (for informational purposes)
  const hasReadingToday = useMemo(() => {
    if (latestReading) {
      const readingDate = new Date(latestReading.capture_timestamp).toLocaleDateString('en-CA');
      return readingDate === today;
    }
    return false;
  }, [latestReading, today]);

  // Get pricing data
  useEffect(() => {
    setCurrentPrice(config.defaultPrice);
  }, [config.defaultPrice, config.utilityType]);

  const handleDigitChange = (idx: number, value: string) => {
    if (value.length > 1) return;
    const digits = [...manualDigits];
    digits[idx] = value.replace(/[^0-9]/g, "");
    setManualDigits(digits);
    if (value && idx < config.inputConfig.digitCount - 1) {
      // Move to next input after decimal point
      const nextIndex = config.inputConfig.hasDecimal && config.inputConfig.decimalPosition === idx ? idx + 1 : idx + 1;
      if (nextIndex < config.inputConfig.digitCount) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const processCapturedImage = useCallback(async (imageData: string) => {
    if (!user) {
      toast.error('Please log in to process meter readings');
      return;
    }

    if (isProcessingInProgress) {
      console.log('Processing already in progress, skipping...');
      return;
    }

    // Start image processing animation
    setShowImageProcessingAnimation(true);
    setIsProcessingInProgress(true);
    setProcessingError(null);
    setProcessingStep('uploading');
    
    try {
      // Simulate processing steps for better user feedback
      setProcessingStep('uploading');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setProcessingStep('analyzing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStep('extracting');
      
      // Process image with backend CNN + OCR
      const result = await processImage(imageData);

      if (result.processing_status === 'processed' && result.reading_value) {
        // Success
        setProcessingStep('complete');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Hide processing animation
        setShowImageProcessingAnimation(false);

        // Show confirmation directly in place
        setPendingConfirmation({
          reading_value: result.reading_value,
          image_data: imageData,
          is_manual: false,
          notes: `CNN processed with ${(result.confidence_score * 100).toFixed(1)}% confidence`,
          method: 'camera',
          confidence_score: result.confidence_score
        });
      } else {
        // Processing failed - show failed state
        setProcessingStep('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Hide processing animation
        setShowImageProcessingAnimation(false);

        // Camera processing failed - increment attempts
        const newAttempts = cameraAttempts + 1;
        updateCameraAttempts(newAttempts);

        if (newAttempts >= MAX_CAMERA_ATTEMPTS) {
          // Enable manual input after 3 attempts
          setShowManualFallback(true);
        }
        // No toast messages - user can see the retry flow through UI
      }
    } catch (error: any) {
      console.error('Failed to process image:', error);

      // Show failed state
      setProcessingStep('failed');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setShowImageProcessingAnimation(false);

      const newAttempts = cameraAttempts + 1;
      updateCameraAttempts(newAttempts);

      if (newAttempts >= MAX_CAMERA_ATTEMPTS) {
        setShowManualFallback(true);
      }
      // No toast messages - user can see the retry flow through UI
    } finally {
      setIsProcessingInProgress(false);
    }
  }, [user, processImage, config, cameraAttempts, isProcessingInProgress]);

  // Track if we've already processed this image to prevent re-processing
  const processedImageRef = useRef<string | null>(null);

  useEffect(() => {
    // Clean up storage space before loading data
    cleanupStorageSpace();

    // Load previous analysis state from sessionStorage
    const analysisCompleted = sessionStorage.getItem(config.sessionKeys.analysisCompleted) === 'true';
    const storedImageData = sessionStorage.getItem(config.sessionKeys.imageData);

    // Check for temporary image data from camera fallback
    const tempImageData = sessionStorage.getItem('temp_captured_image');
    const tempImageCaptured = sessionStorage.getItem('temp_image_captured') === 'true';

    setHasCompletedAnalysis(analysisCompleted);

    // Check if we have captured image data from camera (from state or temp storage)
    const hasImageFromState = location.state?.imageCaptured && location.state?.imageData;
    const hasImageFromTemp = tempImageCaptured && tempImageData;
    const hasStoredImage = storedImageData;

    if (hasImageFromState || hasImageFromTemp || hasStoredImage) {
      const imageData = location.state?.imageData || tempImageData || storedImageData;

      // Prevent re-processing the same image
      if (processedImageRef.current === imageData) {
        console.log('Image already processed, skipping...');
        return;
      }

      setCapturedImageData(imageData);

      // Store image data when coming from camera with storage management
      if (location.state?.imageData) {
        // Clear any existing images first to make space
        const itemsToClean = [
          'capturedWaterMeterImage',
          'capturedElectricityMeterImage',
          'temp_captured_image',
          'waterMeterImageData',
          'electricityMeterImageData'
        ];

        itemsToClean.forEach(key => {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to clear ${key}:`, e);
          }
        });

        // Try to store the image
        try {
          sessionStorage.setItem(config.sessionKeys.imageData, location.state.imageData);
        } catch (e) {
          console.error('Storage quota exceeded even after cleanup:', e);
          toast.error('Storage full - image processing will continue without caching');
          // Continue without storage - processing will work with in-memory data
        }
      } else if (tempImageData) {
        try {
          sessionStorage.setItem(config.sessionKeys.imageData, tempImageData);
        } catch (e) {
          console.error('Storage quota exceeded for temp image:', e);
          // Continue without storage
        }
        // Clear temp data after storing
        sessionStorage.removeItem('temp_captured_image');
        sessionStorage.removeItem('temp_image_captured');
      }

      // If we just came from camera with new image data, start the animation immediately
      const justCameFromCamera = (location.state?.imageCaptured && location.state?.imageData) || (tempImageCaptured && tempImageData);
      if (justCameFromCamera && !analysisCompleted && user && !isProcessingInProgress) {
        console.log('Starting processing animation for newly captured image');
        // Mark this image as processed
        processedImageRef.current = imageData;
        // Show animation immediately when page loads with new image
        setShowImageProcessingAnimation(true);
        // Start processing after showing animation for a moment
        setTimeout(() => {
          processCapturedImage(imageData);
        }, 500);
      }
    }
  }, [location.state?.imageCaptured, location.state?.imageData, location.state?.showResults, user, config.sessionKeys, processCapturedImage, isProcessingInProgress]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    }

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        if (imageData) {
          // Ensure processing state is cleared before starting new capture
          setIsProcessingInProgress(false);

          // Trigger the same processing flow
          setCapturedImageData(imageData);
          processedImageRef.current = imageData;
          sessionStorage.setItem(config.sessionKeys.imageData, imageData);

          // Start processing animation
          setShowImageProcessingAnimation(true);

          // Small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 100));
          await processCapturedImage(imageData);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read image file');
    }

    event.target.value = '';
  };

  const handleOpenCamera = () => {
    if (!user) {
      toast.error('Please log in to access the camera');
      navigate('/login');
      return;
    }

    if (hasConfirmedToday) {
      toast.success('Great job! Your reading for today is already confirmed', {
        description: 'Come back tomorrow for your next reading'
      });
      return;
    }

    // Clear any existing image data so the new image shows processing animation
    setCapturedImageData(null);
    setShowImageProcessingAnimation(false);
    setPendingConfirmation(null);

    // Trigger native file picker (shows Take Photo | Gallery | Browse options)
    fileInputRef.current?.click();
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };


  const handleScanAgain = () => {
    sessionStorage.removeItem(config.sessionKeys.analysisCompleted);
    sessionStorage.removeItem(config.sessionKeys.readingId);
    sessionStorage.removeItem(config.sessionKeys.imageData);
    setHasCompletedAnalysis(false);
    setCapturedImageData(null);
    setProcessingError(null);
    setProcessingStep('uploading');
    setIsProcessingInProgress(false);
    processedImageRef.current = null; // Clear processed image ref to allow reprocessing

    // Increment attempts when user clicks "Try Again" - don't reset to 0
    const newAttempts = cameraAttempts + 1;
    updateCameraAttempts(newAttempts);

    // Show manual fallback if we've reached the limit
    if (newAttempts >= MAX_CAMERA_ATTEMPTS) {
      setShowManualFallback(true);
    }

    // Trigger file picker instead of navigating to camera page
    setPendingConfirmation(null);
    setAnomalyResult(null);
    setShowAnomalyAlert(false);
    setManualDigits(Array(config.inputConfig.digitCount).fill(''));

    // Open file picker
    fileInputRef.current?.click();
  };

  const getProcessingTitle = () => {
    switch (processingStep) {
      case 'uploading':
        return 'Uploading Image...';
      case 'analyzing':
        return 'Analyzing with CNN YOLOv8...';
      case 'extracting':
        return 'Extracting Reading...';
      case 'complete':
        return 'Processing Complete';
      case 'failed':
        return 'Processing Failed';
      default:
        return 'Analyzing Meter...';
    }
  };

  const getProcessingSubtitle = () => {
    switch (processingStep) {
      case 'uploading':
        return 'Securely uploading your meter image';
      case 'analyzing':
        return 'CNN YOLOv8 model is analyzing the meter display';
      case 'extracting':
        return 'Extracting numerical reading with OCR';
      case 'complete':
        return 'Image processing completed';
      case 'failed':
        return 'Could not detect meter reading - please try again';
      default:
        return 'Processing with CNN YOLOv8 model...';
    }
  };

  const formatManualReading = () => {
    if (config.inputConfig.hasDecimal && config.inputConfig.decimalPosition) {
      const beforeDecimal = manualDigits.slice(0, config.inputConfig.decimalPosition).join('');
      const afterDecimal = manualDigits.slice(config.inputConfig.decimalPosition).join('');
      return beforeDecimal + '.' + afterDecimal;
    }
    return manualDigits.join('');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit readings');
      navigate('/login');
      return;
    }
    
    if (hasConfirmedToday) {
      toast.success('Great job! Your reading for today is already confirmed', {
        description: 'Come back tomorrow for your next reading'
      });
      return;
    }
    
    // Get formatted reading
    const fullReading = formatManualReading();
    
    if (!fullReading || isNaN(Number(fullReading))) {
      toast.error('Please enter a valid meter reading');
      return;
    }
    
    // Set up pending confirmation - will replace manual section
    setPendingConfirmation({
      reading_value: Number(fullReading),
      image_data: null,
      is_manual: true,
      notes: 'Manually entered reading',
      method: 'manual'
    });
  };
  
  // Unified confirmation handler for both camera and manual
  const handleConfirmReading = async () => {
    if (!pendingConfirmation || !user) {
      toast.error('No reading to confirm');
      return;
    }
    
    try {
      const result = await createReading(pendingConfirmation);

      // Handle result structure (could be just reading or { reading, anomaly })
      const reading = result.reading || result;

      // Check if this was saved locally due to CORS error
      if (reading.id?.startsWith('local_')) {
        toast.success('Reading saved locally (will sync when server is available)', {
          duration: 5000,
          description: 'Your reading has been stored and will be uploaded when the connection is restored.'
        });
      }
      const anomaly = result.anomaly;
      
      sessionStorage.setItem(config.sessionKeys.readingId, reading.id);
      setHasCompletedAnalysis(true);
      sessionStorage.setItem(config.sessionKeys.analysisCompleted, 'true');
      
      // Mark as confirmed for today to disable further inputs
      sessionStorage.setItem(`${config.utilityType}_confirmed_${today}`, 'true');

      // Reset camera attempts after successful reading submission
      updateCameraAttempts(0);
      setShowManualFallback(false);
      
      // Handle anomaly detection result
      const utilityName = config.utilityType.charAt(0).toUpperCase() + config.utilityType.slice(1);
      
      if (anomaly && anomaly.is_anomaly) {
        setAnomalyResult(anomaly);
        setShowAnomalyAlert(true);
      }
      
      setPendingConfirmation(null);
      
      // Navigate to second carousel page (results view)
      navigate(config.routes.monitoring, {
        state: { slideIndex: 1 },
        replace: true
      });
      
      // Show toast after navigation
      setTimeout(() => {
        if (anomaly && anomaly.is_anomaly) {
          const severityEmoji = {
            'low': '⚠️',
            'medium': '🔶', 
            'high': '⚡',
            'critical': '🚨'
          }[anomaly.severity] || '⚠️';
          
          toast.error(`${severityEmoji} ${anomaly.severity.toUpperCase()} Anomaly Detected`, {
            description: `Your ${utilityName.toLowerCase()} reading appears unusual but has been saved. Check the alert below for details.`,
          });
        } else {
          toast.success(`${utilityName} reading confirmed for today!`);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Failed to save reading:', error);
      toast.error('Failed to confirm reading: ' + (error?.message || 'Unknown error'));
    }
  };
  
  const handleRetryReading = () => {
    setPendingConfirmation(null);
    // Reset manual input
    setManualDigits(Array(config.inputConfig.digitCount).fill(''));
    // Allow retrying camera or manual
  };


  // Camera view is now handled by dedicated camera pages, no overlay needed


  const utilityName = config.utilityType === 'water' ? 'Water' : 'Electric';
  const Icon = config.utilityType === 'water' ? Droplet : Bolt;
  const textColorClass = config.utilityType === 'water' ? 'text-blue-50' : 'text-yellow-50';
  const primaryColorClass = config.utilityType === 'water' ? 'text-blue-100' : 'text-yellow-100';
  const focusRingClass = config.utilityType === 'water' ? 'focus:ring-blue-400' : 'focus:ring-yellow-400';
  const buttonColorClass = config.utilityType === 'water' ? 'bg-blue-400' : 'bg-yellow-400';
  const hoverButtonColorClass = config.utilityType === 'water' ? 'hover:bg-blue-600' : 'hover:bg-yellow-600';
  const scanButtonColorClass = config.utilityType === 'water' ? 'bg-blue-500' : 'bg-yellow-500';
  const textOnButtonClass = config.utilityType === 'water' ? 'text-blue-600' : 'text-yellow-600';

  return (
    <div className="space-y-4 pb-10">
      {/* Current Price Card */}
      <div className={`bg-gradient-to-br ${config.colors.gradient} p-6 rounded-3xl shadow-sm mb-4`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Current {utilityName} Price</h3>
          <p className="text-4xl font-bold text-white mb-2">
            ₱{currentPrice?.toFixed(2) || config.defaultPrice.toFixed(2)}
            <span className="text-lg font-normal align-top">/{config.unit}</span>
          </p>
          <p className={`text-sm ${textColorClass}`}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Image Processing Animation */}
      {showImageProcessingAnimation && capturedImageData && (
        <div className={`bg-gradient-to-br ${config.colors.gradient} p-8 rounded-3xl shadow-lg mb-6 transition-all duration-500`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 relative">
              <LoaderCircle className="text-white w-12 h-12 animate-spin" />
              <div className="absolute inset-0 border-4 border-white border-opacity-20 rounded-full animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {getProcessingTitle()}
            </h3>
            <p className="text-white text-opacity-90 mb-6">
              {getProcessingSubtitle()}
            </p>
            
            {/* Enhanced Processing Steps Indicator */}
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-6 mb-4 w-full max-w-md">
              <div className="flex justify-center items-center mb-4">
                {['uploading', 'analyzing', 'extracting'].map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-4 h-4 rounded-full transition-all duration-500 ${
                          processingStep === step
                            ? 'bg-white animate-pulse scale-125'
                            : ['uploading', 'analyzing', 'extracting'].indexOf(processingStep) > index
                            ? 'bg-green-400 scale-110'
                            : 'bg-white bg-opacity-30'
                        }`}
                      />
                      <span className={`text-xs mt-2 transition-opacity duration-300 whitespace-nowrap ${
                        processingStep === step ? 'text-white font-semibold' : 'text-white text-opacity-70'
                      }`}>
                        {step === 'uploading' ? 'Upload' : step === 'analyzing' ? 'Analyze' : 'Extract'}
                      </span>
                    </div>
                    {index < 2 && (
                      <div
                        className={`w-16 h-0.5 mx-3 transition-colors duration-500 ${
                          ['uploading', 'analyzing', 'extracting'].indexOf(processingStep) > index
                            ? 'bg-green-400'
                            : 'bg-white bg-opacity-20'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-center">
                <div className="text-white text-sm">
                  CNN YOLOv8 is processing your meter image...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Section - Replaces Camera/Manual when ready */}
      {pendingConfirmation && !showImageProcessingAnimation && (
        <div className={`${config.utilityType === 'water' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-amber-400 to-amber-500'} p-8 rounded-3xl shadow-lg mb-6 border-2 border-white border-opacity-20`}>
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {pendingConfirmation.method === 'camera' ? 'Reading Detected!' : 'Manual Entry Ready'}
            </h3>
            <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold mb-2">{pendingConfirmation.reading_value} {config.unit}</p>
              {pendingConfirmation.confidence_score && (
                <p className="text-sm opacity-90">
                  AI Confidence: {(pendingConfirmation.confidence_score * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <p className="text-sm opacity-90 mb-6">
              {pendingConfirmation.method === 'camera' 
                ? 'Our AI has detected your meter reading. Please confirm if this looks correct.' 
                : 'Please confirm your manual entry is correct.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPendingConfirmation(null);
                  processedImageRef.current = null; // Clear processed image ref

                  // Increment attempts when user clicks "Try Again" - don't reset to 0
                  const newAttempts = cameraAttempts + 1;
                  updateCameraAttempts(newAttempts);

                  // Show manual fallback if we've reached the limit
                  if (newAttempts >= MAX_CAMERA_ATTEMPTS) {
                    setShowManualFallback(true);
                  }

                  setManualDigits(Array(config.inputConfig.digitCount).fill(''));
                }}
                className="flex-1 bg-white bg-opacity-20 text-white py-4 rounded-full font-medium hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
              >
                Try Again
              </button>
              <button
                onClick={handleConfirmReading}
                disabled={isSubmittingReading}
                className={`flex-1 bg-white bg-opacity-20 text-white py-4 rounded-full font-medium hover:bg-opacity-30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-white border-opacity-30`}
              >
                {isSubmittingReading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Section - Only show when no pending confirmation and not processing */}
      {!pendingConfirmation && !showImageProcessingAnimation && !hasConfirmedToday && (
        <div className={`bg-gradient-to-br ${config.colors.gradient} p-8 rounded-3xl shadow-lg mb-4`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Camera className="text-3xl text-white" size={38} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Scan {utilityName} Meter</h3>
            <p className={`${textColorClass} mb-4`}>
              {cameraAttempts === 0
                ? 'Tap to capture a photo of your meter'
                : 'Tap to try again or use manual input below'}
            </p>
            {cameraAttempts === 0 && (
              <p className="text-white text-opacity-75 text-sm mb-4 px-2">
                Manual input available if capture fails
              </p>
            )}
            {cameraAttempts > 0 && (
              <p className="text-white text-opacity-75 text-sm mb-4">
                Try improving lighting and meter visibility
              </p>
            )}
            <button
              className={`w-full bg-white ${textOnButtonClass} py-4 rounded-full font-medium text-lg shadow-md hover:bg-opacity-90 transition-colors active:scale-95`}
              onClick={handleOpenCamera}
            >
              {cameraAttempts === 0 ? 'Open Camera' : 'Retry Camera'}
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Section - Show after 1 failed attempt */}
      {!pendingConfirmation && !showImageProcessingAnimation && !hasConfirmedToday && (showManualFallback || cameraAttempts >= MANUAL_INPUT_THRESHOLD) && (
        <div className="bg-white p-6 rounded-3xl shadow-sm" data-manual-input-section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#212529]">Manual Input</h3>
          </div>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              {config.inputConfig.hasDecimal ? 'Scroll horizontally to enter all digits' : 'Enter all digits'}
            </p>
            <div className="overflow-x-auto pb-2">
              <div className={`flex gap-2 mb-4 ${config.inputConfig.hasDecimal ? 'min-w-[24rem] sm:min-w-[28rem] md:min-w-[32rem] lg:min-w-[36rem]' : 'min-w-max'}`}>
                {config.inputConfig.hasDecimal ? (
                  <>
                    {[...Array(config.inputConfig.decimalPosition || 5)].map((_, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        ref={el => (inputRefs.current[idx] = el)}
                        className={`w-10 h-12 rounded-lg border text-center text-lg ${focusRingClass} transition`}
                        value={manualDigits[idx]}
                        onChange={e => handleDigitChange(idx, e.target.value)}
                        inputMode="numeric"
                        disabled={isSubmittingReading}
                      />
                    ))}
                    <div className="w-4 flex items-center justify-center text-lg">.</div>
                    {[...Array(config.inputConfig.digitCount - (config.inputConfig.decimalPosition || 5))].map((_, idx) => (
                      <input
                        key={config.inputConfig.decimalPosition! + idx}
                        type="text"
                        maxLength={1}
                        ref={el => (inputRefs.current[config.inputConfig.decimalPosition! + idx] = el)}
                        className={`w-10 h-12 rounded-lg border text-center text-lg ${focusRingClass} transition`}
                        value={manualDigits[config.inputConfig.decimalPosition! + idx]}
                        onChange={e => handleDigitChange(config.inputConfig.decimalPosition! + idx, e.target.value)}
                        inputMode="numeric"
                        disabled={isSubmittingReading}
                      />
                    ))}
                  </>
                ) : (
                  [...Array(config.inputConfig.digitCount)].map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      ref={el => (inputRefs.current[idx] = el)}
                      className={`w-10 h-12 rounded-lg border text-center text-lg ${focusRingClass} transition`}
                      value={manualDigits[idx]}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      inputMode="numeric"
                      disabled={isSubmittingReading}
                    />
                  ))
                )}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmittingReading}
              className={`w-full ${buttonColorClass} text-white py-3 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSubmittingReading ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Reading'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Confirmed State */}
      {hasConfirmedToday && (
        <div className={`${config.utilityType === 'water' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'} p-8 rounded-3xl shadow-lg mb-4 border-2`}>
          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 ${config.utilityType === 'water' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-amber-400 to-amber-500'} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
              <Icon className="text-white" size={38} />
            </div>
            <h3 className={`text-xl font-semibold ${config.utilityType === 'water' ? 'text-blue-700' : 'text-amber-700'} mb-2`}>Reading Confirmed!</h3>
            <p className={`${config.utilityType === 'water' ? 'text-blue-600' : 'text-amber-600'} mb-6`}>You've successfully confirmed your {utilityName.toLowerCase()} reading for today</p>
            <div className={`w-full bg-gradient-to-r ${config.utilityType === 'water' ? 'from-blue-500 to-blue-600 border-blue-400' : 'from-amber-500 to-amber-600 border-amber-400'} text-white py-4 rounded-full font-medium text-lg shadow-lg border-2 flex items-center justify-center gap-2`}>
              <Icon className="w-5 h-5" />
              Today's Reading Complete
            </div>
          </div>
        </div>
      )}

      {/* Anomaly Alert - Show when anomaly is detected */}
      {showAnomalyAlert && anomalyResult && (
        <UnifiedAnomalyAlert
          anomaly={anomalyResult}
          utilityType={config.utilityType}
          onDismiss={() => setShowAnomalyAlert(false)}
          variant="compact"
        />
      )}

      {/* Hidden file input for camera/gallery picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

    </div>
  );
};

export default MeterCapture;