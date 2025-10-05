# Senso API - Utility Monitoring PWA Backend
# Python FastAPI with YOLO-based meter reading and ML cost forecasting
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for:
# - opencv-python-headless (libglib, libsm, libxext, libxrender, libgomp)
# - ultralytics/YOLO (libgl1-mesa-glx)
# - Building Python packages (gcc, g++)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories for models, uploads, and logs
RUN mkdir -p models uploads logs

# Ensure YOLO models are present (copy if building with models)
# Models should be in backend/models/ directory:
# - electric_meter.pt (50MB)
# - water_meter.pt (50MB)

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
# Disable multiprocessing for scikit-learn (prevents Windows spawn issues)
ENV JOBLIB_MULTIPROCESSING=0
ENV SCIKIT_LEARN_ENABLE_MULTIPROCESSING=0

# Expose port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run the application
# Note: Render will override PORT with $PORT environment variable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]