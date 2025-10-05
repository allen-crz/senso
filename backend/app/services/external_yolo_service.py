"""
External YOLO Service - Calls Hugging Face Space API for meter reading
Falls back to local YOLO models if API is unavailable
"""
import httpx
from typing import Optional, Tuple
from decimal import Decimal
from loguru import logger

from app.core.config import settings
from app.models.schemas import UtilityType, ReadingStatus, ImageProcessResponse


class ExternalYOLOService:
    """Service for calling external YOLO API or falling back to local"""

    def __init__(self):
        self.api_url = settings.YOLO_API_URL
        self.timeout = settings.YOLO_API_TIMEOUT
        self.local_service = None  # Lazy load local service if needed

    async def process_image(
        self, image_data: str, utility_type: UtilityType
    ) -> ImageProcessResponse:
        """
        Process meter image using external YOLO API or local fallback

        Args:
            image_data: Base64 encoded image string
            utility_type: "electricity" or "water"

        Returns:
            ImageProcessResponse with reading data
        """

        # Try external API first if configured
        if self.api_url:
            try:
                return await self._call_external_api(image_data, utility_type)
            except Exception as e:
                logger.warning(f"External YOLO API failed: {e}, falling back to local")
                return await self._use_local_fallback(image_data, utility_type)

        # No external API configured, use local
        return await self._use_local_fallback(image_data, utility_type)

    async def _call_external_api(
        self, image_data: str, utility_type: UtilityType
    ) -> ImageProcessResponse:
        """Call external Hugging Face YOLO API"""

        logger.info(f"Calling external YOLO API: {self.api_url}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.api_url}/process-meter-image",
                json={
                    "image_data": image_data,
                    "utility_type": utility_type.value
                }
            )

            response.raise_for_status()
            data = response.json()

            # Convert API response to ImageProcessResponse
            return ImageProcessResponse(
                reading_value=data.get("reading_value"),
                confidence_score=Decimal(str(data.get("confidence_score", 0.0))),
                processing_status=(
                    ReadingStatus.PROCESSED
                    if data.get("reading_value") and not data.get("error_message")
                    else ReadingStatus.FAILED
                ),
                raw_ocr_data=data.get("raw_data", {}),
                error_message=data.get("error_message")
            )

    async def _use_local_fallback(
        self, image_data: str, utility_type: UtilityType
    ) -> ImageProcessResponse:
        """Fallback to local YOLO models"""

        logger.info("Using local YOLO models (fallback)")

        # Lazy load local image processing service
        if self.local_service is None:
            from app.services.image_processing import image_processing_service
            self.local_service = image_processing_service

        # Use local service
        return await self.local_service.process_image(image_data, utility_type)


# Global service instance
external_yolo_service = ExternalYOLOService()
