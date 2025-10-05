import React from "react";
import { ChevronDown, Loader2, Keyboard } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import AnomaliesDialog from "./AnomaliesDialog";
import { useCleanDataForCharts } from "@/hooks/useAnomalyDetection";

interface MeterHistoryConfig {
  utilityType: 'electricity' | 'water';
  unit: string;
  defaultPrice: number;
  colors: {
    primary: string;
    chartColor: string;
    gradientId: string;
    loadingColor: string;
    buttonColor: string;
  };
  hooks: {
    useReadings: (limit: number) => { data: any; isLoading: boolean };
    useAnomalies: (limit: number) => { data: any; isLoading: boolean };
    useUsageAnalytics: (period: string, months: number) => { data: any; isLoading: boolean };
  };
}

interface MeterHistoryProps {
  config: MeterHistoryConfig;
}

const MeterHistory: React.FC<MeterHistoryProps> = React.memo(({ config }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showAnomalies, setShowAnomalies] = React.useState(false);

  // Fetch data from backend
  const { data: readings, isLoading: readingsLoading } = config.hooks.useReadings(12);
  const { data: anomalies, isLoading: anomaliesLoading } = config.hooks.useAnomalies(10);
  const { data: usageData, isLoading: usageLoading } = config.hooks.useUsageAnalytics('monthly', 6);
  const { data: cleanData, isLoading: cleanDataLoading } = useCleanDataForCharts(config.utilityType, 180); // 6 months

  // Get latest reading from the first item in readings array
  const latestReading = React.useMemo(() => {
    if (readings && readings.length > 0) {
      return readings[0];
    }
    return null;
  }, [readings]);

  // Process readings for display
  const previousReadings = React.useMemo(() => {
    if (!readings) return [];
    
    return readings.map((reading: any) => {
      const date = new Date(reading.capture_timestamp);
      const dateString = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      });
      
      // Check if this reading has accurate anomaly feedback
      const readingDate = new Date(reading.capture_timestamp).toLocaleDateString('en-CA');
      let isAnomalous = false;
      
      if (anomalies && Array.isArray(anomalies)) {
        const readingAnomalies = anomalies.filter((anomaly: any) => {
          if (!anomaly?.reading_id) return false;
          return anomaly.reading_id === reading.id;
        });

        // Check if any anomaly for this reading is actually anomalous
        isAnomalous = readingAnomalies.some((anomaly: any) =>
          anomaly.is_anomaly === true
        );
      }
      
      return {
        date: dateString,
        reading: reading.reading_value.toString(),
        unit: config.unit,
        isAnomalous
      };
    });
  }, [readings, config.unit, anomalies]);

  // Process anomalies for display
  const previousAnomalies = React.useMemo(() => {
    if (!anomalies) return [];

    return anomalies.map((anomaly: any) => {
      const factors = anomaly.contributing_factors || {};
      const reasonLower = (factors.reason || '').toLowerCase();
      const alertLower = (factors.alert || '').toLowerCase();

      // Extract numeric values safely
      const consumption = typeof factors.consumption === 'number' ? factors.consumption : factors.consumption?.value;
      const readingValue = typeof factors.reading_value === 'number' ? factors.reading_value : factors.reading_value?.value;
      const rollbackAmount = factors.rollback_amount;
      const currentReading = factors.current_reading;
      const prevReading = factors.previous_reading || factors.last_good_reading;

      let description = '';
      let type = `${anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)} Severity`;

      // Detect rollback anomalies
      if (reasonLower.includes('rollback') || alertLower.includes('rollback') ||
          reasonLower.includes('decrease') || reasonLower.includes('backwards')) {
        type = 'Meter Rollback';

        if (rollbackAmount && currentReading && prevReading) {
          description = `Meter decreased by ${Number(rollbackAmount).toFixed(2)} ${config.unit} from ${Number(prevReading).toFixed(2)} to ${Number(currentReading).toFixed(2)}. Possible meter replacement, reset, or tampering.`;
        } else if (factors.alert) {
          description = factors.alert;
        } else if (factors.reason) {
          description = factors.reason;
        } else {
          description = 'Meter reading went backwards - requires investigation.';
        }
      }
      // Detect spike/high consumption anomalies
      else if (reasonLower.includes('spike') || reasonLower.includes('sudden') ||
               reasonLower.includes('high') || reasonLower.includes('extreme')) {
        type = 'High Consumption';

        if (consumption) {
          description = `Consumption of ${Number(consumption).toFixed(2)} ${config.unit} is significantly higher than your typical usage.`;
        } else if (readingValue) {
          description = `Reading of ${Number(readingValue).toFixed(2)} ${config.unit} is unusually high.`;
        } else if (factors.reason) {
          description = factors.reason;
        } else {
          description = 'Consumption significantly higher than normal.';
        }
      }
      // Detect pattern-based anomalies
      else if (reasonLower.includes('pattern') || reasonLower.includes('unusual') ||
               reasonLower.includes('deviation')) {
        type = 'Unusual Pattern';

        if (consumption) {
          description = `Consumption of ${Number(consumption).toFixed(2)} ${config.unit} differs from your normal pattern.`;
        } else if (factors.reason) {
          description = factors.reason;
        } else {
          description = 'Usage pattern different from your normal consumption.';
        }
      }
      // Physical limits violations
      else if (reasonLower.includes('physical') || reasonLower.includes('limit')) {
        type = 'Physical Limit';
        description = factors.reason || factors.alert || 'Exceeds realistic consumption limits.';
      }
      // Default: Use backend-provided information
      else {
        // Try insights first
        if (factors.insights && Array.isArray(factors.insights) && factors.insights.length > 0) {
          description = factors.insights[0];
        }
        // Then alert
        else if (factors.alert) {
          description = factors.alert;
        }
        // Then reason
        else if (factors.reason) {
          description = factors.reason;
        }
        // Last fallback with actual consumption data if available
        else if (consumption) {
          description = `Consumption of ${Number(consumption).toFixed(2)} ${config.unit} detected outside normal range.`;
        } else if (readingValue) {
          description = `Reading of ${Number(readingValue).toFixed(2)} ${config.unit} flagged as anomalous.`;
        } else {
          description = `Anomalous ${config.utilityType} consumption detected.`;
        }
      }

      return {
        date: new Date(anomaly.detected_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        type,
        percentage: `${(Number(anomaly.anomaly_score) * 100).toFixed(1)}%`,
        description
      };
    });
  }, [anomalies, config.unit, config.utilityType]);

  // Process usage data for chart (using clean data only - excluding anomalies)
  const chartData = React.useMemo(() => {
    // Use clean data from API endpoint if available
    if (cleanData?.data && Array.isArray(cleanData.data) && cleanData.data.length > 0) {
      return cleanData.data.slice(0, 6).map((reading: any) => ({
        name: new Date(reading.capture_timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: reading.reading_value
      })).reverse();
    }
    
    // Fallback: use clean readings data with client-side filtering (exclude anomalous readings)
    if (readings && readings.length > 1) {
      const cleanReadings = readings.filter((reading: any) => {
        // Check if this reading has accurate anomaly feedback
        const readingDate = new Date(reading.capture_timestamp).toLocaleDateString('en-CA');
        
        if (anomalies && Array.isArray(anomalies)) {
          const readingAnomalies = anomalies.filter((anomaly: any) => {
            if (!anomaly?.reading_id) return false;
            return anomaly.reading_id === reading.id;
          });

          // Exclude readings that are actually anomalous
          const isAnomalous = readingAnomalies.some((anomaly: any) =>
            anomaly.is_anomaly === true
          );
          
          return !isAnomalous; // Only include non-anomalous readings
        }
        
        return true; // Include if no anomaly data available
      });
      
      return cleanReadings.slice(0, 6).map((reading: any) => ({
        name: new Date(reading.capture_timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: reading.reading_value
      })).reverse();
    }
    
    return [];
  }, [cleanData, readings, anomalies]);

  // Calculate statistics using clean data only
  const averageUsage = React.useMemo(() => {
    // Use clean data from API if available
    if (cleanData?.data && Array.isArray(cleanData.data) && cleanData.data.length > 0) {
      const totalUsage = cleanData.data.reduce((sum: number, reading: any) => sum + (Number(reading.reading_value) || 0), 0);
      return (totalUsage / cleanData.data.length).toFixed(1);
    }
    
    // Fallback: calculate from client-side filtered clean readings
    if (readings && readings.length > 0) {
      const cleanReadings = readings.filter((reading: any) => {
        const readingDate = new Date(reading.capture_timestamp).toLocaleDateString('en-CA');
        
        if (anomalies && Array.isArray(anomalies)) {
          const readingAnomalies = anomalies.filter((anomaly: any) => {
            if (!anomaly?.reading_id) return false;
            return anomaly.reading_id === reading.id;
          });

          const isAnomalous = readingAnomalies.some((anomaly: any) =>
            anomaly.is_anomaly === true
          );
          
          return !isAnomalous;
        }
        
        return true;
      });
      
      if (cleanReadings.length > 0) {
        const totalUsage = cleanReadings.reduce((sum: number, reading: any) => sum + (Number(reading.reading_value) || 0), 0);
        return (totalUsage / cleanReadings.length).toFixed(1);
      }
    }
    return '0';
  }, [cleanData, readings, anomalies]);

  const trend = React.useMemo(() => {
    // Use chartData (which now uses clean data only) for trend calculation
    if (!chartData || chartData.length < 2) return { value: 'Baseline', isPositive: true };
    
    const current = Number(chartData[chartData.length - 1]?.value) || 0;
    const previous = Number(chartData[chartData.length - 2]?.value) || 0;
    
    if (previous === 0) return { value: '0', isPositive: true };
    
    // Calculate the actual difference for clean readings
    const change = current - previous;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  }, [chartData]);

  // Only show full loading on initial load (when readings haven't loaded yet)
  if (readingsLoading && !readings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`h-8 w-8 animate-spin ${config.colors.loadingColor}`} />
        <span className="ml-2 text-gray-600">Loading {config.utilityType} data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-2xl font-bold text-[#212529] mb-6">History</h2>

      {/* Previous Readings Card */}
      <div className="bg-white rounded-3xl shadow-sm mb-6">
        <div className="bg-white p-6 rounded-t-3xl">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-[#212529]">Previous Readings</h3>
                <p className="text-sm text-gray-500">All readings</p>
              </div>
              {previousReadings.length > 3 && (
                <CollapsibleTrigger className="text-[#212529]">
                  <ChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
              )}
            </div>
            
            <div className="px-6 pt-4 pb-6 -mx-6 -mb-6 bg-white rounded-b-3xl">
              <div className="space-y-4 bg-gray-50 rounded-xl p-4 shadow-sm">
                {previousReadings.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#212529]">{item.date}</p>
                      <p className={`text-sm ${item.isAnomalous ? 'text-orange-500' : 'text-gray-500'}`}>
                        {item.isAnomalous ? 'Anomalous Reading' : 'Reading'}
                      </p>
                    </div>
                    <p className="font-medium text-[#212529]">{item.reading} {item.unit}</p>
                  </div>
                ))}
              </div>
              
              <CollapsibleContent>
                <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-xl p-4 shadow-sm">
                  {previousReadings.slice(3).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#212529]">{item.date}</p>
                        <p className={`text-sm ${item.isAnomalous ? 'text-orange-500' : 'text-gray-500'}`}>
                          {item.isAnomalous ? 'Anomalous Reading' : 'Reading'}
                        </p>
                      </div>
                      <p className="font-medium text-[#212529]">{item.reading} {item.unit}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>

      {/* Usage Trend Card */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#212529] mb-4">
          {config.utilityType === 'electricity' ? 'Electricity' : 'Water'} Usage Trend
        </h3>
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={config.colors.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.colors.chartColor} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={config.colors.chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => `${value}${config.unit}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={config.colors.chartColor}
                fill={`url(#${config.colors.gradientId})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Average Usage:</span>
            <span className="font-medium">{averageUsage} {config.unit}/day</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Trend:</span>
            <span className={trend.value === 'Baseline' ? "text-blue-500" : (trend.isPositive ? "text-red-500" : "text-green-500")}>
              {trend.value === 'Baseline' ? 'Baseline reading' : `${trend.isPositive ? "+" : "-"}${trend.value}${usageData?.data_points ? '% vs last day' : ` ${config.unit} vs previous`}`}
            </span>
          </div>
        </div>
      </div>

      {/* Previous Anomaly Alerts Card */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#212529]">Previous Anomaly Alerts</h3>
          {previousAnomalies.length > 0 && (
            <button
              onClick={() => setShowAnomalies(true)}
              className={`text-sm font-medium ${config.colors.buttonColor} transition-colors`}
            >
              View All
            </button>
          )}
        </div>
        <div className="space-y-4">
          {previousAnomalies.length > 0 ? (
            previousAnomalies.slice(0, 2).map((anomaly, index) => (
              <div key={index} className="p-4 bg-red-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-red-600">{anomaly.type}</p>
                    <p className="text-sm text-gray-500">{anomaly.date}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                    {anomaly.percentage}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{anomaly.description}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No anomalies detected</p>
              <p className="text-sm">Your {config.utilityType} usage patterns look normal</p>
            </div>
          )}
        </div>
      </div>

      {/* Previous Images Card */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#212529]">Previous Images</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {readings?.slice(0, 6).map((reading: any, index: number) => (
            <div key={reading.id || index} className="aspect-square rounded-xl bg-gray-100">
              {reading.image_data ? (
                <img
                  className="w-full h-full rounded-xl object-cover"
                  src={reading.image_data.startsWith('data:') ? reading.image_data : `data:image/jpeg;base64,${reading.image_data}`}
                  alt={`${config.utilityType} meter reading from ${new Date(reading.capture_timestamp).toLocaleDateString()}`}
                  onError={(e) => {
                    const placeholderText = reading.is_manual ? 'Manual+Input' : 'No+Image';
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x200/f3f4f6/9ca3af?text=${placeholderText}`;
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gray-200 flex flex-col items-center justify-center gap-2">
                  {reading.is_manual ? (
                    <>
                      <Keyboard className="text-gray-400" size={24} />
                      <span className="text-gray-400 text-xs">Manual Input</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">No Image</span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(reading.capture_timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )) || (
            <div className="col-span-2 text-center py-8 text-gray-500">
              <p>No previous images available</p>
              <p className="text-sm">Take your first meter reading to see images here</p>
            </div>
          )}
        </div>
      </div>

      <AnomaliesDialog
        open={showAnomalies}
        onOpenChange={setShowAnomalies}
        anomalies={previousAnomalies}
        utilityType={config.utilityType}
      />
    </div>
  );
});

MeterHistory.displayName = 'MeterHistory';

export default MeterHistory;