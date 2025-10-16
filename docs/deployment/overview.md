# Deployment Overview

This guide provides an overview of deploying Senso to production environments. Detailed deployment instructions are available for different scenarios.

## Deployment Options

Senso consists of two main components that need to be deployed:

### Frontend (React PWA)
- Static site deployment
- CDN-friendly
- PWA requirements

### Backend (FastAPI)
- Python application server
- Database connectivity
- ML model hosting

## Deployment Guides

We provide detailed guides for different deployment scenarios:

### [Production Deployment](production.md)
Comprehensive guide for full production deployment including:
- Infrastructure setup
- Environment configuration
- Security considerations
- Monitoring and maintenance

### [Free Tier Deployment](free-tier.md)
Deploy Senso using free-tier services:
- Vercel (frontend)
- Render or Railway (backend)
- Supabase (database)
- Cost: $0/month

## Quick Start

### Frontend Deployment

**Recommended platforms:**
- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS Amplify

**Requirements:**
- Node.js 16+
- Build command: `npm run build`
- Output directory: `dist`
- HTTPS enabled
- Environment variables configured

### Backend Deployment

**Recommended platforms:**
- Render (recommended for free tier)
- Railway
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run

**Requirements:**
- Python 3.8+
- PostgreSQL database (Supabase)
- Environment variables
- File storage for uploads

## Pre-Deployment Checklist

### Frontend
- [ ] Environment variables configured
- [ ] API endpoints set correctly
- [ ] PWA manifest configured
- [ ] Service worker registered
- [ ] Icons and assets included
- [ ] Build tested locally

### Backend
- [ ] Database schema applied
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] ML models available
- [ ] Storage configured
- [ ] CORS configured

### Database
- [ ] Supabase project created
- [ ] Schema deployed
- [ ] RLS policies enabled
- [ ] Backups configured

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=your_backend_url
```

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_postgres_url
```

See [Environment Configuration](environment.md) for complete reference.

## Architecture Overview

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐       ┌──────────────┐
│  Frontend (PWA) │◄──────┤     CDN      │
│   React/Vite    │       │   (Static)   │
└────────┬────────┘       └──────────────┘
         │
         │ API Calls
         ▼
┌──────────────────┐      ┌──────────────┐
│  Backend API     │◄─────┤  Supabase    │
│    FastAPI       │      │  PostgreSQL  │
└────────┬─────────┘      └──────────────┘
         │
         ▼
┌──────────────────┐
│   ML Models      │
│  Anomaly/Forecast│
└──────────────────┘
```

## Deployment Process

### 1. Database Setup
1. Create Supabase project
2. Apply database schema
3. Configure RLS policies
4. Test connection

### 2. Backend Deployment
1. Choose hosting platform
2. Configure environment
3. Deploy application
4. Test API endpoints

### 3. Frontend Deployment
1. Choose hosting platform
2. Configure environment
3. Build and deploy
4. Test PWA installation

### 4. Post-Deployment
1. Monitor logs
2. Test all features
3. Configure monitoring
4. Set up backups

## Platform-Specific Guides

### Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Render (Backend)
- Connect GitHub repository
- Configure build command
- Set environment variables
- Deploy

### Supabase (Database)
- Create project via dashboard
- Apply SQL schema
- Configure authentication
- Get connection strings

## Security Considerations

### HTTPS
- Required for PWA features
- Automatic on most platforms
- Configure custom domain

### API Security
- JWT authentication
- Rate limiting
- CORS configuration
- Input validation

### Database Security
- Row Level Security (RLS)
- Service role keys protected
- Connection encryption
- Regular backups

## Performance Optimization

### Frontend
- Static asset caching
- Code splitting
- Image optimization
- Service worker caching

### Backend
- Database connection pooling
- Query optimization
- Model caching
- CDN for static files

## Monitoring & Maintenance

### Logging
- Application logs
- Error tracking
- Performance monitoring
- User analytics

### Backups
- Database backups (daily)
- Configuration backups
- ML model versioning

### Updates
- Zero-downtime deployments
- Database migrations
- Feature flags
- Rollback procedures

## Cost Estimation

### Free Tier
- Frontend: $0 (Vercel/Netlify)
- Backend: $0 (Render free tier)
- Database: $0 (Supabase free tier)
- Total: **$0/month**

### Production Scale
- Frontend: $0-20/month
- Backend: $7-25/month
- Database: $25-50/month
- Total: **$32-95/month**

See [Free Tier Deployment](free-tier.md) for $0 deployment guide.

## Troubleshooting

### Common Issues

**Build failures:**
- Check Node.js version
- Verify dependencies installed
- Check environment variables

**API connection errors:**
- Verify CORS configuration
- Check API URL in frontend
- Test backend health endpoint

**Database connection:**
- Verify connection string
- Check network connectivity
- Confirm credentials

## Next Steps

Choose your deployment path:
- [Production Deployment Guide](production.md) - Full production setup
- [Free Tier Deployment](free-tier.md) - Zero-cost deployment
- [Environment Configuration](environment.md) - Detailed env vars

## Support

For deployment help:
- Review platform documentation
- Check [Troubleshooting Guide](../troubleshooting/common-issues.md)
- Consult community forums
