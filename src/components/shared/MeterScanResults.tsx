import React, { useState, useEffect } from "react";
import { RefreshCw, ChevronUp, ChevronDown, TrendingUp, Calculator, DollarSign, Droplet, Zap, AlertCircle, CheckCircle, Clock, Info, Brain, BarChart3, Minimize2, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import NewUserResults from "./NewUserResults";
import UnifiedAnomalyAlert from "@/components/shared/UnifiedAnomalyAlert";
import { useMonthlyForecast, useModelInfo } from '@/hooks/useCostForecasting';
import { api } from "@/services/api";
import { anomalyRecommendationEngine } from '@/services/anomalyRecommendationEngine';

interface MeterScanResultsConfig {
  utilityType: 'electricity' | 'water';
  unit: string;
  defaultPrice: number;
  colors: {
    primary: string;
    secondary: string;
    gradient: string;
    buttonBg: string;
    buttonHover: string;
    textColors: string;
  };
  sessionKeys: {
    analysisCompleted: string;
    readingId: string;
    imageData: string;
  };
  routes: {
    monitoring: string;
  };
  hooks: {
    useLatestReading: () => { data: any; isLoading: boolean };
    useReadings: (limit: number) => { data: any; isLoading: boolean };
    useAnomalies?: (limit: number) => { data: any; isLoading: boolean };
    useConsumptionStats?: (days: number) => { data: any; isLoading: boolean };
    useAnomalyDetectionHealth?: () => { data: any; isLoading: boolean };
  };
  anomalies: {
    detectedType: string;
    increasePercentage: string;
    causes: string[];
  };
}

interface MeterScanResultsProps {
  config: MeterScanResultsConfig;
}

const MeterScanResults: React.FC<MeterScanResultsProps> = ({ config }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { } = useAuth();
  const [userType, setUserType] = useState<'new' | 'existing'>('new');
  const [isAnomalyOpen, setIsAnomalyOpen] = useState(true);
  const [isBillOpen, setIsBillOpen] = useState(true);
  const [usage, setUsage] = useState<number>(0);
  const [estimatedBill, setEstimatedBill] = useState<number>(0);
  const imageCaptured = sessionStorage.getItem(config.sessionKeys.analysisCompleted) === 'true';

  // Get forecast for the current utility type only
  const { data: forecast, isLoading: forecastLoading, error: forecastError } = useMonthlyForecast(config.utilityType);
  const { data: modelInfo } = useModelInfo(config.utilityType);

  // Use backend hooks - simplified
  const { data: latestReading, isLoading: latestReadingLoading } = config.hooks.useLatestReading();
  const { data: readings, isLoading: readingsLoading } = config.hooks.useReadings(10);
  const { data: anomalies } = config.hooks.useAnomalies ? config.hooks.useAnomalies(5) : { data: null };

  // Track if data is still loading
  const isDataLoading = latestReadingLoading || readingsLoading;
  
  // Anomaly management
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());

  const handleDismissAnomaly = (anomalyId: string) => {
    setDismissedAnomalies(prev => new Set([...prev, anomalyId]));
  };

  // Filter visible anomalies
  const visibleAnomalies = anomalies?.filter(
    (anomaly: any) => anomaly.is_anomaly && !dismissedAnomalies.has(anomaly.id)
  ) || [];

  // Get anomaly display info
  const getAnomalyInfo = (anomaly: any) => {
    const reason = anomaly?.contributing_factors?.reason || '';
    let title = 'Anomaly Detected';
    let description = reason || 'Unusual consumption pattern detected';

    if (reason.toLowerCase().includes('rollback')) {
      title = 'Rollback Detected';
      description = 'Meter reading went backwards - possible malfunction';
    } else if (reason.toLowerCase().includes('zero')) {
      title = 'Zero Reading';
      description = 'No consumption recorded - check meter';
    } else if (reason.toLowerCase().includes('extreme') || reason.toLowerCase().includes('physical')) {
      title = 'Extreme Usage';
      description = 'Reading exceeds normal consumption limits';
    } else if (reason.toLowerCase().includes('pattern')) {
      title = 'Unusual Pattern';
      description = 'Usage differs from your normal behavior';
    }

    return { title, description };
  };

  useEffect(() => {
    // Show existing user view if there are readings or image was captured
    if (imageCaptured || location.state?.imageCaptured || (latestReading && latestReading.reading_value)) {
      setUserType('existing');
    } else {
      setUserType('new');
    }
  }, [location.state?.imageCaptured, imageCaptured, latestReading]);

  // Calculate usage and get intelligent bill forecast
  const [previousReading, setPreviousReading] = useState<any>(null);
  const [isCurrentReadingAnomalous, setIsCurrentReadingAnomalous] = useState(false);

  useEffect(() => {
    if (latestReading && readings && readings.length >= 2) {
      const sortedReadings = [...readings].sort((a, b) =>
        new Date(a.capture_timestamp).getTime() - new Date(b.capture_timestamp).getTime()
      );

      if (sortedReadings.length >= 2) {
        const currentValue = latestReading.reading_value;
        const previousValue = sortedReadings[sortedReadings.length - 2].reading_value;
        const usageAmount = Math.max(0, currentValue - previousValue);

        // Store the previous reading for display
        setPreviousReading(sortedReadings[sortedReadings.length - 2]);
        setUsage(usageAmount);
      }
    }

    // Use forecast data if available
    if (forecast?.predicted_monthly_cost) {
      setEstimatedBill(forecast.predicted_monthly_cost);
    } else if (usage > 0) {
      // Fallback to simple calculation
      setEstimatedBill(usage * config.defaultPrice);
    }
  }, [latestReading, readings, forecast]);


  // Check if current reading is marked as anomalous (accurate feedback)
  useEffect(() => {
    if (latestReading && anomalies) {
      // Check all anomalies, not just visible ones, since we need to find feedback
      const currentReadingAnomaly = anomalies.find((anomaly: any) => {
        return anomaly.reading_id === latestReading.id && anomaly.is_anomaly;
      });

      if (currentReadingAnomaly) {
        setIsCurrentReadingAnomalous(true);
      } else {
        setIsCurrentReadingAnomalous(false);
      }
    }
  }, [latestReading, anomalies]);

  const handleScanAgain = () => {
    sessionStorage.removeItem(config.sessionKeys.analysisCompleted);
    sessionStorage.removeItem(config.sessionKeys.readingId);
    sessionStorage.removeItem(config.sessionKeys.imageData);
    navigate(config.routes.monitoring, { 
      replace: true,
      state: { 
        slideIndex: 0,
        resetState: true
      }
    });
  };

  const utilityName = config.utilityType === 'electricity' ? 'Electricity' : 'Water';
  const usageUnit = config.unit;

  return (
    <div className="relative">
      {userType === 'new' ? (
        <NewUserResults utilityType={config.utilityType} />
      ) : (
        <div className="space-y-4 pb-10">
          <h2 className="text-2xl font-bold text-[#212529] mb-6">{utilityName} Scan Results</h2>

          {/* Meter Usage/Bill Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
            <h3 className={`text-lg font-semibold ${config.colors.textColors} mb-4`}>
              Meter Usage This Month
            </h3>
            <div className="text-center mb-6">
              <p className={`text-5xl font-bold ${config.colors.textColors} mb-2`}>
                {forecastLoading ? (
                  <span className="animate-pulse">₱---.--</span>
                ) : (
                  `₱${estimatedBill.toFixed(2)}`
                )}
              </p>
              <p className={`text-sm ${config.colors.secondary}`}>
                {forecastLoading ? 'Loading prediction...' :
                 forecastError ? 'Estimated Bill (Basic)' :
                 forecast ? 'Smart Prediction' : 'Estimated Bill'}
              </p>
              {forecastError && (
                <p className="text-xs text-orange-500 mt-1">Forecast temporarily unavailable</p>
              )}
            </div>
            <div className={`bg-${config.colors.primary}-50 rounded-xl p-4 mb-4`}>
              {isDataLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-2xl font-bold ${config.colors.textColors}`}>
                      {latestReading?.reading_value || 0} {usageUnit}
                    </p>
                    <p className={`text-sm ${config.colors.secondary}`}>Current Reading</p>
                  </div>
                  <div className="text-right">
                    <p className={`${isCurrentReadingAnomalous ? 'text-base font-bold' : 'text-lg font-semibold'} ${
                      isCurrentReadingAnomalous ? 'text-orange-500' :
                      readings && readings.length < 2 ? 'text-blue-500' :
                      (usage > 0 ? 'text-red-500' : 'text-green-500')
                    }`}>
                      {isCurrentReadingAnomalous ? 'Anomaly' :
                       readings && readings.length < 2 ? 'Baseline' :
                       `${usage > 0 ? '+' : ''}${config.utilityType === 'electricity' ? usage.toFixed(0) : usage.toFixed(1)} ${usageUnit}`}
                    </p>
                    <p className={`text-sm ${config.colors.secondary}`}>
                      {readings && readings.length < 2 ? 'First Reading' : 'vs Previous'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className={`flex justify-between text-sm ${config.colors.secondary}`}>
              <span>
                Previous: {previousReading ? `${previousReading.reading_value} ${usageUnit}` : 'N/A (First reading)'}
              </span>
            </div>
          </div>

          {/* Anomaly Detection Card - Collapsible */}
          {visibleAnomalies.length > 0 && (
            <Collapsible open={isAnomalyOpen} onOpenChange={setIsAnomalyOpen} className="mb-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-3xl shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white mb-1 text-left">
                        {getAnomalyInfo(visibleAnomalies[0]).title}
                      </h3>
                      <p className="text-red-100 text-left">{getAnomalyInfo(visibleAnomalies[0]).description}</p>
                      {visibleAnomalies.length > 1 && (
                        <p className="text-red-200 text-xs text-left mt-1">+ {visibleAnomalies.length - 1} more anomalies detected</p>
                      )}
                    </div>
                    {isAnomalyOpen ? (
                      <ChevronUp className="text-white" size={24} />
                    ) : (
                      <ChevronDown className="text-white" size={24} />
                    )}
                  </div>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="bg-white p-6 rounded-b-3xl shadow-sm">
                  {/* Individual anomaly cards */}
                  <div className="space-y-4">
                    {visibleAnomalies.map((anomaly: any, index: number) => (
                      <div key={anomaly.id || index} className="relative">
                        {/* Stack indicator for multiple anomalies */}
                        {visibleAnomalies.length > 1 && (
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-400 rounded-full border border-white z-10">
                            <span className="sr-only">Anomaly {index + 1} of {visibleAnomalies.length}</span>
                          </div>
                        )}
                        <UnifiedAnomalyAlert
                          anomaly={anomaly}
                          utilityType={config.utilityType}
                          variant="compact"
                          onDismiss={() => handleDismissAnomaly(anomaly.id)}
                          showFeedback={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Estimated Bill Card - Now Collapsible */}
          <Collapsible open={isBillOpen} onOpenChange={setIsBillOpen}>
            <div className={`bg-gradient-to-br ${config.colors.gradient} p-6 rounded-t-3xl shadow-sm`}>
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white mb-2">Estimated Bill</h3>
                    <p className="text-4xl font-bold text-white">₱{estimatedBill.toFixed(2)}</p>
                    <span className={`${config.colors.primary === 'blue' ? 'text-blue' : 'text-yellow'}-50 text-sm`}>
                      Monthly prediction
                    </span>
                  </div>
                  {isBillOpen ? (
                    <ChevronUp className="text-white" size={24} />
                  ) : (
                    <ChevronDown className="text-white" size={24} />
                  )}
                </div>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="bg-white p-6 rounded-b-3xl shadow-sm">
                {forecast ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Predicted Monthly Usage</span>
                      <span className="font-semibold">
                        {forecast.predicted_monthly_consumption.toFixed(1)} {config.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Predicted Avg Daily Cost</span>
                      <span className="font-semibold">₱{(forecast.predicted_monthly_cost / forecast.billing_cycle_days).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="font-semibold">{forecast.billing_cycle_days} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining Days</span>
                      <span className="font-semibold">{forecast.remaining_days} days</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 mt-3">
                      <p className="text-xs text-gray-500">
                        {modelInfo ? 'Based on your usage patterns' : 'Based on current rates'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Calculator className="text-gray-200 w-12 h-12 mb-4" />
                    <p className="text-gray-400 text-center">
                      Add more readings to see smart predictions
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

        </div>
      )}
    </div>
  );
};

export default MeterScanResults;