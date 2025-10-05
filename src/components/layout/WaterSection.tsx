import React from 'react';
import UtilityUsageCard from '@/components/shared/UtilityUsageCard';
import { useLatestWaterReading, useWaterReadings } from '@/hooks/useWaterData';

interface WaterReading {
  id: string;
  user_id: string;
  reading: number;
  created_at: string;
  updated_at: string;
}

interface WaterSectionProps {
  variant?: 'dashboard' | 'water';
  onViewDetails?: () => void;
  onAddReading?: () => void;
  // Optional: Pass data from parent to avoid redundant API calls
  latestReading?: any;
  isLoading?: boolean;
  anomalies?: any[]; // NEW: Pass anomaly data from parent
}

const WaterSection: React.FC<WaterSectionProps> = ({
  onViewDetails,
  onAddReading,
  latestReading: providedReading,
  isLoading: providedLoading,
  anomalies: providedAnomalies
}) => {
  const hasProvidedData = providedReading !== undefined;

  // Only fetch latest if data not provided (for standalone use outside Dashboard)
  const { data: fetchedLatestReading, isLoading: fetchedLoading } = useLatestWaterReading({
    enabled: !hasProvidedData
  });
  // Always fetch 2 readings to get previous reading for trend comparison
  const { data: readings } = useWaterReadings(2);

  // Use provided data if available, otherwise use fetched data
  const latestReading = hasProvidedData ? providedReading : fetchedLatestReading;
  const isLoading = hasProvidedData ? (providedLoading !== undefined ? providedLoading : false) : fetchedLoading;

  // Transform the data for UtilityUsageCard
  const transformedData = (latestReading && Object.keys(latestReading).length > 0) ? {
    id: latestReading.id || '',
    user_id: latestReading.user_id || '',
    reading: latestReading.reading_value || 0,
    created_at: latestReading.capture_timestamp || '',
    updated_at: latestReading.capture_timestamp || ''
  } : null;

  // Get previous reading (second most recent)
  const previousReading = (readings && readings.length >= 2) ? {
    id: readings[1].id || '',
    user_id: readings[1].user_id || '',
    reading: readings[1].reading_value || 0,
    created_at: readings[1].capture_timestamp || '',
    updated_at: readings[1].capture_timestamp || ''
  } : null;

  return (
    <UtilityUsageCard
      utilityType="water"
      utilityData={transformedData}
      isLoading={isLoading}
      onViewDetails={onViewDetails}
      onAddReading={onAddReading}
      previousReading={previousReading}
      anomalies={providedAnomalies} // Pass through anomaly data
    />
  );
};

export default WaterSection;
