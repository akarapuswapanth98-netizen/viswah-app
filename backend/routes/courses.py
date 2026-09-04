# Course and Lesson Routes

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models.models import Course, Lesson, Progress, UserCourse, User
from models.schemas import (
    CourseResponse, LessonResponse, ProgressUpdate, ProgressPatch,
    ProgressResponse, EnrollmentResponse, EnrolledCourseResponse,
    ErrorResponse, InstrumentType
)
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Courses"])


@router.get(
    "/courses",
    response_model=List[CourseResponse],
    responses={422: {"model": ErrorResponse, "description": "Validation error"}}
)
def get_courses(
    stage: Optional[int] = Query(default=None, ge=1, le=4),
    instrument: Optional[InstrumentType] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if stage:
        query = query.filter(Course.stage == stage)
    if instrument:
        query = query.filter(Course.instrument == instrument.value)
    return query.all()


@router.get(
    "/courses/{course_id}",
    response_model=CourseResponse,
    responses={404: {"model": ErrorResponse, "description": "Course not found"}}
)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get(
    "/courses/{course_id}/lessons",
    response_model=List[LessonResponse],
    responses={404: {"model": ErrorResponse, "description": "Course not found"}}
)
def get_course_lessons(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()


@router.get(
    "/lessons/{lesson_id}",
    response_model=LessonResponse,
    responses={404: {"model": ErrorResponse, "description": "Lesson not found"}}
)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post(
    "/enroll/{course_id}",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        404: {"model": ErrorResponse, "description": "Course not found"},
        409: {"model": ErrorResponse, "description": "Already enrolled"}
    }
)
def enroll_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id,
        UserCourse.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already enrolled")

    db.add(UserCourse(user_id=current_user.id, course_id=course_id))
    db.commit()
    return EnrollmentResponse(message="Successfully enrolled", course_id=course_id)


@router.get(
    "/enrolled",
    response_model=List[EnrolledCourseResponse],
    responses={401: {"model": ErrorResponse, "description": "Not authenticated"}}
)
def get_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fix #12: Use join instead of N+1
    courses = db.query(Course).join(UserCourse).filter(
        UserCourse.user_id == current_user.id
    ).all()
    return courses


@router.post(
    "/progress",
    response_model=ProgressResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        404: {"model": ErrorResponse, "description": "Lesson not found"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def create_progress(
    progress: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(Lesson.id == progress.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    new_progress = Progress(
        user_id=current_user.id,
        lesson_id=progress.lesson_id,
        completed=progress.completed,
        score=progress.score,
        time_spent_minutes=progress.time_spent_minutes
    )
    db.add(new_progress)
    db.commit()
    db.refresh(new_progress)
    return new_progress


@router.patch(
    "/progress/{progress_id}",
    response_model=ProgressResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        404: {"model": ErrorResponse, "description": "Progress not found"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def update_progress(
    progress_id: int,
    progress: ProgressPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Progress).filter(
        Progress.id == progress_id,
        Progress.user_id == current_user.id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Progress not found")

    if progress.completed is not None:
        existing.completed = progress.completed
    if progress.score is not None:
        existing.score = progress.score
    if progress.time_spent_minutes is not None:
        existing.time_spent_minutes = progress.time_spent_minutes

    db.commit()
    db.refresh(existing)
    return existing


@router.get(
    "/progress",
    response_model=List[ProgressResponse],
    responses={401: {"model": ErrorResponse, "description": "Not authenticated"}}
)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Progress).filter(Progress.user_id == current_user.id).all()