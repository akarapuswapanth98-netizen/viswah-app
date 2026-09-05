# Seed Data - Initial Courses and Lessons

import json
from sqlalchemy.orm import Session
from models.models import Course, Lesson


def seed_database(db: Session):
    """Populate database with initial course data"""

    if db.query(Course).first():
        return

    try:
        courses = [
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

        for course in courses:
            db.refresh(course)

        lessons = [
            Lesson(
                course_id=courses[0].id,
                title="Introduction to Notes",
                content="# Introduction to Notes\n\nMusic is made up of different sounds called notes...",
                order=1,
                lesson_type="theory",
                duration_minutes=10,
                quiz_questions=json.dumps([
                    {"question": "How many notes are in the musical alphabet?", "options": ["5", "6", "7", "8"], "correct_answer": "7"},
                    {"question": "What is the first note of the C major scale?", "options": ["A", "B", "C", "D"], "correct_answer": "C"}
                ])
            ),
            Lesson(
                course_id=courses[0].id,
                title="Understanding Rhythm",
                content="# Understanding Rhythm\n\nRhythm is the pattern of sounds and silences...",
                order=2,
                lesson_type="theory",
                duration_minutes=15,
                quiz_questions=json.dumps([
                    {"question": "How many beats in a 4/4 time signature?", "options": ["2", "3", "4", "6"], "correct_answer": "4"},
                    {"question": "What note gets one beat in 4/4 time?", "options": ["Whole", "Half", "Quarter", "Eighth"], "correct_answer": "Quarter"}
                ])
            ),
            Lesson(
                course_id=courses[0].id,
                title="Major Scales",
                content="# Major Scales\n\nA major scale is a sequence of 7 notes...",
                order=3,
                lesson_type="practice",
                duration_minutes=20,
                quiz_questions=json.dumps([
                    {"question": "How many notes in a major scale?", "options": ["5", "6", "7", "8"], "correct_answer": "7"},
                    {"question": "What is the pattern of a major scale?", "options": ["W-W-H-W-W-W-H", "W-H-W-W-H-W-W", "H-W-W-W-H-W-W", "W-W-W-H-W-W-H"], "correct_answer": "W-W-H-W-W-W-H"}
                ])
            ),
            Lesson(
                course_id=courses[0].id,
                title="Knowledge Check",
                content="Quiz time!",
                order=4,
                lesson_type="quiz",
                duration_minutes=10,
                quiz_questions=json.dumps([
                    {"question": "What is the third note of a C major scale?", "options": ["A", "B", "C", "E"], "correct_answer": "E"},
                    {"question": "How many half steps in an octave?", "options": ["7", "8", "10", "12"], "correct_answer": "12"}
                ])
            ),
            Lesson(
                course_id=courses[1].id,
                title="Breathing Techniques",
                content="# Breathing for Singing\n\nProper breathing is essential...",
                order=1,
                lesson_type="theory",
                duration_minutes=12,
                quiz_questions=json.dumps([
                    {"question": "What muscle is used for diaphragmatic breathing?", "options": ["Chest", "Shoulders", "Diaphragm", "Throat"], "correct_answer": "Diaphragm"},
                    {"question": "How long should you hold your breath during singing exercises?", "options": ["1 second", "5 seconds", "10 seconds", "Not at all"], "correct_answer": "Not at all"}
                ])
            ),
            Lesson(
                course_id=courses[1].id,
                title="Pitch Matching",
                content="# Pitch Matching\n\nLearn to match your voice to notes...",
                order=2,
                lesson_type="practice",
                duration_minutes=15,
                quiz_questions=json.dumps([
                    {"question": "What is the first step in pitch matching?", "options": ["Singing loud", "Listening carefully", "Moving around", "Warming up"], "correct_answer": "Listening carefully"},
                    {"question": "Which note is A440?", "options": ["Low A", "Middle A", "High A", "All of them"], "correct_answer": "Middle A"}
                ])
            ),
            Lesson(
                course_id=courses[3].id,
                title="Keyboard Layout",
                content="# Keyboard Layout\n\nThe piano keyboard has 88 keys...",
                order=1,
                lesson_type="theory",
                duration_minutes=10,
                quiz_questions=json.dumps([
                    {"question": "How many keys on a standard piano?", "options": ["76", "88", "96", "108"], "correct_answer": "88"},
                    {"question": "What color are the keys for C, D, E?", "options": ["Black", "White", "Red", "Blue"], "correct_answer": "White"}
                ])
            ),
            Lesson(
                course_id=courses[3].id,
                title="Finger Positioning",
                content="# Finger Positioning\n\nProper finger placement is crucial...",
                order=2,
                lesson_type="practice",
                duration_minutes=15,
                quiz_questions=json.dumps([
                    {"question": "Which finger is finger 1 on the right hand?", "options": ["Pinky", "Ring", "Middle", "Thumb"], "correct_answer": "Thumb"},
                    {"question": "Should you play piano with flat or curved fingers?", "options": ["Flat", "Curved", "Bent backward", "Straight"], "correct_answer": "Curved"}
                ])
            ),
            Lesson(
                course_id=courses[2].id,
                title="Vibrato Techniques",
                content="# Vibrato Techniques\n\nLearn to add warmth to your voice...",
                order=1,
                lesson_type="theory",
                duration_minutes=15,
                quiz_questions=json.dumps([
                    {"question": "What is vibrato?", "options": ["Singing loud", "Pitch fluctuation", "Breathing technique", "Reading music"], "correct_answer": "Pitch fluctuation"},
                    {"question": "How fast should vibrato oscillate?", "options": ["1-2 times/sec", "5-7 times/sec", "10-15 times/sec", "As fast as possible"], "correct_answer": "5-7 times/sec"}
                ])
            ),
            Lesson(
                course_id=courses[2].id,
                title="Dynamic Control",
                content="# Dynamic Control\n\nMaster volume and intensity...",
                order=2,
                lesson_type="practice",
                duration_minutes=20,
                quiz_questions=json.dumps([
                    {"question": "What does 'pp' mean in music?", "options": ["Piano piano", "Very soft", "Fortissimo", "Medium"], "correct_answer": "Very soft"},
                    {"question": "What does 'ff' mean in music?", "options": ["Very fast", "Very soft", "Very loud", "Flat"], "correct_answer": "Very loud"}
                ])
            ),
            Lesson(
                course_id=courses[4].id,
                title="Chord Progressions",
                content="# Chord Progressions\n\nLearn common chord sequences...",
                order=1,
                lesson_type="theory",
                duration_minutes=15,
                quiz_questions=json.dumps([
                    {"question": "What is a I-IV-V progression?", "options": ["Major chords", "Minor chords", "Diminished chords", "Augmented chords"], "correct_answer": "Major chords"},
                    {"question": "How many notes in a triad?", "options": ["2", "3", "4", "5"], "correct_answer": "3"}
                ])
            ),
            Lesson(
                course_id=courses[4].id,
                title="Scale Runs",
                content="# Scale Runs\n\nPractice smooth scale passages...",
                order=2,
                lesson_type="practice",
                duration_minutes=20,
                quiz_questions=json.dumps([
                    {"question": "What is the fingering pattern for C major scale?", "options": ["1-2-3-1-2-3-4-5", "1-2-3-4-5-1-2-3", "All same finger", "Random"], "correct_answer": "1-2-3-1-2-3-4-5"},
                    {"question": "How many octaves in a standard piano?", "options": ["5", "6", "7", "8"], "correct_answer": "7"}
                ])
            ),
            Lesson(
                course_id=courses[5].id,
                title="Basic Drum Patterns",
                content="# Basic Drum Patterns\n\nStart with simple 4/4 beats...",
                order=1,
                lesson_type="theory",
                duration_minutes=10,
                quiz_questions=json.dumps([
                    {"question": "Which foot controls the bass drum?", "options": ["Left", "Right", "Both", "Neither"], "correct_answer": "Right"},
                    {"question": "What is the downbeat?", "options": ["Beat 1", "Beat 2", "Beat 3", "Beat 4"], "correct_answer": "Beat 1"}
                ])
            ),
            Lesson(
                course_id=courses[5].id,
                title="Coordination Exercise",
                content="# Coordination Exercise\n\nPractice using both hands independently...",
                order=2,
                lesson_type="practice",
                duration_minutes=15,
                quiz_questions=json.dumps([
                    {"question": "Which hand plays the hi-hat in basic rock beat?", "options": ["Left", "Right", "Both", "Neither"], "correct_answer": "Right"},
                    {"question": "What is a paradiddle?", "options": ["RLRR LRLL", "RRLR LRLR", "RLRL RLRL", "RRLL RRLL"], "correct_answer": "RLRR LRLL"}
                ])
            ),
        ]

        db.add_all(lessons)
        db.commit()

        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
