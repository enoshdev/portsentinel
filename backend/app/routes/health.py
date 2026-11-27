from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.schemas.dashboard import HealthResponse
from backend.app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def check_health(db: Session = Depends(get_db)):
    """Health check endpoint confirming API status, SQLite database connectivity, and operational mode."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status,
        phase=3,
        demo_mode=settings.DEMO_MODE,
        timestamp=datetime.utcnow().isoformat()
    )

