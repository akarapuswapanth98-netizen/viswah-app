import os
import json
import logging
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Fix #3: Properly check for valid API key
_openai_key = os.getenv("OPENAI_API_KEY", "")
OPENAI_AVAILABLE = False
client = None

if _openai_key and _openai_key != "your-openai-api-key-here" and len(_openai_key) > 10:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=_openai_key)
        OPENAI_AVAILABLE = True
    except ImportError:
        logger.warning("OpenAI package not installed")
    except Exception as e:
        logger.error(f"OpenAI init failed: {e}")


def generate_lesson(topic: str, difficulty: str, instrument: str, lesson_type: str) -> Dict:
    if OPENAI_AVAILABLE and client:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert music teacher."},
                    {"role": "user", "content": f"Create a {difficulty} {instrument} lesson on {topic} ({lesson_type}). Return JSON with title, content, quiz_questions (array with question/options/correct_answer), and tips."}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI error: {e}")

    return get_fallback_lesson(topic, difficulty, instrument)


def get_fallback_lesson(topic: str, difficulty: str, instrument: str) -> Dict:
    lessons = {
        "major scales": {
            "title": "Understanding Major Scales",
            "content": "# Major Scales\n\nPattern: W-W-H-W-W-W-H\n\n## C Major\nC - D - E - F - G - A - B - C",
            "quiz_questions": [
                {"question": "What is the major scale pattern?", "options": ["W-H-W-H-W-H-W", "W-W-H-W-W-W-H", "H-W-W-H-W-W-W"], "correct_answer": "W-W-H-W-W-W-H"},
                {"question": "How many notes in a major scale?", "options": ["5", "6", "7", "8"], "correct_answer": "7"}
            ],
            "tips": ["Practice ascending and descending", "Use a metronome", "Start with C Major"]
        }
    }
    for key in lessons:
        if key in topic.lower():
            return lessons[key]
    return {
        "title": f"Introduction to {topic.title()}",
        "content": f"Welcome to this {difficulty} {instrument} lesson on {topic}.",
        "quiz_questions": [{"question": f"What is {topic}?", "options": ["Theory", "Practice", "Both"], "correct_answer": "Both"}],
        "tips": ["Practice regularly", "Take breaks"]
    }


def generate_practice_exercise(topic: str, skill_level: str) -> Dict:
    if OPENAI_AVAILABLE and client:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a music coach."},
                    {"role": "user", "content": f"Create a {skill_level} exercise for {topic}. Return JSON with exercise_name, instructions (array), duration, success_criteria."}
                ],
                temperature=0.7,
                max_tokens=800
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI error: {e}")

    return {
        "exercise_name": f"{topic} Practice",
        "instructions": ["Warm up 5 minutes", "Practice 10 minutes", "Cool down"],
        "duration": "15 minutes",
        "success_criteria": "Complete without mistakes"
    }