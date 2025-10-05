/**
 * Hook for fetching dashboard data with parallel requests
 * Replaces multiple sequential API calls with a single optimized batch request
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from './useAuth';

export const useBatchDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['batch-dashboard-data', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return api.getBatchDashboardData(user.id);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useBatchMonitoringData = (utilityType: 'water' | 'electricity') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['batch-monitoring-data', utilityType, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return api.getBatchMonitoringData(utilityType, user.id);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useBatchProfileData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['batch-profile-data', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return api.getBatchProfileData(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
