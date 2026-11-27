from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.telemetry import MonitoredIPResponse
from backend.app.services.telemetry_service import (
    get_all_monitored_ips,
    get_monitored_ip_by_identifier
)

router = APIRouter(prefix="/ips", tags=["Monitored IPs"])

@router.get("", response_model=List[MonitoredIPResponse])
def list_monitored_ips(db: Session = Depends(get_db)):
    """Retrieve all monitored host IP addresses along with their risk scores and status."""
    return get_all_monitored_ips(db)

@router.get("/{identifier}", response_model=MonitoredIPResponse)
def get_ip_detail(identifier: str, db: Session = Depends(get_db)):
    """Retrieve detailed telemetry and timeline progression for a specific IP or scenario ID."""
    ip_detail = get_monitored_ip_by_identifier(db, identifier)
    if not ip_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored host with identifier '{identifier}' was not found."
        )
    return ip_detail

