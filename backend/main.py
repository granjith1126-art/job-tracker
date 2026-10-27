import asyncio
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from services.seed_data import seed_database
from routes.api import router as api_router, cleanup_user_expired_applications

app = FastAPI(
    title="CareerAI API",
    description="AI-Powered Career Guidance & Job Application Tracking Backend",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default port 5174, 5173, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def periodic_expired_cleanup():
    """Background task that runs periodically to remove applications older than 30 days."""
    while True:
        try:
            cleaned = cleanup_user_expired_applications()
            if cleaned > 0:
                print(f"[Cleanup] Automatically pruned {cleaned} expired job applications.")
        except Exception as e:
            print(f"[Cleanup] Periodic cleanup notice: {e}")
        await asyncio.sleep(1800)  # Every 30 minutes

@app.on_event("startup")
async def on_startup():
    init_db()
    seed_database()
    # Trigger initial cleanup of expired records
    try:
        cleanup_user_expired_applications()
    except Exception as e:
        print(f"Initial application expiration cleanup error: {e}")

    # Launch background scheduler
    asyncio.create_task(periodic_expired_cleanup())

    import os
    from services.oauth_config import is_provider_configured
    print(f"GitHub OAuth: {'configured' if is_provider_configured('github') else 'not configured'}")
    print(f"Google OAuth: {'configured' if is_provider_configured('google') else 'not configured'}")
    print(f"YouTube API: {'configured' if bool(os.environ.get('YOUTUBE_API_KEY')) else 'not configured'}")

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
