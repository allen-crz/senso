# 🚀 Senso App - Complete Deployment Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [PWA Setup & Installation](#pwa-setup--installation)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Production Optimizations](#production-optimizations)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🖥️ System Requirements

### Minimum Server Specifications
- **CPU**: 2 cores (4+ recommended)
- **RAM**: 4GB (8GB+ recommended)
- **Storage**: 20GB SSD (50GB+ recommended)
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Required Software
- **Python**: 3.12+
- **Node.js**: 18.x+
- **PostgreSQL**: 14+
- **Nginx**: 1.18+ (for reverse proxy)
- **SSL Certificate** (Let's Encrypt recommended)

---

## 🔧 Backend Deployment

### 1. Server Setup

#### Ubuntu/CentOS
```bash
# Update system
sudo apt update && sudo apt upgrade -y  # Ubuntu
# sudo yum update -y                    # CentOS

# Install Python 3.12
sudo apt install python3.12 python3.12-venv python3.12-dev -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install system dependencies
sudo apt install build-essential libpq-dev -y
```

### 2. Application Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash senso
sudo usermod -aG sudo senso

# Switch to application user
sudo su - senso

# Clone repository
git clone <your-repo-url> /home/senso/senso-app
cd /home/senso/senso-app

# Create Python virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install additional production dependencies
pip install gunicorn uvicorn[standard] python-dotenv
```

### 3. Environment Configuration

Create `/home/senso/senso-app/backend/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://senso_user:your_password@localhost:5432/senso_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# Security
JWT_SECRET=your_super_secure_jwt_secret_here
CORS_ORIGINS=["https://your-domain.com", "https://www.your-domain.com"]

# Python Environment
PYTHONPATH=/home/senso/senso-app/backend
ENVIRONMENT=production
DEBUG=false

# Logging
LOG_LEVEL=INFO
LOG_FILE=/home/senso/logs/senso-backend.log

# Performance
MAX_WORKERS=4
WORKER_TIMEOUT=120
```

### 4. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE senso_db;
CREATE USER senso_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE senso_db TO senso_user;
\q

# Run database migrations (if you have any)
cd /home/senso/senso-app/backend
source ../venv/bin/activate
# python manage.py migrate  # If using Django
# alembic upgrade head      # If using Alembic
```

### 5. Systemd Service

Create `/etc/systemd/system/senso-backend.service`:

```ini
[Unit]
Description=Senso Backend API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=notify
User=senso
Group=senso
WorkingDirectory=/home/senso/senso-app/backend
Environment=PATH=/home/senso/senso-app/venv/bin
Environment=PYTHONPATH=/home/senso/senso-app/backend
EnvironmentFile=/home/senso/senso-app/backend/.env
ExecStart=/home/senso/senso-app/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --timeout 120
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable senso-backend
sudo systemctl start senso-backend

# Check status
sudo systemctl status senso-backend
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/senso`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend (Static Files)
    location / {
        root /home/senso/senso-app/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # PWA Cache Headers
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Service Worker (no cache)
        location = /service-worker.js {
            expires off;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # Manifest
        location = /manifest.json {
            expires 1d;
            add_header Cache-Control "public";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; object-src 'none'; base-uri 'self';" always;

    # Enable Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/senso /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ⚛️ Frontend Deployment

### 1. Build Setup

```bash
# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Build frontend
cd /home/senso/senso-app/frontend
npm install
npm run build

# Copy build to web directory
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### 2. Production Environment Variables

Create `/home/senso/senso-app/frontend/.env.production`:

```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_NAME=Senso
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

---

## 📱 PWA Setup & Installation

### 1. Manifest Configuration

Update `/home/senso/senso-app/public/manifest.json`:

```json
{
  "name": "Senso - Smart Utility Monitor",
  "short_name": "Senso",
  "description": "Monitor and manage your water and electricity consumption with AI-powered insights",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "categories": ["utilities", "productivity", "lifestyle"],
  "lang": "en",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/senso-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/senso-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/senso-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/senso-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/senso-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/senso-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/senso-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/senso-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard-mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Dashboard view on mobile"
    },
    {
      "src": "/screenshots/dashboard-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard view on desktop"
    }
  ],
  "shortcuts": [
    {
      "name": "Take Reading",
      "short_name": "Reading",
      "description": "Capture a new meter reading",
      "url": "/water-meter-camera",
      "icons": [
        {
          "src": "/icons/camera-shortcut-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "View Analytics",
      "short_name": "Analytics",
      "description": "View consumption analytics",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/icons/analytics-shortcut-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "prefer_related_applications": false,
  "related_applications": [],
  "scope": "/",
  "id": "senso-utility-monitor",
  "protocol_handlers": [],
  "edge_side_panel": {
    "preferred_width": 400
  },
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}
```

### 2. Creating App Icons (SVG to PNG)

#### Base SVG Icon (`/public/icons/senso-icon.svg`):

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.1"/>
    </filter>
  </defs>

  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#gradient)" filter="url(#shadow)"/>

  <!-- Water Drop Icon -->
  <path d="M256 120c-40 0-80 40-80 100 0 44.2 35.8 80 80 80s80-35.8 80-80c0-60-40-100-80-100z"
        fill="white" opacity="0.9"/>

  <!-- Lightning Bolt -->
  <path d="M200 320l40-60h-20l20-40h20l-40 60h20l-20 40z"
        fill="white" opacity="0.9"/>

  <!-- Meter Lines -->
  <circle cx="256" cy="256" r="180" stroke="white" stroke-width="8" fill="none" opacity="0.3"/>
  <circle cx="256" cy="256" r="160" stroke="white" stroke-width="4" fill="none" opacity="0.5"/>

  <!-- Center Dot -->
  <circle cx="256" cy="256" r="8" fill="white"/>
</svg>
```

#### Generate PNG Icons Script:

```bash
#!/bin/bash
# create-icons.sh

# Install ImageMagick if not installed
# sudo apt install imagemagick

# Create icons directory
mkdir -p public/icons

# Generate all required sizes from SVG
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"
do
    echo "Generating ${size}x${size} icon..."
    convert public/icons/senso-icon.svg -resize ${size}x${size} public/icons/senso-${size}x${size}.png
done

# Generate favicon
convert public/icons/senso-icon.svg -resize 32x32 public/senso-favicon.ico

echo "All icons generated successfully!"
```

### 3. Service Worker Enhancement

Update `/public/service-worker.js`:

```javascript
const CACHE_NAME = 'senso-v1.0.0';
const STATIC_CACHE = 'senso-static-v1.0.0';
const DYNAMIC_CACHE = 'senso-dynamic-v1.0.0';

const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icons/senso-192x192.png',
  '/icons/senso-512x512.png',
  // Add your critical CSS and JS files here
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache dynamic content
            if (event.request.method === 'GET') {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.put(event.request, responseClone));
            }
            return fetchResponse;
          });
      })
      .catch(() => {
        // Return offline fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'meter-reading-sync') {
    event.waitUntil(syncMeterReadings());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/senso-192x192.png',
    badge: '/icons/senso-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Senso Notification', options)
  );
});
```

---

## 🎨 PWA User Experience: Native vs Browser

### When PWA is Installed (Native-like Experience):

#### ✅ **Native-like Features:**
- **No browser UI** (address bar, tabs, browser buttons)
- **Full screen experience**
- **App icon on home screen/desktop**
- **Splash screen on launch**
- **Native task switching** (Alt+Tab on desktop, app switcher on mobile)
- **Separate window** (desktop) or full screen (mobile)
- **App shortcuts** in context menus
- **Status bar integration** (mobile)

#### ✅ **What Users See:**
```
┌─────────────────────────────┐
│    Senso - Smart Monitor    │ ← Custom title bar (not browser)
├─────────────────────────────┤
│                             │
│     [Your App Content]      │ ← Full screen real estate
│                             │
│    Dashboard | Settings     │ ← Your app navigation
│                             │
└─────────────────────────────┘
```

### When Accessed via Browser:

#### 🌐 **Browser Experience:**
```
┌─────────────────────────────┐
│ ← → ↻ | https://senso.com   │ ← Browser UI
├─────────────────────────────┤
│                             │
│     [Your App Content]      │ ← Limited screen space
│                             │
│    Dashboard | Settings     │
│                             │
├─────────────────────────────┤
│     Browser Tabs/Footer     │ ← Browser controls
└─────────────────────────────┘
```

### Installation Triggers:

#### **Desktop (Chrome/Edge):**
- Install prompt appears automatically when PWA criteria are met
- "Install" button in address bar
- Chrome menu → "Install Senso..."

#### **Mobile (iOS/Android):**
- **iOS Safari**: "Add to Home Screen" from share menu
- **Android Chrome**: "Add to Home Screen" or "Install app" prompt

---

## 🚀 Production Optimizations

### 1. Performance

```bash
# Enable HTTP/2
# Already configured in Nginx config above

# Enable Brotli compression (optional)
sudo apt install nginx-module-brotli
```

### 2. Security

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 📊 Monitoring & Maintenance

### 1. Log Management

```bash
# Create log directories
sudo mkdir -p /var/log/senso
sudo chown senso:senso /var/log/senso

# Logrotate configuration
sudo tee /etc/logrotate.d/senso << EOF
/var/log/senso/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
    notifempty
}
EOF
```

### 2. Backup Script

```bash
#!/bin/bash
# backup-senso.sh

BACKUP_DIR="/home/senso/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U senso_user senso_db > $BACKUP_DIR/senso_db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/senso_app_$DATE.tar.gz -C /home/senso senso-app

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 3. Health Checks

```bash
#!/bin/bash
# health-check.sh

# Check backend service
if ! systemctl is-active --quiet senso-backend; then
    echo "Backend service is down! Restarting..."
    sudo systemctl restart senso-backend
fi

# Check database connection
if ! sudo -u postgres psql -d senso_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Database connection failed!"
    # Add notification/alert logic here
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "Disk usage is at ${DISK_USAGE}%"
    # Add cleanup or alert logic here
fi
```

---

## 🔧 Troubleshooting

### Common Issues:

#### Backend Not Starting:
```bash
# Check logs
journalctl -u senso-backend -f

# Check environment
sudo -u senso env | grep SENSO

# Test manually
cd /home/senso/senso-app/backend
source ../venv/bin/activate
python -c "from main import app; print('Import successful')"
```

#### PWA Not Installing:
1. **Check manifest validity**: Use Chrome DevTools → Application → Manifest
2. **Verify HTTPS**: PWAs require secure connection
3. **Service Worker**: Check DevTools → Application → Service Workers
4. **Icons**: Ensure all required sizes are present

#### Database Connection Issues:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U senso_user -d senso_db -h localhost
```

---

## ✅ Deployment Checklist

### Pre-deployment:
- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Database created and configured
- [ ] All dependencies installed

### Post-deployment:
- [ ] Backend API accessible
- [ ] Frontend loads correctly
- [ ] PWA installable
- [ ] Database connections working
- [ ] Logs being written
- [ ] Backups configured
- [ ] Monitoring set up

### PWA Verification:
- [ ] Manifest.json valid
- [ ] Service worker registered
- [ ] All icon sizes present
- [ ] Install prompt appears
- [ ] Offline functionality works
- [ ] Native feel when installed

---

**🎉 Congratulations! Your Senso app is now deployed and ready for production use with full PWA capabilities!**