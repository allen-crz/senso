import React from 'react';
import { CheckCircle, AlertTriangle, Camera, Eye, RotateCcw } from 'lucide-react';

interface ImageProcessingResultsProps {
  imageData: string;
  processingResult: {
    reading_value?: number;
    confidence_score: number;
    processing_status: 'processed' | 'failed' | 'pending';
    raw_ocr_data?: any;
    error_message?: string;
  };
  onRetry: () => void;
  onManualEntry: () => void;
  onAccept: () => void;
}

const ImageProcessingResults: React.FC<ImageProcessingResultsProps> = ({
  imageData,
  processingResult,
  onRetry,
  onManualEntry,
  onAccept
}) => {
  const isSuccess = processingResult.processing_status === 'processed' && processingResult.reading_value;
  const confidencePercentage = (processingResult.confidence_score * 100).toFixed(1);
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = () => {
    if (isSuccess) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
    return <AlertTriangle className="w-8 h-8 text-orange-500" />;
  };

  const getStatusMessage = () => {
    if (isSuccess) {
      return {
        title: "Reading Detected Successfully!",
        subtitle: `AI extracted the meter reading with ${confidencePercentage}% confidence`
      };
    }
    
    if (processingResult.error_message) {
      return {
        title: "Processing Failed",
        subtitle: processingResult.error_message
      };
    }
    
    return {
      title: "Unable to Read Meter",
      subtitle: "The image quality or angle may not be suitable for automatic reading"
    };
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="space-y-6">
      {/* Image Preview */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Camera className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-800">Captured Image</h3>
        </div>
        <div className="relative">
          <img
            src={imageData}
            alt="Captured meter"
            className="w-full h-48 object-cover rounded-lg"
          />
          {/* Processing overlay if needed */}
          {processingResult.processing_status === 'pending' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Results */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          {getStatusIcon()}
          <h2 className="text-xl font-semibold text-gray-800 mt-3 mb-2">
            {statusInfo.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {statusInfo.subtitle}
          </p>
        </div>

        {/* Reading Display */}
        {isSuccess && (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-yellow-600 mb-1">Detected Reading</p>
              <p className="text-3xl font-bold text-yellow-900 mb-2">
                {processingResult.reading_value} kWh
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(processingResult.confidence_score)}`}>
                  {confidencePercentage}% Confidence
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details (Expandable) */}
        {processingResult.raw_ocr_data && (
          <details className="bg-gray-50 rounded-lg p-4 mb-6">
            <summary className="cursor-pointer text-sm text-gray-600 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Technical Details
            </summary>
            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="font-medium text-gray-700">Method:</span>
                <span className="text-gray-600 ml-2">{processingResult.raw_ocr_data.method || 'CNN + OCR'}</span>
              </div>
              {processingResult.raw_ocr_data.raw_text && (
                <div>
                  <span className="font-medium text-gray-700">Raw OCR Text:</span>
                  <span className="text-gray-600 ml-2 font-mono">{processingResult.raw_ocr_data.raw_text}</span>
                </div>
              )}
              {processingResult.raw_ocr_data.cnn_result && (
                <div>
                  <span className="font-medium text-gray-700">CNN Result:</span>
                  <span className="text-gray-600 ml-2">{JSON.stringify(processingResult.raw_ocr_data.cnn_result)}</span>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isSuccess ? (
            <>
              <button
                onClick={onAccept}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Accept Reading ({processingResult.reading_value} kWh)
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onManualEntry}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Manual Entry
                </button>
                <button
                  onClick={onRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onManualEntry}
                className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Manual Entry
              </button>
              <button
                onClick={onRetry}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Confidence Tips */}
        {processingResult.confidence_score < 0.8 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Tips for Better Results:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Ensure good lighting on the meter display</li>
              <li>• Hold the camera steady and align with the meter</li>
              <li>• Clean the meter display if it's dirty or foggy</li>
              <li>• Try to capture from directly in front of the meter</li>
              <li>• Make sure all digits are clearly visible</li>
              <li>• Avoid shadows, reflections, or glare on the display</li>
            </ul>
          </div>
        )}

        {/* Processing Feedback */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Processing Information:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>✓ Image uploaded and processed successfully</p>
            <p>✓ AI vision analysis completed</p>
            <p>✓ {processingResult.confidence_score ? 
              `OCR confidence: ${(processingResult.confidence_score * 100).toFixed(1)}%` : 
              'OCR processing completed'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageProcessingResults;