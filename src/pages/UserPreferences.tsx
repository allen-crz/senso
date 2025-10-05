import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, BellRing, BellOff, Save, Loader2, Calendar, DollarSign } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNotifications } from '@/hooks/useNotifications';

const UserPreferences = () => {
  const navigate = useNavigate();
  const {
    preferences,
    isLoading,
    togglePreference,
    isUpdating,
    updateNotificationSettings,
    updateBillingSettings
  } = useUserPreferences();
  const {
    browserPermission,
    requestPermission
  } = useNotifications();

  const [billingSettings, setBillingSettings] = useState({
    waterBillingDate: preferences?.water_billing_date || '',
    electricityBillingDate: preferences?.electricity_billing_date || '',
    waterLastBillReading: preferences?.water_last_bill_reading || '',
    electricityLastBillReading: preferences?.electricity_last_bill_reading || '',
    waterLastBillDate: preferences?.water_last_bill_date || '',
    electricityLastBillDate: preferences?.electricity_last_bill_date || ''
  });

  useEffect(() => {
    if (preferences) {
      setBillingSettings({
        waterBillingDate: preferences.water_billing_date || '',
        electricityBillingDate: preferences.electricity_billing_date || '',
        waterLastBillReading: preferences.water_last_bill_reading || '',
        electricityLastBillReading: preferences.electricity_last_bill_reading || '',
        waterLastBillDate: preferences.water_last_bill_date || '',
        electricityLastBillDate: preferences.electricity_last_bill_date || ''
      });
    }
  }, [preferences]);

  const handleToggle = (key: string) => {
    if (!preferences) return;
    
    switch (key) {
      case 'browserNotifications':
        // Request browser permission if not granted
        if (browserPermission !== 'granted') {
          requestPermission();
        } else {
          updateNotificationSettings({ browser_notifications: !preferences.anomaly_notifications_enabled });
        }
        break;
      case 'usageAlerts':
        togglePreference('anomaly_notifications_enabled', !preferences.anomaly_notifications_enabled);
        break;
      case 'reminderNotifications':
        togglePreference('reading_reminder_enabled', !preferences.reading_reminder_enabled);
        break;
      case 'soundEnabled':
        togglePreference('forecast_notifications_enabled', !preferences.forecast_notifications_enabled);
        break;
    }
  };

  const handleBillingInputChange = (field: string, value: string) => {
    setBillingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBillingSettings = async () => {
    if (updateBillingSettings) {
      await updateBillingSettings({
        water_billing_date: billingSettings.waterBillingDate ? parseInt(billingSettings.waterBillingDate) : null,
        electricity_billing_date: billingSettings.electricityBillingDate ? parseInt(billingSettings.electricityBillingDate) : null,
        water_last_bill_reading: billingSettings.waterLastBillReading ? parseFloat(billingSettings.waterLastBillReading) : null,
        electricity_last_bill_reading: billingSettings.electricityLastBillReading ? parseFloat(billingSettings.electricityLastBillReading) : null,
        water_last_bill_date: billingSettings.waterLastBillDate || null,
        electricity_last_bill_date: billingSettings.electricityLastBillDate || null
      });
    }
  };

  const handleSave = async () => {
    await handleSaveBillingSettings();
    navigate('/settings');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#212529]" />
      </div>
    );
  }

  const preferenceItems = [
    {
      key: 'browserNotifications',
      title: 'Browser Notifications',
      description: `Browser permission: ${browserPermission}`,
      icon: Bell,
      isEnabled: browserPermission === 'granted' && (preferences?.anomaly_notifications_enabled || false)
    },
    {
      key: 'usageAlerts',
      title: 'Usage Alerts',
      description: 'Get notified about significant usage changes',
      icon: BellRing,
      isEnabled: preferences?.anomaly_notifications_enabled || false
    },
    {
      key: 'reminderNotifications',
      title: 'Reading Reminders',
      description: 'Remind me to take regular meter readings',
      icon: BellOff,
      isEnabled: preferences?.reading_reminder_enabled || false
    },
    {
      key: 'soundEnabled',
      title: 'Forecast Notifications',
      description: 'Get notified about usage forecasts',
      icon: Bell,
      isEnabled: preferences?.forecast_notifications_enabled || false
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-8 pt-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/settings')} 
              className="p-2 -ml-2 rounded-lg transition duration-150 hover:bg-gray-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-gray-200 outline-none"
              aria-label="Back to Settings"
            >
              <ChevronLeft className="text-[#212529] w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-[#212529]">Preferences</h1>
          </div>
          <Bell className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">Notification Settings</h2>
            <p className="text-gray-600 mb-4">
              Configure how Senso communicates with you through browser notifications.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {preferenceItems.map((item, index) => {
              const ItemIcon = item.icon;
              const isEnabled = item.isEnabled;
              
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isEnabled ? 'bg-gray-100' : 'bg-gray-100'
                        }`}>
                          <ItemIcon className={`w-5 h-5 ${
                            isEnabled ? 'text-[#212529]' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#212529] mb-1">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      disabled={isUpdating}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                        isEnabled ? 'bg-[#212529]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-[#212529] mb-4">About Browser Notifications</h3>
            <div className="space-y-2">
              <p className="text-gray-600 text-sm">
                Browser notifications work even when the app is not open, helping you stay updated on your utility usage.
              </p>
              <ul className="text-gray-600 text-sm space-y-1 mt-3">
                <li>• You may need to allow notifications when prompted by your browser</li>
                <li>• Notifications can be managed in your browser settings</li>
                <li>• Works on desktop and mobile browsers</li>
              </ul>
            </div>
          </div>

          {/* Billing Cycle Configuration */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="text-[#212529] w-6 h-6" />
              <h2 className="text-lg font-semibold text-[#212529]">Billing Cycle Configuration</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Set up your billing cycle information to get accurate cost tracking and forecasts.
            </p>

            <div className="space-y-6">
              {/* Water Billing Settings */}
              <div className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Water Billing
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Date (Day of Month)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={billingSettings.waterBillingDate}
                      onChange={(e) => handleBillingInputChange('waterBillingDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Bill Reading (cubic meters)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={billingSettings.waterLastBillReading}
                      onChange={(e) => handleBillingInputChange('waterLastBillReading', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 125.50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Bill Date
                    </label>
                    <input
                      type="date"
                      value={billingSettings.waterLastBillDate}
                      onChange={(e) => handleBillingInputChange('waterLastBillDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Electricity Billing Settings */}
              <div>
                <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Electricity Billing
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Date (Day of Month)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={billingSettings.electricityBillingDate}
                      onChange={(e) => handleBillingInputChange('electricityBillingDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Bill Reading (kWh)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={billingSettings.electricityLastBillReading}
                      onChange={(e) => handleBillingInputChange('electricityLastBillReading', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2450.75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Bill Date
                    </label>
                    <input
                      type="date"
                      value={billingSettings.electricityLastBillDate}
                      onChange={(e) => handleBillingInputChange('electricityLastBillDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full py-4 px-6 bg-[#212529] text-white rounded-xl font-semibold hover:bg-[#303338] active:bg-[#1a1d21] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;