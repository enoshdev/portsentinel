import os
import tempfile
import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.models.monitored_ip import MonitoredIP
from backend.app.models.connection_event import ConnectionEvent
from backend.app.services.detection_engine import detection_engine
from backend.app.services.event_processor import event_processor
from backend.app.services.simulation_service import simulation_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_database():
    """Ensure DB schema is initialized and clean prior to detection tests."""
    init_db()
    db = SessionLocal()
    try:
        # Clear dynamic test IPs if present
        db.query(ConnectionEvent).filter(ConnectionEvent.source_ip.like("10.0.%")).delete()
        db.query(ConnectionEvent).filter(ConnectionEvent.source_ip.like("192.168.99.%")).delete()
        db.query(ConnectionEvent).filter(ConnectionEvent.source_ip.like("203.0.113.%")).delete()
        db.query(MonitoredIP).filter(MonitoredIP.ip_address.like("10.0.%")).delete()
        db.query(MonitoredIP).filter(MonitoredIP.ip_address.like("192.168.99.%")).delete()
        db.query(MonitoredIP).filter(MonitoredIP.ip_address.like("203.0.113.%")).delete()
        db.commit()
    finally:
        db.close()

def test_fast_scan_detection_algorithm():
    """Verify detection engine identifies rapid burst sweeps across distinct ports."""
    src_ip = "10.0.0.77"
    now = time.time()
    ports = [21, 22, 23, 25, 80, 110, 139, 443, 445, 1433, 3306, 3389]
    
    events = []
    for i, port in enumerate(ports):
        events.append({
            "dst_port": port,
            "timestamp": now - (len(ports) - i) * 0.3,
            "tcp_flags": "SYN"
        })
    
    analysis = detection_engine.evaluate_ip_behavior(src_ip, events)
    assert analysis["distinct_ports"] == 12
    assert analysis["port_diversity_score"] >= 70
    assert analysis["timing_score"] >= 70
    assert analysis["composite_score"] >= 75
    assert analysis["status"] in ("Confirmed Scan", "Blocked")
    assert "Fast" in analysis["primary_reason"] and "sweep" in analysis["primary_reason"]

def test_slow_scan_clockwork_interval_detection():
    """Verify stealth detection identifies fixed clockwork intervals with low jitter across long windows."""
    src_ip = "203.0.113.88"
    now = time.time()
    sensitive_ports = [22, 3389, 5900, 8080, 1025, 23]
    interval = 600 # 10 minute intervals
    
    events = []
    for i, port in enumerate(sensitive_ports):
        # Extremely consistent machine-paced intervals (low CV)
        events.append({
            "dst_port": port,
            "timestamp": (now - 3600) + (i * interval) + 0.1,
            "tcp_flags": "SYN"
        })
    
    analysis = detection_engine.evaluate_ip_behavior(src_ip, events)
    assert analysis["distinct_ports"] == 6
    assert analysis["timing_score"] >= 70
    assert analysis["composite_score"] >= 70
    assert analysis["status"] in ("Confirmed Scan", "Suspicious")
    assert "Stealth" in analysis["primary_reason"] or "probes" in analysis["primary_reason"]

def test_single_port_repetition_not_flagged_as_scan():
    """Verify multiple connection attempts on a single port (retries / streaming) do not trigger false positives."""
    src_ip = "192.168.99.50"
    now = time.time()
    
    events = []
    for i in range(30):
        events.append({
            "dst_port": 443,
            "timestamp": now - 30 + i,
            "tcp_flags": "SYN"
        })
    
    analysis = detection_engine.evaluate_ip_behavior(src_ip, events)
    assert analysis["distinct_ports"] == 1
    assert analysis["repeated_attempts"] >= 25
    assert analysis["port_diversity_score"] <= 15
    # Composite score should remain low (Normal / Benign)
    assert analysis["composite_score"] < 40
    assert analysis["status"] == "Normal"
    assert "single-port" in analysis["primary_reason"].lower() or "service traffic" in analysis["primary_reason"].lower() or "benign" in analysis["primary_reason"].lower()

def test_event_processor_and_db_persistence():
    """Verify event processor persists connection event and creates/updates MonitoredIP record."""
    src_ip = "10.0.0.12"
    result = event_processor.process_event(
        source_ip=src_ip,
        destination_port=22,
        destination_ip="192.168.1.1",
        protocol="TCP",
        tcp_flags="SYN",
        timestamp=time.time(),
        event_origin="live"
    )
    assert result["source_ip"] == src_ip
    assert result["score"] >= 0
    
    # Query database to confirm persistence
    db = SessionLocal()
    try:
        monitored = db.query(MonitoredIP).filter(MonitoredIP.ip_address == src_ip).first()
        assert monitored is not None
        assert monitored.connection_attempts >= 1
        assert monitored.unique_ports_count >= 1
        
        events = db.query(ConnectionEvent).filter(ConnectionEvent.source_ip == src_ip).all()
        assert len(events) >= 1
        assert events[0].destination_port == 22
        assert events[0].tcp_flags == "SYN"
    finally:
        db.close()

def test_pcap_generation_and_replay():
    """Verify PCAP creation on disk and replay through the pipeline."""
    temp_dir = tempfile.gettempdir()
    pcap_path = os.path.join(temp_dir, "test_trace.pcap")
    
    generated_file = simulation_service.create_sample_pcap(pcap_path)
    assert os.path.exists(generated_file)
    
    replay_summary = simulation_service.replay_pcap(generated_file)
    assert replay_summary["packets_in_file"] > 0
    assert replay_summary["events_processed"] > 0
    assert replay_summary["origin"] == "pcap_replay"
    
    # Clean up test pcap
    if os.path.exists(pcap_path):
        os.remove(pcap_path)

def test_monitoring_routes():
    """Verify monitoring control endpoints via FastAPI TestClient."""
    # Status endpoint
    resp = client.get("/api/monitoring/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "state" in data
    assert "npcap_available" in data
    
    # Interfaces endpoint
    resp_if = client.get("/api/monitoring/interfaces")
    assert resp_if.status_code == 200
    assert isinstance(resp_if.json(), list)

def test_simulation_endpoints():
    """Verify traffic simulation API endpoints."""
    # Fast scan simulation
    resp_fast = client.post("/api/test/traffic/fast-scan", json={"source_ip": "10.0.0.44", "port_count": 15})
    assert resp_fast.status_code == 200
    data_fast = resp_fast.json()
    assert data_fast["type"] == "FAST_SCAN"
    assert data_fast["final_score"] >= 75

    # Repeated port simulation
    resp_rep = client.post("/api/test/traffic/repeated-port", json={"source_ip": "192.168.99.77", "count": 15, "port": 80})
    assert resp_rep.status_code == 200
    data_rep = resp_rep.json()
    assert data_rep["is_repeated_single_port"] is True
    assert data_rep["final_status"] == "Normal"
