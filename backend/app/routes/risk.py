from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.telemetry import TimelinePoint
from backend.app.services.telemetry_service import get_risk_history_for_ip

router = APIRouter(prefix="/risk-history", tags=["Risk Progression History"])

@router.get("/{identifier}", response_model=List[TimelinePoint])
def read_risk_history(identifier: str, db: Session = Depends(get_db)):
    """Retrieve the 60-minute sliding timeline checkpoints for a specific IP or scenario."""
    points = get_risk_history_for_ip(db, identifier)
    if not points:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No risk progression history found for '{identifier}'."
        )
    return points

