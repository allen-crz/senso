#!/bin/bash

# Senso Backend Deployment Script
# Deploys FastAPI backend with YOLO-based meter reading and ML cost forecasting

set -e

echo "🚀 Starting Senso Backend Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please copy .env.example to .env and configure it."
    echo ""
    echo "Required environment variables:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Load environment variables
source .env

# Verify required environment variables
echo "🔍 Verifying required environment variables..."
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required Supabase configuration!"
    echo "Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env"
    exit 1
fi

# Check if YOLO models exist
echo "🔍 Checking YOLO models..."
if [ ! -f "models/electric_meter.pt" ] || [ ! -f "models/water_meter.pt" ]; then
    echo "⚠️  Warning: YOLO models not found in models/ directory"
    echo "   - electric_meter.pt (required for electricity meter reading)"
    echo "   - water_meter.pt (required for water meter reading)"
    echo ""
    echo "   The app will start but meter image processing will fail."
    echo "   Press Ctrl+C to cancel or wait 5 seconds to continue..."
    sleep 5
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p models uploads logs ssl

# Build Docker image
echo "🔨 Building Docker image..."
echo "   (This may take 5-10 minutes on first build due to ML dependencies)"
docker-compose build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
echo "   (FastAPI with YOLO models needs time to load...)"
sleep 30

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed!"
    echo ""
    echo "Showing recent logs:"
    docker-compose logs --tail=50 senso-backend
    exit 1
fi

# Show running containers
echo "📋 Running containers:"
docker-compose ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Service endpoints:"
echo "   - API: http://localhost:8000"
echo "   - API Documentation: http://localhost:8000/docs"
echo "   - Health Check: http://localhost:8000/health"
echo ""
echo "🔧 Core Features Available:"
echo "   - User Authentication (Supabase)"
echo "   - Meter Reading Image Processing (YOLO CNN)"
echo "   - Cost Forecasting (Scikit-learn ML)"
echo "   - Anomaly Detection (Isolation Forest)"
echo "   - Billing Cycle Management (APScheduler)"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f senso-backend"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"