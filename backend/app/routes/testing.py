import os
import tempfile
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.services.simulation_service import simulation_service

router = APIRouter(prefix="/test", tags=["Traffic Simulation & Testing"])

class NormalTrafficRequest(BaseModel):
    source_ip: Optional[str] = "192.168.1.105"
    count: Optional[int] = 15

class FastScanRequest(BaseModel):
    source_ip: Optional[str] = "10.0.0.99"
    port_count: Optional[int] = 20

class SlowScanRequest(BaseModel):
    source_ip: Optional[str] = "203.0.113.199"
    probe_count: Optional[int] = 6

class RepeatedPortRequest(BaseModel):
    source_ip: Optional[str] = "192.168.1.180"
    count: Optional[int] = 25
    port: Optional[int] = 443

class PcapReplayRequest(BaseModel):
    file_path: Optional[str] = None

@router.post("/traffic/normal")
def simulate_normal_traffic(req: Optional[NormalTrafficRequest] = None) -> Dict[str, Any]:
    """Generates benign web session packets (ports 80 & 443 with human jitter)."""
    ip = req.source_ip if req and req.source_ip else "192.168.1.105"
    cnt = req.count if req and req.count else 15
    return simulation_service.generate_normal_traffic(source_ip=ip, count=cnt)

@router.post("/traffic/fast-scan")
def simulate_fast_scan(req: Optional[FastScanRequest] = None) -> Dict[str, Any]:
    """Generates rapid multi-port SYN sweep probing up to 20 ports within 5 seconds."""
    ip = req.source_ip if req and req.source_ip else "10.0.0.99"
    cnt = req.port_count if req and req.port_count else 20
    return simulation_service.generate_fast_scan(source_ip=ip, port_count=cnt)

@router.post("/traffic/slow-scan")
def simulate_slow_scan(req: Optional[SlowScanRequest] = None) -> Dict[str, Any]:
    """Generates stealth scan probing sensitive ports at low-jitter ~12 min intervals."""
    ip = req.source_ip if req and req.source_ip else "203.0.113.199"
    cnt = req.probe_count if req and req.probe_count else 6
    return simulation_service.generate_slow_scan(source_ip=ip, probe_count=cnt)

@router.post("/traffic/repeated-port")
def simulate_repeated_port(req: Optional[RepeatedPortRequest] = None) -> Dict[str, Any]:
    """Generates repeated connections on a single port to verify false-positive prevention."""
    ip = req.source_ip if req and req.source_ip else "192.168.1.180"
    cnt = req.count if req and req.count else 25
    port = req.port if req and req.port else 443
    return simulation_service.generate_repeated_single_port(source_ip=ip, count=cnt, port=port)

@router.post("/pcap/generate-and-replay")
def replay_pcap(req: Optional[PcapReplayRequest] = None) -> Dict[str, Any]:
    """Generates a sample PCAP if not provided and replays it through the detection pipeline."""
    target_path = req.file_path if req and req.file_path else None
    try:
        if not target_path:
            temp_dir = tempfile.gettempdir()
            target_path = os.path.join(temp_dir, "portsentinel_sample_trace.pcap")
            simulation_service.create_sample_pcap(target_path)
        
        return simulation_service.replay_pcap(target_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

