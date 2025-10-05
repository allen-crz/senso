import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface CostPredictionRequest {
  utility_type: 'water' | 'electricity';
  daily_consumption: number;
  target_date?: string;
  cumulative_month_consumption?: number;
}

export interface MonthlyForecastRequest {
  utility_type: 'water' | 'electricity';
  estimated_monthly_consumption?: number;
}

export interface CostPredictionResponse {
  predicted_daily_cost: number;
  confidence_score: number;
  feature_values: Record<string, any>;
  feature_importance: Record<string, number>;
  predictor_strength: Record<string, number>;
  performance_metrics: Record<string, any>;
  prediction_date: string;
  trained_at: string;
}

export interface MonthlyForecastResponse {
  user_id: string;
  utility_type: string;
  billing_month: string;
  predicted_monthly_cost: number;
  predicted_monthly_consumption: number;
  confidence_score: number;
  billing_cycle_days: number;
  elapsed_days: number;
  remaining_days: number;
  forecast_info: Record<string, any>;
  generated_at: string;
}

export interface ModelInfoResponse {
  user_id: string;
  utility_type: string;
  features: string[];
  feature_importance: Record<string, number>;
  predictor_strength: Record<string, number>;
  performance_metrics: Record<string, any>;
  user_daily_average: number;
  trained_at: string;
  algorithm_type: string;
  total_features: number;
}

export interface ForecastComparison {
  billing_month: string;
  predicted_cost: number;
  actual_cost: number;
  predicted_usage: number;
  actual_usage: number;
  accuracy_percent: number;
  variance: number;
  variance_type: 'over' | 'under' | 'exact';
  model_version: string;
}

export interface ForecastAccuracy {
  average_accuracy: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  total_forecasts: number;
  best_forecast?: {
    month: string;
    accuracy: number;
  };
  worst_forecast?: {
    month: string;
    accuracy: number;
  };
}

/**
 * Hook to predict daily cost for a specific consumption amount
 */
export const useCostPrediction = (request: CostPredictionRequest | null) => {
  return useQuery({
    queryKey: ['cost-prediction', request],
    queryFn: async (): Promise<CostPredictionResponse> => {
      if (!request) throw new Error('Request data required');

      return api.request('/api/v1/cost-forecasting/predict-daily-cost', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    },
    enabled: !!request,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};

/**
 * Hook to get monthly forecast for current billing cycle
 */
export const useMonthlyForecast = (
  utilityType: 'water' | 'electricity',
  estimatedMonthlyConsumption?: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['monthly-forecast', utilityType, estimatedMonthlyConsumption],
    queryFn: async (): Promise<MonthlyForecastResponse> => {
      return api.request('/api/v1/cost-forecasting/monthly-forecast', {
        method: 'POST',
        body: JSON.stringify({
          utility_type: utilityType,
          estimated_monthly_consumption: estimatedMonthlyConsumption
        })
      });
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });
};

/**
 * Hook to get model information for a utility type
 */
export const useModelInfo = (utilityType: 'water' | 'electricity') => {
  return useQuery({
    queryKey: ['model-info', utilityType],
    queryFn: async (): Promise<ModelInfoResponse> => {
      try {
        return await api.request(`/api/v1/cost-forecasting/model-info/${utilityType}`);
      } catch (error: any) {
        if (error.status === 404) {
          throw new Error('No trained model found');
        }
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });
};


/**
 * Hook to manually trigger model training
 */
export const useTrainModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utilityType: 'water' | 'electricity') => {
      return api.request(`/api/v1/cost-forecasting/train-model/${utilityType}`, {
        method: 'POST'
      });
    },
    onSuccess: (data, utilityType) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['model-info', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['monthly-forecast', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['cost-prediction'] });
    }
  });
};

/**
 * Hook to get forecast vs actual comparison
 */
export const useForecastComparison = (
  utilityType: 'water' | 'electricity',
  limit: number = 6
) => {
  return useQuery({
    queryKey: ['forecast-comparison', utilityType, limit],
    queryFn: async () => {
      return api.request(`/api/v1/cost-forecasting/forecast-comparison/${utilityType}?limit=${limit}`);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });
};

/**
 * Hook to get forecast accuracy trend
 */
export const useForecastAccuracy = (utilityType: 'water' | 'electricity') => {
  return useQuery({
    queryKey: ['forecast-accuracy', utilityType],
    queryFn: async (): Promise<ForecastAccuracy> => {
      return api.request(`/api/v1/cost-forecasting/forecast-accuracy/${utilityType}`);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });
};


/**
 * Hook for getting quick cost prediction for current daily consumption
 */
export const useQuickCostPrediction = (
  utilityType: 'water' | 'electricity',
  dailyConsumption: number | null
) => {
  const request = dailyConsumption ? {
    utility_type: utilityType,
    daily_consumption: dailyConsumption
  } : null;

  return useCostPrediction(request);
};

/**
 * Hook to trigger demo forecast reset (bypasses billing date check)
 */
export const useDemoForecastReset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utilityType: 'water' | 'electricity') => {
      return api.request(`/api/v1/cost-forecasting/demo/trigger-forecast-reset/${utilityType}`, {
        method: 'POST'
      });
    },
    onSuccess: (data, utilityType) => {
      // Invalidate all forecast-related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['monthly-forecast', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['forecast-comparison', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['forecast-accuracy', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['model-info', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['current-cycle-consumption', utilityType] });
      queryClient.invalidateQueries({ queryKey: ['water-data'] });
      queryClient.invalidateQueries({ queryKey: ['electricity-data'] });

      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['monthly-forecast', utilityType] });
        queryClient.refetchQueries({ queryKey: ['forecast-comparison', utilityType] });
        queryClient.refetchQueries({ queryKey: ['current-cycle-consumption', utilityType] });
      }, 500);
    }
  });
};

/**
 * Hook to trigger admin daily billing check (all users)
 */
export const useAdminDailyBillingCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return api.request('/api/v1/cost-forecasting/admin/trigger-daily-billing-check', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      // Invalidate all queries to refresh everything
      queryClient.invalidateQueries({ queryKey: ['monthly-forecast'] });
      queryClient.invalidateQueries({ queryKey: ['forecast-comparison'] });
      queryClient.invalidateQueries({ queryKey: ['forecast-accuracy'] });
      queryClient.invalidateQueries({ queryKey: ['current-cycle-consumption'] });
      queryClient.invalidateQueries({ queryKey: ['water-data'] });
      queryClient.invalidateQueries({ queryKey: ['electricity-data'] });
      queryClient.invalidateQueries({ queryKey: ['model-info'] });

      // Force immediate refetch after short delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['monthly-forecast'] });
        queryClient.refetchQueries({ queryKey: ['forecast-comparison'] });
        queryClient.refetchQueries({ queryKey: ['current-cycle-consumption'] });
      }, 500);
    }
  });
};
