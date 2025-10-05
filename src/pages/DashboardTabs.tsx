
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WaterSection from '@/components/layout/WaterSection';
import ElectricitySection from '@/components/layout/ElectricitySection';
import SimplifiedWaterForecast from '@/components/shared/SimplifiedWaterForecast';
import SimplifiedElectricityForecast from '@/components/shared/SimplifiedElectricityForecast';
import { useUserData } from '@/hooks/useUserData';
import { useBatchDashboardData } from '@/hooks/useBatchDashboardData';
import { useUserRates } from '@/hooks/useUserRates';
import { Card } from "@/components/ui/card";
import { Home, Droplet, Bolt, Settings } from 'lucide-react';
import { prefetchMonitoring, prefetchProfile } from '@/utils/routePrefetch';
import { useAuthContext } from '@/hooks/useAuthContext';

type TabType = "all" | "water" | "electricity";

const DashboardTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { firstName, avatarUrl, isLoading } = useUserData();

  // Single batch API call for all dashboard data
  const { data: batchData, isLoading: batchLoading } = useBatchDashboardData();

  // Pricing data (separate calls as they're from different table)
  const { data: waterRates, isLoading: waterPricingLoading } = useUserRates('water');
  const { data: electricityRates, isLoading: electricityPricingLoading } = useUserRates('electricity');

  // Extract data from batch response
  const waterAnomalies = batchData?.water?.anomalies || [];
  const electricityAnomalies = batchData?.electricity?.anomalies || [];
  const waterAnomaliesLoading = batchLoading;
  const electricityAnomaliesLoading = batchLoading;

  // Extract pricing information from user rates
  const waterPricing = React.useMemo(() => {
    if (!waterRates?.rates) return null;

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en', { month: 'long' }).toLowerCase();
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonth = previousDate.toLocaleString('en', { month: 'long' }).toLowerCase();

    // Get all water charge tiers for current or previous month
    const currentMonthTiers = waterRates.rates.filter(rate =>
      rate.rate_type === 'basic_charge' &&
      (!rate.month_applicable || rate.month_applicable === 'all' || rate.month_applicable === currentMonth)
    );

    // Fallback to previous month if no current month tiers
    const tiers = currentMonthTiers.length > 0 ? currentMonthTiers : waterRates.rates.filter(rate =>
      rate.rate_type === 'basic_charge' &&
      (!rate.month_applicable || rate.month_applicable === 'all' || rate.month_applicable === previousMonth)
    );

    // Sort tiers by tier_min for proper display order
    const sortedTiers = tiers
      .filter(tier => tier.tier_min !== undefined)
      .sort((a, b) => (a.tier_min || 0) - (b.tier_min || 0))
      .map(tier => ({
        description: tier.tier_max === null || tier.tier_max === undefined || tier.tier_max > 900
          ? `${tier.tier_min} - above`
          : `${tier.tier_min}-${tier.tier_max}m³`,
        rate: tier.rate_value
      }));

    // Get base rate (first tier for main display)
    const baseRate = sortedTiers.length > 0 ? sortedTiers[0].rate : null;

    return {
      base_rate: baseRate,
      rate_type: tiers[0]?.description || 'Basic charge for residential',
      tiers: sortedTiers
    };
  }, [waterRates]);

  const electricityPricing = React.useMemo(() => {
    if (!electricityRates?.rates) return null;

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en', { month: 'long' }).toLowerCase();
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonth = previousDate.toLocaleString('en', { month: 'long' }).toLowerCase();

    // Get generation charge for main display
    const generationCharge = electricityRates.rates.find(rate =>
      rate.rate_type === 'generation_charge' &&
      (!rate.month_applicable || rate.month_applicable === 'all' || rate.month_applicable === currentMonth)
    ) || electricityRates.rates.find(rate =>
      rate.rate_type === 'generation_charge' &&
      (!rate.month_applicable || rate.month_applicable === 'all' || rate.month_applicable === previousMonth)
    );

    // Get all distribution charges for current or previous month
    const currentMonthDistribution = electricityRates.rates.filter(rate =>
      rate.rate_type === 'distribution_charge' &&
      (!rate.month_applicable || rate.month_applicable === 'all' || rate.month_applicable === currentMonth)
    );

    // Fallback to previous month if no current month distribution charges
    const distributionCharges = currentMonthDistribution.length > 0 ? currentMonthDistribution : electricityRates.rates.filter(rate =>
      rate.rate_type === 'distribution_charge' &&
      (!rate.month_applicable || rate.month_applicable === 'all' || rate.month_applicable === previousMonth)
    );

    // Create tiers from distribution charges - use description directly
    const tiers = distributionCharges.map(charge => {
      let description = charge.description;

      // If no description, create a clean tier description
      if (!description && charge.tier_min !== undefined) {
        description = charge.tier_max === null || charge.tier_max === undefined || charge.tier_max > 9999
          ? `${charge.tier_min} - above`
          : `${charge.tier_min}-${charge.tier_max}kWh`;
      }

      return {
        description: description || `Distribution Charge`,
        rate: charge.rate_value,
        tier_min: charge.tier_min
      };
    }).sort((a, b) => {
      // Sort by tier_min if available, otherwise by description
      if (a.tier_min !== undefined && b.tier_min !== undefined) {
        return (a.tier_min || 0) - (b.tier_min || 0);
      }
      return a.description.localeCompare(b.description);
    });

    return {
      base_rate: generationCharge?.rate_value || null,
      rate_type: generationCharge?.description || 'Generation charge for residential',
      tiers: tiers
    };
  }, [electricityRates]);

  // Determine selected tab by path (so url stays in sync)
  const tab: TabType = useMemo(() => {
    if (location.pathname === "/water") return "water";
    if (location.pathname === "/electricity") return "electricity";
    return "all"; // default is dashboard
  }, [location.pathname]);

  // Format anomaly details like MeterHistory
  const getAnomalyDisplayInfo = (anomaly: any) => {
    const factors = anomaly.contributing_factors;
    let title = 'Anomaly Detected';
    let description = 'Unusual consumption pattern detected';

    // Use specific titles and descriptions based on anomaly type
    if (factors?.reason?.includes('rollback')) {
      title = 'Rollback Detected';
      description = 'Meter reading went backwards - possible malfunction';
    } else if (factors?.reason?.includes('physical') || factors?.reason?.includes('Extreme')) {
      title = 'Extreme Reading';
      description = 'Reading exceeds realistic consumption limits';
    } else if (factors?.reason?.includes('pattern') || factors?.reason?.includes('consumption')) {
      title = 'Unusual Pattern';
      description = 'Usage pattern differs significantly from normal';
    } else if (factors?.insights?.[0]) {
      description = factors.insights[0];
    }

    return {
      title,
      severity: anomaly.severity,
      confidence: `${(Number(anomaly.anomaly_score) * 100).toFixed(1)}%`,
      date: new Date(anomaly.detected_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      description
    };
  };

  // Get smart suggestions for dashboard anomaly cards
  const getAnomalySuggestion = (anomaly: any, utilityType: 'water' | 'electricity') => {
    try {
      const recommendations = anomalyRecommendationEngine.generateRecommendations(
        anomaly,
        utilityType
      );

      // Return the most urgent action with priority indicator
      const priorityAction = recommendations.prioritizedActions[0];
      const immediateAction = recommendations.immediate[0];

      return {
        action: priorityAction?.action || immediateAction || 'Check usage patterns',
        urgency: recommendations.urgencyLevel,
        timeframe: priorityAction?.timeframe || 'immediate',
        priority: priorityAction?.priority || 'medium'
      };
    } catch (error) {
      console.error('Error getting anomaly suggestion:', error);
      return {
        action: 'Check your meter and usage patterns',
        urgency: 'medium',
        timeframe: 'today',
        priority: 'medium'
      };
    }
  };

  // Strong memoization of user data to prevent UI flickering
  const userAvatar = useMemo(() => {
    const capitalizedFirstName = firstName 
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1) 
      : 'User';
    
    return (
      <>
        <div>
          <h1 className="text-2xl font-bold text-[#212529] mb-1">
            Hi, {capitalizedFirstName}
          </h1>
          <p className="text-gray-500">Welcome to Senso</p>
        </div>
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatarUrl || ''} alt="Profile" />
          <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
        </Avatar>
      </>
    );
  }, [firstName, avatarUrl]);

  // Redirect to monitoring pages instead of showing toast
  const handleAddWaterReading = () => {
    navigate('/water-monitoring');
  };

  const handleAddElectricityReading = () => {
    navigate('/electricity-monitoring');
  };

  // NAV: Only "Home" is highlighted, Water/Electric/Electricity always default
  return (
    <div className="min-h-screen bg-[#f5f6f7] relative pt-6">
      <div className="px-6 pb-32">
        {/* Shared Top Header - Now fully memoized to prevent refreshing */}
        <div className="flex justify-between items-center mb-8 pt-0">
          {userAvatar}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigate('/dashboard')}
              className={
                "px-6 py-3 rounded-full whitespace-nowrap transition-colors duration-150 " +
                (tab === "all"
                  ? "bg-[#212529] text-white"
                  : "bg-white text-[#212529] border-2 border-gray-200 hover:bg-gray-100")
              }
              type="button"
              tabIndex={0}
            >
              All
            </button>
            <button
              onClick={() => navigate('/water')}
              className={
                "px-6 py-3 rounded-full whitespace-nowrap transition-colors duration-150 " +
                (tab === "water"
                  ? "bg-[#212529] text-white"
                  : "bg-white text-[#212529] border-2 border-blue-200 hover:bg-blue-50")
              }
              type="button"
              tabIndex={0}
            >
              Water
            </button>
            <button
              onClick={() => navigate('/electricity')}
              className={
                "px-6 py-3 rounded-full whitespace-nowrap transition-colors duration-150 " +
                (tab === "electricity"
                  ? "bg-[#212529] text-white"
                  : "bg-white text-[#212529] border-2 border-amber-200 hover:bg-amber-50")
              }
              type="button"
              tabIndex={0}
            >
              Electricity
            </button>
          </div>
        </div>

        {/* Tabbed Content - Instant switching */}
        <div className="space-y-4">
          {tab === "all" && (
            <>
              <WaterSection
                onAddReading={handleAddWaterReading}
                latestReading={batchData?.water?.reading}
                anomalies={waterAnomalies}
                isLoading={batchLoading}
              />
              <ElectricitySection
                onAddReading={handleAddElectricityReading}
                latestReading={batchData?.electricity?.reading}
                anomalies={electricityAnomalies}
                isLoading={batchLoading}
              />
              <SimplifiedWaterForecast />
              <SimplifiedElectricityForecast />
            </>
          )}

          {tab === "water" && (
            <>
              <WaterSection
                onAddReading={() => navigate('/water-monitoring')}
                latestReading={batchData?.water?.reading}
                anomalies={waterAnomalies}
                isLoading={batchLoading}
              />
              {waterAnomaliesLoading ? (
                <div className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : waterAnomalies && Array.isArray(waterAnomalies) && waterAnomalies.length > 0 ? (
                <div className="space-y-3">
                  {waterAnomalies.slice(0, 3).map((anomaly: any) => {
                    const info = getAnomalyDisplayInfo(anomaly);
                    return (
                      <Card key={anomaly.id} className={`p-6 rounded-3xl shadow-sm border ${
                        info.severity === 'critical' ? 'bg-red-500 border-red-400' :
                        info.severity === 'high' ? 'bg-orange-500 border-orange-400' :
                        info.severity === 'medium' ? 'bg-yellow-500 border-yellow-400' :
                        'bg-blue-500 border-blue-400'
                      }`}>
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-triangle-exclamation text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1">
                              {info.title}
                            </h3>
                            <p className="text-sm text-white text-opacity-90">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

              ) : (
                <div className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-check text-gray-500"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-700 mb-1">No anomalies detected</h3>
                      <p className="text-sm text-gray-500">Your water usage is within normal range</p>
                    </div>
                  </div>
                </div>
              )}
              {waterPricingLoading ? (
                <div className="bg-white p-6 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 rounded mb-2 animate-pulse"></div>
                      <div className="h-8 bg-gray-300 rounded mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 mt-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Water Prices</h3>
                      <p className="text-2xl font-bold text-[#212529]">
                        ₱{waterPricing?.base_rate || '25.50'}/m³
                      </p>
                      <p className="text-sm text-gray-500">
                        {waterPricing?.rate_type || 'Base rate for residential'}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-peso-sign text-blue-400"></i>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 mt-4">
                    {waterPricing?.tiers && waterPricing.tiers.length > 0 ? (
                      waterPricing.tiers.map((tier: any, index: number) => (
                        <div key={index} className={`flex justify-between ${index > 0 ? 'mt-2' : ''}`}>
                          <span className="text-sm text-gray-600">{tier.description}</span>
                          <span className="text-sm font-semibold">₱{tier.rate}/m³</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between mb-2">
                          <span>Basic Rate</span>
                          <span className="font-semibold">₱{waterPricing?.base_rate || '25.50'}/m³</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">No detailed tier structure available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "electricity" && (
            <>
              <ElectricitySection
                onAddReading={handleAddElectricityReading}
                latestReading={batchData?.electricity?.reading}
                anomalies={electricityAnomalies}
                isLoading={batchLoading}
              />
              {electricityAnomaliesLoading ? (
                <Card className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              ) : electricityAnomalies && Array.isArray(electricityAnomalies) && electricityAnomalies.length > 0 ? (
                <div className="space-y-3">
                  {electricityAnomalies.slice(0, 3).map((anomaly: any) => {
                    const info = getAnomalyDisplayInfo(anomaly);
                    return (
                      <Card key={anomaly.id} className={`p-6 rounded-3xl shadow-sm border ${
                        info.severity === 'critical' ? 'bg-red-500 border-red-400' :
                        info.severity === 'high' ? 'bg-orange-500 border-orange-400' :
                        info.severity === 'medium' ? 'bg-yellow-500 border-yellow-400' :
                        'bg-blue-500 border-blue-400'
                      }`}>
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-triangle-exclamation text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1">
                              {info.title}
                            </h3>
                            <p className="text-sm text-white text-opacity-90">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

              ) : (
                <Card className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-check text-gray-500"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-700 mb-1">No anomalies detected</h3>
                      <p className="text-sm text-gray-500">Your electricity usage is within normal range</p>
                    </div>
                  </div>
                </Card>
              )}
              {electricityPricingLoading ? (
                <Card className="bg-white p-6 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 rounded mb-2 animate-pulse"></div>
                      <div className="h-8 bg-gray-300 rounded mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 mt-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-white p-6 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Electricity Rates</h3>
                      <p className="text-2xl font-bold text-[#212529]">
                        ₱{electricityPricing?.base_rate || '9.50'}/kWh
                      </p>
                      <p className="text-sm text-gray-500">
                        {electricityPricing?.rate_type || 'Base rate for residential'}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-peso-sign text-amber-400" />
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 mt-4">
                    {electricityPricing?.tiers && electricityPricing.tiers.length > 0 ? (
                      electricityPricing.tiers.map((tier: any, index: number) => (
                        <div key={index} className={`flex justify-between ${index > 0 ? 'mt-2' : ''}`}>
                          <span className="text-sm text-gray-600">{tier.description}</span>
                          <span className="text-sm font-semibold">₱{tier.rate}/kWh</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between mb-2">
                          <span>Generation Charge</span>
                          <span className="font-semibold">₱{electricityPricing?.base_rate || '9.50'}/kWh</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">No detailed distribution charges available</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Nav - Home is always highlighted (active), others are always default */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <div className="bg-[#212529] rounded-full px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div
              className="flex flex-col items-center gap-1 group cursor-default"
              tabIndex={0}
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-white" />
              </div>
              <span className="text-xs font-medium text-white">Home</span>
            </div>
            <button
              onClick={() => navigate('/water-monitoring')}
              onMouseEnter={() => user?.id && prefetchMonitoring(queryClient, user.id, 'water')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Droplet className="text-gray-400 group-hover:text-blue-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Water</span>
            </button>
            <button
              onClick={() => navigate('/electricity-monitoring')}
              onMouseEnter={() => user?.id && prefetchMonitoring(queryClient, user.id, 'electricity')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-amber-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Bolt className="text-gray-400 group-hover:text-amber-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">Electric</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              onMouseEnter={() => user?.id && prefetchProfile(queryClient, user.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-150">
                <Settings className="text-gray-400 group-hover:text-gray-600" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTabs;

