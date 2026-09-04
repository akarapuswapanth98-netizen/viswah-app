# AI Lesson Generator Service

import openai
from typing import List, Dict
import json

# Set your OpenAI API key
openai.api_key = "your-openai-api-key"


def generate_lesson(topic: str, difficulty: str, instrument: str, lesson_type: str) -> Dict:
    """
    Generate a music lesson using AI

    Args:
        topic: Lesson topic (e.g., "major scales", "rhythm basics")
        difficulty: beginner, intermediate, advanced
        instrument: vocal, piano, drums
        lesson_type: theory, practice

    Returns:
        Dictionary with lesson content, quiz questions, and tips
    """

    prompt = f"""
    Create a comprehensive music lesson with the following details:
    - Topic: {topic}
    - Difficulty: {difficulty}
    - Instrument: {instrument}
    - Lesson Type: {lesson_type}

    Please provide:
    1. A clear, engaging title
    2. Main lesson content (educational, step-by-step)
    3. 3-5 quiz questions with multiple choice answers
    4. 3 practical tips for the student

    Format the response as JSON with these keys:
    {{
        "title": "lesson title",
        "content": "main lesson content",
        "quiz_questions": [
            {{
                "question": "question text",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A"
            }}
        ],
        "tips": ["tip1", "tip2", "tip3"]
    }}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert music teacher creating engaging lessons."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        content = response.choices[0].message.content
        lesson_data = json.loads(content)
        return lesson_data

    except Exception as e:
        # Fallback lesson if API fails
        return get_fallback_lesson(topic, difficulty, instrument)


def get_fallback_lesson(topic: str, difficulty: str, instrument: str) -> Dict:
    """Fallback lesson when AI API is unavailable"""

    lessons = {
        "major scales": {
            "title": "Understanding Major Scales",
            "content": """
            # Major Scales

            A major scale is a sequence of 7 notes that follows a specific pattern of whole and half steps:

            **Pattern: W-W-H-W-W-W-H**
            (W = Whole step, H = Half step)

            ## C Major Scale
            C - D - E - F - G - A - B - C

            ## Why Major Scales Matter
            - Foundation of Western music
            - Used in thousands of songs
            - Helps you understand key signatures

            ## Practice Tips
            1. Start slowly, one note at a time
            2. Use a metronome to keep time
            3. Say note names out loud as you play/sing
            """,
            "quiz_questions": [
                {
                    "question": "What is the pattern of a major scale?",
                    "options": ["W-H-W-H-W-H-W", "W-W-H-W-W-W-H", "H-W-W-H-W-W-W", "W-W-W-H-W-W-H"],
                    "correct_answer": "W-W-H-W-W-W-H"
                },
                {
                    "question": "How many notes are in a major scale?",
                    "options": ["5", "6", "7", "8"],
                    "correct_answer": "7"
                },
                {
                    "question": "What is the first note of the C Major scale?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "C"
                }
            ],
            "tips": [
                "Practice the scale ascending and descending",
                "Listen to songs in major keys to develop your ear",
                "Start with C Major as it has no sharps or flats"
            ]
        },
        "rhythm basics": {
            "title": "Rhythm Fundamentals",
            "content": """
            # Rhythm Basics

            Rhythm is the pattern of sounds and silences in music.

            ## Basic Note Values
            - Whole note: 4 beats
            - Half note: 2 beats
            - Quarter note: 1 beat
            - Eighth note: 1/2 beat

            ## Time Signatures
            - 4/4: Four quarter notes per measure (most common)
            - 3/4: Three quarter notes per measure (waltz time)

            ## Practice
            Clap along to your favorite songs to feel the beat!
            """,
            "quiz_questions": [
                {
                    "question": "How many beats does a whole note get?",
                    "options": ["1", "2", "3", "4"],
                    "correct_answer": "4"
                },
                {
                    "question": "What is the most common time signature?",
                    "options": ["2/4", "3/4", "4/4", "6/8"],
                    "correct_answer": "4/4"
                }
            ],
            "tips": [
                "Count out loud while practicing",
                "Use a metronome to develop steady timing",
                "Start with simple rhythms before adding complexity"
            ]
        }
    }

    # Return matching lesson or default
    for key in lessons:
        if key in topic.lower():
            return lessons[key]

    # Default lesson
    return {
        "title": f"Introduction to {topic.title()}",
        "content": f"Welcome to this lesson on {topic}. This is a {difficulty} level lesson for {instrument}.",
        "quiz_questions": [
            {
                "question": f"What is the main focus of {topic}?",
                "options": ["Technique", "Theory", "Practice", "All of the above"],
                "correct_answer": "All of the above"
            }
        ],
        "tips": [
            "Practice regularly for best results",
            "Take breaks when needed",
            "Ask questions if you're confused"
        ]
    }


def generate_practice_exercise(topic: str, skill_level: str) -> Dict:
    """Generate a practice exercise for vocal/instrument training"""

    prompt = f"""
    Create a practice exercise for:
    - Topic: {topic}
    - Skill Level: {skill_level}

    Include:
    1. Exercise name
    2. Step-by-step instructions
    3. Duration recommendation
    4. Success criteria

    Format as JSON.
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a music practice coach."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        return {
            "exercise_name": f"{topic} Practice",
            "instructions": [
                "Start with a 5-minute warm-up",
                "Practice the main exercise for 10 minutes",
                "Cool down with gentle stretching"
            ],
            "duration": "15 minutes",
            "success_criteria": "Complete without mistakes at steady tempo"
        }