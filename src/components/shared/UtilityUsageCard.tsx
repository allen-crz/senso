import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Bolt, Droplet } from "lucide-react";
import { useUserAnomalies } from "@/hooks/useAnomalyDetection";

interface UtilityReading {
  id: string;
  user_id: string;
  reading: number;
  created_at: string;
  updated_at: string;
}

interface UtilityUsageCardProps {
  utilityType: 'electricity' | 'water';
  fetchData?: () => Promise<UtilityReading | null>;
  utilityData?: UtilityReading | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
  onAddReading?: () => void;
  previousReading?: UtilityReading | null;
  anomalies?: any[]; // NEW: Accept anomaly data from parent
}

const UtilityUsageCard: React.FC<UtilityUsageCardProps> = React.memo(({
  utilityType,
  fetchData,
  utilityData: propsUtilityData,
  isLoading: propsIsLoading,
  onViewDetails,
  onAddReading,
  previousReading,
  anomalies: providedAnomalies
}) => {
  // Use props data if provided, otherwise use query
  const queryResult = useQuery({
    queryKey: [`${utilityType}-reading`],
    queryFn: fetchData || (() => Promise.resolve(null)),
    enabled: !!fetchData && !propsUtilityData, // Only run query if no props data provided
  });

  const utilityData = propsUtilityData ?? queryResult.data;
  const isLoading = propsIsLoading ?? (queryResult.isLoading || queryResult.isFetching);

  // Fetch anomaly data for this utility type - ONLY if not provided by parent OR if provided is empty
  const shouldFetchAnomalies = !providedAnomalies || (Array.isArray(providedAnomalies) && providedAnomalies.length === 0);
  const { data: fetchedAnomalies } = useUserAnomalies(utilityType, 10, {
    enabled: shouldFetchAnomalies // Fetch if no anomalies provided or if provided array is empty
  });

  // Use provided anomalies only if it's a non-empty array, otherwise use fetched
  const anomalies = (providedAnomalies && providedAnomalies.length > 0) ? providedAnomalies : fetchedAnomalies;

  // Check if current reading is anomalous and get anomaly details - Memoized
  const { isCurrentReadingAnomalous, currentAnomalyDetails } = useMemo(() => {
    if (!utilityData || !anomalies || !Array.isArray(anomalies) || anomalies.length === 0) {
      return { isCurrentReadingAnomalous: false, currentAnomalyDetails: null };
    }

    // Match pattern from MeterScanResults - check reading_id against utilityData.id
    const currentReadingAnomaly = anomalies.find((anomaly: any) => {
      const matchesId = anomaly.reading_id === utilityData.id;
      const isAnomaly = anomaly.is_anomaly === true;
      return matchesId && isAnomaly;
    });

    return {
      isCurrentReadingAnomalous: !!currentReadingAnomaly,
      currentAnomalyDetails: currentReadingAnomaly || null
    };
  }, [utilityData, anomalies]);
  
  // Format anomaly details like MeterHistory - Memoized
  const anomalyDisplayInfo = useMemo(() => {
    if (!currentAnomalyDetails) return null;
    
    const factors = currentAnomalyDetails.contributing_factors;
    let description = 'Unusual consumption pattern detected.';
    
    // Use specific descriptions based on anomaly type
    if (factors?.reason?.includes('rollback')) {
      description = 'Meter reading went backwards unexpectedly - possible malfunction.';
    } else if (factors?.reason?.includes('physical') || factors?.reason?.includes('Extreme')) {
      description = 'Reading exceeds realistic consumption limits for residential use.';
    } else if (factors?.reason?.includes('pattern') || factors?.reason?.includes('consumption')) {
      description = 'Usage pattern significantly different from your normal consumption.';
    } else if (factors?.insights?.[0]) {
      description = factors.insights[0];
    }
    
    return {
      severity: `${currentAnomalyDetails.severity.charAt(0).toUpperCase() + currentAnomalyDetails.severity.slice(1)} Alert`,
      confidence: `${(Number(currentAnomalyDetails.anomaly_score) * 100).toFixed(1)}%`,
      description
    };
  }, [currentAnomalyDetails]);

  const config = useMemo(() => ({
    electricity: {
      icon: Bolt,
      unit: 'kWh',
      maxUsage: 5,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-400',
      textColor: 'text-amber-500'
    },
    water: {
      icon: Droplet,
      unit: 'm³',
      maxUsage: 100,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-500'
    }
  }), []);

  const { icon: Icon, unit, maxUsage, bgColor, iconColor, textColor } = config[utilityType];

  // Memoize current reading calculation
  const currentReading = useMemo(() => utilityData?.reading || 0, [utilityData]);

  // Show loading if still fetching OR if we don't have data yet
  if (isLoading || (!utilityData && previousReading === undefined)) {
    return (
      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <div className={`w-16 h-16 ${config[utilityType].bgColor} rounded-full flex items-center justify-center mb-4 animate-pulse`}>
            <Icon className={`${config[utilityType].iconColor} h-8 w-8`} />
          </div>
          <div className="space-y-2 text-center">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </Card>
    );
  }

  if (!utilityData) {
    return (
      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <Icon className={`${utilityType === 'water' ? 'text-blue-400' : 'text-amber-400'} w-12 h-12 mb-4`} />
          <p className="text-gray-400 text-center mb-2">Take a photo of your {utilityType} meter</p>
          <button
            className={`px-6 py-2 ${bgColor} ${textColor} rounded-full text-sm font-semibold transition-colors hover:${bgColor.replace('50', '100')} hover:${textColor.replace('500', '600')} active:scale-95 focus:outline-none`}
            onClick={onAddReading}
            type="button"
          >
            Add Reading
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 rounded-3xl shadow-sm transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#212529]">
          {utilityType === 'electricity' ? 'Electricity' : 'Water'} Usage Today
        </h3>
        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center transition-all duration-200`}>
          <Icon className={`${iconColor} h-5 w-5`} />
        </div>
      </div>
      <div className={`${bgColor} rounded-xl p-4 mb-4`}>
        <div className="flex justify-between items-center">
          <div>
            <p className={`text-2xl font-bold ${textColor}`}>
              {currentReading} {unit}
            </p>
            <p className={`text-sm ${textColor.replace('500', '400')}`}>Current Reading</p>
          </div>
          <div className="text-right">
            <p className={`${isCurrentReadingAnomalous ? 'text-base font-bold' : 'text-lg font-semibold'} ${
              isCurrentReadingAnomalous ? 'text-orange-500' :
              previousReading ? (currentReading - previousReading.reading > 0 ? 'text-red-500' : 'text-green-500') : 'text-blue-500'
            }`}>
              {isCurrentReadingAnomalous ? 'Anomaly' :
               previousReading ? 
                `${currentReading - previousReading.reading > 0 ? '+' : ''}${(currentReading - previousReading.reading).toFixed(utilityType === 'electricity' ? 0 : 1)} ${unit}` : 
                'Baseline'
              }
            </p>
            <p className={`text-sm ${textColor.replace('500', '400')}`}>
              {previousReading ? 'vs Previous' : 'First Reading'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          Previous: {previousReading ? 
            `${previousReading.reading} ${unit}` : 
            'N/A (First reading)'
          }
        </span>
      </div>
      {onViewDetails && (
        <button 
          className={`text-sm font-semibold ${textColor} mt-4`}
          onClick={onViewDetails}
          type="button"
        >
          View Details →
        </button>
      )}
    </Card>
  );
});

UtilityUsageCard.displayName = 'UtilityUsageCard';

export default UtilityUsageCard;