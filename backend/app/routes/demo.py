from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.demo_service import seed_demo_data

router = APIRouter(prefix="/demo", tags=["Demonstration Management"])

@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_demonstration_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Reset all demonstration records in SQLite back to initial baseline:
    Restores the 4 core scenarios, default packet logs, and initial quarantine rules.
    """
    seed_demo_data(db=db, force=True)
    return {
        "success": True,
        "message": "Demonstration database successfully reset to clean baseline.",
        "scenarios": ["stealth", "fast", "office", "normal"]
    }

