/**
 * Coordinated cache invalidation across all cache layers
 * Manages Service Worker cache, API cache, and React Query cache
 */

import { apiCache, cacheKeys } from './apiCache';

/**
 * Invalidate all caches for a specific utility type and user
 * Use after data mutations (new readings, preference changes, etc.)
 */
export const invalidateAllCaches = async (
  utilityType: 'water' | 'electricity' | 'both',
  userId: string,
  queryClient?: any
) => {
  console.log(`[Cache Invalidation] Starting for ${utilityType}, user ${userId}`);

  // 1. Invalidate React Query cache if queryClient is provided
  if (queryClient) {
    const queriesToInvalidate: string[][] = [];

    if (utilityType === 'water' || utilityType === 'both') {
      queriesToInvalidate.push(
        ['water-readings', userId],
        ['water-latest', userId],
        ['water-analytics', userId],
        ['water-anomalies', userId],
        ['water-forecasts', userId]
      );
    }

    if (utilityType === 'electricity' || utilityType === 'both') {
      queriesToInvalidate.push(
        ['electricity-readings', userId],
        ['electricity-latest', userId],
        ['electricity-analytics', userId],
        ['electricity-anomalies', userId],
        ['electricity-forecasts', userId]
      );
    }

    // Invalidate all relevant queries
    for (const queryKey of queriesToInvalidate) {
      await queryClient.invalidateQueries({ queryKey });
    }

    console.log(`[Cache Invalidation] React Query invalidated: ${queriesToInvalidate.length} query types`);
  }

  // 2. Invalidate API Cache
  invalidateApiCache(utilityType, userId);

  // 3. Invalidate Service Worker cache
  await invalidateServiceWorkerCache(utilityType, userId);

  console.log(`[Cache Invalidation] Completed for ${utilityType}`);
};

/**
 * Invalidate API cache entries for a utility type
 */
export const invalidateApiCache = (
  utilityType: 'water' | 'electricity' | 'both',
  userId: string
) => {
  const keysToDelete: string[] = [];

  if (utilityType === 'water' || utilityType === 'both') {
    keysToDelete.push(
      cacheKeys.latestReading(userId, 'water'),
      cacheKeys.userAnomalies(userId, 'water'),
      cacheKeys.forecasts(userId, 'water')
    );
  }

  if (utilityType === 'electricity' || utilityType === 'both') {
    keysToDelete.push(
      cacheKeys.latestReading(userId, 'electricity'),
      cacheKeys.userAnomalies(userId, 'electricity'),
      cacheKeys.forecasts(userId, 'electricity')
    );
  }

  // Delete each cache key
  keysToDelete.forEach(key => apiCache.delete(key));

  console.log(`[Cache Invalidation] API cache cleared: ${keysToDelete.length} keys`);
};

/**
 * Send message to Service Worker to invalidate cached API responses
 */
export const invalidateServiceWorkerCache = async (
  utilityType: 'water' | 'electricity' | 'both',
  userId: string
): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.log('[Cache Invalidation] Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (registration.active) {
      // Send message to service worker
      registration.active.postMessage({
        type: 'INVALIDATE_CACHE',
        utilityType,
        userId,
        timestamp: Date.now()
      });

      console.log('[Cache Invalidation] Service Worker message sent');
    }
  } catch (error) {
    console.warn('[Cache Invalidation] Failed to invalidate Service Worker cache:', error);
  }
};

/**
 * Invalidate user profile and preferences caches
 */
export const invalidateUserCache = async (userId: string, queryClient?: any) => {
  console.log(`[Cache Invalidation] Starting user cache invalidation for ${userId}`);

  // Invalidate React Query
  if (queryClient) {
    await queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    await queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
  }

  // Invalidate API Cache
  apiCache.delete(cacheKeys.currentUser(userId));
  apiCache.delete(cacheKeys.userProfile(userId));
  apiCache.delete(cacheKeys.userPreferences(userId));

  // Invalidate Service Worker cache for user data
  await invalidateServiceWorkerCache('both', userId);

  console.log('[Cache Invalidation] User cache invalidated');
};

/**
 * Invalidate notification caches
 */
export const invalidateNotificationCache = async (userId: string, queryClient?: any) => {
  console.log(`[Cache Invalidation] Starting notification cache invalidation`);

  // Invalidate React Query
  if (queryClient) {
    await queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
  }

  // Invalidate API Cache
  apiCache.delete(cacheKeys.notifications(userId));

  console.log('[Cache Invalidation] Notification cache invalidated');
};

/**
 * Clear all caches (use for logout or critical errors)
 */
export const clearAllCaches = async (queryClient?: any): Promise<void> => {
  console.log('[Cache Invalidation] Clearing ALL caches');

  // Clear React Query cache
  if (queryClient) {
    queryClient.clear();
  }

  // Clear API cache
  apiCache.clear();

  // Clear Service Worker caches
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CLEAR_ALL_CACHES',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('[Cache Invalidation] Failed to clear Service Worker caches:', error);
    }
  }

  console.log('[Cache Invalidation] All caches cleared');
};

/**
 * Specific invalidation functions for common scenarios
 */

// After submitting a new meter reading
export const invalidateAfterMeterReading = async (
  utilityType: 'water' | 'electricity',
  userId: string,
  queryClient?: any
) => {
  await invalidateAllCaches(utilityType, userId, queryClient);
};

// After updating user preferences
export const invalidateAfterPreferencesUpdate = async (
  userId: string,
  queryClient?: any
) => {
  await invalidateUserCache(userId, queryClient);
  // Also invalidate readings as preferences affect display
  await invalidateAllCaches('both', userId, queryClient);
};

// After updating provider settings
export const invalidateAfterProviderUpdate = async (
  userId: string,
  queryClient?: any
) => {
  await invalidateUserCache(userId, queryClient);
  await invalidateAllCaches('both', userId, queryClient);
};
