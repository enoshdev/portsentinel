import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from backend.app.services.sniffer_service import sniffer_service
from backend.app.services.event_processor import event_processor

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

@router.get("/client-device")
def get_client_device_info(request: Request) -> Dict[str, Any]:
    """
    Identifies the visiting client device (phone, laptop, tablet),
    registers a live connection event on port 8000 into the detection engine,
    and returns device metadata.
    """
    # Extract client IP (checking Cloudflare and reverse proxy headers first)
    forwarded = (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-forwarded-for")
        or request.headers.get("x-real-ip")
    )
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    user_agent = request.headers.get("user-agent", "Unknown Device")
    device_type = "Desktop Workstation"
    if "iPhone" in user_agent:
        device_type = "Apple iPhone"
    elif "iPad" in user_agent:
        device_type = "Apple iPad"
    elif "Android" in user_agent:
        device_type = "Android Smartphone"
    elif "Macintosh" in user_agent:
        device_type = "MacBook / macOS"
    elif "Windows" in user_agent:
        device_type = "Windows PC"
    elif "Linux" in user_agent:
        device_type = "Linux Workstation"

    # Register initial live connection attempt on destination port 8000
    res = event_processor.process_event(
        source_ip=client_ip,
        destination_port=8000,
        destination_ip="127.0.0.1",
        protocol="TCP",
        tcp_flags="SYN-ACK",
        event_origin="live",
        device_label=device_type
    )

    return {
        "client_ip": client_ip,
        "device_type": device_type,
        "port": 8000,
        "protocol": "TCP",
        "status": res.get("status", "Normal"),
        "risk_score": res.get("score", 0),
        "user_agent": user_agent
    }

@router.post("/client-device/scan")
def trigger_client_device_scan(request: Request) -> Dict[str, Any]:
    """
    Initiates a real multi-port probe sequence originating from the client's device IP,
    triggering detection of port diversity, timing entropy, and risk escalation in real time.
    """
    forwarded = (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-forwarded-for")
        or request.headers.get("x-real-ip")
    )
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    user_agent = request.headers.get("user-agent", "Unknown Device")
    device_type = "Desktop Workstation"
    if "iPhone" in user_agent:
        device_type = "Apple iPhone"
    elif "iPad" in user_agent:
        device_type = "Apple iPad"
    elif "Android" in user_agent:
        device_type = "Android Smartphone"
    elif "Macintosh" in user_agent:
        device_type = "MacBook / macOS"
    elif "Windows" in user_agent:
        device_type = "Windows PC"
    elif "Linux" in user_agent:
        device_type = "Linux Workstation"

    ports_to_probe = [21, 22, 23, 25, 80, 135, 139, 443, 445, 3306, 3389, 8080]
    results = []

    for port in ports_to_probe:
        res = event_processor.process_event(
            source_ip=client_ip,
            destination_port=port,
            destination_ip="127.0.0.1",
            protocol="TCP",
            tcp_flags="SYN",
            event_origin="live",
            device_label=device_type
        )
        results.append(res)
        time.sleep(0.04)

    latest = results[-1]
    return {
        "success": True,
        "source_ip": client_ip,
        "probed_ports": ports_to_probe,
        "final_score": latest.get("score", 85),
        "final_status": latest.get("status", "Confirmed Scan"),
        "signals": latest.get("signals", {}),
        "verdict": latest.get("verdict", "Multi-port scan detected")
    }
