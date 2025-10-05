import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Activity, Droplet, CheckCircle } from 'lucide-react';
import UnifiedAnomalyAlert from '@/components/shared/UnifiedAnomalyAlert';
import CleanCostForecast from '@/components/shared/CleanCostForecast';
import { 
  useLatestWaterReading, 
  useWaterAnomalies,
  useWaterConsumptionStats,
  useAnomalyDetectionHealth
} from '@/hooks/useWaterData';

const waterColors = {
  primary: 'blue',
  secondary: 'text-blue-400',
  gradient: 'from-blue-400 to-blue-600',
  buttonBg: 'bg-blue-500',
  buttonHover: 'hover:bg-blue-600',
  textColors: 'text-blue-600',
};

const EnhancedWaterResults: React.FC = () => {
  const { data: latestReading, isLoading: readingLoading } = useLatestWaterReading();
  const { data: anomalies, isLoading: anomaliesLoading } = useWaterAnomalies(5);
  const { data: consumptionStats, isLoading: statsLoading } = useWaterConsumptionStats(30);
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
    <div className="space-y-4 p-4">
      {/* System Health Indicator */}
      {systemHealth && systemHealth.status !== 'healthy' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">
              Anomaly Detection System: {systemHealth.status}
            </span>
          </div>
        </div>
      )}

      {/* Latest Reading Card */}
      {latestReading && (
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Droplet className="text-blue-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Latest Reading</h3>
                <p className="text-sm text-gray-600">
                  {new Date(latestReading.capture_timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {latestReading.reading_value.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">m³</div>
            </div>
          </div>
          
          {latestReading.confidence_score && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Confidence: {(latestReading.confidence_score * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Anomaly Alerts */}
      {visibleAnomalies.length > 0 && (
        <div className="space-y-3">
          {visibleAnomalies.map((anomaly: any) => (
            <UnifiedAnomalyAlert
              key={anomaly.id}
              anomaly={anomaly}
              utilityType="water"
              onDismiss={() => handleDismissAnomaly(anomaly.id)}
              showFeedback={true}
              variant="detailed"
            />
          ))}
        </div>
      )}

      {/* Clean Cost Forecast */}
      <CleanCostForecast
        utilityType="water"
        colors={waterColors}
        defaultPrice={25.50}
        unit="m³"
        days={30}
      />

      {/* Consumption Statistics */}
      {!statsLoading && consumptionStats && (
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-900">Usage Insights</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Daily Average</div>
              <div className="text-lg font-bold text-blue-600">
                {consumptionStats.daily_avg.toFixed(1)} m³
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Monthly Total</div>
              <div className="text-lg font-bold text-blue-600">
                {consumptionStats.total_consumption.toFixed(1)} m³
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Usage Trend:</span>
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-4 h-4 ${
                consumptionStats.trend === 'increasing' ? 'text-red-500' :
                consumptionStats.trend === 'decreasing' ? 'text-green-500' : 
                'text-gray-500'
              }`} />
              <span className={`font-medium capitalize ${
                consumptionStats.trend === 'increasing' ? 'text-red-600' :
                consumptionStats.trend === 'decreasing' ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {consumptionStats.trend}
              </span>
            </div>
          </div>

          {/* Data Quality Indicator */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>
                Based on {consumptionStats.clean_readings_count} clean readings 
                (anomalies excluded for accuracy)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Anomalies Message */}
      {!anomaliesLoading && visibleAnomalies.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-green-800 font-medium">All Clear!</h3>
              <p className="text-green-700 text-sm">
                No anomalies detected in your recent water usage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
          View History
        </button>
        <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
          Export Data
        </button>
      </div>
    </div>
  );
};

export default EnhancedWaterResults;