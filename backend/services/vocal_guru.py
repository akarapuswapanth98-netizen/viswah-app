# Vocal Guru Service - AI Voice Instructors

import os
import logging
import tempfile
import time
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Try to import TTS providers
ELEVENLABS_AVAILABLE = False
GTTS_AVAILABLE = False

try:
    import elevenlabs
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
    if ELEVENLABS_API_KEY and len(ELEVENLABS_API_KEY) > 10:
        elevenlabs.set_api_key(ELEVENLABS_API_KEY)
        ELEVENLABS_AVAILABLE = True
except (ImportError, AttributeError, Exception) as e:
    logger.info(f"ElevenLabs not available: {e}")

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    logger.info("gTTS not installed")


# Guru personas with different teaching styles
GURU_PERSONAS = {
    "classical": {
        "name": "Pandit Ravi",
        "description": "A classical music maestro with decades of experience",
        "style": "traditional",
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # ElevenLabs voice
        "greeting": "Namaste! I am Pandit Ravi. Let us begin your journey into classical music.",
        "specialties": ["raga", "tal", "classical scales", "voice training"]
    },
    "contemporary": {
        "name": "Maya Singh",
        "description": "A modern vocal coach specializing in contemporary styles",
        "style": "modern",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # ElevenLabs voice
        "greeting": "Hey there! I'm Maya. Ready to find your unique voice?",
        "specialties": ["pop", "rock", "jazz", "improvisation"]
    },
    "carnatic": {
        "name": "Smt. Priya",
        "description": "Carnatic music expert with soulful teaching approach",
        "style": "devotional",
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # ElevenLabs voice
        "greeting": "Welcome, dear student. I am Priya. Let us explore the beauty of Carnatic music.",
        "specialties": ["carnatic", "swaras", "gamakas", "bhajans"]
    }
}

# Lesson content for different topics
GURU_LESSONS = {
    "breathing": {
        "title": "Breathing Techniques",
        "steps": [
            "Place one hand on your chest and one on your belly",
            "Breathe in slowly through your nose for 4 counts",
            "Feel your belly expand, not your chest",
            "Hold for 2 counts",
            "Exhale slowly through your mouth for 6 counts",
            "Repeat 10 times"
        ],
        "tips": [
            "Practice daily for 5 minutes",
            "Always breathe from your diaphragm",
            "Keep your shoulders relaxed"
        ]
    },
    "pitch": {
        "title": "Pitch Matching",
        "steps": [
            "Listen to the reference note carefully",
            "Hum the note gently",
            "Match your pitch to the reference",
            "Check if you're sharp or flat",
            "Adjust and try again"
        ],
        "tips": [
            "Use a piano or tuner for reference",
            "Record yourself to check progress",
            "Start with notes in your comfortable range"
        ]
    },
    "warmup": {
        "title": "Vocal Warm-up",
        "steps": [
            "Lip trills for 1 minute",
            "Humming scales up and down",
            "Tongue stretches",
            "Jaw relaxation exercises",
            "Light vocalization on 'ma', 'me', 'mi', 'mo', 'mu'"
        ],
        "tips": [
            "Never skip warm-ups",
            "Keep water nearby",
            "Stop if you feel any pain"
        ]
    }
}


def get_guru(guru_id: str) -> Optional[Dict]:
    """Get a specific guru"""
    return GURU_PERSONAS.get(guru_id)


def get_all_gurus() -> List[Dict]:
    """Get all available gurus"""
    return [
        {"id": gid, **guru}
        for gid, guru in GURU_PERSONAS.items()
    ]


def get_lesson_content(topic: str) -> Optional[Dict]:
    """Get lesson content for a topic"""
    return GURU_LESSONS.get(topic.lower())


def get_available_topics() -> List[str]:
    """Get all available lesson topics"""
    return list(GURU_LESSONS.keys())


def generate_speech(text: str, guru_id: str = "classical") -> Optional[str]:
    """
    Generate speech audio from text using TTS.
    Returns audio file path or URL.
    """
    guru = GURU_PERSONAS.get(guru_id, GURU_PERSONAS["classical"])
    timestamp = int(time.time() * 1000)

    # Try ElevenLabs first
    if ELEVENLABS_AVAILABLE:
        try:
            audio = elevenlabs.generate(
                text=text,
                voice=guru["voice_id"],
                model="eleven_monolingual_v1"
            )
            # Save to temp file with unique name
            temp_dir = tempfile.gettempdir()
            audio_path = os.path.join(temp_dir, f"guru_{guru_id}_{timestamp}.mp3")
            with open(audio_path, "wb") as f:
                f.write(audio)
            return audio_path
        except Exception as e:
            logger.error(f"ElevenLabs error: {e}")

    # Fallback to gTTS
    if GTTS_AVAILABLE:
        try:
            tts = gTTS(text=text, lang='en')
            temp_dir = tempfile.gettempdir()
            audio_path = os.path.join(temp_dir, f"guru_{guru_id}_{timestamp}.mp3")
            tts.save(audio_path)
            return audio_path
        except Exception as e:
            logger.error(f"gTTS error: {e}")

    return None


def generate_greeting(guru_id: str) -> Dict:
    """Generate a greeting from the guru"""
    guru = GURU_PERSONAS.get(guru_id, GURU_PERSONAS["classical"])
    return {
        "guru_id": guru_id,
        "name": guru["name"],
        "greeting": guru["greeting"],
        "specialties": guru["specialties"],
        "audio_available": ELEVENLABS_AVAILABLE or GTTS_AVAILABLE
    }


def generate_lesson_speech(topic: str, guru_id: str = "classical") -> Dict:
    """Generate speech for a lesson"""
    lesson = GURU_LESSONS.get(topic.lower())
    if not lesson:
        return {"error": "Topic not found"}

    guru = GURU_PERSONAS.get(guru_id, GURU_PERSONAS["classical"])

    # Combine all steps into speech
    full_text = f"{guru['name']} says: {lesson['title']}. "
    full_text += "Let me guide you through this. "
    for i, step in enumerate(lesson["steps"], 1):
        full_text += f"Step {i}: {step}. "
    full_text += "Remember these tips: "
    for tip in lesson["tips"]:
        full_text += f"{tip}. "

    return {
        "guru_id": guru_id,
        "guru_name": guru["name"],
        "topic": topic,
        "title": lesson["title"],
        "steps": lesson["steps"],
        "tips": lesson["tips"],
        "speech_text": full_text,
        "audio_available": ELEVENLABS_AVAILABLE or GTTS_AVAILABLE
    }