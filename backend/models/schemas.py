# Pydantic Schemas for API

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    level: str

    class Config:
        from_attributes = True


# Course Schemas
class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    stage: int
    instrument: str
    difficulty: str
    image_url: Optional[str]

    class Config:
        from_attributes = True


# Lesson Schemas
class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    audio_url: Optional[str]
    order: int
    lesson_type: str
    duration_minutes: int

    class Config:
        from_attributes = True


class LessonContent(BaseModel):
    title: str
    content: str
    audio_url: Optional[str]
    quiz_questions: Optional[List[dict]]


# Progress Schemas
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


# AI Lesson Generation
class LessonGenerateRequest(BaseModel):
    topic: str
    difficulty: str  # beginner, intermediate, advanced
    instrument: str  # vocal, piano, drums
    lesson_type: str  # theory, practice


class LessonGenerateResponse(BaseModel):
    title: str
    content: str
    quiz_questions: List[dict]
    tips: List[str]