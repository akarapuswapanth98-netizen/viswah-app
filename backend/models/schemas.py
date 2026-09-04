# Pydantic Schemas for API

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
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


class UserLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


# ============ Auth Schemas ============

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    level: UserLevel

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
    image_url: Optional[str] = None

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
    duration_minutes: int

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
    score: float = 0.0
    time_spent_minutes: int = 0


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
    topic: str
    difficulty: DifficultyLevel
    instrument: InstrumentType
    lesson_type: LessonType


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str


class LessonGenerateResponse(BaseModel):
    title: str
    content: str
    quiz_questions: List[QuizQuestion]
    tips: List[str]


class ExerciseGenerateRequest(BaseModel):
    topic: str
    skill_level: DifficultyLevel


class ExerciseResponse(BaseModel):
    exercise_name: str
    instructions: List[str]
    duration: str
    success_criteria: str


class TopicsResponse(BaseModel):
    instrument: InstrumentType
    difficulty: DifficultyLevel
    topics: List[str]


# ============ Error Schemas ============

class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str