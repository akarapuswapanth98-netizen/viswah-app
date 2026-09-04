# AI Lesson Routes

from fastapi import APIRouter, Depends
from models.schemas import LessonGenerateRequest, LessonGenerateResponse
from services.ai_lesson_generator import generate_lesson, generate_practice_exercise

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/generate-lesson", response_model=LessonGenerateResponse)
def create_lesson(request: LessonGenerateRequest):
    """Generate a new lesson using AI"""
    lesson = generate_lesson(
        topic=request.topic,
        difficulty=request.difficulty,
        instrument=request.instrument,
        lesson_type=request.lesson_type
    )

    return LessonGenerateResponse(
        title=lesson["title"],
        content=lesson["content"],
        quiz_questions=lesson["quiz_questions"],
        tips=lesson.get("tips", [])
    )


@router.post("/generate-exercise")
def create_exercise(topic: str, skill_level: str):
    """Generate a practice exercise"""
    exercise = generate_practice_exercise(topic, skill_level)
    return exercise


@router.get("/topics/{instrument}/{difficulty}")
def get_topics(instrument: str, difficulty: str):
    """Get available topics for a given instrument and difficulty"""

    topics = {
        "vocal": {
            "beginner": [
                "Breathing basics",
                "Pitch matching",
                "Simple melodies",
                "Vocal warm-ups",
                "Basic scales"
            ],
            "intermediate": [
                "Major scales",
                "Vibrato techniques",
                "Harmony basics",
                "Dynamic control",
                "Song interpretation"
            ],
            "advanced": [
                "Complex harmonies",
                "Vocal runs",
                "Improvisation",
                "Performance techniques",
                "Advanced dynamics"
            ]
        },
        "piano": {
            "beginner": [
                "Keyboard layout",
                "Finger positioning",
                "Basic chords",
                "Simple songs",
                "Reading notes"
            ],
            "intermediate": [
                "Major scales",
                "Chord progressions",
                "Rhythm patterns",
                "Sight reading",
                "Hand coordination"
            ],
            "advanced": [
                "Complex pieces",
                "Arpeggios",
                "Pedal techniques",
                "Jazz chords",
                "Composition basics"
            ]
        },
        "drums": {
            "beginner": [
                "Basic beat patterns",
                "Hi-hat techniques",
                "Simple fills",
                "Counting rhythm",
                "Coordination basics"
            ],
            "intermediate": [
                "Syncopation",
                "Double bass",
                "Complex fills",
                "Time signatures",
                "Groove development"
            ],
            "advanced": [
                "Polyrhythms",
                "Solo techniques",
                "Genre styles",
                "Advanced coordination",
                "Creative patterns"
            ]
        }
    }

    instrument_topics = topics.get(instrument, {})
    difficulty_topics = instrument_topics.get(difficulty, [])

    return {
        "instrument": instrument,
        "difficulty": difficulty,
        "topics": difficulty_topics
    }