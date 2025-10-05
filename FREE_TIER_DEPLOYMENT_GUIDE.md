# Senso - Free Tier Deployment Guide

Deploy your entire app for **$0/month** using free tiers from multiple services.

## 🎯 Architecture Overview

```
┌─────────────────────────────────┐
│  Vercel (FREE)                  │
│  - React PWA Frontend           │
│  - Global CDN                   │
│  - Unlimited bandwidth          │
└─────────────────────────────────┘
         ↓ API calls
┌─────────────────────────────────┐
│  Render (FREE)                  │
│  - FastAPI Backend              │
│  - Cost Forecasting (ML)        │
│  - Anomaly Detection            │
│  - 512MB RAM                    │
└─────────────────────────────────┘
         ↓                    ↓
┌──────────────────┐  ┌──────────────────────┐
│  Supabase (FREE) │  │  Hugging Face (FREE) │
│  - PostgreSQL    │  │  - YOLO Models       │
│  - Auth          │  │  - 16GB RAM          │
│  - 500MB DB      │  │  - Meter Reading API │
└──────────────────┘  └──────────────────────┘
```

---

## 📋 Prerequisites

1. GitHub account (for code hosting)
2. Supabase account (database - already set up)
3. Hugging Face account (for YOLO models)
4. Render account (for backend)
5. Vercel account (for frontend)

---

## Step 1: Push Code to GitHub

```bash
cd C:\Users\ileen\Downloads\senso

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Senso utility monitoring app"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/senso.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy YOLO API to Hugging Face Spaces

### 2.1 Create Hugging Face Space

1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Settings:
   - **Name:** `senso-yolo-api`
   - **License:** MIT
   - **SDK:** Docker
   - **Hardware:** CPU basic (Free)
   - **Visibility:** Public

### 2.2 Upload Files

Upload these files from `huggingface_yolo_api/` folder:

```
app.py
requirements.txt
Dockerfile
README.md
electric_meter.pt  (from backend/models/)
water_meter.pt     (from backend/models/)
```

**Method 1: Web Upload**
- Click "Files" tab → "Add file" → Upload each file

**Method 2: Git Push**
```bash
cd huggingface_yolo_api
git init
git lfs install
git lfs track "*.pt"
git add .
git commit -m "Add YOLO meter reading API"
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/senso-yolo-api
git push
```

### 2.3 Wait for Build

- Space will build automatically (~5-10 minutes)
- Check "App" tab for status
- When ready, you'll see API at: `https://YOUR_USERNAME-senso-yolo-api.hf.space`

### 2.4 Test the API

Visit: `https://YOUR_USERNAME-senso-yolo-api.hf.space/docs`

Test the `/process-meter-image` endpoint with a base64 image.

---

## Step 3: Deploy Backend to Render

### 3.1 Connect GitHub

1. Go to https://render.com
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: `senso`

### 3.2 Configure Service

- **Name:** `senso-backend`
- **Region:** Singapore (or closest to users)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** Python 3
- **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan:** Free

### 3.3 Add Environment Variables

Click "Advanced" → "Add Environment Variable":

**Required:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
YOLO_API_URL=https://YOUR_USERNAME-senso-yolo-api.hf.space
```

**Optional (Recommended):**
```
LOG_LEVEL=WARNING
ALLOWED_HOSTS=http://localhost:5173,https://senso-frontend.vercel.app
ISOLATION_FOREST_CONTAMINATION=0.1
TRAINING_WINDOW_DAYS=30
YOLO_API_TIMEOUT=120
```

### 3.4 Deploy

- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Note your backend URL: `https://senso-backend.onrender.com`

### 3.5 Test Backend

Visit: `https://senso-backend.onrender.com/health`

Should return: `{"status": "healthy"}`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Update Frontend API URL

Edit `src/lib/api.ts` or wherever your API base URL is set:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  'https://senso-backend.onrender.com/api/v1';
```

Commit and push:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

### 4.2 Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repo: `senso`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (project root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 4.3 Add Environment Variables

Under "Environment Variables":

```
VITE_API_URL=https://senso-backend.onrender.com/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4.4 Deploy

- Click "Deploy"
- Wait 2-3 minutes
- Your app will be live at: `https://senso-frontend.vercel.app`

---

## Step 5: Update CORS in Backend

### 5.1 Update Environment Variables in Render

Go to Render dashboard → senso-backend → Environment:

Update `ALLOWED_HOSTS`:
```
ALLOWED_HOSTS=https://senso-frontend.vercel.app,http://localhost:5173
```

Backend will auto-redeploy.

---

## Step 6: Test Full Stack

1. Visit your frontend: `https://senso-frontend.vercel.app`
2. Register a new account
3. Try scanning a meter image
4. Check cost forecasting works
5. Verify anomaly detection

---

## 🎉 Deployment Complete!

Your app is now live on **100% free tier**:

- ✅ **Frontend:** Vercel (unlimited bandwidth, global CDN)
- ✅ **Backend:** Render (512MB RAM, auto-sleep after 15min inactivity)
- ✅ **YOLO API:** Hugging Face (16GB RAM, always on)
- ✅ **Database:** Supabase (500MB, 2GB bandwidth)

---

## 📊 Free Tier Limits

| Service | Limit | Notes |
|---------|-------|-------|
| **Vercel** | Unlimited bandwidth | No limits for hobby projects |
| **Render** | 750 hours/month | Enough for 1 service 24/7 |
| **Render** | 512MB RAM | Sleeps after 15min inactivity (30-60s cold start) |
| **Hugging Face** | 16GB RAM | Free for public Spaces |
| **Supabase** | 500MB database | 50,000 monthly active users |
| **Supabase** | 2GB bandwidth | Plenty for 15 users |

---

## 🔧 Troubleshooting

### Backend shows 503 error
- **Cause:** Cold start after sleep
- **Solution:** Wait 30-60 seconds, retry

### YOLO API timeout
- **Cause:** HF Space sleeping
- **Solution:** First request wakes it up (~30s), then fast

### CORS errors
- **Cause:** Frontend URL not in `ALLOWED_HOSTS`
- **Solution:** Add your Vercel URL to backend env vars

### Out of memory errors
- **Cause:** Backend trying to load local YOLO models
- **Solution:** Ensure `YOLO_API_URL` is set in Render

---

## 🚀 Going to Production (Paid)

If you outgrow free tier:

**Option 1: Upgrade Render Backend** ($7/month)
- 2GB RAM
- No cold starts
- Better for 50+ users

**Option 2: Use Railway** ($5/month)
- 8GB RAM
- No cold starts
- Better performance

**Keep free:**
- Frontend (Vercel)
- Database (Supabase)
- YOLO API (Hugging Face)

---

## 📝 Maintenance

### Updating Code

**Frontend:**
```bash
git add .
git commit -m "Update frontend"
git push
# Vercel auto-deploys
```

**Backend:**
```bash
git add .
git commit -m "Update backend"
git push
# Render auto-deploys
```

**YOLO API:**
- Update files in HF Space
- Or push to HF git repo

### Monitoring

- **Frontend:** Vercel Dashboard → Analytics
- **Backend:** Render Dashboard → Logs
- **YOLO API:** HF Space → App logs
- **Database:** Supabase Dashboard → Logs

---

## 🎯 Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Frontend (Vercel) | $0 |
| Backend (Render) | $0 |
| YOLO API (HF) | $0 |
| Database (Supabase) | $0 |
| **TOTAL** | **$0** |

**Perfect for 15 users!** ✅
