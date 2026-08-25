from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from services.seed_data import seed_database
from routes.api import router as api_router

app = FastAPI(
    title="CareerAI API",
    description="AI-Powered Career Guidance & Job Application Tracking Backend",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default port 5173, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_database()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CareerAI Backend API",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)