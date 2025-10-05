import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface RateInfo {
  source: 'official' | 'fallback' | 'estimated';
  confidence: 'high' | 'medium' | 'low';
  description: string;
  lastUpdated?: string;
  pricePerUnit?: number;
}

interface RateInfoResponse {
  water: RateInfo | null;
  electricity: RateInfo | null;
  isLoading: boolean;
  error: string | null;
}

// Simple function to extract rate info from forecast data
const extractRateInfo = (forecastData: any[]): RateInfo | null => {
  if (!forecastData || forecastData.length === 0) {
    return null;
  }

  const latestForecast = forecastData[0];

  return {
    source: latestForecast.rate_source || 'estimated',
    confidence: latestForecast.rate_confidence || 'low',
    description: latestForecast.rate_description || 'Rate information unavailable',
    lastUpdated: latestForecast.forecast_created_at
  };
};

export const useSimpleRateInfo = (): RateInfoResponse => {
  // Get rate info from existing forecast queries
  const { data: waterForecast, isLoading: waterLoading, error: waterError } = useQuery({
    queryKey: ['water-forecast'],
    queryFn: () => api.getForecasts({ utility_type: 'water', limit: 1 }),
    staleTime: 30 * 60 * 1000, // 30 minutes - rates don't change frequently
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: electricityForecast, isLoading: electricityLoading, error: electricityError } = useQuery({
    queryKey: ['electricity-forecast'],
    queryFn: () => api.getForecasts({ utility_type: 'electricity', limit: 1 }),
    staleTime: 30 * 60 * 1000, // 30 minutes - rates don't change frequently
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const waterRateInfo = extractRateInfo(waterForecast);
  const electricityRateInfo = extractRateInfo(electricityForecast);

  return {
    water: waterRateInfo,
    electricity: electricityRateInfo,
    isLoading: waterLoading || electricityLoading,
    error: (waterError || electricityError) ? 'Failed to load rate information' : null
  };
};

export const useUtilityRateInfo = (utilityType: 'water' | 'electricity'): RateInfo | null => {
  const { water, electricity } = useSimpleRateInfo();
  return utilityType === 'water' ? water : electricity;
};

// Hook for getting detailed rate confidence info
export const useRateConfidence = (utilityType: 'water' | 'electricity', month?: string) => {
  return useQuery({
    queryKey: ['rate-confidence', utilityType, month],
    queryFn: async () => {
      try {
        const response = await api.request(`/api/v1/utility-rates/rate-confidence/${utilityType}`, {
          method: 'GET',
          params: month ? { month } : undefined
        });
        return response.data.rate_confidence;
      } catch (error) {
        console.warn(`Failed to fetch rate confidence for ${utilityType}:`, error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1
  });
};