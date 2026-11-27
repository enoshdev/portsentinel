import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.services.demo_service import seed_demo_data
from backend.app.routes import api_router, websocket_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for database initialization and initial scenario seeding."""
    init_db()
    if settings.DEMO_MODE:
        db = SessionLocal()
        try:
            seed_demo_data(db=db, force=False)
        finally:
            db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PortSentinel Real-Time Detection & Automated Mitigation Engine (Phase 3 Real Firewall Protection)",
    lifespan=lifespan
)

# Configure CORS for frontend dev server & LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all modular API endpoints under /api
app.include_router(api_router, prefix=settings.API_PREFIX)
# Also register websocket directly at root /ws for convenience
app.include_router(websocket_router)

# Mount production frontend build if dist exists in project root
project_root = os.path.dirname(settings.BASE_DIR)
dist_dir = os.path.join(project_root, "dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/api-status")
def api_status():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "api_prefix": settings.API_PREFIX,
        "phase": 3
    }

# SPA Fallback for production static serving
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # Allow docs, openapi, api, ws to pass through
    if full_path.startswith("api") or full_path.startswith("docs") or full_path in ("openapi.json", "ws"):
        return None
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "phase": 3
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
