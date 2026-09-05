# AI Lesson Routes - Fixed with Auth

from fastapi import APIRouter, Depends, HTTPException
from models.schemas import (
    LessonGenerateRequest, LessonGenerateResponse,
    ExerciseGenerateRequest, ExerciseResponse,
    TopicsResponse, ErrorResponse, InstrumentType, DifficultyLevel
)
from services.ai_lesson_generator import generate_lesson, generate_practice_exercise
from models.models import User
from routes.auth import get_current_user

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Lesson Generator"]
)


@router.post(
    "/generate-lesson",
    response_model=LessonGenerateResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def create_lesson(
    request: LessonGenerateRequest,
    current_user: User = Depends(get_current_user)  # Fix #2: Add auth
):
    """Generate a new music lesson using AI (requires auth)"""
    lesson = generate_lesson(
        topic=request.topic,
        difficulty=request.difficulty.value,
        instrument=request.instrument.value,
        lesson_type=request.lesson_type.value
    )

    # Handle missing keys from AI response
    if not lesson or "title" not in lesson:
        raise HTTPException(status_code=500, detail="AI failed to generate valid lesson")

    tips = lesson.get("tips", [])
    if not tips:
        tips = ["Practice regularly", "Take breaks when needed"]

    return LessonGenerateResponse(
        title=lesson["title"],
        content=lesson.get("content", ""),
        quiz_questions=lesson.get("quiz_questions", []),
        tips=tips
    )


@router.post(
    "/generate-exercise",
    response_model=ExerciseResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def create_exercise(
    request: ExerciseGenerateRequest,
    current_user: User = Depends(get_current_user)  # Fix #3: Add auth
):
    """Generate a practice exercise (requires auth)"""
    exercise = generate_practice_exercise(
        topic=request.topic,
        skill_level=request.skill_level.value
    )
    return ExerciseResponse(**exercise)


@router.get(
    "/topics/{instrument}/{difficulty}",
    response_model=TopicsResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        422: {"model": ErrorResponse, "description": "Invalid instrument or difficulty"}
    }
)
def get_topics(
    instrument: InstrumentType,
    difficulty: DifficultyLevel,
    current_user: User = Depends(get_current_user)
):
    """Get available topics for a given instrument and difficulty (requires auth)"""

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

    # Get enum values
    instrument_val = instrument.value
    difficulty_val = difficulty.value

    return TopicsResponse(
        instrument=instrument_val,
        difficulty=difficulty_val,
        topics=topics[instrument_val][difficulty_val]
    )