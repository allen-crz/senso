"""
Meter readings service for CRUD operations and business logic
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID
from supabase import Client

from app.core.database import get_supabase
from app.models.schemas import (
    MeterReadingCreate, 
    MeterReadingUpdate, 
    MeterReadingResponse, 
    UtilityType,
    ReadingStatus
)
from app.services.image_processing import ImageProcessingService
from app.services.anomaly_detection import AnomalyDetectionService
from app.services.cost_forecasting import cost_forecasting_service
from loguru import logger


class MeterReadingService:
    """Service for managing meter readings"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.image_service = ImageProcessingService()
        self.anomaly_service = AnomalyDetectionService()
        self.cost_forecasting_service = cost_forecasting_service
    
    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_supabase()
    
    async def create_reading(self, user_id: str, reading_data: MeterReadingCreate) -> MeterReadingResponse:
        """Create a new meter reading"""
        await self.init_supabase()
        
        try:
            # Process image if provided
            image_url = None
            confidence_score = None
            raw_ocr_data = None
            processing_status = ReadingStatus.MANUAL if reading_data.is_manual else ReadingStatus.PENDING
            final_reading_value = reading_data.reading_value
            
            if reading_data.image_data and not reading_data.is_manual:
                # Process image with CNN
                image_result = await self.image_service.process_image(
                    reading_data.image_data, 
                    reading_data.utility_type
                )
                
                if image_result.processing_status == ReadingStatus.PROCESSED:
                    final_reading_value = image_result.reading_value
                    confidence_score = image_result.confidence_score
                    raw_ocr_data = image_result.raw_ocr_data
                    processing_status = ReadingStatus.PROCESSED

                    # Upload confirmed image to Supabase storage
                    try:
                        image_url = await self._upload_image_to_supabase(
                            reading_data.image_data,
                            user_id,
                            reading_data.utility_type.value
                        )
                        logger.info(f"Confirmed image uploaded: {image_url}")
                    except Exception as upload_error:
                        logger.warning(f"Failed to upload image: {upload_error}")
                        # Continue without image URL if upload fails
                else:
                    processing_status = ReadingStatus.FAILED
            
            # Insert into database
            # Use provided capture_timestamp if available (for backfilling/testing), otherwise use current time
            capture_timestamp = reading_data.capture_timestamp if reading_data.capture_timestamp else datetime.utcnow()

            reading_data_dict = {
                "user_id": user_id,
                "utility_type": reading_data.utility_type.value,
                "reading_value": float(final_reading_value),
                "image_url": image_url,
                "processing_status": processing_status.value,
                "confidence_score": float(confidence_score) if confidence_score else None,
                "is_manual": reading_data.is_manual,
                "raw_ocr_data": raw_ocr_data,
                "location_data": reading_data.location_data,
                "notes": reading_data.notes,
                "capture_timestamp": capture_timestamp.isoformat(),
            }
            
            result = self.supabase.table("meter_readings").insert(reading_data_dict).execute()
            
            if result.data:
                reading = result.data[0]

                # CRITICAL: Invalidate anomaly detection cache so it sees the new reading
                # This must happen BEFORE anomaly detection runs
                self.anomaly_service.invalidate_cache(user_id, reading_data.utility_type)

                # Trigger anomaly detection for all readings (manual and processed)
                # Rollbacks and critical anomalies should be detected regardless of input method
                logger.info(f"Triggering automatic anomaly detection for reading {reading['id']}")
                anomaly_result = None
                try:
                    anomaly_result = await self.anomaly_service.detect_anomaly(user_id, reading["id"])
                    if anomaly_result and anomaly_result.is_anomaly:
                        logger.info(f"ANOMALY DETECTED: {anomaly_result.is_anomaly}, severity: {anomaly_result.severity}")
                        
                        # Send anomaly notification
                        try:
                            from app.services.notifications import notification_service
                            await notification_service.send_anomaly_notification(
                                user_id=user_id,
                                reading_id=reading["id"],
                                utility_type=reading_data.utility_type,
                                severity=anomaly_result.severity,
                                anomaly_score=float(anomaly_result.anomaly_score),
                                contributing_factors=anomaly_result.contributing_factors
                            )
                            logger.info("Anomaly notification sent successfully")
                        except Exception as notification_error:
                            logger.warning(f"Failed to send anomaly notification: {notification_error}")
                    else:
                        logger.info("No anomaly detected")
                except Exception as anomaly_error:
                    # Don't fail reading creation if anomaly detection fails
                    logger.warning(f"Anomaly detection failed for reading {reading['id']}: {anomaly_error}")
                    anomaly_result = None
                
                # Return both reading and anomaly for frontend
                reading_response = MeterReadingResponse(**reading)

                # If there's an anomaly, return it along with the reading
                if anomaly_result and anomaly_result.is_anomaly:
                    return {
                        "reading": reading_response,
                        "anomaly": anomaly_result
                    }
                else:
                    return reading_response
            else:
                raise Exception("Failed to create meter reading")
                
        except Exception as e:
            logger.error(f"Error creating meter reading: {e}")
            raise Exception(f"Failed to create meter reading: {str(e)}")

    async def _get_user_reading_count(self, user_id: str, utility_type: UtilityType) -> int:
        """Get the count of meter readings for a user and utility type."""
        try:
            await self.init_supabase()

            # Query meter readings table to count user's readings for this utility type
            result = self.supabase.table("meter_readings").select("id", count="exact").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).execute()

            count = result.count if result.count is not None else 0
            logger.info(f"Found {count} meter readings for user {user_id}, utility {utility_type.value}")
            return count

        except Exception as e:
            logger.error(f"Error getting reading count: {e}")
            return 0

    async def get_reading(self, user_id: str, reading_id: str) -> Optional[MeterReadingResponse]:
        """Get a specific meter reading"""
        await self.init_supabase()
        
        try:
            result = self.supabase.table("meter_readings").select("*").eq("id", reading_id).eq("user_id", user_id).single().execute()
            
            if result.data:
                return MeterReadingResponse(**result.data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting meter reading: {e}")
            return None
    
    async def get_readings(
        self, 
        user_id: str, 
        utility_type: Optional[UtilityType] = None,
        limit: int = 50,
        offset: int = 0,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[MeterReadingResponse]:
        """Get meter readings with optional filters"""
        await self.init_supabase()
        
        try:
            query = self.supabase.table("meter_readings").select("*").eq("user_id", user_id)
            
            if utility_type:
                query = query.eq("utility_type", utility_type.value)
            
            if start_date:
                query = query.gte("capture_timestamp", start_date.isoformat())
            
            if end_date:
                query = query.lte("capture_timestamp", end_date.isoformat())
            
            result = query.order("capture_timestamp", desc=True).range(offset, offset + limit - 1).execute()
            
            return [MeterReadingResponse(**reading) for reading in result.data]
            
        except Exception as e:
            logger.error(f"Error getting meter readings: {e}")
            return []
    
    async def update_reading(self, user_id: str, reading_id: str, update_data: MeterReadingUpdate) -> Optional[MeterReadingResponse]:
        """Update a meter reading"""
        await self.init_supabase()
        
        try:
            update_dict = {}
            
            if update_data.reading_value is not None:
                update_dict["reading_value"] = float(update_data.reading_value)
            
            if update_data.notes is not None:
                update_dict["notes"] = update_data.notes
            
            if update_data.processing_status is not None:
                update_dict["processing_status"] = update_data.processing_status.value
            
            update_dict["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.supabase.table("meter_readings").update(update_dict).eq("id", reading_id).eq("user_id", user_id).execute()
            
            if result.data:
                return MeterReadingResponse(**result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating meter reading: {e}")
            return None
    
    async def delete_reading(self, user_id: str, reading_id: str) -> bool:
        """Delete a meter reading"""
        await self.init_supabase()
        
        try:
            result = self.supabase.table("meter_readings").delete().eq("id", reading_id).eq("user_id", user_id).execute()
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting meter reading: {e}")
            return False
    
    async def get_latest_reading(self, user_id: str, utility_type: UtilityType) -> Optional[MeterReadingResponse]:
        """Get the latest reading for a utility type"""
        await self.init_supabase()
        
        try:
            result = self.supabase.table("meter_readings").select("*").eq("user_id", user_id).eq("utility_type", utility_type.value).order("capture_timestamp", desc=True).limit(1).execute()
            
            if result.data:
                return MeterReadingResponse(**result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error getting latest meter reading: {e}")
            return None
    
    async def calculate_usage(
        self, 
        user_id: str, 
        utility_type: UtilityType, 
        start_date: datetime, 
        end_date: datetime
    ) -> Optional[Decimal]:
        """Calculate usage between two dates"""
        
        try:
            # Get readings at start and end dates
            start_reading = await self._get_reading_at_date(user_id, utility_type, start_date)
            end_reading = await self._get_reading_at_date(user_id, utility_type, end_date)
            
            if start_reading and end_reading:
                return end_reading.reading_value - start_reading.reading_value
            
            return None
            
        except Exception as e:
            logger.error(f"Error calculating usage: {e}")
            return None
    
    async def _get_reading_at_date(
        self,
        user_id: str,
        utility_type: UtilityType,
        target_date: datetime
    ) -> Optional[MeterReadingResponse]:
        """Get reading closest to a specific date"""
        await self.init_supabase()

        try:
            result = self.supabase.table("meter_readings").select("*").eq("user_id", user_id).eq("utility_type", utility_type.value).lte("capture_timestamp", target_date.isoformat()).order("capture_timestamp", desc=True).limit(1).execute()

            if result.data:
                return MeterReadingResponse(**result.data[0])
            return None

        except Exception as e:
            logger.error(f"Error getting reading at date: {e}")
            return None

    async def _upload_image_to_supabase(
        self,
        image_data: str,
        user_id: str,
        utility_type: str
    ) -> Optional[str]:
        """
        Upload confirmed meter image to Supabase Storage

        Args:
            image_data: Base64 encoded image data
            user_id: User ID
            utility_type: Utility type (water/electricity)

        Returns:
            Public URL of uploaded image, or None if upload fails
        """
        try:
            import base64
            from datetime import datetime

            # Decode base64 image
            if ',' in image_data:
                # Remove data:image/png;base64, prefix if present
                image_data = image_data.split(',')[1]

            image_bytes = base64.b64decode(image_data)

            # Generate unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{user_id}/{utility_type}/{timestamp}.jpg"

            # Upload to Supabase storage bucket 'meter-images'
            result = self.supabase.storage.from_('meter-images').upload(
                filename,
                image_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )

            # Get public URL
            public_url = self.supabase.storage.from_('meter-images').get_public_url(filename)

            logger.info(f"Image uploaded successfully: {public_url}")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload image to Supabase: {e}")
            return None


# Global service instance
meter_reading_service = MeterReadingService()