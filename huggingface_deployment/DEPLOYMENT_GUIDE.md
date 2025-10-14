# Senso Backend - Hugging Face Spaces Deployment Guide

Complete step-by-step guide to deploy your unified backend + YOLO API to Hugging Face Spaces.

---

## 📋 Prerequisites

- [ ] Hugging Face account (free): https://huggingface.co/join
- [ ] Git installed on your computer
- [ ] Supabase project with credentials
- [ ] YOLO model files (`electric_meter.pt`, `water_meter.pt`)

---

## 🚀 Step 1: Prepare Your Files

### 1.1 Create the deployment directory structure

```bash
cd C:\Users\ileen\Downloads\senso
```

Your `huggingface_deployment/` folder should contain:

```
huggingface_deployment/
├── Dockerfile                 ✅ Created
├── requirements.txt           ✅ Created
├── main.py                    ✅ Created
├── README.md                  ✅ Created
├── .env.example               ✅ Created
├── app/                       ⬜ Need to copy
│   ├── __init__.py
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── services/
│   └── utils/
└── models/                    ⬜ Need to copy
    ├── electric_meter.pt
    └── water_meter.pt
```

### 1.2 Copy your backend code

```bash
# From the senso directory
xcopy /E /I backend\app huggingface_deployment\app
```

### 1.3 Copy YOLO models

```bash
# Create models directory
mkdir huggingface_deployment\models

# Copy YOLO models (make sure they exist in backend/models/)
copy backend\models\electric_meter.pt huggingface_deployment\models\
copy backend\models\water_meter.pt huggingface_deployment\models\
```

---

## 🏗️ Step 2: Create Hugging Face Space

### 2.1 Create new Space

1. Go to: https://huggingface.co/new-space
2. Fill in the form:
   - **Space name**: `senso-api` (or your preferred name)
   - **License**: MIT
   - **Select SDK**: Docker
   - **Space hardware**: CPU basic • Free
   - **Visibility**: Public (or Private if you have Pro)
3. Click **Create Space**

### 2.2 Clone the Space repository

```bash
# Install git-lfs if you haven't (for large files like YOLO models)
git lfs install

# Clone your new Space
cd C:\Users\ileen\Downloads
git clone https://huggingface.co/spaces/YOUR_USERNAME/senso-api
cd senso-api
```

Replace `YOUR_USERNAME` with your Hugging Face username.

---

## 📦 Step 3: Upload Files to Space

### 3.1 Copy all deployment files

```bash
# From the senso-api directory (your HF Space repo)
xcopy /E /I ..\senso\huggingface_deployment\* .
```

### 3.2 Verify file structure

Your Space repo should now have:

```
senso-api/
├── Dockerfile
├── requirements.txt
├── main.py
├── README.md
├── .env.example
├── app/
│   └── (all backend code)
└── models/
    ├── electric_meter.pt  (50MB)
    └── water_meter.pt     (50MB)
```

### 3.3 Track large files with Git LFS

```bash
# Track YOLO models with Git LFS
git lfs track "*.pt"
git add .gitattributes
```

---

## 🔐 Step 4: Configure Secrets (CRITICAL!)

### 4.1 Go to Space Settings

1. Open your Space: `https://huggingface.co/spaces/YOUR_USERNAME/senso-api`
2. Click **Settings** tab
3. Scroll to **Repository secrets**

### 4.2 Add these secrets

Click **New secret** for each:

| Name | Value | Where to find it |
|------|-------|------------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiI...` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiI...` | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | Your JWT secret | Supabase → Settings → API |
| `LOG_LEVEL` | `INFO` | Optional |
| `ALLOWED_HOSTS` | `*` | Or your Vercel domain |

⚠️ **IMPORTANT**: Never commit these secrets to git!

---

## 🚢 Step 5: Deploy to Hugging Face

### 5.1 Commit and push

```bash
# Add all files
git add .

# Commit
git commit -m "Initial deployment: Senso unified backend + YOLO API"

# Push to Hugging Face
git push
```

### 5.2 Monitor deployment

1. Go to your Space: `https://huggingface.co/spaces/YOUR_USERNAME/senso-api`
2. Watch the **Logs** tab for build progress
3. Build takes ~5-10 minutes (installing dependencies + YOLO models)

### 5.3 Verify deployment

Once deployed (status shows "Running"), test:

```bash
# Health check
curl https://YOUR_USERNAME-senso-api.hf.space/health

# API docs
# Visit: https://YOUR_USERNAME-senso-api.hf.space/docs
```

---

## 🔄 Step 6: Update Your Frontend

### 6.1 Update Vercel environment variables

In your Vercel project settings, update:

```bash
VITE_API_URL=https://YOUR_USERNAME-senso-api.hf.space
```

### 6.2 Redeploy frontend

Vercel will auto-redeploy when you push to git, or manually trigger a redeploy.

---

## ✅ Step 7: Test Everything

### 7.1 Test authentication

```bash
curl -X POST https://YOUR_USERNAME-senso-api.hf.space/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","full_name":"Test User"}'
```

### 7.2 Test YOLO processing

Use your frontend camera feature to capture a meter image and verify it processes correctly.

### 7.3 Check logs

- Go to Space → Logs tab
- Monitor for any errors or warnings

---

## 🔧 Troubleshooting

### Build fails with "No space left on device"
- Your YOLO models might be too large
- Try Git LFS: `git lfs track "*.pt"`

### "Connection refused" to Supabase
- Check secrets are set correctly in Space Settings
- Verify Supabase project is active

### Cold start takes long (30-60s)
- Normal on free tier
- Consider upgrading to "CPU Upgrade" ($0.03/hr) for no sleep

### YOLO models not found
- Ensure models are in `models/` directory
- Check Dockerfile COPY commands succeeded
- View Space logs for file errors

---

## 📊 Monitoring & Maintenance

### Check Space status
- Visit: https://huggingface.co/spaces/YOUR_USERNAME/senso-api
- Monitor "Logs" tab for errors

### Update deployment
```bash
# Make changes to code
git add .
git commit -m "Update: description of changes"
git push

# HF Spaces will auto-rebuild
```

### View API usage
- Hugging Face provides basic analytics in Space settings
- For detailed logging, check application logs in Logs tab

---

## 💰 Cost Breakdown

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Hugging Face Spaces | CPU Basic | **$0/month** | May sleep after inactivity |
| Vercel | Hobby | **$0/month** | For frontend |
| Supabase | Free | **$0/month** | Up to 500MB DB |
| **Total** | | **$0/month** | Perfect for 15 users! |

### Optional upgrades if needed:

- **HF CPU Upgrade**: $0.03/hour (~$22/month) - No sleep, faster
- **Supabase Pro**: $25/month - 8GB DB, better support
- **Total with upgrades**: ~$47/month (still cheaper than Render + separate ML hosting!)

---

## 🎉 You're Done!

Your complete backend is now deployed on Hugging Face Spaces with:
- ✅ Full backend API
- ✅ YOLO meter reading
- ✅ ML forecasting
- ✅ Supabase integration
- ✅ Free hosting (for 15 users)

**Your API URL**: `https://YOUR_USERNAME-senso-api.hf.space`

**API Docs**: `https://YOUR_USERNAME-senso-api.hf.space/docs`

---

## 📞 Support

If you encounter issues:

1. Check Space logs tab
2. Verify environment variables in Space settings
3. Review Supabase connection
4. Check Dockerfile build logs

Need help? Open an issue or contact support!
