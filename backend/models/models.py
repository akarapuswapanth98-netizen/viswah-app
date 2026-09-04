from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    level = Column(String(20), default="beginner")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    progress = relationship("Progress", back_populates="user")
    courses = relationship("UserCourse", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    description = Column(Text)
    stage = Column(Integer)
    instrument = Column(String(50))
    difficulty = Column(String(20))
    image_url = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    lessons = relationship("Lesson", back_populates="course")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String(100))
    content = Column(Text)
    audio_url = Column(String(200))
    order = Column(Integer)
    lesson_type = Column(String(20))
    duration_minutes = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class UserCourse(Base):
    __tablename__ = "user_courses"
    __table_args__ = (UniqueConstraint('user_id', 'course_id', name='uq_user_course'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="courses")
    course = relationship("Course")