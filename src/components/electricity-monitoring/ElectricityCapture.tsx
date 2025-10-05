import React from 'react';
import MeterCapture from '@/components/shared/MeterCapture';
import CameraView from './CameraView';
import ImageProcessingResults from '@/components/shared/ImageProcessingResults';
import { useCreateElectricityReading, useProcessElectricityImage, useLatestElectricityReading } from '@/hooks/useElectricityData';
import { useCreateElectricityReadingWithAnomaly } from '@/hooks/useAnomalyDetection';
import { useElectricityGenerationCharge } from '@/hooks/useUserRates';

const ElectricityCapture: React.FC = () => {
  const { rateValue: generationCharge } = useElectricityGenerationCharge();

  const electricityConfig = React.useMemo(() => ({
    utilityType: 'electricity' as const,
    unit: 'kWh',
    defaultPrice: generationCharge || 9.50, // Use user's generation charge or fallback
    colors: {
      primary: 'yellow',
      secondary: 'yellow',
      gradient: 'from-yellow-400 to-yellow-600',
      primaryClass: 'bg-yellow',
      secondaryClass: 'text-yellow',
    },
    inputConfig: {
      digitCount: 5,
      hasDecimal: false,
    },
    sessionKeys: {
      analysisCompleted: 'electricityMeterAnalysisCompleted',
      imageData: 'capturedElectricityMeterImage',
      readingId: 'latestElectricityReadingId',
    },
    routes: {
      monitoring: '/electricity-monitoring',
    },
  }), [generationCharge]);

  return (
    <MeterCapture
      config={electricityConfig}
      CameraView={CameraView}
      ImageProcessingResults={ImageProcessingResults}
      hooks={{
        useCreateReading: useCreateElectricityReadingWithAnomaly,
        useProcessImage: useProcessElectricityImage,
        useLatestReading: useLatestElectricityReading,
      }}
    />
  );
};

export default ElectricityCapture;