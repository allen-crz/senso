import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface UserRate {
  id: string;
  provider_id: string;
  rate_type: string;
  effective_date: string;
  end_date?: string;
  rate_value: number;
  rate_unit: string;
  tier_min?: number;
  tier_max?: number;
  month_applicable: string;
  description?: string;
}

interface UserRatesResponse {
  provider: {
    id: string;
    name: string;
    utility_type: string;
    region: string;
  };
  rates: UserRate[];
  last_updated: string;
}

const getUserRates = async (utilityType: 'water' | 'electricity'): Promise<UserRatesResponse | null> => {
  try {
    return await api.getUserRates(utilityType);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific case where no rate configuration is found
    if (errorMessage.includes('No rate configuration found') ||
        errorMessage.includes('Please associate with a provider first')) {
      console.info(`No rate configuration found for ${utilityType}. User needs to set up provider first.`);
      return null;
    }

    // Log other errors as warnings
    console.warn(`Failed to fetch user rates for ${utilityType}:`, error);
    return null;
  }
};

export const useUserRates = (utilityType: 'water' | 'electricity') => {
  const query = useQuery({
    queryKey: ['user-rates-v2', utilityType], // Changed key to force cache refresh
    queryFn: () => getUserRates(utilityType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });


  return query;
};

// Helper hook to get specific rate values for capture components
export const useUserRateValue = (
  utilityType: 'water' | 'electricity',
  rateType: string,
  tierMin?: number,
  tierMax?: number
) => {
  const { data: userRates, isLoading, error } = useUserRates(utilityType);

  const rate = React.useMemo(() => {
    if (!userRates?.rates) {
      return null;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en', { month: 'long' }).toLowerCase();
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonth = previousDate.toLocaleString('en', { month: 'long' }).toLowerCase();

    // First try current month
    let rate = userRates.rates.find(rate => {
      const matchesType = rate.rate_type === rateType;

      // More flexible month matching
      const monthApplicable = rate.month_applicable?.toLowerCase();
      const matchesMonth = !monthApplicable ||
                          monthApplicable === 'all' ||
                          monthApplicable === currentMonth ||
                          monthApplicable === currentMonth.substring(0, 3) || // Jan, Feb, etc.
                          monthApplicable.includes(currentMonth) ||
                          currentMonth.includes(monthApplicable);

      const matchesTier = tierMin === undefined ||
                         (rate.tier_min !== undefined && rate.tier_max !== undefined &&
                          tierMin >= rate.tier_min && (tierMax === undefined || tierMax <= rate.tier_max));

      return matchesType && matchesMonth && matchesTier;
    });

    // Fallback to previous month if current month not found
    if (!rate) {
      rate = userRates.rates.find(rate => {
        const matchesType = rate.rate_type === rateType;

        // More flexible month matching for previous month
        const monthApplicable = rate.month_applicable?.toLowerCase();
        const matchesMonth = !monthApplicable ||
                            monthApplicable === 'all' ||
                            monthApplicable === previousMonth ||
                            monthApplicable === previousMonth.substring(0, 3) || // Jan, Feb, etc.
                            monthApplicable.includes(previousMonth) ||
                            previousMonth.includes(monthApplicable);

        const matchesTier = tierMin === undefined ||
                           (rate.tier_min !== undefined && rate.tier_max !== undefined &&
                            tierMin >= rate.tier_min && (tierMax === undefined || tierMax <= rate.tier_max));

        return matchesType && matchesMonth && matchesTier;
      });
    }

    return rate;
  }, [userRates, rateType, tierMin, tierMax]);

  return {
    rateValue: rate?.rate_value,
    rateUnit: rate?.rate_unit,
    provider: userRates?.provider,
    isLoading,
    error,
    hasData: !!rate
  };
};

// Specific hooks for capture components
export const useElectricityGenerationCharge = () => {
  return useUserRateValue('electricity', 'generation_charge');
};

export const useWaterBasicCharge = () => {
  return useUserRateValue('water', 'basic_charge', 0, 10);
};