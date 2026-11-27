import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.models.firewall_rule import FirewallRule
from backend.app.services.windows_firewall import WindowsFirewallManager
from backend.app.services.firewall_service import firewall_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    db = SessionLocal()
    try:
        # Clear temporary test rules
        db.query(FirewallRule).filter(FirewallRule.ip_address.like("198.51.100.%")).delete()
        db.commit()
    finally:
        db.close()

def test_ip_validation():
    wf = WindowsFirewallManager()
    assert wf.validate_ip("192.168.1.1") == "192.168.1.1"
    assert wf.validate_ip(" 10.0.0.1 ") == "10.0.0.1"
    assert wf.validate_ip("2001:db8::1") == "2001:db8::1"

    with pytest.raises(ValueError):
        wf.validate_ip("not-an-ip")

    with pytest.raises(ValueError):
        wf.validate_ip("999.999.999.999")

def test_protected_ips():
    wf = WindowsFirewallManager()
    # Loopback
    is_prot, _ = wf.is_protected_ip("127.0.0.1")
    assert is_prot is True

    is_prot, _ = wf.is_protected_ip("::1")
    assert is_prot is True

    # Allowlist addition & protection
    wf.add_to_allowlist("192.168.1.99")
    is_prot, _ = wf.is_protected_ip("192.168.1.99")
    assert is_prot is True

    # Host adapter match
    is_prot, _ = wf.is_protected_ip("10.222.62.15", host_ips=["10.222.62.15"])
    assert is_prot is True

    # External IP
    is_prot, _ = wf.is_protected_ip("198.51.100.5")
    assert is_prot is False

def test_mock_command_runner_add_and_verify():
    """Verify WindowsFirewallManager command generation and OS verification with mock runner."""
    state = {}

    def mock_runner(cmd, timeout=5):
        cmd_str = " ".join(cmd)
        if "show rule" in cmd_str:
            rule_name = [part.split("=")[1] for part in cmd if part.startswith("name=")][0]
            if rule_name in state:
                return 0, f"Rule Name: {rule_name}\nEnabled: Yes\nDirection: In\nAction: Block\n", ""
            return 1, "No rules match the specified criteria.", ""
        elif "add rule" in cmd_str:
            rule_name = [part.split("=")[1] for part in cmd if part.startswith("name=")][0]
            state[rule_name] = True
            return 0, "Ok.", ""
        elif "delete rule" in cmd_str:
            rule_name = [part.split("=")[1] for part in cmd if part.startswith("name=")][0]
            state.pop(rule_name, None)
            return 0, "Deleted 1 rule(s).\nOk.", ""
        return 0, "", ""

    wf = WindowsFirewallManager(command_runner=mock_runner)
    test_ip = "198.51.100.77"
    
    # 1. Add rule
    success, rule_name, msg, _ = wf.add_inbound_block_rule(test_ip)
    assert success is True
    assert rule_name == f"PortSentinel_BLOCK_{test_ip}"
    assert rule_name in state

    # 2. Show rule
    exists, props, _ = wf.show_rule(rule_name)
    assert exists is True
    assert props["name"] == rule_name

    # 3. Delete rule
    del_success, del_msg, _ = wf.delete_inbound_block_rule(rule_name)
    assert del_success is True
    assert rule_name not in state

    # 4. Confirm deletion
    still_exists, _, _ = wf.show_rule(rule_name)
    assert still_exists is False

def test_firewall_status_api():
    resp = client.get("/api/firewall/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "is_admin" in data
    assert "auto_block_enabled" in data
    assert "dry_run" in data
    assert "protected_ips" in data

def test_dry_run_block_and_unblock_cycle():
    """Verify that in dry-run mode, firewall rules are tracked in SQLite without error."""
    # Ensure dry-run is on
    client.post("/api/firewall/dry-run", json={"enabled": True})
    
    test_ip = "198.51.100.42"
    block_resp = client.post("/api/firewall/block", json={"ip": test_ip, "reason": "Test dry-run block"})
    assert block_resp.status_code == 200
    rule = block_resp.json()
    assert rule["ip"] == test_ip
    assert rule["status"] == "ACTIVE"
    assert rule["isSimulated"] is True
    assert "PortSentinel_BLOCK_" in rule["ruleName"]

    # History contains rule
    hist_resp = client.get("/api/firewall/history")
    assert hist_resp.status_code == 200
    hist = hist_resp.json()
    assert any(r["ip"] == test_ip for r in hist)

    # Unblock
    unblock_resp = client.post("/api/firewall/unblock", json={"ip": test_ip})
    assert unblock_resp.status_code == 200
    assert unblock_resp.json()["success"] is True

def test_protected_ip_block_rejection():
    # Attempting to block loopback must return 400
    resp = client.post("/api/firewall/block", json={"ip": "127.0.0.1"})
    assert resp.status_code == 400
    assert "protected" in resp.json()["detail"].lower()

def test_auto_block_configuration_toggle():
    resp = client.post("/api/firewall/auto-block", json={"enabled": True, "threshold": 75})
    assert resp.status_code == 200
    data = resp.json()
    assert data["auto_block_enabled"] is True
    assert data["auto_block_threshold"] == 75

    # Toggle back to False
    resp_off = client.post("/api/firewall/auto-block", json={"enabled": False})
    assert resp_off.status_code == 200
    assert resp_off.json()["auto_block_enabled"] is False

def test_allowlist_endpoints():
    add_resp = client.post("/api/firewall/allowlist/add", json={"ip": "198.51.100.100"})
    assert add_resp.status_code == 200

    list_resp = client.get("/api/firewall/allowlist")
    assert list_resp.status_code == 200
    assert "198.51.100.100" in list_resp.json()["protected_ips"]

    rem_resp = client.post("/api/firewall/allowlist/remove", json={"ip": "198.51.100.100"})
    assert rem_resp.status_code == 200
