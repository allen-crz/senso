import React from 'react';
import MeterCapture from '@/components/shared/MeterCapture';
import CameraView from './CameraView';
import ImageProcessingResults from '@/components/shared/ImageProcessingResults';
import { useCreateWaterReading, useProcessWaterImage, useLatestWaterReading } from '@/hooks/useWaterData';
import { useCreateWaterReadingWithAnomaly } from '@/hooks/useAnomalyDetection';
import { useWaterBasicCharge } from '@/hooks/useUserRates';

const WaterCapture: React.FC = () => {
  const { rateValue: basicCharge } = useWaterBasicCharge();

  const waterConfig = React.useMemo(() => ({
    utilityType: 'water' as const,
    unit: 'm³',
    defaultPrice: basicCharge || 25.50, // Use user's basic charge (0-10cum) or fallback
    colors: {
      primary: 'blue',
      secondary: 'blue',
      gradient: 'from-blue-400 to-blue-600',
      primaryClass: 'bg-blue',
      secondaryClass: 'text-blue',
    },
    inputConfig: {
      digitCount: 8,
      hasDecimal: true,
      decimalPosition: 5,
    },
    sessionKeys: {
      analysisCompleted: 'waterMeterAnalysisCompleted',
      imageData: 'capturedWaterMeterImage',
      readingId: 'latestWaterReadingId',
    },
    routes: {
      monitoring: '/water-monitoring',
    },
  }), [basicCharge]);

  return (
    <MeterCapture
      config={waterConfig}
      CameraView={CameraView}
      ImageProcessingResults={ImageProcessingResults}
      hooks={{
        useCreateReading: useCreateWaterReadingWithAnomaly,
        useProcessImage: useProcessWaterImage,
        useLatestReading: useLatestWaterReading,
      }}
    />
  );
};

export default WaterCapture;