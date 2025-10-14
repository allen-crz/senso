# 🚀 Quick Start - Deploy to Hugging Face in 5 Minutes

## Step 1: Prepare Files (2 min)

```bash
cd C:\Users\ileen\Downloads\senso
setup_deployment.bat
```

## Step 2: Create HF Space (1 min)

1. Go to https://huggingface.co/new-space
2. Name: `senso-api`
3. SDK: **Docker**
4. Hardware: **CPU basic • Free**
5. Click **Create Space**

## Step 3: Clone & Upload (1 min)

```bash
cd C:\Users\ileen\Downloads
git clone https://huggingface.co/spaces/YOUR_USERNAME/senso-api
cd senso-api

# Copy all files
xcopy /E /I ..\senso\huggingface_deployment\* .

# Track models with Git LFS
git lfs track "*.pt"
git add .gitattributes

# Commit and push
git add .
git commit -m "Initial deployment"
git push
```

## Step 4: Add Secrets (1 min)

Go to Space → Settings → Repository secrets

Add these 4 secrets:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...
ALLOWED_HOSTS = *
```

Get values from: https://app.supabase.com/project/_/settings/api

## Step 5: Wait & Test (5 min)

1. Watch Space logs while it builds (~5 min)
2. When status = "Running", test:

```bash
curl https://YOUR_USERNAME-senso-api.hf.space/health
```

3. Visit API docs: `https://YOUR_USERNAME-senso-api.hf.space/docs`

## Update Frontend

In Vercel, set:

```bash
VITE_API_URL = https://YOUR_USERNAME-senso-api.hf.space
```

## Done! 🎉

Your backend is live with:
- ✅ Full REST API
- ✅ YOLO meter reading
- ✅ ML forecasting
- ✅ FREE hosting

---

**Problems?** See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
