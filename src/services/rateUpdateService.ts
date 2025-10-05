import { api } from './api';
import { rateManager } from './rateManagement';

export interface RateUpdateEvent {
  id: string;
  utility_type: 'water' | 'electricity';
  old_rate_version: string;
  new_rate_version: string;
  affected_months: string[];
  cost_changes: Array<{
    month: string;
    old_cost: number;
    new_cost: number;
    difference: number;
  }>;
  users_affected: number;
  notification_sent: boolean;
  created_at: string;
}

export interface RateUpdateNotification {
  id: string;
  user_id: string;
  utility_type: 'water' | 'electricity';
  month: string;
  old_cost: number;
  new_cost: number;
  cost_difference: number;
  notification_type: 'rate_published' | 'cost_updated' | 'forecast_improved';
  rate_source_change?: {
    from: string;
    to: string;
  };
  created_at: string;
}

export class RateUpdateService {
  private static instance: RateUpdateService;
  private updateListeners: Array<(event: RateUpdateEvent) => void> = [];
  private isCheckingUpdates = false;
  private lastCheckTime: Date | null = null;

  static getInstance(): RateUpdateService {
    if (!RateUpdateService.instance) {
      RateUpdateService.instance = new RateUpdateService();
    }
    return RateUpdateService.instance;
  }

  onRateUpdate(callback: (event: RateUpdateEvent) => void) {
    this.updateListeners.push(callback);
  }

  removeRateUpdateListener(callback: (event: RateUpdateEvent) => void) {
    const index = this.updateListeners.indexOf(callback);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }

  private notifyListeners(event: RateUpdateEvent) {
    this.updateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in rate update listener:', error);
      }
    });
  }

  async checkForRateUpdates(): Promise<void> {
    if (this.isCheckingUpdates) {
      return;
    }

    this.isCheckingUpdates = true;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const previousMonth = this.getPreviousMonth(currentMonth);

      // Check for new official rates for current and previous month
      await Promise.all([
        this.checkUtilityRateUpdates('water', currentMonth),
        this.checkUtilityRateUpdates('electricity', currentMonth),
        this.checkUtilityRateUpdates('water', previousMonth),
        this.checkUtilityRateUpdates('electricity', previousMonth)
      ]);

      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('Error checking for rate updates:', error);
    } finally {
      this.isCheckingUpdates = false;
    }
  }

  private async checkUtilityRateUpdates(
    utilityType: 'water' | 'electricity',
    month: string
  ): Promise<void> {
    try {
      // Get current rate version used in forecasts/consumption for this month
      const currentRateInfo = await this.getCurrentRateInfo(utilityType, month);

      // Check if new official rates are available
      const latestOfficialRate = await this.getLatestOfficialRate(utilityType, month);

      if (latestOfficialRate && this.shouldUpdateRates(currentRateInfo, latestOfficialRate)) {
        await this.processRateUpdate(utilityType, month, currentRateInfo, latestOfficialRate);
      }
    } catch (error) {
      console.error(`Error checking ${utilityType} rate updates for ${month}:`, error);
    }
  }

  private async getCurrentRateInfo(
    utilityType: 'water' | 'electricity',
    month: string
  ): Promise<any> {
    try {
      // Get rate info from monthly consumption or cost forecasts
      const response = await api.request('/api/v1/rates/current', {
        method: 'POST',
        body: JSON.stringify({
          utility_type: utilityType,
          month: month
        })
      });

      return response.data;
    } catch (error) {
      console.warn('Failed to get current rate info:', error);
      return null;
    }
  }

  private async getLatestOfficialRate(
    utilityType: 'water' | 'electricity',
    month: string
  ): Promise<any> {
    try {
      const rates = await api.getUtilityRates(utilityType);

      return rates.find(rate =>
        rate.effective_date.startsWith(month) &&
        rate.source === 'official' &&
        rate.is_current
      );
    } catch (error) {
      console.warn('Failed to get latest official rate:', error);
      return null;
    }
  }

  private shouldUpdateRates(currentRateInfo: any, newOfficialRate: any): boolean {
    if (!currentRateInfo || !newOfficialRate) {
      return false;
    }

    // Update if we're moving from fallback/estimated to official
    if (currentRateInfo.source !== 'official' && newOfficialRate.source === 'official') {
      return true;
    }

    // Update if official rate version has changed
    if (currentRateInfo.source === 'official' &&
        currentRateInfo.version !== newOfficialRate.version) {
      return true;
    }

    return false;
  }

  private async processRateUpdate(
    utilityType: 'water' | 'electricity',
    month: string,
    oldRateInfo: any,
    newRateInfo: any
  ): Promise<void> {
    try {
      console.log(`Processing rate update for ${utilityType} ${month}:`, {
        old: oldRateInfo,
        new: newRateInfo
      });

      // Get affected consumption records
      const affectedRecords = await this.getAffectedConsumptionRecords(utilityType, month);

      // Calculate cost changes
      const costChanges = await this.calculateCostChanges(affectedRecords, oldRateInfo, newRateInfo);

      // Update consumption records and forecasts
      await this.updateConsumptionCosts(utilityType, month, newRateInfo.version);

      // Create rate update event
      const updateEvent: Omit<RateUpdateEvent, 'id' | 'created_at'> = {
        utility_type: utilityType,
        old_rate_version: oldRateInfo?.version || 'unknown',
        new_rate_version: newRateInfo.version,
        affected_months: [month],
        cost_changes: costChanges,
        users_affected: affectedRecords.length,
        notification_sent: false
      };

      const savedEvent = await this.saveRateUpdateEvent(updateEvent);

      // Invalidate related queries
      await this.invalidateRelatedQueries(utilityType);

      // Send notifications to affected users
      await this.sendRateUpdateNotifications(savedEvent, affectedRecords);

      // Notify listeners
      this.notifyListeners(savedEvent);

    } catch (error) {
      console.error('Error processing rate update:', error);
    }
  }

  private async getAffectedConsumptionRecords(
    utilityType: 'water' | 'electricity',
    month: string
  ): Promise<any[]> {
    try {
      const response = await api.request('/api/v1/consumption/monthly', {
        method: 'GET',
        params: {
          utility_type: utilityType,
          month: month
        }
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to get affected consumption records:', error);
      return [];
    }
  }

  private async calculateCostChanges(
    records: any[],
    oldRateInfo: any,
    newRateInfo: any
  ): Promise<Array<{ month: string; old_cost: number; new_cost: number; difference: number; }>> {
    const changes = [];

    for (const record of records) {
      const oldCost = record.estimated_cost || 0;
      const newCost = record.consumption * newRateInfo.price_per_unit;
      const difference = newCost - oldCost;

      changes.push({
        month: record.billing_month,
        old_cost: oldCost,
        new_cost: newCost,
        difference: difference
      });
    }

    return changes;
  }

  private async updateConsumptionCosts(
    utilityType: 'water' | 'electricity',
    month: string,
    newRateVersion: string
  ): Promise<void> {
    try {
      await api.request('/api/v1/rates/update-costs', {
        method: 'POST',
        body: JSON.stringify({
          utility_type: utilityType,
          month: month,
          new_rate_version: newRateVersion
        })
      });
    } catch (error) {
      console.error('Failed to update consumption costs:', error);
    }
  }

  private async saveRateUpdateEvent(event: Omit<RateUpdateEvent, 'id' | 'created_at'>): Promise<RateUpdateEvent> {
    try {
      const response = await api.request('/api/v1/rates/update-events', {
        method: 'POST',
        body: JSON.stringify({
          ...event,
          created_at: new Date().toISOString()
        })
      });

      return response.data;
    } catch (error) {
      console.error('Failed to save rate update event:', error);
      throw error;
    }
  }

  private async invalidateRelatedQueries(utilityType: 'water' | 'electricity'): Promise<void> {
    // This would trigger cache invalidation in your query client
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;

      await Promise.all([
        queryClient.invalidateQueries([`${utilityType}-forecast`]),
        queryClient.invalidateQueries([`${utilityType}-rates`]),
        queryClient.invalidateQueries([`${utilityType}-pricing`]),
        queryClient.invalidateQueries(['monthly-consumption']),
        queryClient.invalidateQueries(['dashboard-data'])
      ]);
    }
  }

  private async sendRateUpdateNotifications(
    event: RateUpdateEvent,
    affectedRecords: any[]
  ): Promise<void> {
    try {
      // Group records by user
      const userRecords = new Map<string, any[]>();
      affectedRecords.forEach(record => {
        if (!userRecords.has(record.user_id)) {
          userRecords.set(record.user_id, []);
        }
        userRecords.get(record.user_id)!.push(record);
      });

      // Send notification to each affected user
      const notifications = Array.from(userRecords.entries()).map(([userId, records]) => {
        const totalCostChange = event.cost_changes.reduce((sum, change) => sum + change.difference, 0);

        return {
          user_id: userId,
          utility_type: event.utility_type,
          month: event.affected_months[0],
          old_cost: event.cost_changes[0]?.old_cost || 0,
          new_cost: event.cost_changes[0]?.new_cost || 0,
          cost_difference: totalCostChange,
          notification_type: 'rate_published' as const,
          rate_source_change: {
            from: event.old_rate_version,
            to: event.new_rate_version
          }
        };
      });

      await api.request('/api/v1/notifications/rate-updates', {
        method: 'POST',
        body: JSON.stringify({ notifications })
      });

      // Mark event as notified
      await api.request(`/api/v1/rates/update-events/${event.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notification_sent: true })
      });

    } catch (error) {
      console.error('Failed to send rate update notifications:', error);
    }
  }

  async startAutoUpdate(intervalMinutes: number = 60): Promise<void> {
    // Initial check
    await this.checkForRateUpdates();

    // Set up periodic checks
    setInterval(async () => {
      await this.checkForRateUpdates();
    }, intervalMinutes * 60 * 1000);

    console.log(`Rate auto-update started with ${intervalMinutes}-minute interval`);
  }

  private getPreviousMonth(month: string): string {
    const date = new Date(month + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  }

  getLastCheckTime(): Date | null {
    return this.lastCheckTime;
  }

  isCurrentlyChecking(): boolean {
    return this.isCheckingUpdates;
  }
}

export const rateUpdateService = RateUpdateService.getInstance();