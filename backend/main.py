# Viswah Backend - FastAPI Main

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
def root():
    return {"message": "Welcome to Viswah API"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

# Import routes (to be added)
# from routes import auth, courses, vocal, lyrics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)