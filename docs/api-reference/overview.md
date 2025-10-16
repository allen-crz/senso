# API Reference Overview

Senso provides a comprehensive RESTful API for programmatic access to all features. This section documents the API endpoints, authentication, and usage.

## API Documentation

The complete API documentation is available in:
- [Backend API Documentation](backend-api.md) - Full API reference

## API Structure

The Senso API is organized into several main sections:

### Authentication (`/api/v1/auth`)
User registration, login, and token management.

### Meter Readings (`/api/v1/readings`)
CRUD operations for utility meter readings and image processing.

### Analytics (`/api/v1/analytics`)
Access to anomaly detection, forecasts, and usage analytics.

### Notifications (`/api/v1/notifications`)
Manage user notifications and alerts.

### User Preferences (`/api/v1/preferences`)
Configure user settings and preferences.

## Base URL

```
Production: https://your-domain.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All API endpoints (except registration and login) require authentication using JWT tokens.

**Authentication Header:**
```
Authorization: Bearer <your_jwt_token>
```

See [Authentication Endpoints](authentication.md) for details on obtaining tokens.

## Response Format

All API responses follow a consistent JSON format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

## Rate Limiting

API requests are rate-limited to ensure fair usage:
- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Burst**: 200 requests in 60 seconds

## Interactive Documentation

When running the backend locally, access interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Quick Start

### 1. Register a User
```bash
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure_password"}'
```

### 2. Login
```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure_password"}'
```

### 3. Create a Reading
```bash
curl -X POST https://your-domain.com/api/v1/readings \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"utility_type": "water", "value": 12345.67}'
```

### 4. Get Analytics
```bash
curl https://your-domain.com/api/v1/analytics/usage \
  -H "Authorization: Bearer <your_token>"
```

## SDKs and Libraries

Currently, the API can be accessed using any HTTP client. Official SDKs may be available in the future for:
- Python
- JavaScript/TypeScript
- Mobile (iOS/Android)

## Webhooks

Configure webhooks to receive real-time notifications for:
- New anomalies detected
- Forecast updates
- Reading reminders

See your Settings → Integrations for webhook configuration.

## API Versioning

The API is versioned via the URL path (`/api/v1`). Breaking changes will result in a new version (`/api/v2`), while the previous version remains available.

## Support

For API-related questions:
- Review [Backend API Documentation](backend-api.md)
- Check [Technical Documentation](../technical-docs/architecture.md)
- Report issues on GitHub

## Next Steps

- [Authentication Endpoints](authentication.md)
- [Meter Readings Endpoints](readings.md)
- [Analytics Endpoints](analytics.md)
- [Backend API Documentation](backend-api.md)
