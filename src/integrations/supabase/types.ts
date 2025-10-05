export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      meter_readings: {
        Row: {
          id: string
          user_id: string
          utility_type: Database['public']['Enums']['utility_type']
          reading_value: number
          image_url: string | null
          capture_timestamp: string
          processing_status: Database['public']['Enums']['reading_status']
          confidence_score: number | null
          is_manual: boolean
          raw_ocr_data: Json | null
          location_data: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          utility_type: Database['public']['Enums']['utility_type']
          reading_value: number
          image_url?: string | null
          capture_timestamp?: string
          processing_status?: Database['public']['Enums']['reading_status']
          confidence_score?: number | null
          is_manual?: boolean
          raw_ocr_data?: Json | null
          location_data?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          utility_type?: Database['public']['Enums']['utility_type']
          reading_value?: number
          image_url?: string | null
          capture_timestamp?: string
          processing_status?: Database['public']['Enums']['reading_status']
          confidence_score?: number | null
          is_manual?: boolean
          raw_ocr_data?: Json | null
          location_data?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      utility_prices: {
        Row: {
          id: string
          utility_type: Database['public']['Enums']['utility_type']
          price_per_unit: number
          effective_date: string
          region: string | null
          tier_structure: Json | null
          seasonal_multiplier: number
          created_at: string
        }
        Insert: {
          id?: string
          utility_type: Database['public']['Enums']['utility_type']
          price_per_unit: number
          effective_date: string
          region?: string | null
          tier_structure?: Json | null
          seasonal_multiplier?: number
          created_at?: string
        }
        Update: {
          id?: string
          utility_type?: Database['public']['Enums']['utility_type']
          price_per_unit?: number
          effective_date?: string
          region?: string | null
          tier_structure?: Json | null
          seasonal_multiplier?: number
          created_at?: string
        }
        Relationships: []
      }
      anomaly_detections: {
        Row: {
          id: string
          user_id: string
          reading_id: string
          utility_type: Database['public']['Enums']['utility_type']
          anomaly_score: number
          is_anomaly: boolean
          severity: Database['public']['Enums']['anomaly_severity']
          threshold_used: number
          contributing_factors: Json | null
          model_version: string
          training_window_days: number
          detected_at: string
          notification_sent: boolean
          notification_sent_at: string | null
          user_feedback: string | null
          user_feedback_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          reading_id: string
          utility_type: Database['public']['Enums']['utility_type']
          anomaly_score: number
          is_anomaly: boolean
          severity: Database['public']['Enums']['anomaly_severity']
          threshold_used: number
          contributing_factors?: Json | null
          model_version: string
          training_window_days: number
          detected_at?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          user_feedback?: string | null
          user_feedback_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          reading_id?: string
          utility_type?: Database['public']['Enums']['utility_type']
          anomaly_score?: number
          is_anomaly?: boolean
          severity?: Database['public']['Enums']['anomaly_severity']
          threshold_used?: number
          contributing_factors?: Json | null
          model_version?: string
          training_window_days?: number
          detected_at?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          user_feedback?: string | null
          user_feedback_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_detections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomaly_detections_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "meter_readings"
            referencedColumns: ["id"]
          }
        ]
      }
      cost_forecasts: {
        Row: {
          id: string
          user_id: string
          utility_type: Database['public']['Enums']['utility_type']
          forecast_month: string
          predicted_usage: number
          predicted_cost: number
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          model_accuracy: number | null
          features_used: Json | null
          model_version: string
          training_data_points: number
          forecast_created_at: string
          actual_usage: number | null
          actual_cost: number | null
          accuracy_error: number | null
        }
        Insert: {
          id?: string
          user_id: string
          utility_type: Database['public']['Enums']['utility_type']
          forecast_month: string
          predicted_usage: number
          predicted_cost: number
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          model_accuracy?: number | null
          features_used?: Json | null
          model_version: string
          training_data_points: number
          forecast_created_at?: string
          actual_usage?: number | null
          actual_cost?: number | null
          accuracy_error?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          utility_type?: Database['public']['Enums']['utility_type']
          forecast_month?: string
          predicted_usage?: number
          predicted_cost?: number
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          model_accuracy?: number | null
          features_used?: Json | null
          model_version?: string
          training_data_points?: number
          forecast_created_at?: string
          actual_usage?: number | null
          actual_cost?: number | null
          accuracy_error?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_forecasts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          user_id: string
          anomaly_notifications_enabled: boolean
          anomaly_notification_methods: Json
          forecast_notifications_enabled: boolean
          forecast_horizon_months: number
          reading_reminder_enabled: boolean
          reading_reminder_time: string
          reading_reminder_frequency: string
          timezone: string
          currency: string
          units_preference: Json
          water_billing_date: number | null
          electricity_billing_date: number | null
          water_last_bill_reading: number | null
          electricity_last_bill_reading: number | null
          water_last_bill_date: string | null
          electricity_last_bill_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          anomaly_notifications_enabled?: boolean
          anomaly_notification_methods?: Json
          forecast_notifications_enabled?: boolean
          forecast_horizon_months?: number
          reading_reminder_enabled?: boolean
          reading_reminder_time?: string
          reading_reminder_frequency?: string
          timezone?: string
          currency?: string
          units_preference?: Json
          water_billing_date?: number | null
          electricity_billing_date?: number | null
          water_last_bill_reading?: number | null
          electricity_last_bill_reading?: number | null
          water_last_bill_date?: string | null
          electricity_last_bill_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          anomaly_notifications_enabled?: boolean
          anomaly_notification_methods?: Json
          forecast_notifications_enabled?: boolean
          forecast_horizon_months?: number
          reading_reminder_enabled?: boolean
          reading_reminder_time?: string
          reading_reminder_frequency?: string
          timezone?: string
          currency?: string
          units_preference?: Json
          water_billing_date?: number | null
          electricity_billing_date?: number | null
          water_last_bill_reading?: number | null
          electricity_last_bill_reading?: number | null
          water_last_bill_date?: string | null
          electricity_last_bill_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          delivery_method: string
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          clicked_at: string | null
          status: string
          error_message: string | null
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          delivery_method: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          clicked_at?: string | null
          status?: string
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          delivery_method?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          clicked_at?: string | null
          status?: string
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          phone: string | null
          address: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      model_training_logs: {
        Row: {
          id: string
          user_id: string | null
          model_type: string
          utility_type: Database['public']['Enums']['utility_type'] | null
          version: string
          training_started_at: string
          training_completed_at: string | null
          training_status: string
          training_data_size: number | null
          hyperparameters: Json | null
          performance_metrics: Json | null
          validation_score: number | null
          error_message: string | null
          is_deployed: boolean
          deployed_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          model_type: string
          utility_type?: Database['public']['Enums']['utility_type'] | null
          version: string
          training_started_at: string
          training_completed_at?: string | null
          training_status?: string
          training_data_size?: number | null
          hyperparameters?: Json | null
          performance_metrics?: Json | null
          validation_score?: number | null
          error_message?: string | null
          is_deployed?: boolean
          deployed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          model_type?: string
          utility_type?: Database['public']['Enums']['utility_type'] | null
          version?: string
          training_started_at?: string
          training_completed_at?: string | null
          training_status?: string
          training_data_size?: number | null
          hyperparameters?: Json | null
          performance_metrics?: Json | null
          validation_score?: number | null
          error_message?: string | null
          is_deployed?: boolean
          deployed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_training_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_latest_reading: {
        Args: {
          p_user_id: string
          p_utility_type: Database['public']['Enums']['utility_type']
        }
        Returns: Database['public']['Tables']['meter_readings']['Row']
      }
      calculate_usage: {
        Args: {
          p_user_id: string
          p_utility_type: Database['public']['Enums']['utility_type']
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
      trigger_model_retraining: {
        Args: {
          p_user_id: string
          p_model_type: string
          p_utility_type?: Database['public']['Enums']['utility_type']
        }
        Returns: string
      }
    }
    Enums: {
      utility_type: 'water' | 'electricity'
      anomaly_severity: 'low' | 'medium' | 'high' | 'critical'
      reading_status: 'pending' | 'processed' | 'failed' | 'manual'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
