"""
Image processing service for YOLOv8-based meter reading extraction
"""
import base64
import io
import cv2
import numpy as np
from typing import Optional, Dict, Any, Tuple
from decimal import Decimal
from PIL import Image
from pathlib import Path

from app.models.schemas import UtilityType, ReadingStatus, ImageProcessResponse
from app.core.config import settings
from loguru import logger

# Lazy import YOLO to avoid startup issues
YOLO_AVAILABLE = None
_YOLO = None

def _get_yolo():
    """Lazy load YOLO model"""
    global YOLO_AVAILABLE, _YOLO

    if YOLO_AVAILABLE is None:
        try:
            from ultralytics import YOLO
            YOLO_AVAILABLE = True
            logger.info("YOLO successfully imported")
        except ImportError as e:
            YOLO_AVAILABLE = False
            logger.warning(f"YOLO not available: {e}")
            return None

    if YOLO_AVAILABLE and _YOLO is None:
        try:
            from ultralytics import YOLO
            _YOLO = YOLO
        except Exception as e:
            logger.error(f"Failed to load YOLO: {e}")
            YOLO_AVAILABLE = False
            return None

    return _YOLO if YOLO_AVAILABLE else None


class ImageProcessingService:
    """Service for processing meter images and extracting readings using YOLOv8 CNN"""
    
    def __init__(self):
        self.electricity_model = None
        self.water_model = None
        self.models_loaded = {"electricity": False, "water": False}
        
    async def load_models(self, utility_type: UtilityType = None):
        """Load YOLOv8 models for electricity and/or water meters"""
        # Get YOLO class using lazy loader
        YOLO = _get_yolo()
        if not YOLO:
            logger.error("YOLO package not available")
            return

        # Load electricity model if needed
        if (utility_type is None or utility_type == UtilityType.ELECTRICITY) and not self.models_loaded["electricity"]:
            try:
                electricity_paths = [
                    settings.YOLO_MODEL_PATH,
                    "backend/app/models/electric_meter.pt",
                    "app/models/electric_meter.pt",
                    "models/electric_meter.pt",
                    "electric_meter.pt"
                ]

                for model_path in electricity_paths:
                    if Path(model_path).exists():
                        self.electricity_model = YOLO(model_path)
                        logger.info(f"Electricity YOLOv8 model loaded from {model_path}")
                        self.models_loaded["electricity"] = True
                        break

                if not self.models_loaded["electricity"]:
                    logger.warning("Electricity meter model not found")

            except Exception as e:
                logger.error(f"Failed to load electricity YOLOv8 model: {e}")

        # Load water model if needed
        if (utility_type is None or utility_type == UtilityType.WATER) and not self.models_loaded["water"]:
            try:
                water_paths = [
                    settings.WATER_YOLO_MODEL_PATH,
                    "backend/app/models/water_meter.pt",
                    "app/models/water_meter.pt",
                    "models/water_meter.pt",
                    "water_meter.pt"
                ]

                for model_path in water_paths:
                    if Path(model_path).exists():
                        self.water_model = YOLO(model_path)
                        logger.info(f"Water YOLOv8 model loaded from {model_path}")
                        self.models_loaded["water"] = True
                        break

                if not self.models_loaded["water"]:
                    logger.warning("Water meter model not found")

            except Exception as e:
                logger.error(f"Failed to load water YOLOv8 model: {e}")
    
    async def process_image(self, image_data: str, utility_type: UtilityType) -> ImageProcessResponse:
        """Process meter image and extract reading using YOLOv8"""
        
        
        await self.load_models(utility_type)

        # Get the appropriate model for the utility type
        current_model = self.electricity_model if utility_type == UtilityType.ELECTRICITY else self.water_model

        if not current_model:
            model_type = "electricity" if utility_type == UtilityType.ELECTRICITY else "water"
            return ImageProcessResponse(
                reading_value=None,
                confidence_score=Decimal("0.0"),
                processing_status=ReadingStatus.FAILED,
                raw_ocr_data={"error": f"{model_type} YOLOv8 model not available"},
                error_message=f"{model_type} YOLOv8 model not loaded"
            )
        
        try:
            # Decode base64 image
            image = self._decode_base64_image(image_data)
            
            # Extract reading using YOLOv8
            reading_value, confidence_score = await self._extract_reading_yolo(image, utility_type, current_model)
            
            # Prepare response
            raw_data = {
                "method": "yolov8_cnn",
                "reading": str(reading_value) if reading_value else None,
                "confidence": str(confidence_score) if confidence_score else "0.0"
            }
            
            # Check confidence threshold
            confidence_threshold = 0.3  # Lower threshold for debugging
            
            if reading_value is not None and confidence_score and confidence_score >= confidence_threshold:
                return ImageProcessResponse(
                    reading_value=reading_value,
                    confidence_score=confidence_score,
                    processing_status=ReadingStatus.PROCESSED,
                    raw_ocr_data=raw_data
                )
            else:
                return ImageProcessResponse(
                    reading_value=reading_value,  # Return the value even if low confidence
                    confidence_score=confidence_score or Decimal("0.0"),
                    processing_status=ReadingStatus.FAILED,
                    raw_ocr_data=raw_data,
                    error_message=f"Low confidence ({confidence_score or 0.0:.3f} < {confidence_threshold})"
                )
                
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return ImageProcessResponse(
                reading_value=None,
                confidence_score=Decimal("0.0"),
                processing_status=ReadingStatus.FAILED,
                raw_ocr_data={"error": str(e)},
                error_message=str(e)
            )
    
    def _decode_base64_image(self, image_data: str) -> np.ndarray:
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array (OpenCV format BGR)
            image_array = np.array(pil_image)
            return cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
        except Exception as e:
            raise Exception(f"Failed to decode image: {str(e)}")
    
    async def _extract_reading_yolo(self, image: np.ndarray, utility_type: UtilityType, model) -> Tuple[Optional[str], Optional[Decimal]]:
        """Extract meter reading using YOLOv8 digit detection"""
        
        try:
            # Convert BGR to RGB for YOLO
            if len(image.shape) == 3:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(image_rgb)
            
            
            # Run YOLOv8 inference
            results = model(pil_image, conf=0.25, imgsz=640, verbose=False)
            
            if not results or not results[0].boxes:
                return None, None
            
            # Process detections
            boxes = results[0].boxes
            detections = []
            
            
            # Extract detection data
            for i, box in enumerate(boxes):
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                class_name = model.names.get(cls, f"class_{cls}")
                
                detections.append({
                    "class": cls,
                    "confidence": conf,
                    "bbox": xyxy,
                    "class_name": class_name
                })
                
            
            # Filter out non-digit detections (keep only classes 0-9, exclude 'meter' class)
            digit_detections = []
            for det in detections:
                # Assume classes 0-9 are digits, class 10 is 'meter'
                if det['class'] <= 9 and det['confidence'] >= 0.25:
                    digit_detections.append(det)
            
            if not digit_detections:
                return None, None
            
            # Sort detections by X position (left to right)
            digit_detections.sort(key=lambda d: d['bbox'][0])
            
            
            # Combine digits into reading
            digits = [str(det['class']) for det in digit_detections]
            confidences = [det['confidence'] for det in digit_detections]

            # Create reading string with proper decimal placement for water meters
            if utility_type == UtilityType.WATER and len(digits) >= 6:
                # Water meters: 5 digits before decimal, remaining after (typically 3)
                integer_part = ''.join(digits[:-3])  # All but last 3 digits
                decimal_part = ''.join(digits[-3:])  # Last 3 digits
                reading_str = f"{integer_part}.{decimal_part}"
            else:
                # Electricity meters or insufficient digits - no decimal
                reading_str = ''.join(digits)

            avg_confidence = sum(confidences) / len(confidences)
            
            
            # Keep as string to preserve leading zeros, convert confidence to decimal
            reading_value = reading_str  # Keep as string to preserve leading zeros
            confidence = Decimal(str(avg_confidence))
            
            
            # Validate reading based on utility type (convert to float for validation only)
            if not self._validate_reading_string(reading_value, utility_type):
                return None, None
            
            return reading_value, confidence
            
        except Exception as e:
            logger.error(f"YOLOv8 extraction failed: {e}")
            return None, None
    
    def _validate_reading(self, reading_value: Decimal, utility_type: UtilityType) -> bool:
        """Validate reading value based on utility type"""
        try:
            value = float(reading_value)
            
            if utility_type == UtilityType.ELECTRICITY:
                # Reasonable range for electricity meters (0-999999 kWh)
                return 0 <= value <= 999999
                
            elif utility_type == UtilityType.WATER:
                # Reasonable range for water meters (0-99999 m³)
                return 0 <= value <= 99999
            
            return True
            
        except (ValueError, TypeError):
            return False
    
    def _validate_reading_string(self, reading_value: str, utility_type: UtilityType) -> bool:
        """Validate reading value string based on utility type"""
        try:
            value = float(reading_value)
            
            if utility_type == UtilityType.ELECTRICITY:
                # Reasonable range for electricity meters (0-999999 kWh)
                return 0 <= value <= 999999
                
            elif utility_type == UtilityType.WATER:
                # Reasonable range for water meters (0-99999 m³)
                return 0 <= value <= 99999
            
            return True
            
        except (ValueError, TypeError):
            return False


# Global service instance
image_processing_service = ImageProcessingService()