# Viswah Deployment Guide

## Overview

This guide covers deploying the Viswah backend and frontend to production.

---

## Backend Deployment

### Option A: Render.com

**1. Push code to GitHub**

Ensure your repository is on GitHub.

**2. Create a new Web Service on Render**

- Go to https://dashboard.render.com
- Click "New" > "Web Service"
- Connect your GitHub repository

**3. Configure the service**

| Setting | Value |
|---------|-------|
| Name | `viswah-api` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker` |
| Python Version | 3.13 |

**4. Set environment variables**

In the Render dashboard, go to "Environment" and add:

```
JWT_SECRET_KEY          = <generate-a-strong-random-key>
OPENAI_API_KEY          = <your-openai-key>
ELEVENLABS_API_KEY      = <your-elevenlabs-key>
DATABASE_URL            = <your-postgresql-url>
CORS_ORIGINS            = https://your-app.onrender.com
```

**5. Deploy**

Click "Create Web Service". Render will build and deploy automatically.

### Option B: Railway

**1. Install Railway CLI**

```bash
npm install -g @railway/cli
```

**2. Login and initialize**

```bash
railway login
cd backend
railway init
```

**3. Add a PostgreSQL database**

```bash
railway add --database postgresql
```

This automatically sets the `DATABASE_URL` variable.

**4. Set environment variables**

```bash
railway variables set JWT_SECRET_KEY="your-secret-key"
railway variables set OPENAI_API_KEY="your-openai-key"
railway variables set ELEVENLABS_API_KEY="your-elevenlabs-key"
railway variables set CORS_ORIGINS="https://your-app.up.railway.app"
```

**5. Deploy**

```bash
railway up
```

---

### Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

Build and run locally:

```bash
docker build -t viswah-api .
docker run -p 8000:8000 --env-file .env viswah-api
```

---

## Frontend Deployment

### EAS Build (Recommended)

**1. Install EAS CLI**

```bash
npm install -g eas-cli
```

**2. Login to Expo**

```bash
eas login
```

**3. Configure EAS Build**

Create `frontend/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

**4. Build for Android (standalone APK)**

```bash
cd frontend
eas build --platform android --profile preview
```

This produces an installable `.apk` file downloadable from the EAS dashboard.

**5. Build for iOS**

```bash
eas build --platform ios --profile production
```

Requires an Apple Developer account and iOS distribution certificate.

**6. Build for Web**

```bash
expo build:web
```

Or deploy to Vercel/Netlify:

```bash
cd frontend
npx expo export:web
# Deploy the `web-build/` directory
```

---

## Database Migration: SQLite to PostgreSQL

### Step 1: Install PostgreSQL driver

```bash
pip install psycopg2-binary
```

### Step 2: Set DATABASE_URL

In your production `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/viswah_db
```

### Step 3: Update database.py (if needed)

The `database.py` already handles PostgreSQL correctly:

```python
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
```

The `check_same_thread` argument is only applied for SQLite connections.

### Step 4: Migrate data

Export from SQLite:

```bash
cd backend
sqlite3 viswah.db .dump > dump.sql
```

Import to PostgreSQL:

```bash
psql -h localhost -U viswah_user -d viswah_db -f dump.sql
```

Or use `pgloader` for a more robust migration:

```bash
pgloader sqlite:///viswah.db postgresql://user:password@host/viswah_db
```

### Step 5: Update CORS

Set `CORS_ORIGINS` to your production frontend URL:

```
CORS_ORIGINS=https://your-frontend.vercel.app
```

---

## Production Checklist

- [ ] `JWT_SECRET_KEY` is a strong, unique random value (not the dev default)
- [ ] `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` are set (or app gracefully degrades)
- [ ] `DATABASE_URL` points to PostgreSQL (not SQLite)
- [ ] `CORS_ORIGINS` is restricted to your frontend domain(s)
- [ ] HTTPS is enabled (handled by Render/Railway/Vercel)
- [ ] No `.env` file committed to version control
- [ ] Swagger docs are disabled in production (optional):
  ```python
  app = FastAPI(docs_url=None, redoc_url=None)
  ```
- [ ] Error logging is configured for production monitoring

---

## Architecture Diagram

```
                    +---------------------------+
                    |      CDN / Load Balancer  |
                    |   (Render / Railway / CF) |
                    +---------------------------+
                              |
              +---------------+---------------+
              |                               |
    +---------v----------+         +----------v---------+
    |   Frontend (Web)   |         |  Backend (API)     |
    |   Vercel / Netlify |         |  Render / Railway  |
    +--------------------+         +--------------------+
                                          |
                            +-------------+-------------+
                            |             |             |
                    +-------v---+  +------v------+  +---v-----------+
                    | PostgreSQL|  |  OpenAI API |  |  ElevenLabs   |
                    | Database  |  |  (GPT-3.5)  |  |  (TTS)        |
                    +-----------+  +-------------+  +---------------+
```
