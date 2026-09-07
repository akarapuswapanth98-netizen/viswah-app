# Pydantic Schemas for API - Fixed

import json
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator

# ============ Shared Enums ============

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class InstrumentType(str, Enum):
    vocal = "vocal"
    piano = "piano"
    drums = "drums"
    guitar = "guitar"
    violin = "violin"
    flute = "flute"
    trumpet = "trumpet"
    saxophone = "saxophone"
    cello = "cello"
    ukulele = "ukulele"
    keyboard = "keyboard"
    bass = "bass"
    harmonica = "harmonica"
    clarinet = "clarinet"
    percussion = "percussion"


class LessonType(str, Enum):
    theory = "theory"
    practice = "practice"
    quiz = "quiz"


# Fix #4: Single shared level type (remove UserLevel, use DifficultyLevel everywhere)


# ============ Auth Schemas ============

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    level: DifficultyLevel  # Fix #4: Use shared enum

    class Config:
        from_attributes = True


# ============ Course Schemas ============

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    stage: int
    instrument: InstrumentType
    difficulty: DifficultyLevel
    image_url: str | None = None
    lessons_count: int | None = None

    class Config:
        from_attributes = True


# ============ Lesson Schemas ============

class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    audio_url: str | None = None
    order: int
    lesson_type: LessonType
    duration_minutes: int = Field(..., ge=0)
    quiz_questions: list[dict] | None = None

    @field_validator('quiz_questions', mode='before')
    @classmethod
    def parse_quiz_questions(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    class Config:
        from_attributes = True


# ============ Progress Schemas ============

class ProgressResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    completed: bool
    score: float
    time_spent_minutes: int
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    lesson_id: int
    completed: bool = False
    score: float = Field(default=0.0, ge=0, le=100)
    time_spent_minutes: int = Field(default=0, ge=0)


class ProgressPatch(BaseModel):
    """Partial update for progress"""
    completed: bool | None = None
    score: float | None = Field(default=None, ge=0, le=100)
    time_spent_minutes: int | None = Field(default=None, ge=0)


# ============ Enrollment Schemas ============

class EnrollmentResponse(BaseModel):
    message: str
    course_id: int


class EnrolledCourseResponse(BaseModel):
    id: int
    title: str
    description: str
    stage: int
    instrument: InstrumentType
    difficulty: DifficultyLevel

    class Config:
        from_attributes = True


# ============ AI Schemas ============

class LessonGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    difficulty: DifficultyLevel
    instrument: InstrumentType
    lesson_type: LessonType


class QuizQuestion(BaseModel):
    question: str = Field(..., min_length=5, max_length=500)
    options: list[str] = Field(..., min_length=2, max_length=6)
    correct_answer: str = Field(..., min_length=1)


class LessonGenerateResponse(BaseModel):
    title: str
    content: str
    quiz_questions: list[QuizQuestion] = Field(default=[], min_length=0)
    tips: list[str] = Field(default=[], min_length=0)


class ExerciseGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    skill_level: DifficultyLevel


class ExerciseResponse(BaseModel):
    exercise_name: str
    instructions: list[str] = Field(..., min_length=1)
    duration: str = Field(..., min_length=1)
    success_criteria: str = Field(..., min_length=1)


class TopicsResponse(BaseModel):
    instrument: InstrumentType
    difficulty: DifficultyLevel
    topics: list[str] = Field(..., min_length=1)


# ============ Error Schemas ============

class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str