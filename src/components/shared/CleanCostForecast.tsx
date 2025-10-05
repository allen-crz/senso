import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Brain, BarChart3, Clock } from 'lucide-react';
import { useCleanWaterDataForForecasting, useWaterConsumptionStats, useLatestWaterReading, useWaterReadings } from '@/hooks/useWaterData';
import { useLatestElectricityReading, useElectricityReadings } from '@/hooks/useElectricityData';
import { useModelInfo } from '@/hooks/useCostForecasting';
import { api } from '@/services/api';

interface CleanCostForecastProps {
  utilityType: 'water' | 'electricity';
  colors: {
    primary: string;
    secondary: string;
    gradient: string;
    buttonBg: string;
    buttonHover: string;
  };
  defaultPrice: number;
  unit: string;
  days?: number;
}

const CleanCostForecast: React.FC<CleanCostForecastProps> = ({
  utilityType,
  colors,
  defaultPrice,
  unit,
  days = 30
}) => {
  const { data: cleanData, isLoading: cleanDataLoading, error: cleanDataError } = useCleanWaterDataForForecasting(days);
  const { data: stats, isLoading: statsLoading, error: statsError } = useWaterConsumptionStats(days);

  // Get meter readings based on utility type
  const { data: latestWaterReading } = useLatestWaterReading();
  const { data: latestElectricityReading } = useLatestElectricityReading();
  const { data: waterReadings } = useWaterReadings();
  const { data: electricityReadings } = useElectricityReadings();

  const latestReading = utilityType === 'water' ? latestWaterReading : latestElectricityReading;
  const allReadings = utilityType === 'water' ? waterReadings : electricityReadings;

  // State for intelligent forecasting
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Get model info for AI features
  const modelInfo = useModelInfo(utilityType);

  // Helper function to calculate daily consumption from readings
  const calculateDailyConsumption = (latestReading: any, allReadings: any[]) => {
    if (!latestReading || !allReadings || allReadings.length < 2) {
      return null;
    }

    const sortedReadings = [...allReadings].sort((a, b) =>
      new Date(a.capture_timestamp).getTime() - new Date(b.capture_timestamp).getTime()
    );

    if (sortedReadings.length >= 2) {
      const currentValue = latestReading.reading_value;
      const previousValue = sortedReadings[sortedReadings.length - 2].reading_value;
      const usageAmount = Math.max(0, currentValue - previousValue);

      // Calculate days between readings for daily average
      const currentDate = new Date(latestReading.capture_timestamp);
      const previousDate = new Date(sortedReadings[sortedReadings.length - 2].capture_timestamp);
      const daysDiff = Math.max(1, Math.ceil((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)));

      return usageAmount / daysDiff; // Daily average consumption
    }

    return null;
  };

  // Load intelligent forecasting data
  useEffect(() => {
    loadForecastData();
  }, [utilityType, days, latestReading, allReadings]); // Refresh when readings change

  const loadForecastData = async () => {
    setForecastLoading(true);
    setForecastError(null);

    try {
      // Calculate monthly consumption from meter readings
      const dailyConsumption = calculateDailyConsumption(latestReading, allReadings);
      const monthlyConsumption = dailyConsumption ? dailyConsumption * 30 : undefined;

      // Use calculated consumption if available, otherwise fallback to forecast without it
      const forecast = await api.getMonthlyForecast(utilityType, monthlyConsumption);

      if (forecast) {
        setForecastData([forecast]);
      } else {
        setForecastData([]);
      }
    } catch (error) {
      console.error('Error loading forecast data:', error);
      setForecastError('Unable to load AI forecast');
      setForecastData([]);
    } finally {
      setForecastLoading(false);
    }
  };

  if (cleanDataLoading || statsLoading || forecastLoading) {
    return (
      <div className="bg-white rounded-lg p-4 mb-4 border animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-4">
          {forecastLoading ? 'Loading AI forecast...' : 'Loading clean data...'}
        </div>
      </div>
    );
  }

  if (cleanDataError || statsError || !cleanData || !stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-yellow-800">Forecast Unavailable</h3>
        </div>
        <p className="text-yellow-700 text-sm">
          Unable to generate cost forecast. More usage data may be needed.
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendDescription = () => {
    switch (stats.trend) {
      case 'increasing':
        return 'Usage trending upward';
      case 'decreasing':
        return 'Usage trending downward';
      case 'stable':
        return 'Usage stable';
      default:
        return 'Insufficient data for trend';
    }
  };

  // Calculate projections - use AI forecast if available, fallback to clean data
  let dailyAverage, weeklyProjection, monthlyProjection;
  let dailyCost, weeklyCost, monthlyCost;
  let usingAIForecast = false;

  if (forecastData.length > 0) {
    // Use AI forecasting model predictions
    usingAIForecast = true;
    const totalPredictedConsumption = forecastData.reduce((sum, day) => sum + (day.predicted_consumption || 0), 0);
    const totalPredictedCost = forecastData.reduce((sum, day) => sum + (day.predicted_cost || 0), 0);

    dailyAverage = totalPredictedConsumption / forecastData.length;
    weeklyProjection = dailyAverage * 7;
    monthlyProjection = totalPredictedConsumption;

    dailyCost = totalPredictedCost / forecastData.length;
    weeklyCost = dailyCost * 7;
    monthlyCost = totalPredictedCost;
  } else {
    // Fallback to clean data calculations
    dailyAverage = stats.daily_avg;
    weeklyProjection = dailyAverage * 7;
    monthlyProjection = dailyAverage * 30;

    dailyCost = dailyAverage * defaultPrice;
    weeklyCost = weeklyProjection * defaultPrice;
    monthlyCost = monthlyProjection * defaultPrice;
  }

  const anomaliesExcluded = (cleanData.count || 0) < (cleanData.count || 0) + 5; // Rough estimate

  return (
    <div className="space-y-4">
      {/* Simple Cost Projections */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Daily</div>
          <div className="text-xl font-bold text-gray-900">₱{dailyCost.toFixed(0)}</div>
          <div className="text-xs text-gray-500">{dailyAverage.toFixed(1)} {unit}</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Weekly</div>
          <div className="text-xl font-bold text-gray-900">₱{weeklyCost.toFixed(0)}</div>
          <div className="text-xs text-gray-500">{weeklyProjection.toFixed(1)} {unit}</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Monthly</div>
          <div className="text-xl font-bold text-gray-900">₱{monthlyCost.toFixed(0)}</div>
          <div className="text-xs text-gray-500">{monthlyProjection.toFixed(1)} {unit}</div>
        </div>
      </div>

      {/* AI Model Status - Only show if using AI forecast */}
      {usingAIForecast && modelInfo.data && (
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <Brain className="w-5 h-5 text-purple-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-purple-700">
              Smart Prediction Active
            </div>
            <div className="text-xs text-purple-600">
              {(() => {
                const confidence = forecastData.length > 0 ? forecastData[0].confidence_score || 0 : 0;
                if (confidence > 0.8) return 'High Accuracy Model';
                if (confidence > 0.6) return 'Good Accuracy Model';
                return 'Learning from your data...';
              })()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-600 font-medium">
              AI-Powered
            </div>
            <div className="text-xs text-purple-500">
              Based on patterns
            </div>
          </div>
        </div>
      )}

      {/* Forecast Data Source Indicator */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {usingAIForecast ? (
            <>
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI Forecast</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Basic Estimate</span>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {usingAIForecast
            ? `${forecastData.length} days predicted`
            : 'Add more readings for AI predictions'
          }
        </div>
      </div>

      {/* Usage Trend */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        {getTrendIcon()}
        <span className="text-sm font-medium text-gray-700">{getTrendDescription()}</span>
        {usingAIForecast && forecastData.length > 7 && (
          <div className="ml-auto text-xs text-gray-500">
            Week 1: ₱{forecastData.slice(0, 7).reduce((sum, day) => sum + (day.predicted_cost || 0), 0).toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanCostForecast;