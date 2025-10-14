"""
Pydantic models/schemas for API requests and responses
"""
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class UtilityType(str, Enum):
    WATER = "water"
    ELECTRICITY = "electricity"


class ReadingStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"
    MANUAL = "manual"


class AnomalySeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationMethod(str, Enum):
    PUSH = "push"
    EMAIL = "email"
    IN_APP = "in_app"


# Base schemas
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


# Meter Reading Schemas
class MeterReadingBase(BaseSchema):
    utility_type: UtilityType
    reading_value: Decimal = Field(..., decimal_places=3)
    is_manual: bool = False
    notes: Optional[str] = None


class MeterReadingCreate(MeterReadingBase):
    image_data: Optional[str] = None  # Base64 encoded image
    location_data: Optional[Dict[str, Any]] = None


class MeterReadingUpdate(BaseSchema):
    reading_value: Optional[Decimal] = None
    notes: Optional[str] = None
    processing_status: Optional[ReadingStatus] = None


class MeterReadingResponse(MeterReadingBase):
    id: str
    user_id: str
    image_url: Optional[str] = None
    capture_timestamp: datetime
    processing_status: ReadingStatus
    confidence_score: Optional[Decimal] = None
    raw_ocr_data: Optional[Dict[str, Any]] = None
    location_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class CreateReadingResponse(BaseSchema):
    """Response model for creating a meter reading, includes potential anomaly"""
    reading: MeterReadingResponse
    anomaly: Optional['AnomalyDetectionResponse'] = None


# Image Processing Schemas
class ImageProcessRequest(BaseSchema):
    image_data: str = Field(..., description="Base64 encoded image")
    utility_type: UtilityType


class ImageProcessResponse(BaseSchema):
    reading_value: Optional[Union[Decimal, str]] = None
    confidence_score: Decimal
    processing_status: ReadingStatus
    raw_ocr_data: Dict[str, Any]
    error_message: Optional[str] = None


# Anomaly Detection Schemas
class AnomalyDetectionResponse(BaseSchema):
    id: str
    reading_id: str
    utility_type: UtilityType
    anomaly_score: Decimal
    is_anomaly: bool
    severity: AnomalySeverity
    threshold_used: Decimal
    contributing_factors: Dict[str, Any]
    model_version: str
    training_window_days: int
    detected_at: datetime
    confidence: Optional[str] = None  # "low", "medium", "high"
    user_feedback: Optional[str] = None
    user_feedback_at: Optional[datetime] = None


class AnomalyFeedback(BaseSchema):
    feedback: str = Field(..., pattern="^(true_positive|false_positive|uncertain)$")


# Cost Forecasting Schemas
class CostForecastResponse(BaseSchema):
    id: str
    utility_type: UtilityType
    forecast_month: date
    predicted_usage: Decimal
    predicted_cost: Decimal
    confidence_interval_lower: Optional[Decimal] = None
    confidence_interval_upper: Optional[Decimal] = None
    model_accuracy: Optional[Decimal] = None
    features_used: Dict[str, Any]
    model_version: str
    forecast_created_at: datetime


class CostForecastCreate(BaseSchema):
    utility_type: UtilityType
    months_ahead: int = Field(default=1, ge=1, le=12)


# User Preferences Schemas
class UserPreferencesBase(BaseSchema):
    # REMOVED: anomaly_sensitivity - now managed by ML adaptive algorithm
    # REMOVED: forecast_horizon_months - now request-based, not static preference
    anomaly_notifications_enabled: bool = True
    anomaly_notification_methods: List[NotificationMethod] = [NotificationMethod.PUSH, NotificationMethod.EMAIL]
    forecast_notifications_enabled: bool = True
    reading_reminder_enabled: bool = True
    reading_reminder_time: str = "08:00"
    reading_reminder_frequency: str = Field(default="daily", pattern="^(daily|weekly)$")
    timezone: str = "Asia/Manila"
    currency: str = "PHP"
    units_preference: Dict[str, str] = {
        "water": "cubic_meters",
        "electricity": "kwh"
    }
    # Billing cycle configuration
    water_billing_date: Optional[int] = Field(default=None, ge=1, le=31)
    electricity_billing_date: Optional[int] = Field(default=None, ge=1, le=31)
    water_last_bill_reading: Optional[float] = Field(default=None, ge=0)
    electricity_last_bill_reading: Optional[float] = Field(default=None, ge=0)
    water_last_bill_date: Optional[str] = None  # ISO date string
    electricity_last_bill_date: Optional[str] = None  # ISO date string


class UserPreferencesResponse(UserPreferencesBase):
    user_id: str
    created_at: datetime
    updated_at: datetime


class UserPreferencesUpdate(BaseSchema):
    # REMOVED: anomaly_sensitivity - now managed by ML adaptive algorithm
    # REMOVED: forecast_horizon_months - now request-based, not static preference
    anomaly_notifications_enabled: Optional[bool] = None
    anomaly_notification_methods: Optional[List[NotificationMethod]] = None
    forecast_notifications_enabled: Optional[bool] = None
    reading_reminder_enabled: Optional[bool] = None
    reading_reminder_time: Optional[str] = None
    reading_reminder_frequency: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    units_preference: Optional[Dict[str, str]] = None
    # Billing cycle configuration
    water_billing_date: Optional[int] = None
    electricity_billing_date: Optional[int] = None
    water_last_bill_reading: Optional[float] = None
    electricity_last_bill_reading: Optional[float] = None
    water_last_bill_date: Optional[str] = None
    electricity_last_bill_date: Optional[str] = None


# Notification Schemas
class NotificationCreate(BaseSchema):
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    delivery_method: NotificationMethod = NotificationMethod.PUSH


class NotificationResponse(BaseSchema):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    delivery_method: NotificationMethod
    status: str
    created_at: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None


# Analytics Schemas
class UsageAnalytics(BaseSchema):
    utility_type: UtilityType
    period: str = Field(..., pattern="^(daily|weekly|monthly|yearly)$")
    start_date: date
    end_date: date


class UsageAnalyticsResponse(BaseSchema):
    utility_type: UtilityType
    period: str
    total_usage: Decimal
    average_usage: Decimal
    cost_estimate: Decimal
    anomaly_count: int
    data_points: List[Dict[str, Any]]


# Authentication Schemas
class UserLogin(BaseSchema):
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)


class UserRegister(UserLogin):
    confirm_password: str = Field(..., min_length=6)


class ChangePassword(BaseSchema):
    new_password: str = Field(..., min_length=6)


class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]


class UserResponse(BaseSchema):
    id: str
    email: str
    created_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None


# Profile Management Schemas
class UserProfileBase(BaseSchema):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseSchema):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class AvatarUpload(BaseSchema):
    avatar_data: str = Field(..., description="Base64 encoded image data")


# Historical Data Schemas
class HistoricalDataBase(BaseSchema):
    month: str = Field(..., description="Month name (e.g., 'january')")
    year: int = Field(..., ge=2020, le=2030)
    consumption: Decimal = Field(..., gt=0, decimal_places=3)
    actual_bill: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    notes: Optional[str] = None


class HistoricalDataCreate(HistoricalDataBase):
    pass


class HistoricalDataResponse(HistoricalDataBase):
    id: str
    user_id: str
    utility_type: UtilityType
    month_date: date
    month_name: str
    created_at: datetime
    updated_at: datetime


class HistoricalDataBulkCreate(BaseSchema):
    utility_type: UtilityType
    historical_months: List[HistoricalDataBase] = Field(..., min_items=1, max_items=12)


# Daily Forecasting Schemas
class DailyForecastRequest(BaseSchema):
    utility_type: UtilityType
    days: int = Field(..., ge=1, le=365, description="Number of days to forecast")
    start_date: Optional[date] = Field(None, description="Start date for forecast")
    daily_consumption: Optional[float] = Field(None, ge=0, description="Specific daily consumption to use for forecast")


class ForecastAccuracy(BaseSchema):
    mae: float = Field(..., description="Mean Absolute Error")
    r2_score: float = Field(..., description="R-squared score")
    confidence_level: str = Field(..., description="Confidence level (Low/Medium/High)")
    training_data_points: int = Field(..., description="Number of training data points")


class DailyForecastPoint(BaseSchema):
    date: str = Field(..., description="Forecast date (ISO format)")
    predicted_consumption: float = Field(..., description="Predicted consumption for the day")
    predicted_cost: float = Field(..., description="Predicted cost for the day")
    cumulative_consumption: float = Field(..., description="Cumulative consumption up to this day")
    cumulative_cost: float = Field(..., description="Cumulative cost up to this day")


class DailyForecastResponse(BaseSchema):
    user_id: str
    utility_type: UtilityType
    forecast_start_date: date
    forecast_days: int
    total_predicted_consumption: float
    total_predicted_cost: float
    average_daily_consumption: float
    average_daily_cost: float
    daily_forecasts: List[Dict[str, Any]] = Field(..., description="Daily forecast data points")
    accuracy: ForecastAccuracy
    model_version: str
    created_at: datetime


# ====================================
# UTILITY RATE MANAGEMENT SCHEMAS
# ====================================

class UtilityProviderCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=200)
    utility_type: UtilityType
    region: str = Field(..., min_length=1, max_length=100)
    service_area: Optional[str] = None
    is_active: bool = True

class UtilityProviderResponse(BaseSchema):
    id: str
    name: str
    utility_type: UtilityType
    region: str
    service_area: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class RateStructureCreate(BaseSchema):
    provider_id: str
    rate_type: str = Field(..., min_length=1, max_length=100, description="e.g., 'generation_charge', 'distribution_tier1'")
    effective_date: date
    end_date: Optional[date] = None
    rate_value: float = Field(..., ge=0, description="Rate value (can be 0 for subsidies)")
    rate_unit: str = Field(..., description="e.g., 'per_kwh', 'per_cubic_meter', 'fixed'")
    tier_min: Optional[float] = Field(None, ge=0, description="Minimum consumption for tiered pricing")
    tier_max: Optional[float] = Field(None, ge=0, description="Maximum consumption for tiered pricing")
    month_applicable: str = Field(default="all", description="'all' or specific month name")
    description: Optional[str] = None

class RateStructureResponse(BaseSchema):
    id: str
    provider_id: str
    rate_type: str
    effective_date: date
    end_date: Optional[date]
    rate_value: float
    rate_unit: str
    tier_min: Optional[float]
    tier_max: Optional[float]
    month_applicable: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

class UserProviderAssociationCreate(BaseSchema):
    provider_id: str
    utility_type: UtilityType
    account_number: Optional[str] = None

class UserProviderAssociationResponse(BaseSchema):
    id: str
    user_id: str
    provider_id: str
    utility_type: UtilityType
    account_number: Optional[str]
    is_active: bool
    provider: UtilityProviderResponse
    created_at: datetime
    updated_at: datetime

class RateStructureBulkCreate(BaseSchema):
    """For migrating from JSON to database"""
    provider_id: str
    utility_type: UtilityType
    rates_data: Dict[str, Any] = Field(..., description="JSON rate structure to migrate")
    effective_date: date = Field(default_factory=lambda: date.today())

class UserRatesResponse(BaseSchema):
    """User's current rates for a utility type"""
    utility_type: UtilityType
    provider: UtilityProviderResponse
    rates: List[RateStructureResponse]
    last_updated: datetime