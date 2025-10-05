import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Building2, Droplet, Zap, MapPin, Info, TrendingUp } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { api } from '@/services/api';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface Provider {
  id: string;
  name: string;
  type: 'water' | 'electricity';
  description: string;
  coverage?: string;
}

const providers: Provider[] = [
  // Electricity Providers
  {
    id: 'meralco',
    name: 'MERALCO',
    type: 'electricity',
    description: 'Manila Electric Company',
    coverage: 'Metro Manila, Rizal, Cavite, Bulacan'
  },

  // Water Providers
  {
    id: 'manila_water',
    name: 'Manila Water',
    type: 'water',
    description: 'Manila Water Company',
    coverage: 'East Zone Metro Manila'
  },
  {
    id: 'maynilad',
    name: 'Maynilad',
    type: 'water',
    description: 'Maynilad Water Services',
    coverage: 'West Zone Metro Manila'
  },
];

const ProviderSelection = () => {
  const navigate = useNavigate();
  const [selectedElectricityProvider, setSelectedElectricityProvider] = useState<string>('');
  const [selectedWaterProvider, setSelectedWaterProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Carousel API for navigation
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const electricityProviders = providers.filter(p => p.type === 'electricity');
  const waterProviders = providers.filter(p => p.type === 'water');

  // Carousel setup
  React.useEffect(() => {
    if (!carouselApi) {
      return;
    }

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleContinue = async () => {
    if (!selectedElectricityProvider && !selectedWaterProvider) {
      toast({
        title: "Selection Required",
        description: "Please select at least one utility provider.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store provider selections
      const providerData = {
        electricity: selectedElectricityProvider ?
          providers.find(p => p.id === selectedElectricityProvider) : null,
        water: selectedWaterProvider ?
          providers.find(p => p.id === selectedWaterProvider) : null,
      };

      localStorage.setItem('selectedProviders', JSON.stringify(providerData));

      // Get consumption data from previous step
      const consumptionData = JSON.parse(localStorage.getItem('consumptionData') || '{"water": [], "electricity": []}');

      // Get billing data from previous step
      const billingData = JSON.parse(localStorage.getItem('billingData') || '{"water": {}, "electricity": {}}');

      // Send data to backend for model training
      if (consumptionData.water.length > 0 || consumptionData.electricity.length > 0) {
        await api.submitHistoricalData({
          water_data: consumptionData.water.length > 0 ? consumptionData.water : undefined,
          electricity_data: consumptionData.electricity.length > 0 ? consumptionData.electricity : undefined,
          providers: {
            electricity: providerData.electricity ? {
              id: providerData.electricity.id,
              name: providerData.electricity.name
            } : undefined,
            water: providerData.water ? {
              id: providerData.water.id,
              name: providerData.water.name
            } : undefined,
          },
          billing_info: {
            water: billingData.water || {},
            electricity: billingData.electricity || {}
          }
        });

        toast({
          title: "Setup Complete!",
          description: "Your historical data has been processed for forecasting.",
        });
      }

      // Navigate to success screen first
      navigate('/success');
      // Keep loading state during navigation
    } catch (error) {
      console.error('Error submitting historical data:', error);
      toast({
        title: "Setup Error",
        description: "There was an issue processing your data. You can continue and add data later.",
        variant: "destructive",
      });
      setIsLoading(false);
      // Still navigate to success screen even if API call fails
      navigate('/success');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('selectedProviders', JSON.stringify({
      electricity: null,
      water: null,
    }));
    navigate('/success');
  };

  // Progress bar click handler
  const handleProgressBarClick = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

  const getStepTitle = () => {
    switch (current) {
      case 0: return 'Select Provider';
      case 1: return 'Select Provider';
      case 2: return 'Select Provider';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (current) {
      case 0: return 'Choose your water service provider';
      case 1: return 'Choose your electricity service provider';
      case 2: return 'Review your provider selections';
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
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-400',
        icon: <Building2 className="text-purple-400" />,
        cardBorder: 'border-purple-200',
        cardBg: 'bg-purple-50',
        buttonBg: 'bg-purple-500 hover:bg-purple-600',
        accentColor: 'text-purple-600',
        lightBg: 'bg-purple-100'
      };
    }
  };

  const handleConfirmAndContinue = async (step: number) => {
    if (carouselApi && !isTransitioning) {
      setIsTransitioning(true);
      carouselApi.scrollTo(step + 1);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };


  // Render provider selection for a specific utility type
  const renderProviderSection = (type: 'water' | 'electricity') => {
    const isWater = type === 'water';
    const providerList = isWater ? waterProviders : electricityProviders;
    const selectedProvider = isWater ? selectedWaterProvider : selectedElectricityProvider;
    const setSelectedProvider = isWater ? setSelectedWaterProvider : setSelectedElectricityProvider;

    return (
      <div className="space-y-4">
        <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
          {providerList.map((provider) => (
            <div key={provider.id} className={`flex items-start space-x-3 space-y-0 p-4 border rounded-lg transition-colors ${
              selectedProvider === provider.id
                ? `${getStepTheme().lightBg} ${getStepTheme().cardBorder}`
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <RadioGroupItem value={provider.id} id={provider.id} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={provider.id} className="font-medium cursor-pointer">
                  {provider.name}
                </Label>
                <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                {provider.coverage && (
                  <div className="flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{provider.coverage}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>

        {/* Confirm button */}
        <div className="mt-6">
          <Button
            onClick={() => handleConfirmAndContinue(current)}
            disabled={!selectedProvider || isTransitioning}
            className={`w-full ${getStepTheme().buttonBg} text-white py-3 disabled:opacity-50`}
          >
            {isTransitioning ? 'Moving to next...' : selectedProvider ? 'Confirm & Continue' : 'Select a provider'}
          </Button>
        </div>

      </div>
    );
  };

  // Render review step
  const renderReviewStep = () => {
    const hasWaterProvider = !!selectedWaterProvider;
    const hasElectricityProvider = !!selectedElectricityProvider;

    return (
      <div className="space-y-6">
        {hasWaterProvider && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Water Provider</h4>
              </div>
              <button
                onClick={() => {
                  if (carouselApi) {
                    carouselApi.scrollTo(0); // Go back to water page
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit →
              </button>
            </div>
            <p className="text-sm text-blue-700">
              {providers.find(p => p.id === selectedWaterProvider)?.name}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {providers.find(p => p.id === selectedWaterProvider)?.description}
            </p>
          </div>
        )}

        {hasElectricityProvider && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-amber-900">Electricity Provider</h4>
              </div>
              <button
                onClick={() => {
                  if (carouselApi) {
                    carouselApi.scrollTo(1); // Go back to electricity page
                  }
                }}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                Edit →
              </button>
            </div>
            <p className="text-sm text-amber-700">
              {providers.find(p => p.id === selectedElectricityProvider)?.name}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {providers.find(p => p.id === selectedElectricityProvider)?.description}
            </p>
          </div>
        )}

        {!hasWaterProvider && !hasElectricityProvider && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">No Providers Selected</h4>
            </div>
            <p className="text-sm text-yellow-700">
              You can continue without selecting providers, but rate calculations will be less accurate.
            </p>
          </div>
        )}

        {/* Complete Setup button */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={handleContinue}
            className={`w-full ${getStepTheme().buttonBg} text-white py-3`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Complete Setup"}
          </Button>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative font-sans pt-8">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#212529] via-gray-800 to-black flex flex-col items-center justify-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-bolt-lightning text-[#212529] text-4xl"></i>
            </div>
          </div>
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white/60 mt-8 text-sm animate-pulse">Setting up your experience...</p>
        </div>
      )}

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
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => handleProgressBarClick(index)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-colors hover:opacity-80 ${
                index === current
                  ? index === 0
                    ? "bg-blue-500"
                    : index === 1
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
            setApi={setCarouselApi}
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              {/* Water provider page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`${getStepTheme().cardBg} ${getStepTheme().cardBorder} border`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${getStepTheme().accentColor}`}>Water Provider</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Select your water service provider to get accurate rate calculations and forecasts.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      More providers will be added soon
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderProviderSection('water')}
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Electricity provider page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`bg-yellow-50 border-yellow-200 border`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-600">Electricity Provider</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Select your electricity service provider to get accurate rate calculations and forecasts.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      More providers will be added soon
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderProviderSection('electricity')}
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Review page */}
              <CarouselItem className="overflow-auto h-[calc(100vh-210px)]">
                <Card className={`${getStepTheme().cardBg} ${getStepTheme().cardBorder} border`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${getStepTheme().accentColor}`}>Review & Complete</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Review your provider selections before completing the setup process.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderReviewStep()}
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

export default ProviderSelection;