FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Copy YOLO models (must be uploaded to HF Space)
COPY electric_meter.pt .
COPY water_meter.pt .

# Expose Hugging Face Spaces port
EXPOSE 7860

# Run the application
CMD ["python", "app.py"]
