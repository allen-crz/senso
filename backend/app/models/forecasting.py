"""
Clean data models for cost forecasting system
"""
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from decimal import Decimal


class DataSource(Enum):
    USER_INPUT = "user_input"           # From onboarding ConsumptionInput
    METER_READING = "meter_reading"     # From camera/OCR
    CALCULATED = "calculated"           # Derived/estimated


class TrainingStatus(Enum):
    PENDING = "pending"
    TRAINING = "training"
    READY = "ready"
    ERROR = "error"


@dataclass
class BillingPosition:
    """Current position within billing cycle"""
    cycle_start_date: date
    cycle_end_date: date
    current_date: date
    elapsed_days: int
    remaining_days: int
    total_cycle_days: int

    @property
    def cycle_progress(self) -> float:
        """Percentage of billing cycle completed (0.0 to 1.0)"""
        return self.elapsed_days / self.total_cycle_days if self.total_cycle_days > 0 else 0.0


@dataclass
class ConsumptionFeatures:
    """Data-driven features for ML training - REQUIREMENT 2"""
    daily_consumption: float
    billing_cycle_day: int              # Day within cycle (1-30)
    month_number: int                   # Seasonality (1-12)
    elapsed_days: int                   # Days into current cycle
    remaining_days: int                 # Days left in cycle
    rolling_avg_7day: float            # Recent trend
    rolling_avg_30day: float           # Long-term trend
    timestamp: datetime


@dataclass
class TrainingData:
    """Clean training sample"""
    features: ConsumptionFeatures
    target_cost: float
    confidence: float = 1.0
    weight: float = 1.0


@dataclass
class ModelTrainingResult:
    """Result of model training"""
    user_id: str
    utility_type: str
    status: TrainingStatus
    model_id: Optional[str] = None
    performance_score: Optional[float] = None
    training_samples: int = 0
    features_used: List[str] = None
    error_message: Optional[str] = None
    trained_at: datetime = None


@dataclass
class BillingAwareForecast:
    """Billing-cycle-aware cost prediction - REQUIREMENT 5"""
    predicted_cost: float
    confidence_score: float
    billing_position: BillingPosition
    cycle_average_daily: float
    projected_monthly_cost: float
    days_of_data_used: int
    features_importance: Dict[str, float]
    prediction_date: datetime


@dataclass
class OnboardingData:
    """Data from frontend ConsumptionInput.tsx"""
    user_id: str
    utility_type: str
    monthly_consumption: List[Dict[str, Any]]  # [{"month": "January 2025", "consumption": 150.5}]
    billing_info: Dict[str, Any]               # {"billing_date": 15, "last_bill_reading": 1250}