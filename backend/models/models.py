# Database Models

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    level = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    progress = relationship("Progress", back_populates="user")
    courses = relationship("UserCourse", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    description = Column(Text)
    stage = Column(Integer)  # 1, 2, 3, 4
    instrument = Column(String(50))  # vocal, piano, drums
    difficulty = Column(String(20))  # beginner, intermediate, advanced
    image_url = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lessons = relationship("Lesson", back_populates="course")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String(100))
    content = Column(Text)
    audio_url = Column(String(200))
    order = Column(Integer)
    lesson_type = Column(String(20))  # theory, practice, quiz
    duration_minutes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    completed = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    time_spent_minutes = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class UserCourse(Base):
    __tablename__ = "user_courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="courses")