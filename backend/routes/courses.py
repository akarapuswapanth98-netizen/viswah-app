# Course and Lesson Routes - Fixed

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import Course, Lesson, Progress, UserCourse, User
from models.schemas import (
    CourseResponse, LessonResponse, ProgressUpdate, ProgressPatch,
    ProgressResponse, EnrollmentResponse, EnrolledCourseResponse,
    ErrorResponse, SuccessResponse, InstrumentType
)
from routes.auth import get_current_user

router = APIRouter(
    prefix="/api",
    tags=["Courses"]
)


# ============ Public Endpoints ============

@router.get(
    "/courses",
    response_model=List[CourseResponse],
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
def get_courses(
    stage: int = None,
    instrument: InstrumentType = None,
    db: Session = Depends(get_db)
):
    """Get all courses with optional filters"""
    query = db.query(Course)
    if stage:
        query = query.filter(Course.stage == stage)
    if instrument:
        query = query.filter(Course.instrument == instrument.value)
    return query.all()


@router.get(
    "/courses/{course_id}",
    response_model=CourseResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Course not found"}
    }
)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get course by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.get(
    "/courses/{course_id}/lessons",
    response_model=List[LessonResponse],
    responses={
        404: {"model": ErrorResponse, "description": "Course not found"}
    }
)
def get_course_lessons(course_id: int, db: Session = Depends(get_db)):
    """Get all lessons for a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.order).all()
    return lessons


@router.get(
    "/lessons/{lesson_id}",
    response_model=LessonResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Lesson not found"}
    }
)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Get single lesson by ID"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    return lesson


# ============ Protected Endpoints (require auth) ============

@router.post(
    "/enroll/{course_id}",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,  # Fix #6: Return 201
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
    """Enroll in a course (requires auth)"""
    # Check course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Check if already enrolled
    existing = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id,
        UserCourse.course_id == course_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already enrolled in this course"
        )

    enrollment = UserCourse(user_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    db.commit()

    return EnrollmentResponse(
        message="Successfully enrolled",
        course_id=course_id
    )


@router.get(
    "/enrolled",
    response_model=List[EnrolledCourseResponse],
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"}
    }
)
def get_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all enrolled courses for current user (requires auth)"""
    enrolled = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id
    ).all()
    course_ids = [e.course_id for e in enrolled]
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    return courses  # Fix #8: Returns empty array if no enrollments (not 404)


# ============ Progress Endpoints ============

@router.post(
    "/progress",
    response_model=ProgressResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        404: {"model": ErrorResponse, "description": "Lesson not found"},
        422: {"model": ErrorResponse, "description": "Validation error"}  # Fix #7
    }
)
def create_progress(
    progress: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new lesson progress (requires auth)"""
    # Check lesson exists
    lesson = db.query(Lesson).filter(Lesson.id == progress.lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

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
    progress: ProgressPatch,  # Fix #11: PATCH for partial updates
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update existing progress (requires auth, PATCH for partial)"""
    # Check progress exists and belongs to user
    existing = db.query(Progress).filter(
        Progress.id == progress_id,
        Progress.user_id == current_user.id
    ).first()

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found"
        )

    # Update only provided fields
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
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"}
    }
)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's progress (requires auth)"""
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    return progress