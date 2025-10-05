"""
Senso YOLO Meter Reading API
Deployed on Hugging Face Spaces (Free tier - 16GB RAM)
Provides meter digit detection via YOLOv8 CNN
"""
import os
import io
import base64
from typing import Dict, Any
from decimal import Decimal

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
import uvicorn

# Initialize FastAPI
app = FastAPI(
    title="Senso YOLO Meter Reading API",
    description="YOLOv8-based meter digit detection service",
    version="1.0.0"
)

# Model cache (loaded once at startup)
models = {
    "electricity": None,
    "water": None
}

class ImageRequest(BaseModel):
    image_data: str  # base64 encoded image
    utility_type: str  # "electricity" or "water"

class ImageResponse(BaseModel):
    reading_value: str | None
    confidence_score: float
    raw_data: Dict[str, Any]
    error_message: str | None = None

def load_models():
    """Load YOLO models at startup"""
    print("🔄 Loading YOLO models...")

    # Load electricity model
    if os.path.exists("electric_meter.pt"):
        models["electricity"] = YOLO("electric_meter.pt")
        print("✅ Electricity model loaded")
    else:
        print("⚠️ electric_meter.pt not found")

    # Load water model
    if os.path.exists("water_meter.pt"):
        models["water"] = YOLO("water_meter.pt")
        print("✅ Water model loaded")
    else:
        print("⚠️ water_meter.pt not found")

def decode_base64_image(image_data: str) -> np.ndarray:
    """Decode base64 image to numpy array"""
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

def extract_reading_yolo(image: np.ndarray, utility_type: str, model) -> tuple:
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
            return None, None, []

        # Process detections
        boxes = results[0].boxes
        detections = []

        # Extract detection data
        for box in boxes:
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

        # Filter out non-digit detections (keep only classes 0-9)
        digit_detections = []
        for det in detections:
            if det['class'] <= 9 and det['confidence'] >= 0.25:
                digit_detections.append(det)

        if not digit_detections:
            return None, None, detections

        # Sort detections by X position (left to right)
        digit_detections.sort(key=lambda d: d['bbox'][0])

        # Combine digits into reading
        digits = [str(det['class']) for det in digit_detections]
        confidences = [det['confidence'] for det in digit_detections]

        # Create reading string with proper decimal placement for water meters
        if utility_type == "water" and len(digits) >= 6:
            # Water meters: 5 digits before decimal, remaining after (typically 3)
            integer_part = ''.join(digits[:-3])
            decimal_part = ''.join(digits[-3:])
            reading_str = f"{integer_part}.{decimal_part}"
        else:
            # Electricity meters or insufficient digits - no decimal
            reading_str = ''.join(digits)

        avg_confidence = sum(confidences) / len(confidences)

        return reading_str, avg_confidence, detections

    except Exception as e:
        print(f"YOLO extraction failed: {e}")
        return None, None, []

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Senso YOLO Meter Reading API",
        "status": "running",
        "models_loaded": {
            "electricity": models["electricity"] is not None,
            "water": models["water"] is not None
        }
    }

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "models": {
            "electricity": "loaded" if models["electricity"] else "not_loaded",
            "water": "loaded" if models["water"] else "not_loaded"
        }
    }

@app.post("/process-meter-image", response_model=ImageResponse)
async def process_meter_image(request: ImageRequest):
    """Process meter image and extract reading"""

    # Validate utility type
    if request.utility_type not in ["electricity", "water"]:
        raise HTTPException(status_code=400, detail="utility_type must be 'electricity' or 'water'")

    # Get model
    model = models.get(request.utility_type)
    if not model:
        return ImageResponse(
            reading_value=None,
            confidence_score=0.0,
            raw_data={"error": f"{request.utility_type} model not loaded"},
            error_message=f"{request.utility_type} model not available"
        )

    try:
        # Decode image
        image = decode_base64_image(request.image_data)

        # Extract reading
        reading_value, confidence_score, detections = extract_reading_yolo(
            image, request.utility_type, model
        )

        # Prepare response
        raw_data = {
            "method": "yolov8_cnn",
            "reading": reading_value,
            "confidence": confidence_score,
            "detections_count": len(detections)
        }

        # Check confidence threshold
        confidence_threshold = 0.3

        if reading_value and confidence_score and confidence_score >= confidence_threshold:
            return ImageResponse(
                reading_value=reading_value,
                confidence_score=confidence_score,
                raw_data=raw_data,
                error_message=None
            )
        else:
            return ImageResponse(
                reading_value=reading_value,
                confidence_score=confidence_score or 0.0,
                raw_data=raw_data,
                error_message=f"Low confidence ({confidence_score or 0.0:.3f} < {confidence_threshold})"
            )

    except Exception as e:
        return ImageResponse(
            reading_value=None,
            confidence_score=0.0,
            raw_data={"error": str(e)},
            error_message=str(e)
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
