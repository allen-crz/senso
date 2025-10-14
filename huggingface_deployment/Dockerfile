# Senso Unified Backend + YOLO API for Hugging Face Spaces
# Combines FastAPI backend with ML forecasting and YOLO meter reading
FROM python:3.11-slim

WORKDIR /app

# Set YOLO config directory to avoid repeated warnings
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
# Disable multiprocessing for scikit-learn (prevents spawn issues)
ENV JOBLIB_MULTIPROCESSING=0
ENV SCIKIT_LEARN_ENABLE_MULTIPROCESSING=0

# Install system dependencies for OpenCV, YOLO, and scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgl1 \
    libgthread-2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY main.py .

# Copy YOLO models (50MB each)
# You'll upload these to your HF Space
COPY models/electric_meter.pt ./models/electric_meter.pt
COPY models/water_meter.pt ./models/water_meter.pt

# Create necessary directories for models, uploads, and logs with write permissions
RUN mkdir -p models uploads logs && chmod -R 777 logs uploads

# Expose port 7860 (HF Spaces standard)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:7860/health')" || exit 1

# Run application on port 7860 (HF Spaces requirement)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
