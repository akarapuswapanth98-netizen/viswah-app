# Seed Data - Initial Courses and Lessons

from sqlalchemy.orm import Session
from models.models import Course, Lesson


def seed_database(db: Session):
    """Populate database with initial course data"""

    # Check if data already exists
    if db.query(Course).first():
        return

    # Stage 1 Courses
    courses = [
        # Vocal Courses
        Course(
            title="Music Fundamentals",
            description="Learn the basics of music theory and notation",
            stage=1,
            instrument="vocal",
            difficulty="beginner",
            image_url="https://example.com/fundamentals.jpg"
        ),
        Course(
            title="Vocal Training Basics",
            description="Develop your singing voice with proper technique",
            stage=1,
            instrument="vocal",
            difficulty="beginner",
            image_url="https://example.com/vocal.jpg"
        ),
        Course(
            title="Intermediate Vocal Skills",
            description="Advance your singing with vibrato and dynamics",
            stage=2,
            instrument="vocal",
            difficulty="intermediate",
            image_url="https://example.com/vocal-inter.jpg"
        ),

        # Piano Courses
        Course(
            title="Piano for Beginners",
            description="Start your piano journey from scratch",
            stage=1,
            instrument="piano",
            difficulty="beginner",
            image_url="https://example.com/piano.jpg"
        ),
        Course(
            title="Intermediate Piano",
            description="Master chords, scales, and coordination",
            stage=2,
            instrument="piano",
            difficulty="intermediate",
            image_url="https://example.com/piano-inter.jpg"
        ),

        # Drums Courses
        Course(
            title="Drum Basics",
            description="Learn fundamental drum patterns and techniques",
            stage=1,
            instrument="drums",
            difficulty="beginner",
            image_url="https://example.com/drums.jpg"
        ),
    ]

    db.add_all(courses)
    db.commit()

    # Refresh to get IDs
    for course in courses:
        db.refresh(course)

    # Add Lessons for Music Fundamentals
    lessons = [
        # Music Fundamentals Lessons
        Lesson(
            course_id=courses[0].id,
            title="Introduction to Notes",
            content="# Introduction to Notes\n\nMusic is made up of different sounds called notes...",
            order=1,
            lesson_type="theory",
            duration_minutes=10
        ),
        Lesson(
            course_id=courses[0].id,
            title="Understanding Rhythm",
            content="# Understanding Rhythm\n\nRhythm is the pattern of sounds and silences...",
            order=2,
            lesson_type="theory",
            duration_minutes=15
        ),
        Lesson(
            course_id=courses[0].id,
            title="Major Scales",
            content="# Major Scales\n\nA major scale is a sequence of 7 notes...",
            order=3,
            lesson_type="practice",
            duration_minutes=20
        ),
        Lesson(
            course_id=courses[0].id,
            title="Knowledge Check",
            content="Quiz time!",
            order=4,
            lesson_type="quiz",
            duration_minutes=10
        ),

        # Vocal Training Lessons
        Lesson(
            course_id=courses[1].id,
            title="Breathing Techniques",
            content="# Breathing for Singing\n\nProper breathing is essential...",
            order=1,
            lesson_type="theory",
            duration_minutes=12
        ),
        Lesson(
            course_id=courses[1].id,
            title="Pitch Matching",
            content="# Pitch Matching\n\nLearn to match your voice to notes...",
            order=2,
            lesson_type="practice",
            duration_minutes=15
        ),

        # Piano Lessons
        Lesson(
            course_id=courses[3].id,
            title="Keyboard Layout",
            content="# Keyboard Layout\n\nThe piano keyboard has 88 keys...",
            order=1,
            lesson_type="theory",
            duration_minutes=10
        ),
        Lesson(
            course_id=courses[3].id,
            title="Finger Positioning",
            content="# Finger Positioning\n\nProper finger placement is crucial...",
            order=2,
            lesson_type="practice",
            duration_minutes=15
        ),

        # Drum Lessons
        Lesson(
            course_id=courses[5].id,
            title="Basic Drum Patterns",
            content="# Basic Drum Patterns\n\nStart with simple 4/4 beats...",
            order=1,
            lesson_type="theory",
            duration_minutes=10
        ),
        Lesson(
            course_id=courses[5].id,
            title="Coordination Exercise",
            content="# Coordination Exercise\n\nPractice using both hands independently...",
            order=2,
            lesson_type="practice",
            duration_minutes=15
        ),
    ]

    db.add_all(lessons)
    db.commit()

    print("Database seeded successfully!")