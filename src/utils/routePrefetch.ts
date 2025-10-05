/**
 * Route prefetching utilities for optimizing navigation
 * Prefetches data before route transitions for smoother UX
 */

import { QueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

/**
 * Prefetch dashboard data before navigation
 */
export const prefetchDashboard = async (queryClient: QueryClient, userId: string) => {
  if (!userId) return;

  // Prefetch batch dashboard data
  await queryClient.prefetchQuery({
    queryKey: ['batch-dashboard-data', userId],
    queryFn: () => api.getBatchDashboardData(userId),
    staleTime: 2 * 60 * 1000,
  });

  // Prefetch rates in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['user-rates', 'water', userId],
      queryFn: () => api.getUserRates('water'),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['user-rates', 'electricity', userId],
      queryFn: () => api.getUserRates('electricity'),
      staleTime: 5 * 60 * 1000,
    }),
  ]);
};

/**
 * Prefetch monitoring data before navigation
 */
export const prefetchMonitoring = async (
  queryClient: QueryClient,
  userId: string,
  utilityType: 'water' | 'electricity'
) => {
  if (!userId) return;

  await queryClient.prefetchQuery({
    queryKey: ['batch-monitoring-data', utilityType, userId],
    queryFn: () => api.getBatchMonitoringData(utilityType, userId),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Prefetch profile data before navigation
 */
export const prefetchProfile = async (queryClient: QueryClient, userId: string) => {
  if (!userId) return;

  await queryClient.prefetchQuery({
    queryKey: ['batch-profile-data', userId],
    queryFn: () => api.getBatchProfileData(userId),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Prefetch common data used across multiple routes
 */
export const prefetchCommon = async (queryClient: QueryClient, userId: string) => {
  if (!userId) return;

  // Prefetch user profile (used in many pages)
  await queryClient.prefetchQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => api.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook-based prefetch on link hover
 * Use this in navigation components to prefetch on hover
 */
export const usePrefetchOnHover = (
  queryClient: QueryClient,
  userId: string | undefined
) => {
  return {
    onDashboardHover: () => {
      if (userId) prefetchDashboard(queryClient, userId);
    },
    onWaterMonitoringHover: () => {
      if (userId) prefetchMonitoring(queryClient, userId, 'water');
    },
    onElectricityMonitoringHover: () => {
      if (userId) prefetchMonitoring(queryClient, userId, 'electricity');
    },
    onProfileHover: () => {
      if (userId) prefetchProfile(queryClient, userId);
    },
  };
};
