import React from 'react';
import MeterHistory from '@/components/shared/MeterHistory';
import { 
  useElectricityReadings, 
  useElectricityAnomalies, 
  useElectricityUsageAnalytics 
} from '@/hooks/useElectricityData';

const electricityConfig = {
  utilityType: 'electricity' as const,
  unit: 'kWh',
  defaultPrice: 9.50,
  colors: {
    primary: 'yellow',
    chartColor: '#F59E0B',
    gradientId: 'colorElectricValue',
    loadingColor: 'text-yellow-500',
    buttonColor: 'text-yellow-500 hover:text-yellow-600 active:text-yellow-700',
  },
  hooks: {
    useReadings: useElectricityReadings,
    useAnomalies: useElectricityAnomalies,
    useUsageAnalytics: useElectricityUsageAnalytics,
  },
};

const ElectricityConfirmation: React.FC = () => {
  return <MeterHistory config={electricityConfig} />;
};

export default ElectricityConfirmation;