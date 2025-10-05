/**
 * Simple API response caching utility to reduce redundant requests
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60000; // 1 minute default TTL

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const apiCache = new ApiCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Cache key generators for common API endpoints
 */
export const cacheKeys = {
  currentUser: (userId: string) => `current_user_${userId}`,
  userProfile: (userId: string) => `user_profile_${userId}`,
  userPreferences: (userId: string) => `user_preferences_${userId}`,
  latestReading: (userId: string, utilityType: string) => `latest_reading_${userId}_${utilityType}`,
  userAnomalies: (userId: string, utilityType?: string, limit?: number) =>
    `user_anomalies_${userId}_${utilityType || 'all'}_${limit || 50}`,
  notifications: (userId: string, limit?: number, unreadOnly?: boolean) =>
    `notifications_${userId}_${limit || 50}_${unreadOnly || false}`,
  utilityPrice: (utilityType: string, region?: string) =>
    `utility_price_${utilityType}_${region || 'default'}`,
  forecasts: (userId: string, utilityType: string) =>
    `forecasts_${userId}_${utilityType}`,
  usageAnalytics: (userId: string, utilityType: string, period: string, startDate: string, endDate: string) =>
    `usage_analytics_${userId}_${utilityType}_${period}_${startDate}_${endDate}`
};

/**
 * TTL configurations for different data types (in milliseconds)
 */
export const cacheTTL = {
  currentUser: 30 * 60 * 1000,      // 30 minutes (reduced from 5 min to avoid frequent auth checks)
  userProfile: 30 * 60 * 1000,      // 30 minutes
  userPreferences: 60 * 60 * 1000,  // 1 hour
  latestReading: 30 * 1000,         // 30 seconds
  userAnomalies: 2 * 60 * 1000,     // 2 minutes
  notifications: 60 * 1000,         // 1 minute
  utilityPrice: 60 * 60 * 1000,     // 1 hour
  forecasts: 5 * 60 * 1000,         // 5 minutes
  usageAnalytics: 10 * 60 * 1000    // 10 minutes
};