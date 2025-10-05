import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Activity, Bolt, CheckCircle } from 'lucide-react';
import UnifiedAnomalyAlert from '@/components/shared/UnifiedAnomalyAlert';
import CleanCostForecast from '@/components/shared/CleanCostForecast';
import { 
  useLatestElectricityReading, 
  useElectricityAnomalies,
  useElectricityConsumptionStats,
  useAnomalyDetectionHealth
} from '@/hooks/useElectricityData';

const electricityColors = {
  primary: 'yellow',
  secondary: 'text-yellow-400',
  gradient: 'from-yellow-400 to-yellow-600',
  buttonBg: 'bg-yellow-500',
  buttonHover: 'hover:bg-yellow-600',
  textColors: 'text-yellow-600',
};

const EnhancedElectricityResults: React.FC = () => {
  const { data: latestReading, isLoading: readingLoading } = useLatestElectricityReading();
  const { data: anomalies, isLoading: anomaliesLoading } = useElectricityAnomalies(5);
  const { data: consumptionStats, isLoading: statsLoading } = useElectricityConsumptionStats(30);
  const { data: systemHealth } = useAnomalyDetectionHealth();
  
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());

  const handleDismissAnomaly = (anomalyId: string) => {
    setDismissedAnomalies(prev => new Set([...prev, anomalyId]));
  };

  const visibleAnomalies = anomalies?.filter(
    (anomaly: any) => 
      anomaly.is_anomaly && 
      !dismissedAnomalies.has(anomaly.id)
  ) || [];

  if (readingLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Bolt className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">Electricity Monitoring</h1>
          </div>
          <p className="text-gray-600">Enhanced anomaly detection and cost forecasting</p>
        </div>

        {/* System Health Indicator */}
        {systemHealth && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">
                Anomaly Detection System: {systemHealth.status || 'Operational'}
              </span>
            </div>
          </div>
        )}

        {/* Latest Reading Card */}
        {latestReading && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Latest Reading</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-yellow-600">
                    {latestReading.reading_value}
                  </span>
                  <span className="text-gray-500">kWh</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(latestReading.capture_timestamp).toLocaleString()}
                </p>
              </div>
              <Bolt className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
        )}

        {/* Anomaly Alerts */}
        {visibleAnomalies.length > 0 && (
          <div className="space-y-3">
            {visibleAnomalies.map((anomaly: any) => (
              <UnifiedAnomalyAlert
                key={anomaly.id}
                anomaly={anomaly}
                utilityType="electricity"
                onDismiss={() => handleDismissAnomaly(anomaly.id)}
                showFeedback={true}
                variant="detailed"
              />
            ))}
          </div>
        )}

        {/* Consumption Statistics */}
        {consumptionStats && !statsLoading && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Consumption Insights (Last 30 Days)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {consumptionStats.daily_avg?.toFixed(1) || '0'}
                </div>
                <div className="text-sm text-gray-600">Daily Avg (kWh)</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {consumptionStats.daily_max?.toFixed(1) || '0'}
                </div>
                <div className="text-sm text-gray-600">Daily Max (kWh)</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {consumptionStats.total_consumption?.toFixed(1) || '0'}
                </div>
                <div className="text-sm text-gray-600">Total (kWh)</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600 capitalize">
                  {consumptionStats.trend || 'stable'}
                </div>
                <div className="text-sm text-gray-600">Trend</div>
              </div>
            </div>
            
            {consumptionStats.clean_readings_count && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Analysis based on {consumptionStats.clean_readings_count} clean readings
                (excluding anomalous data for accuracy)
              </div>
            )}
          </div>
        )}

        {/* Clean Cost Forecast */}
        <CleanCostForecast 
          utilityType="electricity"
          colors={electricityColors}
        />

        {/* No Anomalies Message */}
        {!anomaliesLoading && visibleAnomalies.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              All Systems Normal
            </h3>
            <p className="text-green-700">
              No electricity usage anomalies detected. Your consumption patterns appear normal.
            </p>
          </div>
        )}

        {/* Loading States */}
        {(anomaliesLoading || statsLoading) && (
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedElectricityResults;