# AI Lesson Generator Service

import os
import logging
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Try to import openai, handle gracefully if not installed
try:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    client = None
    logger.warning("OpenAI not installed. Using fallback lessons.")


def generate_lesson(topic: str, difficulty: str, instrument: str, lesson_type: str) -> Dict:
    """Generate a music lesson using AI"""

    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY") != "your-openai-api-key-here":
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert music teacher creating engaging lessons."},
                    {"role": "user", "content": f"Create a lesson on {topic} for {difficulty} {instrument} students. Type: {lesson_type}. Return JSON with title, content, quiz_questions (array with question/options/correct_answer), and tips."}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            content = response.choices[0].message.content
            import json
            lesson_data = json.loads(content)
            return lesson_data
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return get_fallback_lesson(topic, difficulty, instrument)
    else:
        return get_fallback_lesson(topic, difficulty, instrument)


def get_fallback_lesson(topic: str, difficulty: str, instrument: str) -> Dict:
    """Fallback lesson when AI API is unavailable"""

    lessons = {
        "major scales": {
            "title": "Understanding Major Scales",
            "content": "# Major Scales\n\nA major scale follows the pattern: W-W-H-W-W-W-H\n\n## C Major Scale\nC - D - E - F - G - A - B - C\n\n## Why Major Scales Matter\n- Foundation of Western music\n- Used in thousands of songs\n- Helps understand key signatures",
            "quiz_questions": [
                {
                    "question": "What is the pattern of a major scale?",
                    "options": ["W-H-W-H-W-H-W", "W-W-H-W-W-W-H", "H-W-W-H-W-W-W"],
                    "correct_answer": "W-W-H-W-W-W-H"
                },
                {
                    "question": "How many notes are in a major scale?",
                    "options": ["5", "6", "7", "8"],
                    "correct_answer": "7"
                }
            ],
            "tips": [
                "Practice ascending and descending",
                "Use a metronome",
                "Start with C Major"
            ]
        },
        "rhythm basics": {
            "title": "Rhythm Fundamentals",
            "content": "# Rhythm Basics\n\n## Basic Note Values\n- Whole note: 4 beats\n- Half note: 2 beats\n- Quarter note: 1 beat\n\n## Time Signatures\n- 4/4: Most common\n- 3/4: Waltz time",
            "quiz_questions": [
                {
                    "question": "How many beats does a whole note get?",
                    "options": ["1", "2", "3", "4"],
                    "correct_answer": "4"
                }
            ],
            "tips": [
                "Count out loud",
                "Use a metronome",
                "Start simple"
            ]
        }
    }

    for key in lessons:
        if key in topic.lower():
            return lessons[key]

    return {
        "title": f"Introduction to {topic.title()}",
        "content": f"Welcome to this {difficulty} lesson on {topic} for {instrument}.",
        "quiz_questions": [
            {
                "question": f"What is the main focus of {topic}?",
                "options": ["Technique", "Theory", "Practice", "All of the above"],
                "correct_answer": "All of the above"
            }
        ],
        "tips": [
            "Practice regularly",
            "Take breaks",
            "Ask questions"
        ]
    }


def generate_practice_exercise(topic: str, skill_level: str) -> Dict:
    """Generate a practice exercise"""

    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY") != "your-openai-api-key-here":
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a music practice coach."},
                    {"role": "user", "content": f"Create a practice exercise for {topic} at {skill_level} level. Return JSON with exercise_name, instructions (array), duration, success_criteria."}
                ],
                temperature=0.7,
                max_tokens=800
            )
            content = response.choices[0].message.content
            import json
            return json.loads(content)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return get_fallback_exercise(topic, skill_level)
    else:
        return get_fallback_exercise(topic, skill_level)


def get_fallback_exercise(topic: str, skill_level: str) -> Dict:
    """Fallback exercise"""
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