# Viswah Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.13+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| npm | 9+ | Package manager |
| Expo CLI | Latest | React Native development |

### Installing Prerequisites

**Python:** https://www.python.org/downloads/

**Node.js:** https://nodejs.org/

**Expo CLI:**
```bash
npm install -g expo-cli
```

---

## Project Structure

```
viswah-app/
├── backend/           # FastAPI Python backend
├── frontend/          # React Native Expo app
├── ai-models/         # ML model pipeline
├── docs/              # Documentation
└── README.md
```

---

## Backend Setup

### 1. Navigate to backend directory

```bash
cd viswah-app/backend
```

### 2. Create virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

Key packages installed:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - ORM
- `python-jose` - JWT tokens
- `passlib[bcrypt]` - Password hashing
- `python-dotenv` - Environment variables
- `pydantic[email]` - Validation

### 4. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
# Required
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production

# Optional (AI features degrade gracefully without these)
OPENAI_API_KEY=your-openai-api-key-here
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

# Database (defaults to SQLite)
DATABASE_URL=sqlite:///./viswah.db

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

### 5. Start the backend server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

The database is auto-created and seeded with sample courses on first run.

---

## Frontend Setup

### 1. Navigate to frontend directory

```bash
cd viswah-app/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

Or directly:

```bash
expo start
```

### 4. Run on device/emulator

**Android Emulator:**
```bash
npm run android
# or
expo start --android
```

**iOS Simulator (macOS only):**
```bash
npm run ios
# or
expo start --ios
```

**Web Browser:**
```bash
npm run web
# or
expo start --web
```

**Physical Device:**
1. Install Expo Go app from App Store / Google Play
2. Scan the QR code shown in the terminal
3. The app will load on your device

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET_KEY` | Yes | - | Secret key for JWT token signing. Use a long random string. |
| `OPENAI_API_KEY` | No | - | OpenAI API key for AI lesson/lyrics generation. Without this, fallback templates are used. |
| `ELEVENLABS_API_KEY` | No | - | ElevenLabs API key for high-quality guru voices. Without this, gTTS is used. |
| `DATABASE_URL` | No | `sqlite:///./viswah.db` | Database connection string. |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of allowed CORS origins. |

### Generating a JWT Secret Key

```bash
# Python
python -c "import secrets; print(secrets.token_hex(32))"

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Optional: AI Models Setup

The `ai-models/` directory contains ML model definitions for pitch detection, speech analysis, and note recognition. These are used for advanced audio processing.

```bash
cd ai-models

pip install tensorflow numpy librosa

# Export models to TFLite format
python export_model.py --model_type pitch_detection --output_dir ./saved_models
python export_model.py --model_type speech_analysis --output_dir ./saved_models
python export_model.py --model_type note_recognition --output_dir ./saved_models
```

---

## Verification

After setup, verify everything works:

1. **Backend health check:**
   ```bash
   curl http://localhost:8000/api/health
   # Should return: {"message":"healthy"}
   ```

2. **Swagger docs:**
   Open http://localhost:8000/docs in a browser

3. **Frontend:**
   The Expo dev server will show a QR code. Scan with Expo Go.

---

## Common Issues

### "JWT_SECRET_KEY environment variable is required"
The server will not start without this. Create a `.env` file with `JWT_SECRET_KEY` set.

### "ModuleNotFoundError: No module named 'fastapi'"
Ensure your virtual environment is activated before running `pip install`.

### Port already in use
```bash
# Use a different port
uvicorn main:app --reload --port 8001
```

### Expo Go connection issues
- Ensure device and computer are on the same network
- Try `expo start --tunnel` for remote access
- Check firewall settings

### OpenAI errors
Without a valid `OPENAI_API_KEY`, AI features use fallback templates. The app remains fully functional.
