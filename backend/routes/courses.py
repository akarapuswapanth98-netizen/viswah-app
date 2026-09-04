# Course and Lesson Routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import Course, Lesson, Progress, UserCourse
from models.schemas import CourseResponse, LessonResponse, ProgressUpdate, ProgressResponse

router = APIRouter(prefix="/api", tags=["courses"])


# Get all courses
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(stage: int = None, instrument: str = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if stage:
        query = query.filter(Course.stage == stage)
    if instrument:
        query = query.filter(Course.instrument == instrument)
    return query.all()


# Get course by ID
@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# Get lessons for a course
@router.get("/courses/{course_id}/lessons", response_model=List[LessonResponse])
def get_course_lessons(course_id: int, db: Session = Depends(get_db)):
    lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()
    return lessons


# Get single lesson
@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# Update progress
@router.post("/progress", response_model=ProgressResponse)
def update_progress(progress: ProgressUpdate, user_id: int, db: Session = Depends(get_db)):
    # Check if progress exists
    existing = db.query(Progress).filter(
        Progress.user_id == user_id,
        Progress.lesson_id == progress.lesson_id
    ).first()

    if existing:
        existing.completed = progress.completed
        existing.score = progress.score
        existing.time_spent_minutes = progress.time_spent_minutes
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_progress = Progress(
            user_id=user_id,
            lesson_id=progress.lesson_id,
            completed=progress.completed,
            score=progress.score,
            time_spent_minutes=progress.time_spent_minutes
        )
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress


# Get user progress
@router.get("/progress/{user_id}", response_model=List[ProgressResponse])
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    progress = db.query(Progress).filter(Progress.user_id == user_id).all()
    return progress


# Enroll in course
@router.post("/enroll/{course_id}")
def enroll_course(course_id: int, user_id: int, db: Session = Depends(get_db)):
    # Check if already enrolled
    existing = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == course_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = UserCourse(user_id=user_id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    return {"message": "Successfully enrolled"}


# Get enrolled courses
@router.get("/enrolled/{user_id}")
def get_enrolled_courses(user_id: int, db: Session = Depends(get_db)):
    enrolled = db.query(UserCourse).filter(UserCourse.user_id == user_id).all()
    course_ids = [e.course_id for e in enrolled]
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    return courses