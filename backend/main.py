# Viswah Backend - FastAPI Main - Fixed

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models.schemas import SuccessResponse

# Import routes
from routes import auth, courses, ai_routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Viswah Music Learning API",
    description="AI-Powered Music Education Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(ai_routes.router)


@app.get(
    "/",
    response_model=SuccessResponse,
    tags=["System"]
)
def root():
    """API root endpoint"""
    return SuccessResponse(
        message="Welcome to Viswah API - v1.0.0"
    )


@app.get(
    "/api/health",
    response_model=SuccessResponse,
    tags=["System"]
)
def health():
    """Health check endpoint"""
    return SuccessResponse(message="healthy")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)