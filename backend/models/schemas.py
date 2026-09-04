# Pydantic Schemas for API - Fixed

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============ Shared Enums ============

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class InstrumentType(str, Enum):
    vocal = "vocal"
    piano = "piano"
    drums = "drums"


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
    image_url: Optional[str] = None  # Fix #5: Simple nullable string

    class Config:
        from_attributes = True


# ============ Lesson Schemas ============

class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    audio_url: Optional[str] = None
    order: int
    lesson_type: LessonType
    duration_minutes: int = Field(..., ge=1)

    class Config:
        from_attributes = True


class LessonContent(BaseModel):
    title: str
    content: str
    audio_url: Optional[str] = None
    quiz_questions: Optional[List[dict]] = None


# ============ Progress Schemas ============

class ProgressResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    completed: bool
    score: float
    time_spent_minutes: int

    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    lesson_id: int
    completed: bool = False
    score: float = Field(default=0.0, ge=0.0, le=100.0)
    time_spent_minutes: int = Field(default=0, ge=0)


class ProgressPatch(BaseModel):
    """Partial update for progress"""
    completed: Optional[bool] = None
    score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    time_spent_minutes: Optional[int] = Field(default=None, ge=0)


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
    options: List[str] = Field(..., min_items=2, max_items=6)  # Fix #10: min 2 options
    correct_answer: str = Field(..., min_length=1)


class LessonGenerateResponse(BaseModel):
    title: str
    content: str
    quiz_questions: List[QuizQuestion] = Field(..., min_items=1)
    tips: List[str] = Field(..., min_items=1)


class ExerciseGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    skill_level: DifficultyLevel


class ExerciseResponse(BaseModel):
    exercise_name: str
    instructions: List[str] = Field(..., min_items=1)
    duration: str = Field(..., min_length=1, pattern=r"^\d+\s*(min|minutes|hour|hours|sec|seconds)$")
    success_criteria: str = Field(..., min_length=1)


class TopicsResponse(BaseModel):
    instrument: InstrumentType
    difficulty: DifficultyLevel
    topics: List[str] = Field(..., min_items=1)


# ============ Error Schemas ============

class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str