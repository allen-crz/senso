# Senso - Utility Monitoring PWA

Welcome to the Senso documentation! Senso is a Progressive Web Application designed to help you monitor and manage your utility consumption through intelligent meter reading, anomaly detection, and cost forecasting.

## What is Senso?

Senso is a comprehensive utility monitoring solution that combines modern web technologies with machine learning to provide:

- **Automated Meter Reading**: Capture and process utility meter readings using your device's camera
- **AI-Powered Analysis**: Machine learning models detect anomalies and forecast costs
- **Real-time Monitoring**: Track water and electricity consumption in real-time
- **Smart Notifications**: Get alerted about unusual consumption patterns
- **Cost Forecasting**: Predict future utility costs based on historical data

## Key Features

### 📸 Smart Camera Integration
Capture meter readings using your device's camera with automatic OCR processing powered by computer vision and deep learning models.

### 🤖 Machine Learning Analytics
- **Anomaly Detection**: Isolation Forest models identify unusual consumption patterns
- **Cost Forecasting**: Linear Regression and Random Forest models predict future costs
- **Pattern Recognition**: CNN-based models extract accurate readings from images

### 📊 Comprehensive Dashboard
View your utility consumption trends, compare usage across different periods, and track your savings goals.

### 🔔 Intelligent Notifications
Receive alerts for:
- Unusual consumption patterns
- Billing reminders
- Reading schedule reminders
- Anomaly detection results

### 🔐 Secure & Private
Built with Supabase authentication and Row Level Security (RLS) policies to ensure your data remains private and secure.

## Technology Stack

### Frontend
- **React** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **shadcn/ui** for beautiful, accessible components
- **Capacitor** for native mobile capabilities

### Backend
- **FastAPI** for high-performance API endpoints
- **Supabase** for authentication and database
- **PostgreSQL** for reliable data storage
- **scikit-learn** for machine learning models
- **PyTorch** for deep learning (CNN models)
- **OpenCV** and **EasyOCR/Tesseract** for image processing

## Quick Links

- [Installation Guide](getting-started/installation.md)
- [Quick Start](getting-started/quick-start.md)
- [User Guide](user-guide/overview.md)
- [API Documentation](api-reference/overview.md)
- [Deployment Guide](deployment/overview.md)

## Get Started

Ready to start monitoring your utilities? Head over to the [Installation Guide](getting-started/installation.md) to get Senso up and running on your device.

## Support

If you encounter any issues or have questions, please refer to:
- [Troubleshooting Guide](troubleshooting/common-issues.md)
- [FAQ](troubleshooting/faq.md)

## Contributing

We welcome contributions! See our [Contributing Guide](contributing.md) for details on how to get started.
