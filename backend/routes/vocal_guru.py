# Vocal Guru Routes

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os

from models.schemas import ErrorResponse
from services.vocal_guru import (
    get_guru, get_all_gurus, get_lesson_content,
    get_available_topics, generate_speech,
    generate_greeting, generate_lesson_speech
)

router = APIRouter(
    prefix="/api/vocal-guru",
    tags=["Vocal Guru"]
)


@router.get(
    "/gurus",
    response_model=List[dict],
    responses={422: {"model": ErrorResponse}}
)
def list_gurus():
    """Get all available vocal gurus"""
    return get_all_gurus()


@router.get(
    "/gurus/{guru_id}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Guru not found"}
    }
)
def get_guru_info(guru_id: str):
    """Get specific guru information"""
    guru = get_guru(guru_id)
    if not guru:
        raise HTTPException(status_code=404, detail="Guru not found")
    return {"id": guru_id, **guru}


@router.get(
    "/topics",
    response_model=List[str]
)
def list_topics():
    """Get available lesson topics"""
    return get_available_topics()


@router.get(
    "/lesson/{topic}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Topic not found"}
    }
)
def get_lesson(topic: str):
    """Get lesson content for a topic"""
    lesson = get_lesson_content(topic)
    if not lesson:
        raise HTTPException(status_code=404, detail="Topic not found")
    return lesson


@router.post(
    "/greet/{guru_id}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Guru not found"}
    }
)
def greet_guru(guru_id: str):
    """Get greeting from a guru"""
    result = generate_greeting(guru_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post(
    "/teach/{topic}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Topic not found"}
    }
)
def teach_topic(topic: str, guru_id: str = "classical"):
    """Get teaching content from guru for a topic"""
    result = generate_lesson_speech(topic, guru_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post(
    "/speak",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "TTS not available"}
    }
)
def speak_text(request: dict):
    """Generate speech audio from text"""
    text = request.get("text", "")
    guru_id = request.get("guru_id", "classical")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Fix #11: Validate text length and guru_id
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Maximum 5000 characters allowed.")

    valid_guru_ids = ["classical", "contemporary", "carnatic"]
    if guru_id not in valid_guru_ids:
        raise HTTPException(status_code=400, detail=f"Invalid guru_id. Must be one of: {', '.join(valid_guru_ids)}")

    audio_path = generate_speech(text, guru_id)
    if not audio_path:
        raise HTTPException(
            status_code=400,
            detail="Text-to-speech not available. Install gTTS or ElevenLabs."
        )
    return {
        "audio_url": f"/api/vocal-guru/audio/{os.path.basename(audio_path)}",
        "guru_id": guru_id
    }


@router.get("/audio/{filename}")
def get_audio(filename: str):
    """Serve audio files"""
    import tempfile
    # Fix #7: Prevent path traversal
    safe_filename = os.path.basename(filename)
    if safe_filename != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    temp_dir = tempfile.gettempdir()
    audio_path = os.path.join(temp_dir, safe_filename)
    
    # Verify path is within temp directory
    if not os.path.realpath(audio_path).startswith(os.path.realpath(temp_dir)):
        raise HTTPException(status_code=400, detail="Invalid path")
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg")