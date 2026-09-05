# Viswah Backend - FastAPI Main

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base, SessionLocal
from models.schemas import SuccessResponse
from routes import auth, courses, ai_routes, vocal_guru, speech_analysis, lyrics_creator
from seed_data import seed_database

load_dotenv()

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="Viswah Music Learning API",
    description="AI-Powered Music Education Platform",
    version="1.0.0"
)

# Fix #4: Secure CORS from environment
cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)