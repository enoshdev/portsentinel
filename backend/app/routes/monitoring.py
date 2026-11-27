from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.app.services.sniffer_service import sniffer_service

router = APIRouter(prefix="/monitoring", tags=["Live Network Monitoring"])

class StartMonitoringRequest(BaseModel):
    interface_name: Optional[str] = None
    filter_str: Optional[str] = "tcp"

@router.get("/status")
def get_monitoring_status() -> Dict[str, Any]:
    """Retrieve current packet collection state, adapter diagnostics, and Npcap availability."""
    return sniffer_service.get_status()

@router.get("/interfaces")
def get_available_interfaces() -> List[Dict[str, Any]]:
    """List available network adapters on the host system."""
    return sniffer_service.list_interfaces()

@router.post("/start")
def start_monitoring(request: StartMonitoringRequest) -> Dict[str, Any]:
    """Start live network packet collection on the authorized interface."""
    status_res = sniffer_service.start_capture(
        interface_name=request.interface_name,
        filter_str=request.filter_str or "tcp"
    )
    if status_res["state"] in ("Capture unavailable", "Permission required", "Error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=status_res["error_message"] or f"Unable to start capture: {status_res['state']}"
        )
    return status_res

@router.post("/stop")
def stop_monitoring() -> Dict[str, Any]:
    """Stop live packet collection."""
    return sniffer_service.stop_capture()

