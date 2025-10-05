import { api } from './api';
import { rateUpdateService, RateUpdateEvent } from './rateUpdateService';

export interface MetricsRecalculation {
  id: string;
  trigger_event: 'rate_update' | 'consumption_update' | 'manual';
  utility_type: 'water' | 'electricity';
  affected_months: string[];
  metrics_updated: string[];
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface MetricUpdate {
  metric_name: string;
  old_value: number | null;
  new_value: number;
  percentage_change: number;
  affected_period: string;
}

export class MetricsRecalculationService {
  private static instance: MetricsRecalculationService;
  private recalculationQueue: Array<{
    utilityType: 'water' | 'electricity';
    months: string[];
    triggerEvent: 'rate_update' | 'consumption_update' | 'manual';
  }> = [];
  private isProcessing = false;

  static getInstance(): MetricsRecalculationService {
    if (!MetricsRecalculationService.instance) {
      MetricsRecalculationService.instance = new MetricsRecalculationService();
    }
    return MetricsRecalculationService.instance;
  }

  constructor() {
    // Listen for rate updates to trigger metric recalculation
    rateUpdateService.onRateUpdate(this.handleRateUpdate.bind(this));
  }

  private handleRateUpdate(event: RateUpdateEvent) {
    console.log('Triggering metrics recalculation for rate update:', event);

    this.queueRecalculation({
      utilityType: event.utility_type,
      months: event.affected_months,
      triggerEvent: 'rate_update'
    });
  }

  queueRecalculation(params: {
    utilityType: 'water' | 'electricity';
    months: string[];
    triggerEvent: 'rate_update' | 'consumption_update' | 'manual';
  }) {
    this.recalculationQueue.push(params);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.recalculationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.recalculationQueue.length > 0) {
        const task = this.recalculationQueue.shift()!;
        await this.executeRecalculation(task);
      }
    } catch (error) {
      console.error('Error processing metrics recalculation queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeRecalculation(params: {
    utilityType: 'water' | 'electricity';
    months: string[];
    triggerEvent: 'rate_update' | 'consumption_update' | 'manual';
  }): Promise<MetricsRecalculation> {
    const startTime = Date.now();
    const metricsUpdated: string[] = [];
    let success = true;
    let errorMessage: string | undefined;

    try {
      console.log(`Starting metrics recalculation for ${params.utilityType}:`, params.months);

      // 1. Recalculate monthly costs
      await this.recalculateMonthlyConsumptionCosts(params.utilityType, params.months);
      metricsUpdated.push('monthly_consumption_costs');

      // 2. Update cost forecasts
      await this.recalculateCostForecasts(params.utilityType, params.months);
      metricsUpdated.push('cost_forecasts');

      // 3. Recalculate usage analytics
      await this.recalculateUsageAnalytics(params.utilityType, params.months);
      metricsUpdated.push('usage_analytics');

      // 4. Update dashboard metrics
      await this.updateDashboardMetrics(params.utilityType, params.months);
      metricsUpdated.push('dashboard_metrics');

      // 5. Invalidate caches
      await this.invalidateRelatedCaches(params.utilityType);
      metricsUpdated.push('cache_invalidation');

      console.log(`Metrics recalculation completed for ${params.utilityType}. Updated:`, metricsUpdated);

    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error during metrics recalculation';
      console.error('Metrics recalculation failed:', error);
    }

    const executionTime = Date.now() - startTime;

    // Log the recalculation
    const recalculationRecord: Omit<MetricsRecalculation, 'id' | 'created_at'> = {
      trigger_event: params.triggerEvent,
      utility_type: params.utilityType,
      affected_months: params.months,
      metrics_updated: metricsUpdated,
      execution_time_ms: executionTime,
      success,
      error_message: errorMessage
    };

    return this.saveRecalculationRecord(recalculationRecord);
  }

  private async recalculateMonthlyConsumptionCosts(
    utilityType: 'water' | 'electricity',
    months: string[]
  ): Promise<void> {
    try {
      for (const month of months) {
        // Call API to recalculate monthly consumption costs
        await api.request('/api/v1/consumption/recalculate-costs', {
          method: 'POST',
          body: JSON.stringify({
            utility_type: utilityType,
            month: month
          })
        });
      }
    } catch (error) {
      console.error('Failed to recalculate monthly consumption costs:', error);
      throw error;
    }
  }

  private async recalculateCostForecasts(
    utilityType: 'water' | 'electricity',
    months: string[]
  ): Promise<void> {
    try {
      // Update existing forecasts that may be affected by rate changes
      await api.request('/api/v1/forecasts/recalculate', {
        method: 'POST',
        body: JSON.stringify({
          utility_type: utilityType,
          affected_months: months
        })
      });
    } catch (error) {
      console.error('Failed to recalculate cost forecasts:', error);
      throw error;
    }
  }

  private async recalculateUsageAnalytics(
    utilityType: 'water' | 'electricity',
    months: string[]
  ): Promise<void> {
    try {
      // Recalculate usage analytics that depend on cost calculations
      await api.request('/api/v1/analytics/recalculate', {
        method: 'POST',
        body: JSON.stringify({
          utility_type: utilityType,
          months: months
        })
      });
    } catch (error) {
      console.error('Failed to recalculate usage analytics:', error);
      // Don't throw - analytics are less critical
    }
  }

  private async updateDashboardMetrics(
    utilityType: 'water' | 'electricity',
    months: string[]
  ): Promise<void> {
    try {
      // Update aggregated dashboard metrics
      await api.request('/api/v1/dashboard/recalculate', {
        method: 'POST',
        body: JSON.stringify({
          utility_type: utilityType,
          months: months
        })
      });
    } catch (error) {
      console.error('Failed to update dashboard metrics:', error);
      // Don't throw - dashboard will update on next load
    }
  }

  private async invalidateRelatedCaches(utilityType: 'water' | 'electricity'): Promise<void> {
    try {
      // Invalidate query caches
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        const queryClient = (window as any).queryClient;

        await Promise.all([
          queryClient.invalidateQueries([`${utilityType}-forecast`]),
          queryClient.invalidateQueries([`${utilityType}-rates`]),
          queryClient.invalidateQueries([`${utilityType}-pricing`]),
          queryClient.invalidateQueries([`${utilityType}-usage-analytics`]),
          queryClient.invalidateQueries(['monthly-consumption']),
          queryClient.invalidateQueries(['dashboard-data']),
          queryClient.invalidateQueries(['consumption-with-rates'])
        ]);
      }
    } catch (error) {
      console.error('Failed to invalidate caches:', error);
      // Don't throw - cache will update naturally
    }
  }

  private async saveRecalculationRecord(
    record: Omit<MetricsRecalculation, 'id' | 'created_at'>
  ): Promise<MetricsRecalculation> {
    try {
      const response = await api.request('/api/v1/metrics/recalculations', {
        method: 'POST',
        body: JSON.stringify({
          ...record,
          created_at: new Date().toISOString()
        })
      });

      return response.data;
    } catch (error) {
      console.error('Failed to save recalculation record:', error);
      // Return a mock record if saving fails
      return {
        id: `local-${Date.now()}`,
        ...record,
        created_at: new Date().toISOString()
      };
    }
  }

  async getRecalculationHistory(
    utilityType?: 'water' | 'electricity',
    limit: number = 50
  ): Promise<MetricsRecalculation[]> {
    try {
      const response = await api.request('/api/v1/metrics/recalculations', {
        method: 'GET',
        params: {
          utility_type: utilityType,
          limit: limit.toString()
        }
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to get recalculation history:', error);
      return [];
    }
  }

  async triggerManualRecalculation(
    utilityType: 'water' | 'electricity',
    months?: string[]
  ): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const affectedMonths = months || [currentMonth];

    this.queueRecalculation({
      utilityType,
      months: affectedMonths,
      triggerEvent: 'manual'
    });
  }

  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.recalculationQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

export const metricsRecalculationService = MetricsRecalculationService.getInstance();