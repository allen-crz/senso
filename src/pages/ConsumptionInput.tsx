import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplet, Zap, Calendar, TrendingUp, Info } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface MonthlyConsumption {
  month: string;
  consumption: number;
}

interface BillingInfo {
  billing_date: number | null;
  last_bill_reading: number | null;
  last_bill_date: string | null;
}

const ConsumptionInput = () => {
  const navigate = useNavigate();
  // Carousel API for navigation
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // Button states
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Water settings
  const [waterMonthCount, setWaterMonthCount] = useState<number>(0);
  const [waterSelectedMonths, setWaterSelectedMonths] = useState<string[]>([]);
  const [waterData, setWaterData] = useState<MonthlyConsumption[]>([]);

  // Electricity settings
  const [electricityMonthCount, setElectricityMonthCount] = useState<number>(0);
  const [electricitySelectedMonths, setElectricitySelectedMonths] = useState<string[]>([]);
  const [electricityData, setElectricityData] = useState<MonthlyConsumption[]>([]);

  // Billing information
  const [waterBilling, setWaterBilling] = useState<BillingInfo>({
    billing_date: null,
    last_bill_reading: null,
    last_bill_date: null
  });
  const [electricityBilling, setElectricityBilling] = useState<BillingInfo>({
    billing_date: null,
    last_bill_reading: null,
    last_bill_date: null
  });

  // Carousel setup
  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // All available months in chronological order
  const availableMonths = [
    'January 2025', 'February 2025', 'March 2025', 'April 2025',
    'May 2025', 'June 2025', 'July 2025', 'August 2025',
    'September 2025', 'October 2025', 'November 2025', 'December 2025'
  ];

  // Helper functions for month selection
  const handleMonthSelection = (month: string, type: 'water' | 'electricity') => {
    if (type === 'water') {
      if (waterSelectedMonths.includes(month)) {
        setWaterSelectedMonths(prev => prev.filter(m => m !== month));
        setWaterData([]); // Clear data when deselecting
      } else if (waterSelectedMonths.length < waterMonthCount) {
        const newSelected = [...waterSelectedMonths, month];
        setWaterSelectedMonths(newSelected);

        // Auto-generate input fields when selection is complete
        if (newSelected.length === waterMonthCount) {
          const initData = newSelected.map(month => ({ month, consumption: 0 }));
          setWaterData(initData);
        }
      }
    } else {
      if (electricitySelectedMonths.includes(month)) {
        setElectricitySelectedMonths(prev => prev.filter(m => m !== month));
        setElectricityData([]); // Clear data when deselecting
      } else if (electricitySelectedMonths.length < electricityMonthCount) {
        const newSelected = [...electricitySelectedMonths, month];
        setElectricitySelectedMonths(newSelected);

        // Auto-generate input fields when selection is complete
        if (newSelected.length === electricityMonthCount) {
          const initData = newSelected.map(month => ({ month, consumption: 0 }));
          setElectricityData(initData);
        }
      }
    }
  };

  const initializeDataForSelectedMonths = (type: 'water' | 'electricity') => {
    if (type === 'water' && waterSelectedMonths.length === waterMonthCount) {
      const initData = waterSelectedMonths.map(month => ({ month, consumption: 0 }));
      setWaterData(initData);
    } else if (type === 'electricity' && electricitySelectedMonths.length === electricityMonthCount) {
      const initData = electricitySelectedMonths.map(month => ({ month, consumption: 0 }));
      setElectricityData(initData);
    }
  };

  const updateConsumption = (
    type: 'water' | 'electricity',
    monthIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;

    if (type === 'water') {
      const newData = [...waterData];
      newData[monthIndex].consumption = numValue;
      setWaterData(newData);
    } else {
      const newData = [...electricityData];
      newData[monthIndex].consumption = numValue;
      setElectricityData(newData);
    }
  };

  const hasValidData = () => {
    const waterFilled = waterData.some(item => item.consumption > 0);
    const electricityFilled = electricityData.some(item => item.consumption > 0);
    return waterFilled || electricityFilled;
  };

  // Progress bar click handler
  const handleProgressBarClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  const getStepTitle = () => {
    switch (current) {
      case 0: return 'Historical Usage';
      case 1: return 'Historical Usage';
      case 2: return 'Billing Configuration';
      case 3: return 'Billing Configuration';
      case 4: return 'Setup Review';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (current) {
      case 0: return 'Enter your water consumption history';
      case 1: return 'Enter your electricity consumption history';
      case 2: return 'Configure your water billing cycle';
      case 3: return 'Configure your electricity billing cycle';
      case 4: return 'Review and confirm your settings';
      default: return '';
    }
  };

  const getStepTheme = () => {
    switch (current) {
      case 0: return {
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-400',
        icon: <Droplet className="text-blue-400" />,
        cardBorder: 'border-blue-200',
        cardBg: 'bg-blue-50',
        buttonBg: 'bg-blue-500 hover:bg-blue-600',
        accentColor: 'text-blue-600',
        lightBg: 'bg-blue-100'
      };
      case 1: return {
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-400',
        icon: <Zap className="text-yellow-400" />,
        cardBorder: 'border-yellow-200',
        cardBg: 'bg-yellow-50',
        buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
        accentColor: 'text-yellow-600',
        lightBg: 'bg-yellow-100'
      };
      case 2: return {
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-400',
        icon: <Droplet className="text-blue-400" />,
        cardBorder: 'border-blue-200',
        cardBg: 'bg-blue-50',
        buttonBg: 'bg-blue-500 hover:bg-blue-600',
        accentColor: 'text-blue-600',
        lightBg: 'bg-blue-100'
      };
      case 3: return {
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-400',
        icon: <Zap className="text-yellow-400" />,
        cardBorder: 'border-yellow-200',
        cardBg: 'bg-yellow-50',
        buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
        accentColor: 'text-yellow-600',
        lightBg: 'bg-yellow-100'
      };
      case 4: return {
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        icon: <TrendingUp className="text-gray-600" />,
        cardBorder: 'border-gray-200',
        cardBg: 'bg-white',
        buttonBg: 'bg-[#212529] hover:bg-[#303338]',
        accentColor: 'text-gray-700',
        lightBg: 'bg-gray-50'
      };
      default: return {
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        icon: <TrendingUp className="text-gray-600" />,
        cardBorder: 'border-gray-200',
        cardBg: 'bg-white',
        buttonBg: 'bg-[#212529] hover:bg-[#303338]',
        accentColor: 'text-gray-700',
        lightBg: 'bg-gray-50'
      };
    }
  };

  // Render month selection and input for a specific utility type
  const renderUtilitySection = (type: 'water' | 'electricity') => {
    const isWater = type === 'water';
    const monthCount = isWater ? waterMonthCount : electricityMonthCount;
    const selectedMonths = isWater ? waterSelectedMonths : electricitySelectedMonths;
    const data = isWater ? waterData : electricityData;
    const unit = isWater ? 'm³' : 'kWh';
    const color = isWater ? 'blue' : 'amber';

    // If data is ready, only show input fields
    if (data.length > 0) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">
              Enter your monthly {type} usage in {unit}
            </Label>
            <button
              onClick={() => {
                if (isWater) {
                  setWaterData([]);
                  setWaterSelectedMonths([]);
                  setWaterMonthCount(0);
                } else {
                  setElectricityData([]);
                  setElectricitySelectedMonths([]);
                  setElectricityMonthCount(0);
                }
              }}
              className={`inline-flex items-center gap-1 text-xs ${getStepTheme().accentColor} hover:opacity-70 font-medium`}
            >
              ← Change selection
            </button>
          </div>
          {renderConsumptionInputs(data, type, unit)}

          {/* Confirm button after entering data */}
          <div className="mt-6">
            <Button
              onClick={async () => {
                if (api && !isTransitioning) {
                  setIsTransitioning(true);
                  api.scrollTo(current + 1);
                  // Reset transition state after animation
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              disabled={isTransitioning}
              className={`w-full ${getStepTheme().buttonBg} text-white py-3 disabled:opacity-50`}
            >
              {isTransitioning ? 'Moving to next...' : 'Confirm & Continue'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Step 1: How many months */}
        <div className="space-y-3">
          <Label className="text-sm text-gray-600">
            How many months of {type} data do you have? (1-12)
          </Label>
          <Input
            type="number"
            min="1"
            max="12"
            value={monthCount || ''}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              if (isWater) {
                setWaterMonthCount(count);
                setWaterSelectedMonths([]);
                setWaterData([]);
              } else {
                setElectricityMonthCount(count);
                setElectricitySelectedMonths([]);
                setElectricityData([]);
              }
            }}
            placeholder="Enter number of months"
            className="text-center"
          />
        </div>

        {/* Step 2: Month selection */}
        {monthCount > 0 && (
          <div className="space-y-3">
            <Label className="text-sm text-gray-600">
              Select {monthCount} months ({selectedMonths.length}/{monthCount} selected)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {availableMonths.map((month) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelection(month, type)}
                  disabled={!selectedMonths.includes(month) && selectedMonths.length >= monthCount}
                  className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                    selectedMonths.includes(month)
                      ? `${getStepTheme().buttonBg.split(' ')[0]} text-white ${getStepTheme().cardBorder}`
                      : selectedMonths.length >= monthCount
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : `bg-white text-gray-700 border-gray-200 hover:${getStepTheme().lightBg}`
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>

            {selectedMonths.length === monthCount && data.length === 0 && (
              <div className={`mt-2 p-2 ${getStepTheme().lightBg} rounded-lg text-center`}>
                <span className={`text-sm ${getStepTheme().accentColor} font-medium`}>
                  ✓ Input fields will appear automatically
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleContinue = async () => {
    if (!hasValidData()) {
      toast({
        title: "Input Required",
        description: "Please enter consumption data for at least one utility type.",
        variant: "destructive",
      });
      return;
    }

    // Store consumption data and billing info in localStorage for now
    localStorage.setItem('consumptionData', JSON.stringify({
      water: waterData.filter(item => item.consumption > 0),
      electricity: electricityData.filter(item => item.consumption > 0),
    }));

    localStorage.setItem('billingData', JSON.stringify({
      water: waterBilling,
      electricity: electricityBilling
    }));

    // Navigate to provider selection
    navigate('/provider-selection');
  };

  // Render billing information step for a specific utility type
  const renderBillingStep = (type: 'water' | 'electricity') => {
    const billing = type === 'water' ? waterBilling : electricityBilling;
    const setBilling = type === 'water' ? setWaterBilling : setElectricityBilling;
    const hasData = type === 'water' ? waterData.length > 0 : electricityData.length > 0;
    const unit = type === 'water' ? 'm³' : 'kWh';

    if (!hasData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No {type} consumption data entered. Billing setup will be skipped for {type}.
          </p>
          <Button
            onClick={async () => {
              if (api && !isTransitioning) {
                setIsTransitioning(true);
                api.scrollTo(current + 1);
                setTimeout(() => setIsTransitioning(false), 500);
              }
            }}
            disabled={isTransitioning}
            className={`mt-4 ${getStepTheme().buttonBg} text-white py-2 px-6`}
          >
            Skip to Next
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Billing Date Selection */}
        <div className="space-y-3">
          <Label className="text-sm text-gray-600">
            What date do you typically receive your {type} bill each month?
          </Label>

          {/* Selected date display with edit option */}
          {billing.billing_date ? (
            <div className={`p-4 rounded-lg border ${getStepTheme().cardBorder} ${getStepTheme().lightBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${getStepTheme().accentColor}`}>
                    {billing.billing_date}{billing.billing_date === 1 ? 'st' : billing.billing_date === 2 ? 'nd' : billing.billing_date === 3 ? 'rd' : 'th'} of each month
                  </p>
                  <p className="text-xs text-gray-500">Billing date selected</p>
                </div>
                <button
                  onClick={() => setBilling(prev => ({ ...prev, billing_date: null }))}
                  className={`text-xs ${getStepTheme().accentColor} hover:opacity-70 font-medium underline`}
                >
                  Change Date
                </button>
              </div>
            </div>
          ) : (
            // Calendar grid - only show when no date is selected
            <div className="space-y-3">
              {/* Week headers for better alignment */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="text-xs font-medium text-gray-400 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days grid */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    onClick={() => setBilling(prev => ({ ...prev, billing_date: day }))}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
                      billing.billing_date === day
                        ? `${getStepTheme().buttonBg.split(' ')[0]} text-white`
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}

                {/* Fill remaining cells to complete the grid */}
                {Array.from({ length: (7 - (31 % 7)) % 7 }, (_, i) => (
                  <div key={`empty-${i}`} className="p-3 min-h-[44px]"></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optional Bill Reading */}
        {billing.billing_date && (
          <div className="space-y-3">
            <Label className="text-sm text-gray-600">
              Do you have your most recent {type} bill handy? (Optional but recommended)
            </Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 font-medium">
                  Meter reading from your last bill ({unit})
                </Label>
                <Input
                  type="number"
                  placeholder={`Enter reading in ${unit} (optional)`}
                  value={billing.last_bill_reading || ''}
                  onChange={(e) => setBilling(prev => ({
                    ...prev,
                    last_bill_reading: parseFloat(e.target.value) || null
                  }))}
                  className="text-right"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500">
                  This helps us track your full billing cycle consumption, especially if you're joining mid-cycle.
                </p>
              </div>

              {billing.last_bill_reading && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 font-medium">
                    Date of that bill (recommended)
                  </Label>
                  <Input
                    type="date"
                    value={billing.last_bill_date || ''}
                    onChange={(e) => setBilling(prev => ({
                      ...prev,
                      last_bill_date: e.target.value || null
                    }))}
                    className="text-right"
                    style={{
                      textAlign: 'right',
                      paddingRight: '12px',
                      justifyContent: 'flex-end',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500">
                    Should match your billing cycle start date (around the {billing.billing_date}{billing.billing_date === 1 ? 'st' : billing.billing_date === 2 ? 'nd' : billing.billing_date === 3 ? 'rd' : 'th'} of the month)
                  </p>
                </div>
              )}
            </div>

            <div className={`p-3 rounded-lg ${getStepTheme().lightBg} text-sm`}>
              {billing.last_bill_reading ? (
                <div className="text-gray-700">
                  We'll track your full billing cycle consumption for accurate anomaly detection and forecasting.
                </div>
              ) : (
                <div className="text-gray-700">
                  We'll start tracking from your first meter reading. If you're mid-cycle, we won't have consumption data from the start of this cycle.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {billing.billing_date && (
          <div className="mt-6">
            <Button
              onClick={async () => {
                if (api && !isTransitioning) {
                  setIsTransitioning(true);
                  api.scrollTo(current + 1);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              disabled={isTransitioning}
              className={`w-full ${getStepTheme().buttonBg} text-white py-3`}
            >
              {isTransitioning ? 'Moving to next...' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderConsumptionInputs = (
    data: MonthlyConsumption[],
    type: 'water' | 'electricity',
    unit: string
  ) => {
    return (
      <div className="grid grid-cols-1 gap-4">
        {data.map((item, index) => (
          <div key={item.month} className={`flex items-center gap-4 p-4 ${getStepTheme().lightBg} rounded-lg border ${getStepTheme().cardBorder}`}>
            <div className="flex items-center gap-2 flex-1">
              <Calendar className={`w-4 h-4 ${getStepTheme().accentColor}`} />
              <Label className={`min-w-[80px] font-medium ${getStepTheme().accentColor}`}>{item.month}</Label>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                placeholder={`Enter ${unit}`}
                value={item.consumption || ''}
                onChange={(e) => updateConsumption(type, index, e.target.value)}
                className={`text-right border-${getStepTheme().cardBorder.split('-')[1]}-300 focus:border-${getStepTheme().cardBorder.split('-')[1]}-500`}
                min="0"
                step="0.01"
              />
              <span className={`text-sm ${getStepTheme().accentColor} min-w-[40px]`}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render review step
  const renderReviewStep = () => {
    const waterCount = waterData.filter(item => item.consumption > 0).length;
    const electricityCount = electricityData.filter(item => item.consumption > 0).length;

    return (
      <div className="space-y-6">

        {/* Water Utility Card - Combined Consumption & Billing */}
        {waterCount > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Water Utility</h4>
              </div>
            </div>

            {/* Consumption Data */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-blue-800">Historical Consumption</h5>
                <button
                  onClick={() => {
                    if (api) {
                      api.scrollTo(0); // Go back to water consumption page
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit →
                </button>
              </div>
              <p className="text-sm text-blue-700">{waterCount} months of data entered</p>
              <div className="text-xs text-blue-600">
                Total: {waterData.reduce((sum, item) => sum + item.consumption, 0).toFixed(2)} m³
              </div>
            </div>

            {/* Billing Configuration */}
            <div className="border-t border-blue-200 pt-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-blue-800">Billing Configuration</h5>
                <button
                  onClick={() => {
                    if (api) {
                      api.scrollTo(2); // Go back to water billing page
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit →
                </button>
              </div>
              {waterBilling.billing_date ? (
                <div className="space-y-1">
                  <p className="text-sm text-blue-700">
                    Bills received on the {waterBilling.billing_date}{waterBilling.billing_date === 1 ? 'st' : waterBilling.billing_date === 2 ? 'nd' : waterBilling.billing_date === 3 ? 'rd' : 'th'} of each month
                  </p>
                  {waterBilling.last_bill_reading ? (
                    <div className="text-xs text-blue-600">
                      <span className="font-medium">Last bill reading:</span> {waterBilling.last_bill_reading} m³
                      {waterBilling.last_bill_date && <span> ({new Date(waterBilling.last_bill_date).toLocaleDateString()})</span>}
                      <span className="ml-2 text-green-600">✓ High accuracy</span>
                    </div>
                  ) : (
                    <div className="text-xs text-blue-600">
                      <span className="font-medium">Baseline:</span> First meter reading
                      <span className="ml-2 text-amber-600">⚠ Medium accuracy</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-blue-700">Billing date not configured</p>
              )}
            </div>
          </div>
        )}

        {/* Electricity Utility Card - Combined Consumption & Billing */}
        {electricityCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-amber-900">Electricity Utility</h4>
              </div>
            </div>

            {/* Consumption Data */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-amber-800">Historical Consumption</h5>
                <button
                  onClick={() => {
                    if (api) {
                      api.scrollTo(1); // Go back to electricity consumption page
                    }
                  }}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                >
                  Edit →
                </button>
              </div>
              <p className="text-sm text-amber-700">{electricityCount} months of data entered</p>
              <div className="text-xs text-amber-600">
                Total: {electricityData.reduce((sum, item) => sum + item.consumption, 0).toFixed(2)} kWh
              </div>
            </div>

            {/* Billing Configuration */}
            <div className="border-t border-amber-200 pt-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-amber-800">Billing Configuration</h5>
                <button
                  onClick={() => {
                    if (api) {
                      api.scrollTo(3); // Go back to electricity billing page
                    }
                  }}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                >
                  Edit →
                </button>
              </div>
              {electricityBilling.billing_date ? (
                <div className="space-y-1">
                  <p className="text-sm text-amber-700">
                    Bills received on the {electricityBilling.billing_date}{electricityBilling.billing_date === 1 ? 'st' : electricityBilling.billing_date === 2 ? 'nd' : electricityBilling.billing_date === 3 ? 'rd' : 'th'} of each month
                  </p>
                  {electricityBilling.last_bill_reading ? (
                    <div className="text-xs text-amber-600">
                      <span className="font-medium">Last bill reading:</span> {electricityBilling.last_bill_reading} kWh
                      {electricityBilling.last_bill_date && <span> ({new Date(electricityBilling.last_bill_date).toLocaleDateString()})</span>}
                      <span className="ml-2 text-green-600">✓ High accuracy</span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600">
                      <span className="font-medium">Baseline:</span> First meter reading
                      <span className="ml-2 text-amber-600">⚠ Medium accuracy</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-amber-700">Billing date not configured</p>
              )}
            </div>
          </div>
        )}

        {!hasValidData() && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">No Data Entered</h4>
            </div>
            <p className="text-sm text-yellow-700">
              You can continue without historical data, but forecasts will be less accurate initially.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-blue-600 mb-2">Water Consumption</h3>
              <p className="text-sm text-gray-600">Enter your water consumption data (optional)</p>
            </div>
            {renderUtilitySection('water')}
          </div>
        );
      case 1:
        return (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-amber-600 mb-2">Electricity Consumption</h3>
              <p className="text-sm text-gray-600">Enter your electricity consumption data (optional)</p>
            </div>
            {renderUtilitySection('electricity')}
          </div>
        );
      case 2:
        return (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-blue-600 mb-2">Water Billing Setup</h3>
              <p className="text-sm text-gray-600">Configure your water billing cycle</p>
            </div>
            {renderBillingStep('water')}
          </div>
        );
      case 3:
        return (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-amber-600 mb-2">Electricity Billing Setup</h3>
              <p className="text-sm text-gray-600">Configure your electricity billing cycle</p>
            </div>
            {renderBillingStep('electricity')}
          </div>
        );
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative font-sans pt-8">
      <div className="px-6">
        {/* Header styled exactly like monitoring pages */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-black">{getStepTitle()}</h1>
            <p className="text-gray-500">{getStepDescription()}</p>
          </div>
          <button
            aria-label="Info"
            className="w-10 h-10 rounded-full flex items-center justify-center focus:outline-none"
          >
            <Info className="text-gray-400" />
          </button>
        </div>

        {/* Progress bar exactly like monitoring pages */}
        <div className="mb-6 flex gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <button
              key={index}
              onClick={() => handleProgressBarClick(index)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-colors hover:opacity-80 ${
                index === current
                  ? index === 0
                    ? "bg-blue-500"
                    : index === 1
                    ? "bg-yellow-500"
                    : index === 2
                    ? "bg-blue-500"
                    : index === 3
                    ? "bg-yellow-500"
                    : "bg-[#212529]"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Carousel content */}
        <div className="pb-[72px]">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              {/* Water page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`${getStepTheme().cardBg} ${getStepTheme().cardBorder} border`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${getStepTheme().accentColor}`}>Historical Water Usage</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter your past water consumption data to help us create accurate forecasts for your utility bills.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderUtilitySection('water')}
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Electricity page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`bg-yellow-50 border-yellow-200 border`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-600">Historical Electricity Usage</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter your past electricity consumption data to help us create accurate forecasts for your utility bills.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderUtilitySection('electricity')}
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Water Billing page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`bg-blue-50 border-blue-200 border`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Water Billing Cycle</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Set your water billing date and add your latest bill reading for the most accurate consumption tracking.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderBillingStep('water')}
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Electricity Billing page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`bg-yellow-50 border-yellow-200 border`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-600">Electricity Billing Cycle</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Set your electricity billing date and add your latest bill reading for the most accurate consumption tracking.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderBillingStep('electricity')}
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Review page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`bg-white border-gray-200 border`}>
                  <CardHeader>
                    <CardTitle className={`text-lg text-gray-700`}>Review Your Setup</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Review your consumption data and billing configuration before continuing to provider selection.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderReviewStep()}

                    {/* Continue button in review */}
                    <div className="mt-6">
                      <Button
                        onClick={handleContinue}
                        className={`w-full bg-[#212529] hover:bg-[#303338] text-white py-3`}
                        disabled={!hasValidData()}
                      >
                        Continue to Provider Selection
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionInput;