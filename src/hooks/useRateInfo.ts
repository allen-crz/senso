import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { requestBatcher } from '@/utils/requestBatcher';
import { rateUpdateService, RateUpdateEvent } from '@/services/rateUpdateService';

interface RateInfo {
  source: 'official' | 'fallback' | 'estimated' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  description: string;
  lastUpdated?: string;
  version?: string;
  pricePerUnit?: number;
}

interface RateInfoResponse {
  water: RateInfo | null;
  electricity: RateInfo | null;
  isLoading: boolean;
  error: string | null;
  lastCheckTime: Date | null;
  isCheckingUpdates: boolean;
}

export const useRateInfo = (): RateInfoResponse => {
  const [rateInfo, setRateInfo] = useState<{
    water: RateInfo | null;
    electricity: RateInfo | null;
  }>({ water: null, electricity: null });

  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Query for utility rates with deduplication
  const { data: waterRates, isLoading: waterLoading } = useQuery({
    queryKey: ['water-rates'],
    queryFn: () => requestBatcher.deduplicate(
      'water-rates',
      () => api.getUtilityRates('water')
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const { data: electricityRates, isLoading: electricityLoading } = useQuery({
    queryKey: ['electricity-rates'],
    queryFn: () => requestBatcher.deduplicate(
      'electricity-rates',
      () => api.getUtilityRates('electricity')
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Process rate information
  useEffect(() => {
    const processRateInfo = async () => {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);

        const waterInfo = await getCurrentRateInfo('water', currentMonth, waterRates);
        const electricityInfo = await getCurrentRateInfo('electricity', currentMonth, electricityRates);

        setRateInfo({
          water: waterInfo,
          electricity: electricityInfo
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rate information');
      }
    };

    if (waterRates && electricityRates) {
      processRateInfo();
    }
  }, [waterRates, electricityRates]);

  // Listen for rate updates
  useEffect(() => {
    const handleRateUpdate = (event: RateUpdateEvent) => {
      console.log('Rate update received:', event);

      // Update the affected utility's rate info
      const utilityType = event.utility_type;
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (event.affected_months.includes(currentMonth)) {
        // Trigger a refresh of rate information
        const rates = utilityType === 'water' ? waterRates : electricityRates;
        if (rates) {
          getCurrentRateInfo(utilityType, currentMonth, rates).then(newRateInfo => {
            setRateInfo(prev => ({
              ...prev,
              [utilityType]: newRateInfo
            }));
          });
        }
      }

      setLastCheckTime(new Date());
    };

    rateUpdateService.onRateUpdate(handleRateUpdate);

    return () => {
      rateUpdateService.removeRateUpdateListener(handleRateUpdate);
    };
  }, [waterRates, electricityRates]);

  const getCurrentRateInfo = async (
    utilityType: 'water' | 'electricity',
    month: string,
    rates?: any[]
  ): Promise<RateInfo> => {
    try {
      if (!rates || rates.length === 0) {
        return {
          source: 'estimated',
          confidence: 'low',
          description: 'No rate data available - using estimates',
          version: 'estimated-' + month
        };
      }

      // Find current month's official rate
      const currentMonthRate = rates.find(rate =>
        rate.effective_date &&
        rate.effective_date.startsWith(month) &&
        (rate.source === 'official' || !rate.source) // Default to official if no source specified
      );

      if (currentMonthRate) {
        return {
          source: 'official',
          confidence: 'high',
          description: 'Using current month rates',
          lastUpdated: currentMonthRate.effective_date,
          version: currentMonthRate.version || '1.0',
          pricePerUnit: currentMonthRate.price_per_unit
        };
      }

      // Try to find the most recent official rate (fallback)
      const recentRate = rates
        .filter(rate => rate.source === 'official' || !rate.source)
        .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())[0];

      if (recentRate) {
        const rateDate = new Date(recentRate.effective_date);
        const isRecent = (Date.now() - rateDate.getTime()) < (90 * 24 * 60 * 60 * 1000); // 90 days

        return {
          source: 'fallback',
          confidence: isRecent ? 'medium' : 'low',
          description: `Using ${new Date(recentRate.effective_date).toLocaleDateString()} rates (current month pending)`,
          lastUpdated: recentRate.effective_date,
          version: (recentRate.version || '1.0') + '-fallback',
          pricePerUnit: recentRate.price_per_unit
        };
      }

      // Fallback to estimated
      return {
        source: 'estimated',
        confidence: 'low',
        description: 'Using estimated rates',
        version: 'estimated-' + month,
        pricePerUnit: utilityType === 'electricity' ? 10.50 : 15.00
      };

    } catch (error) {
      console.error(`Error getting rate info for ${utilityType}:`, error);
      return {
        source: 'estimated',
        confidence: 'low',
        description: 'Error loading rates - using estimates',
        version: 'error-' + month
      };
    }
  };

  return {
    water: rateInfo.water,
    electricity: rateInfo.electricity,
    isLoading: waterLoading || electricityLoading,
    error,
    lastCheckTime: lastCheckTime || rateUpdateService.getLastCheckTime(),
    isCheckingUpdates: rateUpdateService.isCurrentlyChecking()
  };
};

export const useUtilityRateInfo = (utilityType: 'water' | 'electricity'): RateInfo | null => {
  const { water, electricity } = useRateInfo();
  return utilityType === 'water' ? water : electricity;
};