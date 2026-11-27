from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.dashboard import DashboardStatsResponse
from backend.app.services.telemetry_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def read_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve top-level operational statistics for the Overview section."""
    return get_dashboard_stats(db)

