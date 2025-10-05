import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api } from '@/services/api';
import { Database } from '@/integrations/supabase/types';
import { toast } from './use-toast';
import { invalidateAfterPreferencesUpdate } from '@/utils/cacheInvalidation';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export const useUserPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      try {
        const data = await api.getUserPreferences();
        return data;
      } catch (error: any) {
        // If no preferences exist, create default ones
        if (error.status === 404 ||
            error.message?.includes('404') ||
            error.message?.includes('not found') ||
            error.message?.includes('Not Found') ||
            error.message?.includes('Resource not found')) {
          const defaultPrefs = {
            anomaly_notifications_enabled: false,
            reading_reminder_enabled: true,
            reading_reminder_time: '08:00',
            reading_reminder_frequency: 'daily',
            forecast_notifications_enabled: false,
            anomaly_sensitivity: 0.80,
            forecast_horizon_months: 1,
            timezone: 'Asia/Manila',
            currency: 'PHP',
            units_preference: { water: 'cubic_meters', electricity: 'kwh' },
            anomaly_notification_methods: ['push']
          };
          
          const newPrefs = await api.updateUserPreferences(defaultPrefs);
          return newPrefs;
        }
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Update user preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: UserPreferencesUpdate) => {
      if (!user?.id) throw new Error('User not authenticated');

      const data = await api.updateUserPreferences({
        ...updates,
        updated_at: new Date().toISOString()
      });

      return data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['user-preferences', user?.id], data);

      // Invalidate all cache layers
      if (user?.id) {
        await invalidateAfterPreferencesUpdate(user.id, queryClient);
      }

      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle specific preference
  const togglePreference = (key: keyof UserPreferences, value: boolean) => {
    if (!preferences) return;
    
    updatePreferences.mutate({
      [key]: value
    });
  };

  // Update notification settings
  const updateNotificationSettings = (settings: {
    browser_notifications?: boolean;
    usage_alerts?: boolean;
    reading_reminders?: boolean;
    sound_enabled?: boolean;
  }) => {
    if (!preferences) return;

    updatePreferences.mutate({
      anomaly_notifications_enabled: settings.usage_alerts ?? preferences.anomaly_notifications_enabled,
      reading_reminder_enabled: settings.reading_reminders ?? preferences.reading_reminder_enabled,
      // We can extend this as needed for browser notifications and sounds
    });
  };

  // Update billing settings
  const updateBillingSettings = (settings: {
    water_billing_date?: number | null;
    electricity_billing_date?: number | null;
    water_last_bill_reading?: number | null;
    electricity_last_bill_reading?: number | null;
    water_last_bill_date?: string | null;
    electricity_last_bill_date?: string | null;
  }) => {
    if (!preferences) return;

    updatePreferences.mutate({
      water_billing_date: settings.water_billing_date,
      electricity_billing_date: settings.electricity_billing_date,
      water_last_bill_reading: settings.water_last_bill_reading,
      electricity_last_bill_reading: settings.electricity_last_bill_reading,
      water_last_bill_date: settings.water_last_bill_date,
      electricity_last_bill_date: settings.electricity_last_bill_date,
    });
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
    togglePreference,
    updateNotificationSettings,
    updateBillingSettings
  };
};