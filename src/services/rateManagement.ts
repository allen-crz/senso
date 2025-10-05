import {
  RateVersion,
  RateSource,
  ConsumptionRecord,
  RateUpdateEvent,
  CostForecast,
  RateUpdateNotification
} from '@/types/consumption';
import { api } from './api';

export class RateManagementService {
  private static instance: RateManagementService;
  private rateCache = new Map<string, RateVersion[]>();
  private updateCallbacks: ((event: RateUpdateEvent) => void)[] = [];

  static getInstance(): RateManagementService {
    if (!RateManagementService.instance) {
      RateManagementService.instance = new RateManagementService();
    }
    return RateManagementService.instance;
  }

  onRateUpdate(callback: (event: RateUpdateEvent) => void) {
    this.updateCallbacks.push(callback);
  }

  private notifyRateUpdate(event: RateUpdateEvent) {
    this.updateCallbacks.forEach(callback => callback(event));
  }

  async getCurrentRate(
    utilityType: 'water' | 'electricity',
    month: string,
    region?: string
  ): Promise<RateVersion> {
    const cacheKey = `${utilityType}-${month}-${region || 'default'}`;

    try {
      // Try to get official rates for the month
      const officialRate = await this.getOfficialRate(utilityType, month, region);
      if (officialRate) {
        this.cacheRate(cacheKey, officialRate);
        return officialRate;
      }

      // Fallback to previous month's rates
      const fallbackRate = await this.getFallbackRate(utilityType, month, region);
      if (fallbackRate) {
        const fallbackRateVersion: RateVersion = {
          ...fallbackRate,
          source: 'fallback',
          version: `${fallbackRate.version}-fallback`,
          effective_date: month
        };
        this.cacheRate(cacheKey, fallbackRateVersion);
        return fallbackRateVersion;
      }

      // Last resort: estimated rates
      return this.getEstimatedRate(utilityType, month, region);
    } catch (error) {
      console.error('Failed to get current rate:', error);
      return this.getEstimatedRate(utilityType, month, region);
    }
  }

  private async getOfficialRate(
    utilityType: 'water' | 'electricity',
    month: string,
    region?: string
  ): Promise<RateVersion | null> {
    try {
      const rates = await api.getUtilityRates(utilityType, {
        month,
        region,
        source: 'official'
      });

      return rates.find(rate =>
        rate.source === 'official' &&
        rate.effective_date === month &&
        rate.is_current
      ) || null;
    } catch (error) {
      console.warn('Failed to fetch official rates:', error);
      return null;
    }
  }

  private async getFallbackRate(
    utilityType: 'water' | 'electricity',
    month: string,
    region?: string
  ): Promise<RateVersion | null> {
    try {
      // Get previous month's rate
      const previousMonth = this.getPreviousMonth(month);
      const rates = await api.getUtilityRates(utilityType, {
        month: previousMonth,
        region,
        source: 'official'
      });

      return rates.find(rate =>
        rate.source === 'official' &&
        rate.effective_date === previousMonth
      ) || null;
    } catch (error) {
      console.warn('Failed to fetch fallback rates:', error);
      return null;
    }
  }

  private async getEstimatedRate(
    utilityType: 'water' | 'electricity',
    month: string,
    region?: string
  ): Promise<RateVersion> {
    // Use historical average or provider default
    const defaultRates = {
      water: 2.50,
      electricity: 0.15
    };

    return {
      id: `estimated-${Date.now()}`,
      version: `estimated-${month}`,
      utility_type: utilityType,
      price_per_unit: defaultRates[utilityType],
      effective_date: month,
      seasonal_multiplier: 1.0,
      region,
      source: 'estimated',
      is_current: true,
      created_at: new Date().toISOString()
    };
  }

  async calculateCost(
    consumption: number,
    utilityType: 'water' | 'electricity',
    month: string,
    region?: string
  ): Promise<{
    estimated_cost: number;
    rate_info: RateVersion;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const rate = await this.getCurrentRate(utilityType, month, region);
    const baseCost = consumption * rate.price_per_unit * rate.seasonal_multiplier;

    // Apply tier structure if available
    let finalCost = baseCost;
    if (rate.tier_structure) {
      finalCost = this.applyTierStructure(consumption, rate.tier_structure);
    }

    const confidence = this.getConfidenceLevel(rate.source);

    return {
      estimated_cost: finalCost,
      rate_info: rate,
      confidence
    };
  }

  private applyTierStructure(consumption: number, tierStructure: any): number {
    if (!tierStructure || !Array.isArray(tierStructure)) {
      return consumption * (tierStructure?.base_rate || 0);
    }

    let totalCost = 0;
    let remainingConsumption = consumption;

    for (const tier of tierStructure) {
      const tierConsumption = Math.min(remainingConsumption, tier.limit || Infinity);
      totalCost += tierConsumption * tier.rate;
      remainingConsumption -= tierConsumption;

      if (remainingConsumption <= 0) break;
    }

    return totalCost;
  }

  private getConfidenceLevel(source: RateSource): 'high' | 'medium' | 'low' {
    switch (source) {
      case 'official': return 'high';
      case 'fallback': return 'medium';
      case 'estimated':
      case 'manual':
      default: return 'low';
    }
  }

  async updateConsumptionCosts(
    month: string,
    utilityType: 'water' | 'electricity',
    newRate: RateVersion
  ): Promise<RateUpdateEvent> {
    try {
      // Get all consumption records for the month
      const consumptionRecords = await api.getConsumptionRecords({
        month,
        utility_type: utilityType
      });

      const costChanges = [];

      for (const record of consumptionRecords) {
        const oldCost = record.estimated_cost;
        const newCostResult = await this.calculateCost(
          record.consumption,
          utilityType,
          month
        );

        // Update the consumption record
        await api.updateConsumptionRecord(record.id, {
          actual_cost: newCostResult.estimated_cost,
          rate_version_id: newRate.id,
          rate_version: newRate.version,
          rate_source: newRate.source,
          cost_updated_at: new Date().toISOString()
        });

        costChanges.push({
          month,
          old_cost: oldCost,
          new_cost: newCostResult.estimated_cost,
          difference: newCostResult.estimated_cost - oldCost
        });
      }

      // Create rate update event
      const updateEvent: RateUpdateEvent = {
        id: crypto.randomUUID(),
        utility_type: utilityType,
        old_rate_version: consumptionRecords[0]?.rate_version || 'unknown',
        new_rate_version: newRate.version,
        affected_months: [month],
        cost_changes,
        notification_sent: false,
        created_at: new Date().toISOString()
      };

      // Store the event
      await api.createRateUpdateEvent(updateEvent);

      // Notify listeners
      this.notifyRateUpdate(updateEvent);

      return updateEvent;
    } catch (error) {
      console.error('Failed to update consumption costs:', error);
      throw error;
    }
  }

  async checkForRateUpdates(): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonth = this.getPreviousMonth(currentMonth);

    for (const utilityType of ['water', 'electricity'] as const) {
      try {
        // Check if new rates are available for current month
        const newRate = await this.getOfficialRate(utilityType, currentMonth);
        if (newRate) {
          await this.updateConsumptionCosts(currentMonth, utilityType, newRate);
        }

        // Check if previous month's fallback rates got updated
        const updatedPreviousRate = await this.getOfficialRate(utilityType, previousMonth);
        if (updatedPreviousRate) {
          const cachedRate = this.getCachedRate(utilityType, previousMonth);
          if (cachedRate?.source === 'fallback') {
            await this.updateConsumptionCosts(previousMonth, utilityType, updatedPreviousRate);
          }
        }
      } catch (error) {
        console.error(`Failed to check rate updates for ${utilityType}:`, error);
      }
    }
  }

  async generateForecast(
    utilityType: 'water' | 'electricity',
    months: number = 6
  ): Promise<CostForecast[]> {
    const forecasts: CostForecast[] = [];
    const currentDate = new Date();

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      const month = futureDate.toISOString().slice(0, 7);

      try {
        // Get predicted consumption from existing forecast service
        const usageForecast = await api.getForecasts({
          utility_type: utilityType,
          month
        });

        const rate = await this.getCurrentRate(utilityType, month);
        const costResult = await this.calculateCost(
          usageForecast.predicted_usage,
          utilityType,
          month
        );

        forecasts.push({
          month,
          predicted_consumption: usageForecast.predicted_usage,
          predicted_cost: costResult.estimated_cost,
          confidence_interval: {
            lower: usageForecast.confidence_interval_lower || costResult.estimated_cost * 0.8,
            upper: usageForecast.confidence_interval_upper || costResult.estimated_cost * 1.2
          },
          rate_assumptions: {
            source: rate.source,
            version: rate.version,
            rate_per_unit: rate.price_per_unit
          },
          accuracy_history: usageForecast.model_accuracy
        });
      } catch (error) {
        console.warn(`Failed to generate forecast for ${month}:`, error);
      }
    }

    return forecasts;
  }

  private cacheRate(key: string, rate: RateVersion) {
    if (!this.rateCache.has(key)) {
      this.rateCache.set(key, []);
    }
    this.rateCache.get(key)!.push(rate);
  }

  private getCachedRate(utilityType: 'water' | 'electricity', month: string): RateVersion | null {
    const cacheKey = `${utilityType}-${month}-default`;
    const rates = this.rateCache.get(cacheKey);
    return rates?.[rates.length - 1] || null;
  }

  private getPreviousMonth(month: string): string {
    const date = new Date(month + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  }

  clearCache() {
    this.rateCache.clear();
  }
}

export const rateManager = RateManagementService.getInstance();