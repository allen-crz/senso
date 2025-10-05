"""
Configuration settings for the Senso API
"""
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Senso API"
    VERSION: str = "1.0.0"
    
    # CORS
    ALLOWED_HOSTS: Union[str, List[str]] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "*"],
        description="Allowed CORS origins"
    )
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: Optional[str] = None
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    
    # ML Model Settings
    MODEL_VERSION: str = "v1.0.0"
    CNN_MODEL_PATH: str = "./models/cnn_meter_reader.pkl"
    YOLO_MODEL_PATH: str = "./models/electric_meter.pt"
    WATER_YOLO_MODEL_PATH: str = "./models/water_meter.pt"
    ISOLATION_FOREST_CONTAMINATION: float = 0.1
    TRAINING_WINDOW_DAYS: int = 30

    # External YOLO API (Hugging Face Space)
    YOLO_API_URL: Optional[str] = None  # Set to HF Space URL to use external API
    YOLO_API_TIMEOUT: int = 120  # Timeout for YOLO API calls (seconds)
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: Union[str, List[str]] = Field(
        default=["image/jpeg", "image/png", "image/jpg"],
        description="Allowed image MIME types"
    )
    UPLOAD_DIR: str = "./uploads"
    
    # Redis (for background tasks)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Notification Settings
    ENABLE_NOTIFICATIONS: bool = True
    EMAIL_ENABLED: bool = False
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @field_validator("ALLOWED_HOSTS", "ALLOWED_IMAGE_TYPES", mode='before')
    @classmethod
    def parse_list_from_string(cls, v):
        """Parse comma-separated strings into lists"""
        if isinstance(v, str) and v.strip():
            # Handle comma-separated values
            return [item.strip() for item in v.split(",") if item.strip()]
        elif isinstance(v, list):
            return v
        return []
    
    @field_validator("DATABASE_URL", mode='before')
    @classmethod
    def assemble_db_connection(cls, v, info):
        if isinstance(v, str) and v:
            return v
        # DATABASE_URL is optional - direct PostgreSQL access not required
        # Supabase client will be used for database operations
        return None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        # Don't try to parse complex types as JSON automatically
        env_parse_none_str="None"
    )


settings = Settings()