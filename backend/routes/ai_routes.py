# AI Lesson Routes - Fixed

from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import (
    LessonGenerateRequest, LessonGenerateResponse,
    ExerciseGenerateRequest, ExerciseResponse,
    TopicsResponse, ErrorResponse
)
from services.ai_lesson_generator import generate_lesson, generate_practice_exercise

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Lesson Generator"]
)


@router.post(
    "/generate-lesson",
    response_model=LessonGenerateResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def create_lesson(request: LessonGenerateRequest):
    """Generate a new music lesson using AI"""
    lesson = generate_lesson(
        topic=request.topic,
        difficulty=request.difficulty.value,
        instrument=request.instrument.value,
        lesson_type=request.lesson_type.value
    )

    return LessonGenerateResponse(
        title=lesson["title"],
        content=lesson["content"],
        quiz_questions=lesson["quiz_questions"],
        tips=lesson.get("tips", [])
    )


@router.post(
    "/generate-exercise",
    response_model=ExerciseResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def create_exercise(request: ExerciseGenerateRequest):
    """Generate a practice exercise"""
    exercise = generate_practice_exercise(
        topic=request.topic,
        skill_level=request.skill_level.value
    )
    return ExerciseResponse(**exercise)


@router.get(
    "/topics/{instrument}/{difficulty}",
    response_model=TopicsResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid instrument or difficulty"}
    }
)
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

    # Validate inputs
    if instrument not in topics:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid instrument. Must be: vocal, piano, drums"
        )

    if difficulty not in topics[instrument]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid difficulty. Must be: beginner, intermediate, advanced"
        )

    return TopicsResponse(
        instrument=instrument,
        difficulty=difficulty,
        topics=topics[instrument][difficulty]
    )