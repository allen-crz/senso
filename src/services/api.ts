/**
 * API service for communicating with the Senso backend
 */
import { apiCache, cacheKeys, cacheTTL } from '@/utils/apiCache';
import { requestBatcher } from '@/utils/requestBatcher';

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Debug API URL configuration in development only
if (import.meta.env.DEV) {
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('VITE_API_URL env var:', import.meta.env.VITE_API_URL);
}


// API client with authentication
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `${tokenType} ${token}`;
    }
    
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 2,
    isRetryAfterRefresh: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    if (import.meta.env.DEV) {
      console.log('Making API request to:', url);
      console.log('Request config:', config);
    }

    try {
      const response = await fetch(url, config);

      // If response is ok, continue with normal processing
      if (response.ok) {
        return response.json();
      }

      // If it's a 401 and we haven't already retried after refresh, try refreshing token
      if (response.status === 401 && !isRetryAfterRefresh) {
        console.log('[API] 401 error, attempting token refresh...');

        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            // Import refresh function dynamically to avoid circular dependency
            const { refreshAccessToken } = await import('./auth');
            const refreshResult = await refreshAccessToken();

            if (refreshResult.success) {
              console.log('[API] Token refreshed, retrying request...');
              // Retry the request with new token, mark as retry to prevent infinite loop
              return this.request(endpoint, options, retries, true);
            }
          } catch (refreshError) {
            console.error('[API] Token refresh failed:', refreshError);
          }
        }
      }

      // If it's a server error (5xx) and we have retries left, retry
      if (response.status >= 500 && retries > 0) {
        console.warn(`Server error ${response.status}, retrying in 1 second... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(endpoint, options, retries - 1, isRetryAfterRefresh);
      }

      // Handle all error responses
      await this.handleErrorResponse(response);

    } catch (error) {
      // Handle network errors
      if ((error instanceof TypeError && error.message.includes('fetch')) ||
          (error as any)?.name === 'NetworkError') {

        if (retries > 0) {
          console.warn(`Network error, retrying in 2 seconds... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.request(endpoint, options, retries - 1);
        }

        throw new Error('Network connection failed. Please check your internet connection.');
      }

      // Re-throw other errors
      throw error;
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected request flow');
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorText = '';
    let errorData = null;

    try {
      errorText = await response.text();
      // Try to parse as JSON for structured error messages
      if (errorText) {
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Not JSON, use raw text
        }
      }
    } catch (e) {
      errorText = 'Failed to read error response';
    }

    console.error('API Error Response:', errorText);
    console.error('Response status:', response.status, response.statusText);

    // Handle specific status codes
    if (response.status === 401) {
      console.log('Token expired or invalid, clearing localStorage...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('expires_in');
      localStorage.removeItem('user_data');

      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Authentication expired. Please log in again.');
    }

    // Handle 500 Internal Server Error
    if (response.status === 500) {
      const userFriendlyMessage = errorData?.detail || 'Server error occurred. Please try again.';
      throw new Error(userFriendlyMessage);
    }

    // Handle 400 Bad Request
    if (response.status === 400) {
      const userFriendlyMessage = errorData?.detail || 'Invalid request. Please check your data.';
      throw new Error(userFriendlyMessage);
    }

    // Handle 404 Not Found
    if (response.status === 404) {
      const userFriendlyMessage = errorData?.detail || 'Resource not found.';
      const error = new Error(userFriendlyMessage);
      (error as any).status = 404;
      throw error;
    }

    // Handle 422 Validation Error
    if (response.status === 422) {
      const userFriendlyMessage = errorData?.detail || 'Validation error. Please check your input.';
      throw new Error(userFriendlyMessage);
    }

    // Default error message
    const defaultMessage = errorData?.detail || errorText || 'An unexpected error occurred';
    throw new Error(`API Error (${response.status}): ${defaultMessage}`);
  }

  // Meter Readings API
  async getMeterReadings(params?: {
    utility_type?: 'water' | 'electricity';
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request(`/api/v1/readings/${query ? `?${query}` : ''}`);
  }

  async createMeterReading(data: {
    utility_type: 'water' | 'electricity';
    reading_value: number;
    image_data?: string;
    is_manual?: boolean;
    notes?: string;
    location_data?: any;
  }) {
    const response = await this.request<{
      reading: any;
      anomaly?: any;
    }>('/api/v1/readings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Invalidate caches after creating a reading
    const token = localStorage.getItem('access_token');
    if (token) {
      const tokenId = token.slice(-10);
      // Invalidate latest reading cache
      apiCache.delete(cacheKeys.latestReading(tokenId, data.utility_type));
      // Invalidate anomalies cache - could have new anomalies!
      apiCache.delete(cacheKeys.userAnomalies(tokenId, data.utility_type, 5));
      apiCache.delete(cacheKeys.userAnomalies(tokenId, data.utility_type, 10));
      apiCache.delete(cacheKeys.userAnomalies(tokenId, data.utility_type, 50));
    }

    // Return the response in the expected format for backwards compatibility
    return response.reading;
  }

  async getLatestReading(utility_type: 'water' | 'electricity') {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No authentication token');

    const cacheKey = cacheKeys.latestReading(token.slice(-10), utility_type);
    const cached = apiCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.request(`/api/v1/readings/latest/${utility_type}`);
    apiCache.set(cacheKey, result, cacheTTL.latestReading);
    return result;
  }

  async calculateUsage(
    utility_type: 'water' | 'electricity',
    start_date: string,
    end_date: string
  ) {
    const params = new URLSearchParams({
      start_date,
      end_date
    });
    return this.request(`/api/v1/readings/usage/${utility_type}?${params}`);
  }

  async processImage(image_data: string, utility_type: 'water' | 'electricity') {
    return this.request('/api/v1/readings/process-image', {
      method: 'POST',
      body: JSON.stringify({ image_data, utility_type }),
    });
  }

  // Analytics API - Note: getAnomalies replaced with getUserAnomalies

  // Note: createAnomaly removed - backend handles anomaly creation automatically during detection

  async triggerAnomalyDetection(readingId: string) {
    return this.request(`/api/v1/anomaly-detection/detect`, {
      method: 'POST',
      body: JSON.stringify({ reading_id: readingId }),
    });
  }

  async getCleanDataForForecasting(utilityType: 'water' | 'electricity', days = 30) {
    return this.request(`/api/v1/anomaly-detection/clean-data/${utilityType}?days=${days}`);
  }

  async getConsumptionStatistics(utilityType: 'water' | 'electricity', days = 30) {
    return this.request(`/api/v1/anomaly-detection/consumption-stats/${utilityType}?days=${days}`);
  }

  async getAnomalyDetectionHealth() {
    return this.request('/api/v1/anomaly-detection/health');
  }

  async getAnomalyPerformanceStats() {
    return this.request('/api/v1/anomaly-detection/performance-stats');
  }

  async getModelStats(utilityType: 'water' | 'electricity') {
    return this.request(`/api/v1/anomaly-detection/performance-stats`);
  }

  async getUserAnomalies(utilityType: 'water' | 'electricity', limit: number = 50) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No authentication token');

    const cacheKey = cacheKeys.userAnomalies(token.slice(-10), utilityType, limit);

    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.request(`/api/v1/anomaly-detection/user-anomalies/${utilityType}?limit=${limit}`);
    apiCache.set(cacheKey, result, cacheTTL.userAnomalies);
    return result;
  }

  async provideAnomalyFeedback(anomalyId: string, feedback: string) {
    return this.request(`/api/v1/anomaly-detection/feedback`, {
      method: 'POST',
      body: JSON.stringify({ anomaly_id: anomalyId, feedback }),
    });
  }

  async getConsumptionStats(utilityType: 'water' | 'electricity', days: number = 30) {
    return this.request(`/api/v1/anomaly-detection/consumption-stats/${utilityType}?days=${days}`);
  }

  async createForecast(data: {
    utility_type: 'water' | 'electricity';
    months_ahead: number;
  }) {
    return this.request('/api/v1/analytics/forecasts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getForecasts(params?: {
    utility_type?: 'water' | 'electricity';
    limit?: number;
  }) {
    // Use the correct historical data forecast endpoint
    if (!params?.utility_type) {
      throw new Error('utility_type is required for forecasts');
    }

    // Ensure days is a valid integer between 1 and 365
    let days = params.limit || 30;
    days = Math.max(1, Math.min(365, Math.floor(days))); // Clamp between 1-365 and ensure integer

    return this.request('/api/v1/historical-data/forecast/daily', {
      method: 'POST',
      body: JSON.stringify({ utility_type: params.utility_type, days }),
    });
  }

  async getUsageAnalytics(
    utility_type: 'water' | 'electricity',
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: string,
    end_date: string
  ) {
    const params = new URLSearchParams({
      utility_type,
      period,
      start_date,
      end_date
    });
    return this.request(`/api/v1/analytics/usage?${params}`);
  }

  async getUsageSummary(days = 30) {
    return this.request(`/api/v1/analytics/usage/summary?days=${days}`);
  }

  // Utility Pricing API
  async getUtilityRates(utility_type: 'water' | 'electricity') {
    return this.request(`/api/v1/readings/utility-price/${utility_type}`);
  }

  async getCurrentPricing(utility_type: 'water' | 'electricity') {
    return this.request(`/api/v1/readings/utility-price/${utility_type}`);
  }

  async getUserRates(utility_type: 'water' | 'electricity') {
    return this.request(`/api/v1/utility-rates/user-rates/${utility_type}`);
  }

  // Current Cycle Consumption API
  async getCurrentCycleConsumption(utility_type: 'water' | 'electricity') {
    return this.request(`/api/v1/analytics/current-cycle-consumption/${utility_type}`);
  }

  // Notifications API
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request(`/api/v1/notifications/${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/api/v1/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // User Preferences API
  async getUserPreferences() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No authentication token');

    const cacheKey = cacheKeys.userPreferences(token.slice(-10));
    const cached = apiCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.request('/api/v1/preferences/');
    apiCache.set(cacheKey, result, cacheTTL.userPreferences);
    return result;
  }

  async updateUserPreferences(data: any) {
    const result = await this.request('/api/v1/preferences/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    // Clear preferences cache after update
    const token = localStorage.getItem('access_token');
    if (token) {
      const cacheKey = cacheKeys.userPreferences(token.slice(-10));
      apiCache.delete(cacheKey);
    }

    return result;
  }

  // Utility Pricing API
  async getUtilityPrice(utilityType: 'water' | 'electricity', region?: string) {
    const params = new URLSearchParams();
    if (region) {
      params.append('region', region);
    }
    const query = params.toString();
    return this.request(`/api/v1/readings/utility-price/${utilityType}${query ? `?${query}` : ''}`);
  }

  // Authentication API
  async login(email: string, password: string) {
    return this.request<{ access_token: string; token_type: string; expires_in: number; user: any }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, confirm_password: string) {
    return this.request<{ access_token: string; token_type: string; expires_in: number; user: any }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirm_password }),
    });
  }

  async logout() {
    return this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    const cacheKey = cacheKeys.currentUser(token.slice(-10));

    // Use request deduplication to prevent simultaneous duplicate calls
    return requestBatcher.deduplicate(`getCurrentUser:${cacheKey}`, async () => {
      const cached = apiCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const result = await this.request('/api/v1/auth/me');
      apiCache.set(cacheKey, result, cacheTTL.currentUser);
      return result;
    });
  }

  async refreshToken(refresh_token: string) {
    return this.request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });
  }

  async changePassword(new_password: string) {
    return this.request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    });
  }

  // Profile Management API
  async getProfile() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No authentication token');

    const cacheKey = cacheKeys.userProfile(token.slice(-10)); // Use last 10 chars as user identifier

    // Use request deduplication to prevent simultaneous duplicate calls
    return requestBatcher.deduplicate(`getProfile:${cacheKey}`, async () => {
      const cached = apiCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const result = await this.request('/api/v1/users/profile');
      apiCache.set(cacheKey, result, cacheTTL.userProfile);
      return result;
    });
  }

  async updateProfile(data: {
    full_name?: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
  }) {
    const result = await this.request('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    // Invalidate profile cache after update
    const token = localStorage.getItem('access_token');
    if (token) {
      const cacheKey = cacheKeys.userProfile(token.slice(-10));
      apiCache.delete(cacheKey);
    }

    return result;
  }

  async updateAvatar(avatar_data: string) {
    const result = await this.request('/api/v1/users/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar_data }),
    });

    // Invalidate profile cache after avatar update
    const token = localStorage.getItem('access_token');
    if (token) {
      const cacheKey = cacheKeys.userProfile(token.slice(-10));
      apiCache.delete(cacheKey);
    }

    return result;
  }

  // Geocoding API
  async reverseGeocode(lat: number, lon: number) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString()
    });
    return this.request(`/api/v1/geocoding/reverse?${params}`);
  }

  // Historical Data & Forecasting API
  async submitHistoricalData(data: {
    water_data?: Array<{ month: string; consumption: number }>;
    electricity_data?: Array<{ month: string; consumption: number }>;
    providers: {
      electricity?: { id: string; name: string };
      water?: { id: string; name: string };
    };
    billing_info?: {
      water?: { billing_date?: number; last_bill_reading?: number; last_bill_date?: string };
      electricity?: { billing_date?: number; last_bill_reading?: number; last_bill_date?: string };
    };
  }) {
    return this.request('/api/v1/historical-data/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMonthlyForecast(utility_type: 'water' | 'electricity', monthly_consumption?: number) {
    const payload: any = {
      utility_type
    };
    if (monthly_consumption !== undefined) {
      payload.estimated_monthly_consumption = monthly_consumption;
    }

    return this.request('/api/v1/cost-forecasting/monthly-forecast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProgressiveDailyCost(
    utility_type: 'water' | 'electricity',
    daily_consumption: number,
    target_date?: string
  ) {
    return this.request('/api/v1/historical-data/forecast/progressive-daily-cost', {
      method: 'POST',
      body: JSON.stringify({
        utility_type,
        daily_consumption,
        target_date
      }),
    });
  }

  // ===== Batch & Parallel Request Methods =====

  /**
   * Fetch data for both utilities in parallel
   * Optimizes dashboard loading by fetching all data at once
   */
  async getBatchDashboardData(userId: string) {
    const dedupeKey = `dashboard_${userId}`;

    return requestBatcher.deduplicate(dedupeKey, async () => {
      const [
        waterReading,
        electricityReading,
        waterAnomalies,
        electricityAnomalies,
        preferences
      ] = await Promise.allSettled([
        this.getLatestReading('water').catch(() => null),
        this.getLatestReading('electricity').catch(() => null),
        this.getUserAnomalies('water', 5).catch(() => []),
        this.getUserAnomalies('electricity', 5).catch(() => []),
        this.getUserPreferences().catch(() => null)
      ]);

      return {
        water: {
          reading: waterReading.status === 'fulfilled' ? waterReading.value : null,
          anomalies: waterAnomalies.status === 'fulfilled' ? waterAnomalies.value : []
        },
        electricity: {
          reading: electricityReading.status === 'fulfilled' ? electricityReading.value : null,
          anomalies: electricityAnomalies.status === 'fulfilled' ? electricityAnomalies.value : []
        },
        preferences: preferences.status === 'fulfilled' ? preferences.value : null
      };
    });
  }

  /**
   * Fetch all monitoring data for a utility in parallel
   */
  async getBatchMonitoringData(utilityType: 'water' | 'electricity', userId: string) {
    const dedupeKey = `monitoring_${utilityType}_${userId}`;

    return requestBatcher.deduplicate(dedupeKey, async () => {
      const [
        latestReading,
        readings,
        anomalies,
        analytics,
        forecast
      ] = await Promise.allSettled([
        this.getLatestReading(utilityType).catch(() => null),
        this.getMeterReadings({ utility_type: utilityType, limit: 30 }).catch(() => []),
        this.getUserAnomalies(utilityType, 10).catch(() => []),
        this.getUsageAnalytics(
          utilityType,
          'monthly',
          new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 150 days (within 180-day limit)
          new Date().toISOString()
        ).catch(() => null),
        this.getMonthlyForecast(utilityType).catch(() => null)
      ]);

      return {
        latestReading: latestReading.status === 'fulfilled' ? latestReading.value : null,
        readings: readings.status === 'fulfilled' ? readings.value : [],
        anomalies: anomalies.status === 'fulfilled' ? anomalies.value : [],
        analytics: analytics.status === 'fulfilled' ? analytics.value : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value : null
      };
    });
  }

  /**
   * Fetch user profile data in parallel
   */
  async getBatchProfileData(userId: string) {
    const dedupeKey = `profile_${userId}`;

    return requestBatcher.deduplicate(dedupeKey, async () => {
      const [
        profile,
        preferences,
        notifications
      ] = await Promise.allSettled([
        this.getProfile().catch(() => null),
        this.getUserPreferences().catch(() => null),
        this.getNotifications(10, false).catch(() => [])
      ]);

      return {
        profile: profile.status === 'fulfilled' ? profile.value : null,
        preferences: preferences.status === 'fulfilled' ? preferences.value : null,
        notifications: notifications.status === 'fulfilled' ? notifications.value : []
      };
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual API functions for easier use
export const api = {
  // Meter readings
  getMeterReadings: apiClient.getMeterReadings.bind(apiClient),
  createMeterReading: apiClient.createMeterReading.bind(apiClient),
  getLatestReading: apiClient.getLatestReading.bind(apiClient),
  calculateUsage: apiClient.calculateUsage.bind(apiClient),
  processImage: apiClient.processImage.bind(apiClient),
  
  // Analytics - Note: getAnomalies/createAnomaly removed, use getUserAnomalies/triggerAnomalyDetection instead
  triggerAnomalyDetection: apiClient.triggerAnomalyDetection.bind(apiClient),
  getModelStats: apiClient.getModelStats.bind(apiClient),
  createForecast: apiClient.createForecast.bind(apiClient),
  getForecasts: apiClient.getForecasts.bind(apiClient),
  getUsageAnalytics: apiClient.getUsageAnalytics.bind(apiClient),
  getUsageSummary: apiClient.getUsageSummary.bind(apiClient),
  
  // Enhanced Anomaly Detection
  getUserAnomalies: apiClient.getUserAnomalies.bind(apiClient),
  provideAnomalyFeedback: apiClient.provideAnomalyFeedback.bind(apiClient),
  getConsumptionStats: apiClient.getConsumptionStats.bind(apiClient),
  getCleanDataForForecasting: apiClient.getCleanDataForForecasting.bind(apiClient),
  getAnomalyDetectionHealth: apiClient.getAnomalyDetectionHealth.bind(apiClient),
  getAnomalyPerformanceStats: apiClient.getAnomalyPerformanceStats.bind(apiClient),
  
  // Utility Pricing
  getUtilityRates: apiClient.getUtilityRates.bind(apiClient),
  getCurrentPricing: apiClient.getCurrentPricing.bind(apiClient),
  getUserRates: apiClient.getUserRates.bind(apiClient),

  // Current Cycle Consumption
  getCurrentCycleConsumption: apiClient.getCurrentCycleConsumption.bind(apiClient),

  // Notifications
  getNotifications: apiClient.getNotifications.bind(apiClient),
  markNotificationRead: apiClient.markNotificationRead.bind(apiClient),
  markAllNotificationsRead: apiClient.markAllNotificationsRead.bind(apiClient),
  
  // Preferences
  getUserPreferences: apiClient.getUserPreferences.bind(apiClient),
  updateUserPreferences: apiClient.updateUserPreferences.bind(apiClient),
  
  // Utility Pricing
  getUtilityPrice: apiClient.getUtilityPrice.bind(apiClient),
  
  // Authentication
  login: apiClient.login.bind(apiClient),
  register: apiClient.register.bind(apiClient),
  logout: apiClient.logout.bind(apiClient),
  getCurrentUser: apiClient.getCurrentUser.bind(apiClient),
  refreshToken: apiClient.refreshToken.bind(apiClient),
  changePassword: apiClient.changePassword.bind(apiClient),
  
  // Profile Management
  getProfile: apiClient.getProfile.bind(apiClient),
  updateProfile: apiClient.updateProfile.bind(apiClient),
  updateAvatar: apiClient.updateAvatar.bind(apiClient),
  
  // Geocoding
  reverseGeocode: apiClient.reverseGeocode.bind(apiClient),

  // Historical Data & Forecasting
  submitHistoricalData: apiClient.submitHistoricalData.bind(apiClient),
  getMonthlyForecast: apiClient.getMonthlyForecast.bind(apiClient),
  getProgressiveDailyCost: apiClient.getProgressiveDailyCost.bind(apiClient),

  // Generic request method for custom API calls
  request: apiClient.request.bind(apiClient),

  // Batch & Parallel Request Methods
  getBatchDashboardData: apiClient.getBatchDashboardData.bind(apiClient),
  getBatchMonitoringData: apiClient.getBatchMonitoringData.bind(apiClient),
  getBatchProfileData: apiClient.getBatchProfileData.bind(apiClient),
};