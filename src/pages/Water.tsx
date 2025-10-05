import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WaterSection from '@/components/layout/WaterSection';
import { useUserData } from '@/hooks/useUserData';
import { useWaterAnomalies } from '@/hooks/useWaterData';
import { useUserRates } from '@/hooks/useUserRates';
import { toast } from "@/hooks/use-toast";
import { Home, Droplet, Bolt, Settings } from 'lucide-react';

const Water = () => {
  const navigate = useNavigate();
  const { firstName, avatarUrl, isLoading } = useUserData();
  const { data: anomalies, isLoading: anomaliesLoading } = useWaterAnomalies(5);
  const { data: userRates, isLoading: pricingLoading } = useUserRates('water');

  // Extract pricing information from user rates
  const pricing = React.useMemo(() => {
    if (!userRates?.rates) return null;

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en', { month: 'long' }).toLowerCase();
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonth = previousDate.toLocaleString('en', { month: 'long' }).toLowerCase();

    // Get all basic charge tiers for current or previous month
    const currentMonthTiers = userRates.rates.filter(rate =>
      rate.rate_type === 'basic_charge' &&
      (rate.month_applicable === 'all' || rate.month_applicable === currentMonth)
    );

    // Fallback to previous month if no current month tiers
    const tiers = currentMonthTiers.length > 0 ? currentMonthTiers : userRates.rates.filter(rate =>
      rate.rate_type === 'basic_charge' &&
      (rate.month_applicable === 'all' || rate.month_applicable === previousMonth)
    );

    // Sort tiers by tier_min for proper display order
    const sortedTiers = tiers
      .filter(tier => tier.tier_min !== undefined)
      .sort((a, b) => (a.tier_min || 0) - (b.tier_min || 0))
      .map(tier => ({
        description: tier.tier_max === null || tier.tier_max === undefined || tier.tier_max > 900
          ? `${tier.tier_min} - above`
          : `${tier.tier_min}-${tier.tier_max}m³`,
        rate: tier.rate_value,
        min: tier.tier_min,
        max: tier.tier_max
      }));

    // Get base rate (first tier for main display)
    const baseRate = sortedTiers.length > 0 ? sortedTiers[0].rate : null;

    return {
      base_rate: baseRate,
      rate_type: tiers[0]?.description || 'Basic charge for residential',
      provider_name: userRates.provider?.name || 'Water Utility',
      tiers: sortedTiers
    };
  }, [userRates]);

  const capitalizedFirstName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : 'User';

  const handleAddWaterReading = () => {
    navigate('/water-monitoring');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-8 pt-6">
          <div>
            <h1 className="text-2xl font-bold text-[#212529] mb-1">Hi, {capitalizedFirstName} 👋</h1>
            <p className="text-gray-500">Welcome to Senso</p>
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatarUrl || ''} alt="Profile" />
            <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap">All</button>
            <button className="px-6 py-3 bg-[#212529] text-white rounded-full whitespace-nowrap">Water</button>
            <button onClick={() => navigate('/electricity')} className="px-6 py-3 bg-white text-[#212529] rounded-full whitespace-nowrap border-2 border-amber-200">Electricity</button>
          </div>
        </div>

        <div className="space-y-4">
          <WaterSection
            onAddReading={handleAddWaterReading}
          />

          {anomaliesLoading ? (
            <div className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : anomalies && Array.isArray(anomalies) && anomalies.length > 0 ? (
            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anomaly: any) => (
                <div key={anomaly.id} className={`p-6 rounded-3xl shadow-sm border ${
                  anomaly.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  anomaly.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                  anomaly.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      anomaly.severity === 'critical' ? 'bg-red-500' :
                      anomaly.severity === 'high' ? 'bg-orange-500' :
                      anomaly.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}>
                      <i className="fa-solid fa-triangle-exclamation text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${
                        anomaly.severity === 'critical' ? 'text-red-700' :
                        anomaly.severity === 'high' ? 'text-orange-700' :
                        anomaly.severity === 'medium' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)} Anomaly Detected
                      </h3>
                      <p className={`text-sm ${
                        anomaly.severity === 'critical' ? 'text-red-600' :
                        anomaly.severity === 'high' ? 'text-orange-600' :
                        anomaly.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {anomaly.contributing_factors?.reason ||
                         anomaly.contributing_factors?.alert ||
                         'Unusual consumption pattern detected'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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

          {pricingLoading ? (
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
                    ₱{pricing?.base_rate || '25.50'}/m³
                  </p>
                  <p className="text-sm text-gray-500">
                    {pricing?.rate_type || 'Base rate for residential'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-peso-sign text-blue-400"></i>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 mt-4">
                {pricing?.tiers && pricing.tiers.length > 0 ? (
                  pricing.tiers.map((tier: any, index: number) => (
                    <div key={index} className={`flex justify-between ${index > 0 ? 'mt-2' : ''}`}>
                      <span className="text-sm text-gray-600">{tier.description}</span>
                      <span className="text-sm font-semibold">₱{tier.rate}/m³</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-2">
                      <span>Basic Rate</span>
                      <span className="font-semibold">₱{pricing?.base_rate || '25.50'}/m³</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">No detailed tier structure available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
              onClick={() => navigate('/water')}
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
              onClick={() => navigate('/electricity')}
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

export default Water;
