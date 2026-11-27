from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.telemetry import ConnectionEventResponse, ConnectionEventCreate
from backend.app.services.telemetry_service import get_connection_logs, record_connection_event

router = APIRouter(tags=["Connection Logs & Events"])

@router.get("/logs", response_model=List[ConnectionEventResponse])
def list_connection_logs(
    ip: Optional[str] = Query(None, description="Filter logs by source IP"),
    status: Optional[str] = Query(None, description="Filter by status (Normal, Suspicious, Confirmed, Blocked)"),
    search: Optional[str] = Query(None, description="Search keyword in IP, protocol, or verdict"),
    limit: int = Query(50, ge=1, le=500, description="Maximum rows to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """Retrieve chronological connection attempts and packet classification verdicts."""
    return get_connection_logs(
        db=db,
        ip=ip,
        status=status,
        search=search,
        limit=limit,
        offset=offset
    )

@router.post("/events", response_model=ConnectionEventResponse, status_code=status.HTTP_201_CREATED)
def record_event(
    event_in: ConnectionEventCreate,
    db: Session = Depends(get_db)
):
    """Record an incoming connection attempt into SQLite persistent storage."""
    return record_connection_event(db=db, event_in=event_in)

