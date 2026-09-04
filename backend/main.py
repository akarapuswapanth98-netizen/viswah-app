# Viswah Backend - FastAPI Main

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

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


@app.get("/")
def root():
    return {
        "message": "Welcome to Viswah API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "app": "Viswah"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)