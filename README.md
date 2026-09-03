# 🎵 Viswah - Music Learning App

## Complete Music Education Platform

### Features

#### Stage 1: AI-Powered Self-Paced Lessons
- Learn music fundamentals to advanced classical
- AI-generated personalized content
- Progress tracking

#### Stage 2: Vocal Guru Sessions
- AI singing instructors
- Interactive teaching with famous voice styles

#### Stage 3: Speech Analysis Practice
- Record and compare vocals
- Mistake detection and training

#### Stage 4: Lyrics Creator
- AI-assisted lyric writing
- Save and share

#### Bonus: Instrument UIs
- Virtual Piano
- Virtual Drums

---

## Project Structure

```
viswah-app/
├── backend/           # Python FastAPI
│   ├── requirements.txt
│   ├── main.py
│   ├── models/
│   ├── routes/
│   └── services/
├── frontend/          # React Native
│   ├── package.json
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── navigation/
├── ai-models/         # ML models
└── docs/
```

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## Tech Stack
- Frontend: React Native (Expo)
- Backend: Python FastAPI
- AI: OpenAI, ElevenLabs, TensorFlow
- Speech: Google Cloud Speech-to-Text
- Database: PostgreSQL