# Senso YOLO Meter Reading API

Hugging Face Space for YOLOv8-based meter digit detection.

## What this does

Provides a REST API for processing meter images and extracting readings using YOLOv8 CNN models.

## Models Required

Place these files in the same directory as `app.py`:

- `electric_meter.pt` (50MB)
- `water_meter.pt` (50MB)

## API Endpoints

### POST /process-meter-image

**Request:**
```json
{
  "image_data": "base64_encoded_image_string",
  "utility_type": "electricity" or "water"
}
```

**Response:**
```json
{
  "reading_value": "12345",
  "confidence_score": 0.95,
  "raw_data": {
    "method": "yolov8_cnn",
    "reading": "12345",
    "confidence": 0.95,
    "detections_count": 5
  },
  "error_message": null
}
```

### GET /health

Health check endpoint.

### GET /

Root endpoint with service info.

## Deployment on Hugging Face

1. Create new Space on huggingface.co
2. Choose "Docker" SDK
3. Upload files:
   - app.py
   - requirements.txt
   - Dockerfile
   - electric_meter.pt
   - water_meter.pt

## Local Testing

```bash
pip install -r requirements.txt
python app.py
```

Visit: http://localhost:7860/docs
