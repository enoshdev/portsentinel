from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.demo_service import seed_demo_data
from backend.app.models.monitored_ip import MonitoredIP
from backend.app.models.connection_event import ConnectionEvent
from backend.app.models.risk_history import RiskHistory
from backend.app.models.firewall_rule import FirewallRule
from backend.app.services.detection_engine import engine_instance
from backend.app.services.event_processor import event_processor
from backend.app.services.sniffer_service import sniffer_service
from backend.app.services.websocket_manager import ws_manager

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

@router.post("/clear", status_code=status.HTTP_200_OK)
def clear_all_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Clears all simulated and demo records from SQLite and resets in-memory sliding windows.
    Empties monitored_ips, connection_events, firewall_rules, and risk_history.
    Leaves the database completely clean for real live device connection demonstrations.
    """
    db.query(ConnectionEvent).delete()
    db.query(RiskHistory).delete()
    db.query(FirewallRule).delete()
    db.query(MonitoredIP).delete()
    db.commit()
    
    # Clear in-memory caches and counters
    engine_instance.clear_history()
    event_processor._flow_cache.clear()
    sniffer_service.packets_captured = 0
    ws_manager.broadcast_sync({"type": "DATA_CLEARED"})
    
    return {
        "success": True,
        "message": "All mock and demo data removed. Database is completely clean and ready for real device testing."
    }
