# Speech Analysis Routes

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import struct
import tempfile
import os

from models.schemas import ErrorResponse
from services.speech_analysis import (
    analyze_pitch_from_data,
    analyze_volume,
    score_performance,
    get_exercise,
    get_all_exercises,
    analyze_full_session,
    EXERCISES
)

router = APIRouter(
    prefix="/api/speech",
    tags=["Speech Analysis"]
)


class AudioDataRequest(BaseModel):
    audio_data: List[float] = Field(..., min_length=1)
    sample_rate: int = Field(default=44100, ge=8000, le=48000)


class ScoreRequest(BaseModel):
    audio_data: List[float] = Field(..., min_length=1)
    target_note: str = Field(..., min_length=1)
    sample_rate: int = Field(default=44100, ge=8000, le=48000)


@router.get(
    "/exercises",
    response_model=List[dict],
    responses={422: {"model": ErrorResponse}}
)
def list_exercises():
    """Get all available singing exercises"""
    return get_all_exercises()


@router.get(
    "/exercises/{exercise_id}",
    response_model=dict,
    responses={404: {"model": ErrorResponse, "description": "Exercise not found"}}
)
def get_exercise_info(exercise_id: str):
    """Get specific exercise details"""
    exercise = get_exercise(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {"id": exercise_id, **exercise}


@router.post(
    "/analyze-pitch",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio data"}
    }
)
def analyze_pitch(request: AudioDataRequest):
    """Analyze pitch from raw audio data"""
    return analyze_pitch_from_data(request.audio_data, request.sample_rate)


@router.post(
    "/analyze-volume",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio data"}
    }
)
def analyze_volume_endpoint(request: AudioDataRequest):
    """Analyze volume from raw audio data"""
    return analyze_volume(request.audio_data)


@router.post(
    "/score",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid data"}
    }
)
def score_note(request: ScoreRequest):
    """Score a single note performance"""
    analysis = analyze_pitch_from_data(request.audio_data, request.sample_rate)
    volume = analyze_volume(request.audio_data)
    analysis.update(volume)
    return score_performance(analysis, request.target_note)


@router.post(
    "/analyze-session",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid session data"},
        404: {"model": ErrorResponse, "description": "Exercise not found"}
    }
)
def analyze_session(session_data: dict):
    """Analyze a complete singing session"""
    exercise_id = session_data.get("exercise_id")
    audio_segments = session_data.get("segments", [])

    if not exercise_id:
        raise HTTPException(status_code=400, detail="exercise_id is required")
    if not audio_segments:
        raise HTTPException(status_code=400, detail="No audio segments provided")

    result = analyze_full_session(audio_segments, exercise_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post(
    "/upload-audio",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio file"}
    }
)
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file for analysis"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        contents = await file.read()

        # Try to parse as WAV-like PCM data
        # For simplicity, assume raw PCM float data
        if len(contents) % 4 == 0:
            num_samples = len(contents) // 4
            audio_data = struct.unpack(f'{num_samples}f', contents)
            analysis = analyze_pitch_from_data(list(audio_data))
            volume = analyze_volume(list(audio_data))
            analysis.update(volume)
            return {
                "filename": file.filename,
                "size": len(contents),
                "analysis": analysis
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid audio format")
    except struct.error:
        raise HTTPException(status_code=400, detail="Could not parse audio data")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
