# Senso Backend API

FastAPI backend for the Senso Utility Monitoring Progressive Web App.

## Features

- **Authentication**: User registration, login, and JWT-based authentication via Supabase
- **Meter Readings**: CRUD operations for utility meter readings with image processing
- **Image Processing**: CNN-based meter reading extraction using computer vision and OCR
- **Anomaly Detection**: Machine learning-based anomaly detection using Isolation Forest
- **Cost Forecasting**: Predictive analytics for monthly utility costs using Linear Regression
- **Notifications**: Alert system for anomalies and reminders
- **Analytics**: Usage analytics and reporting

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Supabase**: Backend-as-a-service for authentication and database
- **PostgreSQL**: Primary database (via Supabase)
- **scikit-learn**: Machine learning models (Isolation Forest, Linear Regression)
- **OpenCV & PIL**: Computer vision and image processing
- **PyTorch**: Deep learning framework for CNN models
- **EasyOCR/Tesseract**: Optical Character Recognition

## Setup

### Prerequisites

- Python 3.8+
- Supabase account and project
- Redis (optional, for background tasks)

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Set your Supabase URL and keys
- Configure JWT secret key
- Set up email settings (optional)
- Configure other settings as needed

5. Create necessary directories:
```bash
mkdir -p models uploads logs
```

### Database Setup

The database schema is defined in `../database_schema.sql`. Apply it to your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to the SQL editor
3. Copy and execute the contents of `database_schema.sql`

### Running the Application

Development mode:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Meter Readings
- `GET /api/v1/readings` - Get user's meter readings
- `POST /api/v1/readings` - Create new meter reading
- `GET /api/v1/readings/{id}` - Get specific reading
- `PUT /api/v1/readings/{id}` - Update reading
- `DELETE /api/v1/readings/{id}` - Delete reading
- `POST /api/v1/readings/process-image` - Process meter image
- `GET /api/v1/readings/latest/{utility_type}` - Get latest reading
- `GET /api/v1/readings/usage/{utility_type}` - Calculate usage

### Analytics
- `GET /api/v1/analytics/anomalies` - Get user's anomalies
- `POST /api/v1/analytics/anomalies/{id}/feedback` - Provide anomaly feedback
- `POST /api/v1/analytics/forecasts` - Create cost forecast
- `GET /api/v1/analytics/forecasts` - Get user's forecasts
- `GET /api/v1/analytics/usage` - Get usage analytics
- `GET /api/v1/analytics/usage/summary` - Get usage summary

### Notifications
- `GET /api/v1/notifications` - Get user's notifications
- `PATCH /api/v1/notifications/{id}/read` - Mark notification as read
- `PATCH /api/v1/notifications/read-all` - Mark all notifications as read
- `DELETE /api/v1/notifications/{id}` - Delete notification

### User Preferences
- `GET /api/v1/preferences` - Get user preferences
- `PUT /api/v1/preferences` - Update user preferences
- `POST /api/v1/preferences` - Create user preferences
- `DELETE /api/v1/preferences` - Reset to defaults

## Machine Learning Models

### Image Processing (CNN + OCR)
- **Purpose**: Extract meter readings from camera images
- **Architecture**: CNN for digit detection + OCR for text recognition
- **Preprocessing**: Image enhancement, noise reduction, thresholding
- **Fallback**: EasyOCR or Tesseract for digit recognition

### Anomaly Detection (Isolation Forest)
- **Purpose**: Detect unusual consumption patterns
- **Features**: Daily consumption, time patterns, rolling statistics
- **Training**: User-specific models trained on rolling 30-day windows
- **Output**: Anomaly score, severity level, contributing factors

### Cost Forecasting (Linear Regression + Random Forest)
- **Purpose**: Predict monthly utility costs
- **Features**: Historical consumption, seasonal patterns, pricing data
- **Architecture**: Ensemble of Linear Regression and Random Forest
- **Output**: Predicted cost with confidence intervals

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- **Supabase**: Connection and authentication
- **JWT**: Token signing and expiration
- **ML Models**: Paths, parameters, training settings
- **Notifications**: Email, push notification settings
- **File Uploads**: Size limits, storage paths

### Model Training

Models are trained automatically when:
- Sufficient historical data is available (10+ readings for anomaly detection, 30+ for forecasting)
- Previous model is older than the retrain threshold
- New readings trigger retraining

## Development

### Project Structure
```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/       # API route handlers
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration management
│   │   ├── database.py     # Database connections
│   │   └── auth.py         # Authentication logic
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   ├── services/           # Business logic
│   │   ├── meter_readings.py
│   │   ├── image_processing.py
│   │   ├── anomaly_detection.py
│   │   ├── progressive_forecasting.py
│   │   └── notifications.py
│   └── utils/              # Utility functions
├── models/                 # ML model files
├── uploads/                # File upload storage
├── main.py                # FastAPI app entry point
├── requirements.txt       # Python dependencies
└── .env.example          # Environment configuration template
```

### Adding New Endpoints

1. Create endpoint function in appropriate file under `app/api/endpoints/`
2. Define request/response schemas in `app/models/schemas.py`
3. Implement business logic in appropriate service under `app/services/`
4. Add route to main router in `app/api/__init__.py`

### Testing

Run tests with pytest:
```bash
pytest
```

### Code Quality

The project follows these standards:
- Type hints for all functions
- Pydantic models for request/response validation
- Structured logging with loguru
- Error handling with proper HTTP status codes
- Database queries through Supabase client
- Async/await pattern for all I/O operations

## Deployment

### Docker

Build and run with Docker:
```bash
docker build -t senso-backend .
docker run -p 8000:8000 --env-file .env senso-backend
```

### Production Considerations

- Set strong JWT secret key
- Configure proper CORS origins
- Set up SSL/HTTPS
- Use production database
- Configure email service
- Set up monitoring and logging
- Consider using Redis for caching and background tasks

## Security

- JWT-based authentication via Supabase
- Row Level Security (RLS) policies in database
- Input validation with Pydantic
- Rate limiting (implement as needed)
- CORS configuration
- Secure file upload handling

## Monitoring

- Health check endpoint: `GET /health`
- Structured logging with loguru
- Model performance tracking in database
- Notification delivery tracking

## Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the database schema in `../database_schema.sql`
3. Check environment configuration in `.env.example`
4. Enable debug logging with `LOG_LEVEL=DEBUG`