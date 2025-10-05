export type RateSource = 'official' | 'fallback' | 'estimated' | 'manual';

export interface RateVersion {
  id: string;
  version: string;
  utility_type: 'water' | 'electricity';
  price_per_unit: number;
  effective_date: string;
  published_at?: string;
  tier_structure?: any;
  seasonal_multiplier: number;
  region?: string;
  source: RateSource;
  is_current: boolean;
  created_at: string;
}

export interface ConsumptionRecord {
  id: string;
  user_id: string;
  utility_type: 'water' | 'electricity';
  consumption: number;
  billing_month: string;
  estimated_cost: number;
  actual_cost?: number;
  rate_source: RateSource;
  rate_version_id: string;
  rate_version: string;
  cost_updated_at?: string;
  meter_reading_ids: string[];
  forecast_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface ConsumptionWithRates extends ConsumptionRecord {
  rate_info: RateVersion;
  previous_rate_info?: RateVersion;
  cost_difference?: number;
  accuracy_score?: number;
}

export interface MonthlyConsumption {
  month: string;
  consumption: number;
  estimated_cost: number;
  actual_cost?: number;
  rate_source: RateSource;
  rate_certainty: 'high' | 'medium' | 'low';
  updated_at: string;
}

export interface CostForecast {
  month: string;
  predicted_consumption: number;
  predicted_cost: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  rate_assumptions: {
    source: RateSource;
    version: string;
    rate_per_unit: number;
  };
  accuracy_history?: number;
}

export interface RateUpdateEvent {
  id: string;
  utility_type: 'water' | 'electricity';
  old_rate_version: string;
  new_rate_version: string;
  affected_months: string[];
  cost_changes: {
    month: string;
    old_cost: number;
    new_cost: number;
    difference: number;
  }[];
  notification_sent: boolean;
  created_at: string;
}

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

export interface RateUpdateNotification {
  id: string;
  user_id: string;
  utility_type: 'water' | 'electricity';
  month: string;
  old_cost: number;
  new_cost: number;
  cost_difference: number;
  rate_source_change?: {
    from: RateSource;
    to: RateSource;
  };
  notification_type: 'rate_published' | 'cost_updated' | 'forecast_improved';
  sent_at?: string;
  read_at?: string;
  created_at: string;
}