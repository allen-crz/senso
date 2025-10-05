import React from 'react';
import MeterHistory from '@/components/shared/MeterHistory';
import { 
  useWaterReadings, 
  useWaterAnomalies, 
  useWaterUsageAnalytics 
} from '@/hooks/useWaterData';

const waterConfig = {
  utilityType: 'water' as const,
  unit: 'm³',
  defaultPrice: 25.50,
  colors: {
    primary: 'blue',
    chartColor: '#3B82F6',
    gradientId: 'colorValue',
    loadingColor: 'text-blue-500',
    buttonColor: 'text-blue-500 hover:text-blue-600 active:text-blue-700',
  },
  hooks: {
    useReadings: useWaterReadings,
    useAnomalies: useWaterAnomalies,
    useUsageAnalytics: useWaterUsageAnalytics,
  },
};

const WaterConfirmation: React.FC = () => {
  return <MeterHistory config={waterConfig} />;
};

export default WaterConfirmation;