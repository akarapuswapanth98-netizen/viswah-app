# Viswah Architecture

## System Overview

Viswah is an AI-powered music education platform built with a three-tier architecture: a React Native mobile frontend, a FastAPI Python backend, and AI services for content generation and audio analysis.

```
+-------------------+     +-------------------+     +-------------------+
|   React Native    | --> |   FastAPI Backend  | --> |     Database      |
|   (Expo)          |     |   (Python)        |     |   (SQLite)        |
+-------------------+     +-------------------+     +-------------------+
                                  |
                                  v
                          +-------------------+
                          |   AI Services     |
                          |   - OpenAI        |
                          |   - ElevenLabs    |
                          |   - gTTS          |
                          +-------------------+
```

---

## Components

### Frontend (React Native / Expo)

**Location:** `frontend/`

The mobile client built with React Native and Expo SDK 49. Provides the user interface for all 4 stages of music learning.

**Key Technologies:**
- React 18.2 + React Native 0.72
- Expo SDK 49 (managed workflow)
- React Navigation 6 (stack navigation)
- React Native Paper (Material Design UI)
- AsyncStorage (local persistence)

**Screens:**
| Screen | Stage | Purpose |
|--------|-------|---------|
| Home | All | Dashboard with enrolled courses and progress |
| Course List | 1 | Browse available courses by instrument/stage |
| Lesson View | 1 | Course content, quizzes, progress tracking |
| Vocal Guru | 2 | AI instructor sessions with TTS playback |
| Speech Analysis | 3 | Record vocals, real-time pitch/volume feedback |
| Lyrics Creator | 4 | AI-powered lyric generation and editing |
| Virtual Instruments | Bonus | Piano and drums simulation |

**Data Flow:**
1. User interacts with a screen
2. Screen calls API service layer (`src/config/`)
3. HTTP request sent to FastAPI backend
4. Response updates React state
5. UI re-renders with new data

---

### Backend (FastAPI / Python)

**Location:** `backend/`

RESTful API server handling authentication, course management, AI integration, and audio analysis.

**Key Technologies:**
- Python 3.13+
- FastAPI (async web framework)
- SQLAlchemy ORM (database)
- Pydantic (request/response validation)
- python-jose + passlib (JWT auth, bcrypt)

**Architecture Layers:**

```
backend/
├── main.py              # App initialization, CORS, router mounting
├── database.py          # SQLAlchemy engine, session factory
├── models/
│   ├── models.py        # SQLAlchemy ORM models (User, Course, Lesson, Progress, UserCourse)
│   └── schemas.py       # Pydantic schemas for request/response validation
├── routes/
│   ├── auth.py          # Registration, login, JWT management
│   ├── courses.py       # Course CRUD, enrollment, progress tracking
│   ├── ai_routes.py     # AI lesson/exercise generation endpoints
│   ├── vocal_guru.py    # AI instructor personas, TTS
│   ├── speech_analysis.py # Audio pitch/volume analysis, scoring
│   └── lyrics_creator.py  # AI lyrics generation and analysis
└── services/
    ├── ai_lesson_generator.py  # OpenAI integration for lessons
    ├── vocal_guru.py           # ElevenLabs/gTTS integration, guru personas
    ├── speech_analysis.py      # Audio signal processing (autocorrelation, ZCR)
    └── lyrics_creator.py       # OpenAI integration for lyrics
```

**Request Lifecycle:**

```
Client Request
    │
    v
FastAPI Router (routes/*.py)
    │
    v
Pydantic Validation (models/schemas.py)
    │
    v
Route Handler
    │
    ├──> Service Layer (services/*.py)
    │         │
    │         ├──> External APIs (OpenAI, ElevenLabs, gTTS)
    │         └──> Audio Processing (numpy, math)
    │
    └──> Database (models/models.py via SQLAlchemy)
              │
              v
         SQLite/PostgreSQL
```

---

### Database

**Location:** `backend/viswah.db` (SQLite, development)

**ORM Models:**

```
+----------------+     +----------------+     +----------------+
|     User       |     |    UserCourse   |     |     Course     |
+----------------+     +----------------+     +----------------+
| id (PK)        |<--->| user_id (FK)   |<--->| id (PK)        |
| username       |     | course_id (FK) |     | title          |
| email          |     | enrolled_at    |     | description    |
| hashed_password|     +----------------+     | stage          |
| level          |                              | instrument     |
| created_at     |                              | difficulty     |
+----------------+                              | image_url      |
       |                                        | created_at     |
       |                                        +----------------+
       |                                                 |
       v                                                 v
+----------------+                              +----------------+
|    Progress    |<-----------------------------|     Lesson     |
+----------------+                              +----------------+
| id (PK)        |                              | id (PK)        |
| user_id (FK)   |                              | course_id (FK) |
| lesson_id (FK) |                              | title          |
| completed      |                              | content        |
| score          |                              | audio_url      |
| time_spent_min |                              | order          |
| completed_at   |                              | lesson_type    |
+----------------+                              | duration_min   |
                                                | quiz_questions |
                                                | created_at     |
                                                +----------------+
```

---

### AI Services

External AI services integrated via API keys:

| Service | Purpose | Fallback |
|---------|---------|----------|
| **OpenAI GPT-3.5** | Lesson generation, exercise creation, lyrics generation/improvement | Hardcoded lesson templates, template-based lyrics |
| **ElevenLabs** | High-quality guru voice TTS | gTTS (Google Text-to-Speech) |
| **gTTS** | Free text-to-speech fallback | None (speech unavailable) |

**AI Integration Pattern:**

All AI services follow a graceful degradation pattern:
1. Check if API key is configured and valid
2. Attempt to call external API
3. On failure, fall back to local/template-based response
4. Return consistent response format regardless of source

```
Request --> Check API Key --> Call External API
                                  │
                          Success? │
                            Yes    │    No
                             v     v
                          Return  Use Fallback
                          Result  Templates
```

---

## Data Flow

### User Registration & Authentication

```
1. User submits register form
   POST /api/auth/register {username, email, password}
        │
        v
2. Password hashed with bcrypt
3. User saved to database
4. Returns UserResponse (no token)
        │
5. User submits login form
   POST /api/auth/login {email, password}
        │
        v
6. Credentials verified against DB
7. JWT token created (30 min expiry)
8. Returns TokenResponse {access_token}
        │
9. Client stores token, sends in Authorization header
   GET /api/auth/me  Authorization: Bearer <token>
        │
        v
10. Token decoded, user fetched from DB
11. Returns UserResponse
```

### Course Enrollment & Progress

```
1. Browse courses
   GET /api/courses?stage=1&instrument=vocal
        │
        v
2. Enroll in a course
   POST /api/enroll/1  (authenticated)
        │
        v
3. UserCourse record created
4. View course lessons
   GET /api/courses/1/lessons
        │
        v
5. Complete a lesson, record progress
   POST /api/progress {lesson_id: 1, completed: true, score: 85}
        │
        v
6. Progress created or updated (deduplication logic)
7. View all progress
   GET /api/progress
```

### AI Lesson Generation

```
1. User requests AI lesson
   POST /api/ai/generate-lesson
   {topic: "major scales", difficulty: "beginner", instrument: "piano", lesson_type: "theory"}
        │
        v
2. Service checks OpenAI availability
3. If available: GPT-3.5 prompt → JSON parse
   If unavailable: Fallback lesson template
        │
        v
4. Response validated against LessonGenerateResponse
5. Returns {title, content, quiz_questions, tips}
```

### Vocal Guru Session

```
1. User selects guru
   GET /api/vocal-guru/gurus
        │
        v
2. User greets guru
   POST /api/vocal-guru/greet/classical
        │
        v
3. Returns greeting text + audio availability flag
        │
4. User requests teaching
   POST /api/vocal-guru/teach/breathing?guru_id=classical
        │
        v
5. Lesson steps + speech text generated
        │
6. Client requests TTS audio
   POST /api/vocal-guru/speak {text: "lesson text", guru_id: "classical"}
        │
        v
7. ElevenLabs → gTTS fallback → audio file saved to temp
8. Returns {audio_url}
        │
9. Client fetches audio
   GET /api/vocal-guru/audio/guru_classical_1234567890.mp3
```

### Speech Analysis

```
1. Client records audio → raw PCM float array
2. Send to backend
   POST /api/speech/analyze-pitch {audio_data: [...], sample_rate: 44100}
        │
        v
3. Pitch detection (numpy autocorrelation or basic ZCR)
4. Returns {pitch, note, stability, cents, confidence}
        │
5. Score against target
   POST /api/speech/score {audio_data: [...], target_note: "C4"}
        │
        v
6. Combined pitch + volume analysis
7. Scoring: pitch accuracy (40) + stability (30) + volume (15) + confidence (15)
8. Returns {score, feedback[]}
```

---

## Technology Choices

### Why FastAPI?

- **Async support** for handling concurrent AI API calls
- **Automatic OpenAPI docs** at `/docs` for testing
- **Pydantic validation** eliminates manual request parsing
- **Performance** comparable to Node.js for I/O-bound workloads

### Why SQLite (dev) / PostgreSQL (prod)?

- **SQLite:** Zero-config local development, single-file database
- **PostgreSQL:** Production-grade, handles concurrent connections, JSON support for flexible data

### Why Expo/React Native?

- **Cross-platform:** Single codebase for Android, iOS, and Web
- **Managed workflow:** No native build configuration required
- **Rich ecosystem:** Libraries for navigation, UI, audio recording

### Why Graceful AI Degradation?

- App remains functional without API keys
- Development and testing work offline
- Users get consistent experience regardless of backend configuration

---

## Security Considerations

- **JWT tokens** expire after 30 minutes
- **bcrypt** password hashing (12+ rounds)
- **CORS** restricted to configured origins via `CORS_ORIGINS` env var
- **Path traversal prevention** in audio file serving (filename sanitization)
- **Input validation** via Pydantic schemas on all endpoints
- **No secrets in code** - all API keys loaded from environment variables
