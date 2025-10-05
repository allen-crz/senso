import { apiClient } from '@/services/api';
import type { Database } from '@/integrations/supabase/types';

// Type aliases for cleaner code
type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export type MeterReading = Tables['meter_readings']['Row'];
export type MeterReadingInsert = Tables['meter_readings']['Insert'];
export type MeterReadingUpdate = Tables['meter_readings']['Update'];

export type AnomalyDetection = Tables['anomaly_detections']['Row'];
export type CostForecast = Tables['cost_forecasts']['Row'];
export type UserPreferences = Tables['user_preferences']['Row'];
export type Notification = Tables['notifications']['Row'];
export type UtilityPrice = Tables['utility_prices']['Row'];

export type UtilityType = Enums['utility_type'];
export type ReadingStatus = Enums['reading_status'];
export type AnomalySeverity = Enums['anomaly_severity'];

/**
 * Meter Reading Operations - MIGRATED TO FASTAPI
 */
class MeterReadingService {
  static async create(reading: MeterReadingInsert): Promise<MeterReading> {
    try {
      const response = await apiClient.createMeterReading({
        utility_type: reading.utility_type,
        reading_value: reading.reading_value,
        image_data: reading.image_url ?? undefined,
        is_manual: reading.is_manual,
        notes: reading.notes,
        location_data: reading.location_data,
      });
      return response as MeterReading;
    } catch (error: any) {
      throw new Error(`Failed to create meter reading: ${error.message}`);
    }
  }

  static async getLatest(utilityType: UtilityType): Promise<MeterReading | null> {
    try {
      const response = await apiClient.getLatestReading(utilityType);
      return response as MeterReading | null;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw new Error(`Failed to get latest reading: ${error.message}`);
    }
  }

  static async getByDateRange(
    utilityType: UtilityType,
    startDate: string,
    endDate: string
  ): Promise<MeterReading[]> {
    try {
      const response = await apiClient.getMeterReadings({
        utility_type: utilityType,
        start_date: startDate,
        end_date: endDate
      });
      return response as MeterReading[];
    } catch (error: any) {
      throw new Error(`Failed to get readings: ${error.message}`);
    }
  }

  static async getPending(limit: number = 100): Promise<MeterReading[]> {
    try {
      const response = await apiClient.getMeterReadings({ limit });
      return response as MeterReading[];
    } catch (error: any) {
      throw new Error(`Failed to get pending readings: ${error.message}`);
    }
  }

  static async updateProcessingStatus(
    id: string,
    status: ReadingStatus,
    confidenceScore?: number,
    rawOcrData?: Record<string, unknown>
  ): Promise<void> {
    try {
      const updateData = {
        processing_status: status,
        confidence_score: confidenceScore,
        raw_ocr_data: rawOcrData,
      };
      await apiClient.request(`/api/v1/readings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error: any) {
      throw new Error(`Failed to update reading: ${error.message}`);
    }
  }

  static async calculateUsage(
    utilityType: UtilityType,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const response = await apiClient.calculateUsage(utilityType, startDate, endDate);
      return (response as { usage?: number })?.usage || 0;
    } catch (error: any) {
      throw new Error(`Failed to calculate usage: ${error.message}`);
    }
  }
}

/**
 * Anomaly Detection Operations - MIGRATED TO FASTAPI
 */
class AnomalyService {
  // Note: Anomaly creation is handled automatically by the backend when readings are processed
  static async create(anomaly: Tables['anomaly_detections']['Insert']): Promise<AnomalyDetection> {
    throw new Error('Anomaly creation is handled automatically by the backend. Use triggerAnomalyDetection instead.');
  }

  static async getRecent(
    utilityType?: UtilityType,
    limit: number = 10
  ): Promise<AnomalyDetection[]> {
    try {
      const response = await apiClient.getUserAnomalies(utilityType, limit);
      return response as AnomalyDetection[];
    } catch (error: any) {
      throw new Error(`Failed to get anomalies: ${error.message}`);
    }
  }

  static async getPendingNotifications(): Promise<AnomalyDetection[]> {
    try {
      // Get recent anomalies that haven't been sent notifications
      const response = await apiClient.getUserAnomalies(undefined, 50);
      // Filter for those without notification_sent (would need backend support for this filter)
      return response as AnomalyDetection[];
    } catch (error: any) {
      throw new Error(`Failed to get pending notifications: ${error.message}`);
    }
  }

  static async markNotificationSent(id: string): Promise<void> {
    // Note: This functionality would need to be implemented in the backend anomaly-detection API
    // For now, this is a placeholder that doesn't break the application
    console.warn('markNotificationSent not implemented in backend anomaly-detection API');
  }

  static async submitFeedback(
    id: string,
    feedback: 'true_positive' | 'false_positive' | 'unsure'
  ): Promise<void> {
    try {
      // Map feedback types to match backend expectations
      const mappedFeedback = feedback === 'true_positive' ? 'correct' : feedback;
      await apiClient.provideAnomalyFeedback(id, mappedFeedback);
    } catch (error: any) {
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }
}

/**
 * Cost Forecasting Operations - MIGRATED TO FASTAPI
 */
class ForecastService {
  static async create(forecast: Tables['cost_forecasts']['Insert']): Promise<CostForecast> {
    try {
      const response = await apiClient.createForecast({
        utility_type: forecast.utility_type,
        months_ahead: 1, // Default to 1 month ahead
      });
      return response as CostForecast;
    } catch (error: any) {
      throw new Error(`Failed to create forecast: ${error.message}`);
    }
  }

  static async getLatest(
    utilityType: UtilityType
  ): Promise<CostForecast | null> {
    try {
      const response = await apiClient.getForecasts({
        utility_type: utilityType,
        limit: 1,
      });
      const forecasts = response as CostForecast[];
      return forecasts.length > 0 ? forecasts[0] : null;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw new Error(`Failed to get latest forecast: ${error.message}`);
    }
  }

  static async getByDateRange(
    utilityType: UtilityType
  ): Promise<CostForecast[]> {
    try {
      const response = await apiClient.getForecasts({
        utility_type: utilityType,
      });
      return response as CostForecast[];
    } catch (error: any) {
      throw new Error(`Failed to get forecasts: ${error.message}`);
    }
  }

  static async updateActuals(
    id: string,
    actualUsage: number,
    actualCost: number
  ): Promise<void> {
    // Note: Forecasting functionality would need to be implemented in the backend
    // For now, this is a placeholder that doesn't break the application
    console.warn('updateActuals not implemented - forecasting API endpoints not available');
    throw new Error('Forecasting functionality not yet implemented in backend');
  }
}

/**
 * User Preferences Operations - MIGRATED TO FASTAPI
 */
class PreferencesService {
  static async get(): Promise<UserPreferences | null> {
    try {
      const response = await apiClient.getUserPreferences();
      return response as UserPreferences;
    } catch (error: any) {
      // Handle 404 errors by returning null (preferences don't exist yet)
      if (error.status === 404 ||
          error.message?.includes('404') ||
          error.message?.includes('not found') ||
          error.message?.includes('Not Found') ||
          error.message?.includes('Resource not found')) {
        return null;
      }
      // For other errors, re-throw with context
      throw new Error(`Failed to get preferences: ${error.message}`);
    }
  }

  static async update(
    preferences: Tables['user_preferences']['Update']
  ): Promise<UserPreferences> {
    try {
      const response = await apiClient.updateUserPreferences(preferences);
      return response as UserPreferences;
    } catch (error: any) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  static async createDefault(): Promise<UserPreferences> {
    try {
      const response = await apiClient.updateUserPreferences({});
      return response as UserPreferences;
    } catch (error: any) {
      throw new Error(`Failed to create preferences: ${error.message}`);
    }
  }
}

/**
 * Utility Pricing Operations - MIGRATED TO FASTAPI
 */
class PricingService {
  static async getCurrentPrice(
    utilityType: UtilityType,
    region: string = 'default'
  ): Promise<UtilityPrice | null> {
    try {
      const response = await apiClient.getUtilityPrice(utilityType, region);
      return response as UtilityPrice;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw new Error(`Failed to get current price: ${error.message}`);
    }
  }

  static async getPriceHistory(
    utilityType: UtilityType,
    region: string = 'default',
    months: number = 12
  ): Promise<UtilityPrice[]> {
    try {
      const response = await apiClient.getUtilityPrice(utilityType, region);
      return [response] as UtilityPrice[];
    } catch (error: any) {
      throw new Error(`Failed to get price history: ${error.message}`);
    }
  }
}

/**
 * Notification Operations - MIGRATED TO FASTAPI
 */
class NotificationService {
  static async create(notification: Tables['notifications']['Insert']): Promise<Notification> {
    try {
      const response = await apiClient.request('/api/v1/notifications', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
      return response as Notification;
    } catch (error: any) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  static async getForUser(
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      const response = await apiClient.getNotifications({
        limit,
        unread_only: unreadOnly,
      });
      return response as Notification[];
    } catch (error: any) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  static async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.markNotificationRead(id);
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  static async markAsClicked(id: string): Promise<void> {
    try {
      await apiClient.request(`/api/v1/notifications/${id}/clicked`, {
        method: 'PATCH',
      });
    } catch (error: any) {
      throw new Error(`Failed to mark notification as clicked: ${error.message}`);
    }
  }
}

/**
 * ML Model Operations - MIGRATED TO FASTAPI
 */
class ModelService {
  static async triggerRetraining(
    modelType: string,
    utilityType?: UtilityType
  ): Promise<string> {
    try {
      const response = await apiClient.request('/api/v1/models/retrain', {
        method: 'POST',
        body: JSON.stringify({
          model_type: modelType,
          utility_type: utilityType,
        }),
      });
      return (response as { training_id?: string })?.training_id || '';
    } catch (error: any) {
      throw new Error(`Failed to trigger retraining: ${error.message}`);
    }
  }

  static async getTrainingStatus(
    modelType: string
  ): Promise<Tables['model_training_logs']['Row'][]> {
    try {
      const response = await apiClient.request(`/api/v1/models/training-status?model_type=${modelType}`);
      return response as Tables['model_training_logs']['Row'][];
    } catch (error: any) {
      throw new Error(`Failed to get training status: ${error.message}`);
    }
  }
}

/**
 * Dashboard Data Aggregation - MIGRATED TO FASTAPI
 */
class DashboardService {
  static async getDashboardData(utilityType: UtilityType) {
    const [latestReading, recentAnomalies, latestForecast, preferences] = await Promise.all([
      MeterReadingService.getLatest(utilityType),
      AnomalyService.getRecent(utilityType, 5),
      ForecastService.getLatest(utilityType),
      PreferencesService.get(),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReadings = await MeterReadingService.getByDateRange(
      utilityType,
      thirtyDaysAgo.toISOString(),
      new Date().toISOString()
    );

    const currentPrice = await PricingService.getCurrentPrice(utilityType);

    return {
      latestReading,
      recentReadings,
      recentAnomalies,
      latestForecast,
      currentPrice,
      preferences,
    };
  }
}

// Export all services
export {
  MeterReadingService,
  AnomalyService,
  ForecastService,
  PreferencesService,
  PricingService,
  NotificationService,
  ModelService,
  DashboardService,
};