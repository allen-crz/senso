---
title: Senso Unified API
emoji: ⚡
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Senso Unified API - Backend + YOLO Meter Reading

Complete backend service for Senso utility monitoring PWA, including:
- 🔐 User authentication & authorization
- 📊 Meter reading management with YOLO detection
- 📈 ML-based cost forecasting
- 🔔 Anomaly detection & notifications
- 💰 Utility bill calculations
- 📅 Automated billing cycle tracking

## Architecture

```
Frontend (Vercel) → This HF Space → Supabase (Database)
```

## What's Included

### Backend Features
- FastAPI REST API with full CRUD operations
- Supabase integration for data persistence
- User authentication with JWT tokens
- Scheduled tasks for billing cycles (APScheduler)
- ML forecasting with scikit-learn
- Anomaly detection with Isolation Forest

### YOLO Meter Reading
- YOLOv8 CNN models for digit detection
- Support for electricity & water meters
- Real-time image processing
- Confidence scoring

## Environment Variables Required

Configure these as **Secrets** in your Hugging Face Space settings:

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
SUPABASE_JWT_SECRET=your_jwt_secret
LOG_LEVEL=INFO
ALLOWED_HOSTS=*
```

## Models Required

Place these files in the `models/` directory before deploying:

- `electric_meter.pt` (50MB) - YOLOv8 model for electricity meters
- `water_meter.pt` (50MB) - YOLOv8 model for water meters

## API Endpoints

### Health Check
```bash
GET /health
```

### Backend API (Full feature set)
```bash
POST /api/v1/auth/signup          # User registration
POST /api/v1/auth/login           # User login
GET  /api/v1/readings             # Get meter readings
POST /api/v1/readings/process     # Process meter image
GET  /api/v1/forecasting          # Get cost forecast
GET  /api/v1/analytics            # Get usage analytics
# ... and many more
```

### API Documentation
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Deployment Steps

1. **Create a new Hugging Face Space**
   - Go to https://huggingface.co/new-space
   - Choose "Docker" as SDK
   - Select hardware: CPU Basic (free) is sufficient for 15 users

2. **Upload Files**
   ```
   huggingface_deployment/
   ├── Dockerfile
   ├── requirements.txt
   ├── main.py
   ├── README.md (this file)
   ├── app/                    # Copy entire app/ folder from backend/
   └── models/
       ├── electric_meter.pt
       └── water_meter.pt
   ```

3. **Configure Secrets**
   - Go to Space Settings → Repository secrets
   - Add all environment variables listed above

4. **Deploy**
   - Space will automatically build and deploy
   - Access your API at: `https://your-username-senso-api.hf.space`

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the application
python main.py
```

Visit: http://localhost:7860/docs

## Hardware Requirements

**Free Tier (CPU Basic):**
- ✅ 16GB RAM (sufficient for 15 users)
- ✅ 2 CPU cores
- ✅ 50GB storage
- ⚠️ May sleep after inactivity (cold starts)

**Upgrade Options (if needed):**
- CPU Basic ($0/month): Current setup
- CPU Upgrade ($0.03/hour): Better performance, no sleep
- GPU: Not needed for your use case

## Performance Notes

- **Cold starts**: ~30-60 seconds after inactivity (free tier)
- **YOLO inference**: ~2-5 seconds per image
- **ML forecasting**: <1 second
- **Database queries**: <500ms (via Supabase)

## Support

For issues or questions:
- Check `/docs` for API documentation
- Review logs in Space logs tab
- Contact: your-email@example.com

---

**License**: MIT
**Version**: 1.0.0
**Powered by**: FastAPI, YOLOv8, Supabase, Hugging Face Spaces
