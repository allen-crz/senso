import React from 'react';
import MeterScanResults from '@/components/shared/MeterScanResults';
import UnifiedAnomalyAlert from '@/components/shared/UnifiedAnomalyAlert';
import CleanCostForecast from '@/components/shared/CleanCostForecast';
import { 
  useLatestWaterReading, 
  useWaterReadings, 
  useWaterAnomalies,
  useWaterConsumptionStats,
  useAnomalyDetectionHealth
} from '@/hooks/useWaterData';

const waterConfig = {
  utilityType: 'water' as const,
  unit: 'm³',
  defaultPrice: 25.50,
  colors: {
    primary: 'blue',
    secondary: 'text-blue-400',
    gradient: 'from-blue-400 to-blue-600',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-600',
    textColors: 'text-blue-600',
  },
  sessionKeys: {
    analysisCompleted: 'waterMeterAnalysisCompleted',
    readingId: 'latestWaterReadingId',
    imageData: 'capturedWaterMeterImage',
  },
  routes: {
    monitoring: '/water-monitoring',
  },
  hooks: {
    useLatestReading: useLatestWaterReading,
    useReadings: useWaterReadings,
    useAnomalies: useWaterAnomalies,
    useConsumptionStats: useWaterConsumptionStats,
    useAnomalyDetectionHealth: useAnomalyDetectionHealth,
  },
  anomalies: {
    detectedType: 'High water consumption detected',
    increasePercentage: '32',
    causes: [
      'Leaking pipes',
      'Running toilet', 
      'Meter malfunction'
    ],
  },
};

const WaterResults: React.FC = () => {
  // Option to use enhanced results with new features
  const useEnhancedView = false; // Set to true to enable enhanced anomaly detection
  
  if (useEnhancedView) {
    // Use the new enhanced component with improved anomaly detection
    const EnhancedWaterResults = React.lazy(() => import('./EnhancedWaterResults'));
    
    return (
      <React.Suspense fallback={
        <div className="space-y-4 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      }>
        <EnhancedWaterResults />
      </React.Suspense>
    );
  }
  
  // Fallback to original component
  return <MeterScanResults config={waterConfig} />;
};

export default WaterResults;