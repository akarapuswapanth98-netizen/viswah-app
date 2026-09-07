# Viswah Backend - FastAPI Main

import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

from sqlalchemy import text

from database import Base, SessionLocal, engine
from models.schemas import SuccessResponse
from routes import ai_routes, auth, courses, lyrics_creator, speech_analysis, vocal_guru
from seed_data import seed_database

load_dotenv()

# Fix #1: Always create tables first, then run SQLite PRAGMA migration
Base.metadata.create_all(bind=engine)

if engine.url.drivername == "sqlite":
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(lessons)"))
            columns = [row[1] for row in result]
            if "quiz_questions" not in columns:
                # Fix #2: Wrap ALTER TABLE in try/except for concurrent/safe migration
                try:
                    conn.execute(text("ALTER TABLE lessons ADD COLUMN quiz_questions TEXT"))
                    conn.commit()
                except Exception:
                    pass  # Column may already exist from concurrent startup
    except Exception as e:
        logger.warning(f"SQLite migration check failed: {e}")

# Fix #3: Wrap seed in try/except so failure doesn't kill the app
try:
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
except Exception as e:
    logger.error(f"Database seeding failed: {e}")

app = FastAPI(
    title="Viswah Music Learning API",
    description="AI-Powered Music Education Platform",
    version="1.0.0"
)

# Fix #4: Validate CORS_ORIGINS, default to empty list if empty string
cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000").strip()
cors_origins = [origin.strip() for origin in cors_raw.split(",") if origin.strip()] if cors_raw else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(ai_routes.router)
app.include_router(vocal_guru.router)
app.include_router(speech_analysis.router)
app.include_router(lyrics_creator.router)


@app.get("/", response_model=SuccessResponse, tags=["System"])
def root():
    return SuccessResponse(message="Welcome to Viswah API - v1.0.0")


@app.get("/api/health", response_model=SuccessResponse, tags=["System"])
def health():
    return SuccessResponse(message="healthy")


MUSIC_ONTOLOGY_PATH = Path(__file__).parent / "data" / "music_ontology.json"


@app.get("/api/v1/musicology/genres")
def get_musicology_genres():
    if not MUSIC_ONTOLOGY_PATH.exists():
        raise HTTPException(status_code=404, detail="Music ontology not found")
    with open(MUSIC_ONTOLOGY_PATH) as f:
        return json.load(f)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)