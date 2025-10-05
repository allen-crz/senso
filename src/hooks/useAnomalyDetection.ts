import { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface AnomalyResult {
  id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  contributing_factors: any;
}

interface AnomalyDetectionHookResult {
  detectAnomaly: (readingId: string) => Promise<AnomalyResult | null>;
  isProcessing: boolean;
  error: string | null;
  lastResult: AnomalyResult | null;
}

export const useAnomalyDetection = (): AnomalyDetectionHookResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnomalyResult | null>(null);
  const queryClient = useQueryClient();

  const detectAnomaly = useCallback(async (readingId: string): Promise<AnomalyResult | null> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Call backend anomaly detection service
      const result = await api.triggerAnomalyDetection(readingId);
      
      if (result) {
        // Invalidate all relevant queries to refresh UI across components
        queryClient.invalidateQueries({ queryKey: ['user-anomalies'] });
        queryClient.invalidateQueries({ queryKey: ['water-anomalies'] });
        queryClient.invalidateQueries({ queryKey: ['electricity-anomalies'] });
        queryClient.invalidateQueries({ queryKey: ['water-reading'] });
        queryClient.invalidateQueries({ queryKey: ['electricity-reading'] });
        queryClient.invalidateQueries({ queryKey: ['latest-water-reading'] });
        queryClient.invalidateQueries({ queryKey: ['latest-electricity-reading'] });
        queryClient.invalidateQueries({ queryKey: ['water-readings'] });
        queryClient.invalidateQueries({ queryKey: ['electricity-readings'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        queryClient.invalidateQueries({ queryKey: ['batch-dashboard-data'] }); // CRITICAL: Invalidate batch data
        queryClient.invalidateQueries({ queryKey: ['meter-history'] });

        setLastResult(result);
        return result;
      }
      
      setLastResult(null);
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Anomaly detection failed';
      setError(errorMessage);
      console.error('Anomaly detection error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [queryClient]);

  return {
    detectAnomaly,
    isProcessing,
    error,
    lastResult
  };
};

// Enhanced water reading hook with anomaly detection
export const useCreateWaterReadingWithAnomaly = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
  const { detectAnomaly } = useAnomalyDetection();

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
      const result = await api.createMeterReading({
        utility_type: 'water',
        ...data,
      });

      // Run anomaly detection on the created reading
      const anomaly = await detectAnomaly(result.id);
      setAnomalyResult(anomaly);

      return {
        reading: result,
        anomaly
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reading');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    createReading, 
    isLoading, 
    error, 
    anomalyResult 
  };
};

// Enhanced electricity reading hook with anomaly detection
export const useCreateElectricityReadingWithAnomaly = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
  const { detectAnomaly } = useAnomalyDetection();

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
      const result = await api.createMeterReading({
        utility_type: 'electricity',
        ...data,
      });

      // Run anomaly detection on the created reading
      const anomaly = await detectAnomaly(result.id);
      setAnomalyResult(anomaly);

      return {
        reading: result,
        anomaly
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reading');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    createReading, 
    isLoading, 
    error, 
    anomalyResult 
  };
};

// Hook to get model statistics for a user
export const useModelStats = (utilityType: 'water' | 'electricity') => {
  return useQuery({
    queryKey: ['model-stats', utilityType],
    queryFn: () => api.getModelStats(utilityType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
};

// Hook for providing anomaly feedback
export const useAnomalyFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ anomalyId, feedback }: { anomalyId: string; feedback: string }) =>
      api.provideAnomalyFeedback(anomalyId, feedback),
    onSuccess: () => {
      // Invalidate all anomaly-related queries to refresh UI across components
      queryClient.invalidateQueries({ queryKey: ['user-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['water-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['electricity-anomalies'] });

      // Also invalidate reading queries since anomaly state affects display
      queryClient.invalidateQueries({ queryKey: ['latest-water-reading'] });
      queryClient.invalidateQueries({ queryKey: ['latest-electricity-reading'] });
      queryClient.invalidateQueries({ queryKey: ['water-readings'] });
      queryClient.invalidateQueries({ queryKey: ['electricity-readings'] });

      // Fix: Also invalidate UtilityUsageCard query keys
      queryClient.invalidateQueries({ queryKey: ['water-reading'] });
      queryClient.invalidateQueries({ queryKey: ['electricity-reading'] });

      // Invalidate dashboard and meter history queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['meter-history'] });
    }
  });
};

// Hook to get user anomalies for a utility type
export const useUserAnomalies = (
  utilityType: 'water' | 'electricity',
  limit: number = 10,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['user-anomalies', utilityType, limit],
    queryFn: () => api.getUserAnomalies(utilityType, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false, // Support conditional execution
  });
};

// Hook to get clean data for forecasting and charts
export const useCleanDataForCharts = (utilityType: 'water' | 'electricity', days: number = 30) => {
  return useQuery({
    queryKey: ['clean-data', utilityType, days],
    queryFn: () => api.getCleanDataForForecasting(utilityType, days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
  });
};