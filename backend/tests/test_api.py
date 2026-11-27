import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.services.demo_service import seed_demo_data

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Ensure database is initialized and seeded before testing."""
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db=db, force=True)
    finally:
        db.close()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["phase"] == 3

def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["activeConnections"] >= 0
    assert data["scansDetected"] >= 0
    assert data["ipsBlocked"] >= 0
    assert data["systemStatus"] == "CONNECTED"

def test_list_monitored_ips():
    response = client.get("/api/ips")
    assert response.status_code == 200
    ips = response.json()
    assert len(ips) == 4
    scenario_ids = [ip["id"] for ip in ips]
    assert "stealth" in scenario_ids
    assert "fast" in scenario_ids
    assert "office" in scenario_ids
    assert "normal" in scenario_ids

def test_get_ip_detail():
    response = client.get("/api/ips/stealth")
    assert response.status_code == 200
    data = response.json()
    assert data["ip"] == "203.0.113.77"
    assert data["score"] == 84
    assert len(data["timelineData"]) == 6

def test_get_risk_history():
    response = client.get("/api/risk-history/stealth")
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 6
    assert history[0]["minute"] == 0
    assert history[-1]["minute"] == 60

def test_get_connection_logs():
    response = client.get("/api/logs?limit=10")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) <= 10

def test_record_new_event():
    payload = {
        "source_ip": "192.168.1.20",
        "destination_port": 80,
        "protocol": "TCP SYN",
        "verdict": "Test connection event"
    }
    response = client.post("/api/events", json=payload)
    assert response.status_code == 201
    event = response.json()
    assert event["srcIp"] == "192.168.1.20"
    assert event["dstPort"] == 80

def test_firewall_rules_and_quarantine_cycle():
    # 1. Get initial active rules
    response = client.get("/api/firewall/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 2

    # 2. Unblock the stealth scanner
    unblock_payload = {"ip": "203.0.113.77", "reason": "Operator test unblock"}
    unblock_resp = client.post("/api/firewall/unblock", json=unblock_payload)
    assert unblock_resp.status_code == 200

    # Verify status changed to Normal in SQLite
    ip_resp = client.get("/api/ips/stealth")
    assert ip_resp.status_code == 200
    assert ip_resp.json()["status"] == "Normal"

    # 3. Block it again
    block_payload = {"ip": "203.0.113.77", "reason": "Re-quarantine test"}
    block_resp = client.post("/api/firewall/block", json=block_payload)
    assert block_resp.status_code == 200
    assert block_resp.json()["status"] == "ACTIVE"

    # Verify status changed back to Blocked in SQLite
    ip_resp_after = client.get("/api/ips/stealth")
    assert ip_resp_after.status_code == 200
    assert ip_resp_after.json()["status"] == "Blocked"

def test_demo_reset():
    response = client.post("/api/demo/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

