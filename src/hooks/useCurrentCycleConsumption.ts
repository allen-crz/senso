import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface BillingCycle {
  start_date: string;
  end_date: string;
  elapsed_days: number;
  remaining_days: number;
  total_days: number;
}

interface CurrentCycleConsumption {
  utility_type: string;
  has_baseline: boolean;
  cycle_consumption: number;
  baseline_reading: number;
  latest_reading: number;
  baseline_date: string;
  latest_reading_date: string;
  billing_cycle: BillingCycle;
  daily_average: number;
  message?: string;
}

export const useCurrentCycleConsumption = (utilityType: 'water' | 'electricity') => {
  return useQuery<CurrentCycleConsumption>({
    queryKey: ['current-cycle-consumption', utilityType],
    queryFn: async () => {
      const response = await api.getCurrentCycleConsumption(utilityType);
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useBothCycleConsumption = () => {
  const water = useCurrentCycleConsumption('water');
  const electricity = useCurrentCycleConsumption('electricity');

  return {
    water: water.data,
    electricity: electricity.data,
    waterLoading: water.isLoading,
    electricityLoading: electricity.isLoading,
    waterError: water.error,
    electricityError: electricity.error,
  };
};
