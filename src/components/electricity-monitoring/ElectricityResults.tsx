import React from 'react';
import MeterScanResults from '@/components/shared/MeterScanResults';
import { 
  useLatestElectricityReading, 
  useElectricityReadings, 
  useElectricityAnomalies,
  useElectricityConsumptionStats,
  useAnomalyDetectionHealth
} from '@/hooks/useElectricityData';

const electricityConfig = {
  utilityType: 'electricity' as const,
  unit: 'kWh',
  defaultPrice: 9.50,
  colors: {
    primary: 'yellow',
    secondary: 'text-yellow-400',
    gradient: 'from-yellow-400 to-yellow-600',
    buttonBg: 'bg-yellow-500',
    buttonHover: 'hover:bg-yellow-600',
    textColors: 'text-yellow-600',
  },
  sessionKeys: {
    analysisCompleted: 'electricityMeterAnalysisCompleted',
    readingId: 'latestElectricityReadingId',
    imageData: 'capturedElectricityMeterImage',
  },
  routes: {
    monitoring: '/electricity-monitoring',
  },
  hooks: {
    useLatestReading: useLatestElectricityReading,
    useReadings: useElectricityReadings,
    useAnomalies: useElectricityAnomalies,
    useConsumptionStats: useElectricityConsumptionStats,
    useAnomalyDetectionHealth: useAnomalyDetectionHealth,
  },
  anomalies: {
    detectedType: 'High electricity consumption detected',
    increasePercentage: '28',
    causes: [
      'High-consumption appliances running',
      'Faulty electrical wiring',
      'Meter malfunction',
      'Seasonal usage increase'
    ],
  },
};

const ElectricityResults: React.FC = () => {
  // Option to use enhanced results with new features
  const useEnhancedView = false; // Set to true to enable enhanced anomaly detection
  
  if (useEnhancedView) {
    // Use the new enhanced component with improved anomaly detection
    const EnhancedElectricityResults = React.lazy(() => import('./EnhancedElectricityResults'));
    
    return (
      <React.Suspense fallback={
        <div className="space-y-4 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      }>
        <EnhancedElectricityResults />
      </React.Suspense>
    );
  }
  
  // Fallback to original component
  return <MeterScanResults config={electricityConfig} />;
};

export default ElectricityResults;