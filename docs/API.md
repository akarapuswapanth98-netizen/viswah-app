# Viswah API Reference

Base URL: `http://localhost:8000`

All endpoints are prefixed with `/api`. Responses use JSON. Authentication uses Bearer tokens via the `Authorization` header.

---

## Table of Contents

- [System](#system)
- [Authentication](#authentication)
- [Courses & Lessons](#courses--lessons)
- [Enrollment](#enrollment)
- [Progress](#progress)
- [AI Lesson Generator](#ai-lesson-generator)
- [Vocal Guru](#vocal-guru)
- [Speech Analysis](#speech-analysis)
- [Lyrics Creator](#lyrics-creator)

---

## System

### GET /

Returns a welcome message.

**Response:**
```json
{ "message": "Welcome to Viswah API - v1.0.0" }
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{ "message": "healthy" }
```

---

## Authentication

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "username": "string (4-50 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (6-100 chars, required)"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "level": "beginner"
}
```

**Errors:**
- `409` - Email already registered or username already taken

**Authentication:** No

---

### POST /api/auth/login

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "string (valid email, required)",
  "password": "string (6-100 chars, required)"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**Errors:**
- `401` - Incorrect email or password

**Authentication:** No

---

### GET /api/auth/me

Get the currently authenticated user's profile.

**Response (200):**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "level": "beginner"
}
```

**Errors:**
- `401` - Invalid or missing token

**Authentication:** Yes (Bearer token)

---

## Courses & Lessons

### GET /api/courses

List all courses with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stage` | int (1-4) | No | Filter by course stage |
| `instrument` | string | No | Filter by instrument: `vocal`, `piano`, `drums` |

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "stage": 1,
    "instrument": "vocal",
    "difficulty": "beginner",
    "image_url": "string or null"
  }
]
```

**Authentication:** No

---

### GET /api/courses/{course_id}

Get a single course by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | int | Course ID |

**Response (200):**
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "stage": 1,
  "instrument": "vocal",
  "difficulty": "beginner",
  "image_url": "string or null"
}
```

**Errors:**
- `404` - Course not found

**Authentication:** No

---

### GET /api/courses/{course_id}/lessons

Get all lessons for a course, ordered by `order` field.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | int | Course ID |

**Response (200):**
```json
[
  {
    "id": 1,
    "course_id": 1,
    "title": "string",
    "content": "string",
    "audio_url": "string or null",
    "order": 1,
    "lesson_type": "theory",
    "duration_minutes": 10,
    "quiz_questions": [
      {
        "question": "string",
        "options": ["string", "string"],
        "correct_answer": "string"
      }
    ]
  }
]
```

**Errors:**
- `404` - Course not found

**Authentication:** No

---

### GET /api/lessons/{lesson_id}

Get a single lesson by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lesson_id` | int | Lesson ID |

**Response (200):**
```json
{
  "id": 1,
  "course_id": 1,
  "title": "string",
  "content": "string",
  "audio_url": "string or null",
  "order": 1,
  "lesson_type": "theory",
  "duration_minutes": 10,
  "quiz_questions": null
}
```

**Errors:**
- `404` - Lesson not found

**Authentication:** No

---

## Enrollment

### POST /api/enroll/{course_id}

Enroll the authenticated user in a course.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | int | Course ID |

**Response (201):**
```json
{
  "message": "Successfully enrolled",
  "course_id": 1
}
```

**Errors:**
- `404` - Course not found
- `409` - Already enrolled

**Authentication:** Yes

---

### GET /api/enrolled

Get all courses the authenticated user is enrolled in.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "stage": 1,
    "instrument": "vocal",
    "difficulty": "beginner"
  }
]
```

**Authentication:** Yes

---

## Progress

### POST /api/progress

Create or update progress for a lesson. If progress already exists for the user+lesson pair, the record is updated (score takes the higher value, time accumulates).

**Request Body:**
```json
{
  "lesson_id": 1,
  "completed": false,
  "score": 85.0,
  "time_spent_minutes": 10
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `lesson_id` | int | Yes | - |
| `completed` | bool | No | Default: `false` |
| `score` | float | No | 0-100, default: 0.0 |
| `time_spent_minutes` | int | No | >= 0, default: 0 |

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "lesson_id": 1,
  "completed": true,
  "score": 85.0,
  "time_spent_minutes": 20,
  "completed_at": "2026-01-15T10:30:00Z"
}
```

**Errors:**
- `404` - Lesson not found

**Authentication:** Yes

---

### PATCH /api/progress/{progress_id}

Partially update an existing progress record.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `progress_id` | int | Progress record ID |

**Request Body:**
```json
{
  "completed": true,
  "score": 90.0,
  "time_spent_minutes": 15
}
```

All fields are optional.

**Response (200):** Updated `ProgressResponse` object.

**Errors:**
- `404` - Progress not found

**Authentication:** Yes

---

### GET /api/progress

Get the authenticated user's progress records.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lesson_id` | int | No | Filter by lesson ID |
| `skip` | int | No | Pagination offset (default: 0) |
| `limit` | int | No | Max results (default: 50, max: 100) |

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "lesson_id": 1,
    "completed": true,
    "score": 85.0,
    "time_spent_minutes": 10,
    "completed_at": "2026-01-15T10:30:00Z"
  }
]
```

**Authentication:** Yes

---

## AI Lesson Generator

### POST /api/ai/generate-lesson

Generate a music lesson using AI.

**Request Body:**
```json
{
  "topic": "string (2-200 chars, required)",
  "difficulty": "beginner",
  "instrument": "vocal",
  "lesson_type": "theory"
}
```

| Field | Type | Values |
|-------|------|--------|
| `difficulty` | string | `beginner`, `intermediate`, `advanced` |
| `instrument` | string | `vocal`, `piano`, `drums` |
| `lesson_type` | string | `theory`, `practice`, `quiz` |

**Response (200):**
```json
{
  "title": "string",
  "content": "string",
  "quiz_questions": [
    {
      "question": "string",
      "options": ["string", "string"],
      "correct_answer": "string"
    }
  ],
  "tips": ["string"]
}
```

**Errors:**
- `401` - Not authenticated
- `500` - AI failed to generate valid lesson

**Authentication:** Yes

---

### POST /api/ai/generate-exercise

Generate a practice exercise using AI.

**Request Body:**
```json
{
  "topic": "string (2-200 chars, required)",
  "skill_level": "beginner"
}
```

| Field | Type | Values |
|-------|------|--------|
| `skill_level` | string | `beginner`, `intermediate`, `advanced` |

**Response (200):**
```json
{
  "exercise_name": "string",
  "instructions": ["string"],
  "duration": "string (e.g. '15 minutes')",
  "success_criteria": "string"
}
```

**Errors:**
- `401` - Not authenticated

**Authentication:** Yes

---

### GET /api/ai/topics/{instrument}/{difficulty}

Get available topics for a given instrument and difficulty level.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| `instrument` | string | `vocal`, `piano`, `drums` |
| `difficulty` | string | `beginner`, `intermediate`, `advanced` |

**Response (200):**
```json
{
  "instrument": "vocal",
  "difficulty": "beginner",
  "topics": [
    "Breathing basics",
    "Pitch matching",
    "Simple melodies",
    "Vocal warm-ups",
    "Basic scales"
  ]
}
```

**Errors:**
- `401` - Not authenticated

**Authentication:** Yes

---

## Vocal Guru

### GET /api/vocal-guru/gurus

List all available vocal guru personas.

**Response (200):**
```json
[
  {
    "id": "classical",
    "name": "Pandit Ravi",
    "description": "A classical music maestro with decades of experience",
    "style": "traditional",
    "voice_id": "pNInz6obpgDQGcFmaJgB",
    "greeting": "Namaste! I am Pandit Ravi...",
    "specialties": ["raga", "tal", "classical scales", "voice training"]
  },
  {
    "id": "contemporary",
    "name": "Maya Singh",
    "description": "A modern vocal coach specializing in contemporary styles",
    "style": "modern",
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "greeting": "Hey there! I'm Maya...",
    "specialties": ["pop", "rock", "jazz", "improvisation"]
  },
  {
    "id": "carnatic",
    "name": "Smt. Priya",
    "description": "Carnatic music expert with soulful teaching approach",
    "style": "devotional",
    "voice_id": "EXAVITQu4vr4xnSDxMaL",
    "greeting": "Welcome, dear student. I am Priya...",
    "specialties": ["carnatic", "swaras", "gamakas", "bhajans"]
  }
]
```

**Authentication:** No

---

### GET /api/vocal-guru/topics

List available lesson topics for Vocal Guru sessions.

**Response (200):**
```json
["breathing", "pitch", "warmup"]
```

**Authentication:** No

---

### GET /api/vocal-guru/gurus/{guru_id}

Get a specific guru's information.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| `guru_id` | string | `classical`, `contemporary`, `carnatic` |

**Response (200):**
```json
{
  "id": "classical",
  "name": "Pandit Ravi",
  "description": "A classical music maestro with decades of experience",
  "style": "traditional",
  "greeting": "Namaste! I am Pandit Ravi...",
  "specialties": ["raga", "tal", "classical scales", "voice training"]
}
```

**Errors:**
- `404` - Guru not found

**Authentication:** No

---

### GET /api/vocal-guru/lesson/{topic}

Get structured lesson content for a topic.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| `topic` | string | `breathing`, `pitch`, `warmup` |

**Response (200):**
```json
{
  "title": "Breathing Techniques",
  "steps": [
    "Place one hand on your chest and one on your belly",
    "Breathe in slowly through your nose for 4 counts"
  ],
  "tips": [
    "Practice daily for 5 minutes",
    "Always breathe from your diaphragm"
  ]
}
```

**Errors:**
- `404` - Topic not found

**Authentication:** No

---

### POST /api/vocal-guru/greet/{guru_id}

Get a greeting from a guru (text + audio availability).

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| `guru_id` | string | `classical`, `contemporary`, `carnatic` |

**Response (200):**
```json
{
  "guru_id": "classical",
  "name": "Pandit Ravi",
  "greeting": "Namaste! I am Pandit Ravi. Let us begin your journey into classical music.",
  "specialties": ["raga", "tal", "classical scales", "voice training"],
  "audio_available": true
}
```

**Errors:**
- `404` - Guru not found

**Authentication:** No

---

### POST /api/vocal-guru/teach/{topic}

Get teaching content and speech text from a guru for a topic.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| `topic` | string | `breathing`, `pitch`, `warmup` |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `guru_id` | string | `classical` | Guru to teach the topic |

**Response (200):**
```json
{
  "guru_id": "classical",
  "guru_name": "Pandit Ravi",
  "topic": "breathing",
  "title": "Breathing Techniques",
  "steps": ["Step 1...", "Step 2..."],
  "tips": ["Tip 1...", "Tip 2..."],
  "speech_text": "Pandit Ravi says: Breathing Techniques. Let me guide you...",
  "audio_available": true
}
```

**Errors:**
- `404` - Topic not found

**Authentication:** No

---

### POST /api/vocal-guru/speak

Generate speech audio from arbitrary text using a guru's voice.

**Request Body:**
```json
{
  "text": "string (required)",
  "guru_id": "classical"
}
```

**Response (200):**
```json
{
  "audio_url": "/api/vocal-guru/audio/guru_classical_1234567890.mp3",
  "guru_id": "classical"
}
```

**Errors:**
- `400` - Text is required or TTS not available

**Authentication:** No

---

### GET /api/vocal-guru/audio/{filename}

Serve a generated audio file.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `filename` | string | Audio filename (must be a safe basename) |

**Response:** Binary audio file (`audio/mpeg`).

**Errors:**
- `400` - Invalid filename (path traversal attempt)
- `404` - Audio file not found

**Authentication:** No

---

## Speech Analysis

### GET /api/speech/exercises

List all available singing exercises.

**Response (200):**
```json
[
  {
    "id": "scale_c_major",
    "name": "C Major Scale",
    "description": "Sing the C major scale up and down",
    "target_notes": ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    "difficulty": "beginner"
  },
  {
    "id": "vocal_warmup",
    "name": "Vocal Warm-up",
    "description": "Five-note pattern warm-up",
    "target_notes": ["C4", "D4", "E4", "F4", "G4"],
    "difficulty": "beginner"
  }
]
```

**Authentication:** No

---

### GET /api/speech/exercises/{exercise_id}

Get details for a specific exercise.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| `exercise_id` | string | `scale_c_major`, `scale_g_major`, `interval_thirds`, `vocal_warmup`, `pitch_stability` |

**Response (200):**
```json
{
  "id": "scale_c_major",
  "name": "C Major Scale",
  "description": "Sing the C major scale up and down",
  "target_notes": ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"],
  "difficulty": "beginner"
}
```

**Errors:**
- `404` - Exercise not found

**Authentication:** No

---

### POST /api/speech/analyze-pitch

Analyze pitch from raw audio data.

**Request Body:**
```json
{
  "audio_data": [0.01, -0.02, 0.03, ...],
  "sample_rate": 44100
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `audio_data` | float[] | Yes | Min 1 sample |
| `sample_rate` | int | No | 8000-48000 (default: 44100) |

**Response (200):**
```json
{
  "pitch": 440.0,
  "note": "A4",
  "stability": 85.5,
  "cents": 2.3,
  "confidence": 92.1
}
```

**Errors:**
- `400` - Insufficient audio data

**Authentication:** No

---

### POST /api/speech/analyze-volume

Analyze volume/loudness from raw audio data.

**Request Body:**
```json
{
  "audio_data": [0.01, -0.02, 0.03, ...],
  "sample_rate": 44100
}
```

**Response (200):**
```json
{
  "rms": 0.0452,
  "peak": 0.1200,
  "db": -26.9,
  "level": "normal"
}
```

**Errors:**
- `400` - Invalid audio data

**Authentication:** No

---

### POST /api/speech/score

Score a single note performance against a target note.

**Request Body:**
```json
{
  "audio_data": [0.01, -0.02, 0.03, ...],
  "target_note": "C4",
  "sample_rate": 44100
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `audio_data` | float[] | Yes | Min 1 sample |
| `target_note` | string | Yes | Valid note name (e.g. `C4`, `A#3`) |
| `sample_rate` | int | No | 8000-48000 (default: 44100) |

**Response (200):**
```json
{
  "score": 82,
  "target_note": "C4",
  "actual_note": "C4",
  "cents_off": 5.2,
  "feedback": [
    "Perfect pitch!",
    "Excellent voice stability",
    "Good volume level"
  ]
}
```

Scoring breakdown:
- Pitch accuracy: 40 points
- Stability: 30 points
- Volume: 15 points
- Confidence: 15 points

**Errors:**
- `400` - Invalid data

**Authentication:** No

---

### POST /api/speech/analyze-session

Analyze a complete singing session across multiple audio segments.

**Request Body:**
```json
{
  "exercise_id": "scale_c_major",
  "segments": [
    {
      "audio_data": [0.01, -0.02, ...],
      "sample_rate": 44100
    },
    {
      "audio_data": [0.03, -0.01, ...],
      "sample_rate": 44100
    }
  ]
}
```

| Field | Type | Required |
|-------|------|----------|
| `exercise_id` | string | Yes |
| `segments` | object[] | Yes (min 1) |

**Response (200):**
```json
{
  "exercise": "C Major Scale",
  "description": "Sing the C major scale up and down",
  "difficulty": "beginner",
  "total_notes": 15,
  "analyzed_notes": 10,
  "overall_score": 78.5,
  "note_results": [
    {
      "score": 85,
      "target_note": "C4",
      "actual_note": "C4",
      "cents_off": 3.1,
      "feedback": ["Perfect pitch!", "Good volume level"]
    }
  ],
  "summary": "Great job! Minor improvements needed in pitch accuracy."
}
```

**Errors:**
- `400` - exercise_id is required or no audio segments provided
- `404` - Exercise not found

**Authentication:** No

---

### POST /api/speech/upload-audio

Upload an audio file for analysis. Expects raw PCM float data (4 bytes per sample).

**Request:** Multipart form upload.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Audio file with raw PCM float samples |

**Response (200):**
```json
{
  "filename": "recording.wav",
  "size": 88200,
  "analysis": {
    "pitch": 440.0,
    "note": "A4",
    "stability": 85.5,
    "cents": 2.3,
    "confidence": 92.1,
    "rms": 0.0452,
    "peak": 0.1200,
    "db": -26.9,
    "level": "normal"
  }
}
```

**Errors:**
- `400` - No file provided, invalid audio format, or could not parse audio data

**Authentication:** No

---

## Lyrics Creator

### GET /api/lyrics/genres

List available music genres.

**Response (200):**
```json
[
  { "id": "pop", "name": "Pop", "description": "Catchy, upbeat, radio-friendly" },
  { "id": "rock", "name": "Rock", "description": "Powerful, energetic, guitar-driven" },
  { "id": "ballad", "name": "Ballad", "description": "Emotional, slow, piano-based" },
  { "id": "hiphop", "name": "Hip-Hop", "description": "Rhythmic, wordplay, flow-based" },
  { "id": "country", "name": "Country", "description": "Storytelling, twangy, heartland" },
  { "id": "rnb", "name": "R&B", "description": "Smooth, groovy, soulful" }
]
```

**Authentication:** No

---

### GET /api/lyrics/moods

List available moods for lyrics generation.

**Response (200):**
```json
[
  { "id": "happy", "name": "Happy", "emoji": "😊" },
  { "id": "sad", "name": "Sad", "emoji": "😢" },
  { "id": "angry", "name": "Angry", "emoji": "😠" },
  { "id": "romantic", "name": "Romantic", "emoji": "❤️" },
  { "id": "energetic", "name": "Energetic", "emoji": "⚡" },
  { "id": "chill", "name": "Chill", "emoji": "😌" }
]
```

**Authentication:** No

---

### POST /api/lyrics/generate

Generate song lyrics using AI.

**Request Body:**
```json
{
  "topic": "string (2-200 chars, required)",
  "genre": "pop",
  "mood": "happy",
  "language": "english"
}
```

| Field | Type | Default |
|-------|------|---------|
| `topic` | string | Required |
| `genre` | string | `pop` |
| `mood` | string | `happy` |
| `language` | string | `english` |

**Response (200):**
```json
{
  "title": "Shining Summer",
  "genre": "pop",
  "mood": "happy",
  "lyrics": [
    {
      "section_name": "verse1",
      "lines": ["Woke up this morning, feeling so bright"]
    },
    {
      "section_name": "chorus",
      "lines": ["Oh summer, you make me smile"]
    }
  ],
  "rhyme_scheme": "aabb",
  "word_count": 120,
  "suggested_tempo": 120,
  "suggested_key": "C Major"
}
```

**Errors:**
- `400` - Topic is required

**Authentication:** No

---

### POST /api/lyrics/improve

Improve existing lyrics using AI.

**Request Body:**
```json
{
  "lyrics": "string (min 10 chars, required)",
  "instruction": "make it more emotional"
}
```

**Response (200):**
```json
{
  "improved_lyrics": "string",
  "changes_made": ["string"],
  "suggestions": ["string"]
}
```

**Errors:**
- `400` - Lyrics are required

**Authentication:** No

---

### POST /api/lyrics/analyze

Analyze lyrics for various metrics.

**Request Body:**
```json
{
  "lyrics": "string (min 5 chars, required)"
}
```

**Response (200):**
```json
{
  "word_count": 120,
  "line_count": 24,
  "avg_words_per_line": 5.0,
  "total_syllables": 180,
  "avg_syllables_per_word": 1.5,
  "sentiment": "positive",
  "positive_words": 8,
  "negative_words": 2,
  "unique_words": 85,
  "readability": "easy"
}
```

**Errors:**
- `400` - Lyrics are required

**Authentication:** No

---

### POST /api/lyrics/format

Format lyrics for display or export.

**Request Body:**
```json
{
  "lyrics_data": {
    "lyrics": [
      { "section_name": "verse1", "lines": ["Line 1", "Line 2"] }
    ]
  },
  "format_type": "text"
}
```

| Format | Description |
|--------|-------------|
| `text` | Section headers with lyrics |
| `chords` | Bracketed headers with indented lyrics |
| `lrc` | Timestamped lines for media players |
| Other | Raw JSON dump |

**Response (200):**
```json
{
  "formatted": "=== VERSE1 ===\nLine 1\nLine 2",
  "format": "text"
}
```

**Errors:**
- `400` - Lyrics data is required

**Authentication:** No

---

## Shared Enums

These enum values are used across multiple endpoints:

| Enum | Values |
|------|--------|
| `InstrumentType` | `vocal`, `piano`, `drums` |
| `DifficultyLevel` | `beginner`, `intermediate`, `advanced` |
| `LessonType` | `theory`, `practice`, `quiz` |

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error description string"
}
```
