import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { invalidateAfterMeterReading } from '@/utils/cacheInvalidation';
import { useAuth } from './useAuth';
import { requestBatcher } from '@/utils/requestBatcher';

export interface WaterReading {
  id: string;
  reading_value: number;
  capture_timestamp: string;
  confidence_score?: number;
  is_manual: boolean;
  notes?: string;
}

export interface WaterAnomaly {
  id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  contributing_factors: any;
}

export interface UsageData {
  period: string;
  consumption: number;
  average: number;
}

export const useWaterReadings = (limit = 50, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['water-readings', limit],
    queryFn: () => api.getMeterReadings({
      utility_type: 'water',
      limit
    }),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: options?.enabled !== false,
  });
};

export const useLatestWaterReading = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['latest-water-reading'],
    queryFn: () => requestBatcher.deduplicate(
      'latest-water-reading',
      () => api.getLatestReading('water')
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes - fresh data for readings
    gcTime: 10 * 60 * 1000, // 10 minutes cache (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: options?.enabled !== false,
  });
};

export const useWaterAnomalies = (limit = 10) => {
  return useQuery({
    queryKey: ['water-anomalies', limit],
    queryFn: () => api.getUserAnomalies('water', limit),
    staleTime: 0, // Force fresh data - always refetch when invalidated
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true, // Refetch on reconnect
  });
};

export const useWaterUsageAnalytics = (
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  months = 6 // Max 6 months to stay within 180-day backend limit
) => {
  const endDate = new Date().toISOString();
  const startDate = new Date(
    Date.now() - (months * 30 * 24 * 60 * 60 * 1000)
  ).toISOString();

  return useQuery({
    queryKey: ['water-usage-analytics', period, months],
    queryFn: () => api.getUsageAnalytics('water', period, startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useWaterForecast = () => {
  return useQuery({
    queryKey: ['water-forecast-monthly'],
    queryFn: () => api.getMonthlyForecast('water'),
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - forecasts don't change frequently
    gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Reduce retries to prevent multiple model training attempts
  });
};

export const useWaterRates = () => {
  return useQuery({
    queryKey: ['water-rates'],
    queryFn: () => requestBatcher.deduplicate(
      'water-rates',
      () => api.getUtilityRates('water')
    ),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - pricing rarely changes
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const useWaterPricing = () => {
  return useQuery({
    queryKey: ['water-pricing'],
    queryFn: () => api.getCurrentPricing('water'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - pricing rarely changes
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const useWaterUsage = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['water-usage', startDate, endDate],
    queryFn: () => api.calculateUsage('water', startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

// Hook for creating water reading with anomaly detection
export const useCreateWaterReading = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  const createReading = async (data: {
    reading_value: number;
    image_data?: string;
    is_manual?: boolean;
    notes?: string;
    location_data?: any;
  }) => {
    setIsLoading(true);
    setError(null);
    setAnomalyResult(null);

    try {
      // Create the meter reading first
      const reading = await api.createMeterReading({
        utility_type: 'water',
        ...data,
      });

      // Run anomaly detection on the created reading
      let anomaly = null;
      try {
        anomaly = await api.triggerAnomalyDetection(reading.id);
        setAnomalyResult(anomaly);
      } catch (anomalyError) {
        console.warn('Anomaly detection failed:', anomalyError);
        // Don't fail the entire operation if anomaly detection fails
      }

      // Invalidate ALL related queries to force immediate fresh data across all components
      await queryClient.invalidateQueries({ queryKey: ['latest-water-reading'] });
      await queryClient.invalidateQueries({ queryKey: ['water-readings'] });
      await queryClient.invalidateQueries({ queryKey: ['water-anomalies'] });
      await queryClient.invalidateQueries({ queryKey: ['water-usage-analytics'] });
      await queryClient.invalidateQueries({ queryKey: ['user-anomalies'] });
      await queryClient.invalidateQueries({ queryKey: ['water-reading'] }); // UtilityUsageCard
      await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      await queryClient.invalidateQueries({ queryKey: ['meter-history'] });
      await queryClient.invalidateQueries({ queryKey: ['water-forecast'] });
      await queryClient.invalidateQueries({ queryKey: ['water-forecast-30'] }); // CRITICAL: Invalidate forecast cache
      await queryClient.invalidateQueries({ queryKey: ['clean-data'] });

      // Coordinated cache invalidation across all layers (React Query, API Cache, Service Worker)
      if (user?.id) {
        await invalidateAfterMeterReading('water', user.id, queryClient);
      }

      // Force immediate refetch of critical data
      queryClient.refetchQueries({ queryKey: ['latest-water-reading'] });
      queryClient.refetchQueries({ queryKey: ['water-anomalies'] });
      queryClient.refetchQueries({ queryKey: ['water-reading'] });
      queryClient.refetchQueries({ queryKey: ['water-forecast-30'] }); // CRITICAL: Force forecast refetch

      return {
        reading,
        anomaly
      };
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reading';

      // Check if it's a CORS error or network error
      if (err.message?.includes('CORS') ||
          err.message?.includes('Access-Control-Allow-Origin') ||
          err.message?.includes('Failed to fetch') ||
          err.name === 'NetworkError') {
        console.error('Network/CORS error detected:', err);
        setError('Unable to connect to server. Please check your network connection and try again.');

        // Fallback: Store reading locally for now
        const localReading = {
          id: `local_${Date.now()}`,
          reading_value: data.reading_value,
          capture_timestamp: new Date().toISOString(),
          is_manual: data.is_manual || false,
          notes: data.notes || '',
          utility_type: 'water'
        };

        // Store in localStorage as fallback
        try {
          const existingReadings = JSON.parse(localStorage.getItem('pending_water_readings') || '[]');
          existingReadings.push(localReading);
          localStorage.setItem('pending_water_readings', JSON.stringify(existingReadings));

          // Return the local reading so the UI can continue
          return { reading: localReading, anomaly: null };
        } catch (storageErr) {
          console.error('Failed to store reading locally:', storageErr);
        }
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createReading, isLoading, error, anomalyResult };
};

// Hook for processing water meter image
export const useProcessWaterImage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await api.processImage(imageData, 'water');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processImage, isProcessing, error };
};

// Enhanced Anomaly Detection Hooks
export const useWaterConsumptionStats = (days = 30) => {
  return useQuery({
    queryKey: ['water-consumption-stats', days],
    queryFn: () => api.getConsumptionStats('water', days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCleanWaterDataForForecasting = (days = 30) => {
  return useQuery({
    queryKey: ['clean-water-data-forecasting', days],
    queryFn: () => api.getCleanDataForForecasting('water', days),
    staleTime: 15 * 60 * 1000, // 15 minutes - forecasting data can be slightly stale
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useAnomalyDetectionHealth = () => {
  return useQuery({
    queryKey: ['anomaly-detection-health'],
    queryFn: () => api.getAnomalyDetectionHealth(),
    staleTime: 2 * 60 * 1000, // 2 minutes - health should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Hook for providing anomaly feedback
export const useAnomalyFeedback = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = async (
    anomalyId: string, 
    feedback: 'correct' | 'false_positive' | 'missed_anomaly'
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.provideAnomalyFeedback(anomalyId, feedback);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitFeedback, isSubmitting, error };
};

