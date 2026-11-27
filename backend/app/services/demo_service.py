import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.monitored_ip import MonitoredIP
from backend.app.models.connection_event import ConnectionEvent
from backend.app.models.risk_history import RiskHistory
from backend.app.models.firewall_rule import FirewallRule

# 4 Core Demonstration Scenarios
DEMO_SCENARIOS = [
    {
        "id": "stealth",
        "ip_address": "203.0.113.77",
        "label": "Slow / stealth scanner",
        "host_type": "External Host",
        "description": "Patient, periodic reconnaissance across sensitive administration ports. Clockwork ~12 min intervals designed to evade fixed rate-limits.",
        "current_status": "Blocked",
        "current_risk_score": 84,
        "port_diversity_score": 88,
        "timing_score": 94,
        "target_score": 82,
        "last_activity_at": "14:28:15",
        "blocked_at": "14:28:15 (Minute 60)",
        "block_reason": "Multi-factor risk threshold exceeded (84 >= 80). Robotic 12m cadence + sensitive port probing.",
        "is_allowlisted": False,
        "ports_probed": [22, 3389, 5900, 8080, 1025, 23],
        "connection_attempts": 6,
        "timeline_data": [
            {"minute": 0, "score": 6, "status": "Normal", "port": 22, "service": "SSH", "note": "Initial probe on Port 22"},
            {"minute": 12, "score": 21, "status": "Normal", "port": 3389, "service": "RDP", "note": "Second probe on Port 3389 — fixed delay"},
            {"minute": 24, "score": 38, "status": "Suspicious", "port": 5900, "service": "VNC", "note": "Crosses Suspicious threshold (30)"},
            {"minute": 36, "score": 52, "status": "Suspicious", "port": 8080, "service": "Alt-HTTP", "note": "Fourth distinct port probed"},
            {"minute": 48, "score": 66, "status": "Confirmed Scan", "port": 1025, "service": "NFS-RPC", "note": "Crosses Confirmed Scan threshold (60)"},
            {"minute": 60, "score": 84, "status": "Blocked", "port": 23, "service": "Telnet", "note": "Threshold 80 reached → Simulated auto-block"}
        ]
    },
    {
        "id": "fast",
        "ip_address": "10.0.0.45",
        "label": "Fast port scanner",
        "host_type": "Automated Script",
        "description": "Burst scanning tool (SYN sweep) probing 50 distinct ports within 10 seconds. Score spiked from 5 to 87 in under a minute.",
        "current_status": "Blocked",
        "current_risk_score": 87,
        "port_diversity_score": 96,
        "timing_score": 75,
        "target_score": 88,
        "last_activity_at": "14:12:05",
        "blocked_at": "14:12:05 (Minute 14)",
        "block_reason": "Burst port sweep (50 ports in 10s) and elevated sensitive target weighting.",
        "is_allowlisted": False,
        "ports_probed": [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 1521, 3306, 3389, 5432, 5900, 8080],
        "connection_attempts": 50,
        "timeline_data": [
            {"minute": 0, "score": 5, "status": "Normal", "port": None, "service": None, "note": "Idle baseline"},
            {"minute": 13, "score": 5, "status": "Normal", "port": None, "service": None, "note": "Pre-scan idle"},
            {"minute": 14, "score": 87, "status": "Blocked", "port": 3389, "service": "RDP", "note": "Rapid 50-port SYN burst → Instant simulated block"},
            {"minute": 20, "score": 87, "status": "Blocked", "port": None, "service": None, "note": "Firewall drop rule enforced"},
            {"minute": 40, "score": 87, "status": "Blocked", "port": None, "service": None, "note": "Packets dropped"},
            {"minute": 60, "score": 87, "status": "Blocked", "port": None, "service": None, "note": "Quarantine retained"}
        ]
    },
    {
        "id": "office",
        "ip_address": "172.16.4.9",
        "label": "Suspicious internal host",
        "host_type": "Internal Workstation",
        "description": "Internal host probing local web application ports. Risk score 52 is elevated and warrants investigation, but has not reached the threshold for blocking.",
        "current_status": "Suspicious",
        "current_risk_score": 52,
        "port_diversity_score": 58,
        "timing_score": 50,
        "target_score": 46,
        "last_activity_at": "14:26:40",
        "blocked_at": None,
        "block_reason": None,
        "is_allowlisted": False,
        "ports_probed": [80, 443, 8080, 8443],
        "connection_attempts": 4,
        "timeline_data": [
            {"minute": 0, "score": 10, "status": "Normal", "port": None, "service": None, "note": "Normal internal traffic"},
            {"minute": 15, "score": 24, "status": "Normal", "port": 80, "service": "HTTP", "note": "Standard port access"},
            {"minute": 30, "score": 38, "status": "Suspicious", "port": 8080, "service": "Alt-HTTP", "note": "Unusual port request — enters Suspicious tier"},
            {"minute": 45, "score": 48, "status": "Suspicious", "port": 8443, "service": "Alt-HTTPS", "note": "Additional service probed"},
            {"minute": 60, "score": 52, "status": "Suspicious", "port": 443, "service": "HTTPS", "note": "Elevated score 52 — awaiting operator review"}
        ]
    },
    {
        "id": "normal",
        "ip_address": "192.168.1.20",
        "label": "Normal user traffic",
        "host_type": "Corporate Workstation",
        "description": "Standard employee web browsing and SaaS connectivity. Bursty, natural human timing hitting ports 443 and 80 repeatedly.",
        "current_status": "Normal",
        "current_risk_score": 8,
        "port_diversity_score": 8,
        "timing_score": 12,
        "target_score": 5,
        "last_activity_at": "14:28:22",
        "blocked_at": None,
        "block_reason": None,
        "is_allowlisted": False,
        "ports_probed": [443, 80],
        "connection_attempts": 38,
        "timeline_data": [
            {"minute": 0, "score": 6, "status": "Normal", "port": 443, "service": "HTTPS", "note": "Benign web session"},
            {"minute": 15, "score": 9, "status": "Normal", "port": 80, "service": "HTTP", "note": "Benign web session"},
            {"minute": 30, "score": 7, "status": "Normal", "port": 443, "service": "HTTPS", "note": "Benign web session"},
            {"minute": 45, "score": 8, "status": "Normal", "port": 443, "service": "HTTPS", "note": "Benign web session"},
            {"minute": 60, "score": 8, "status": "Normal", "port": 80, "service": "HTTP", "note": "Stable harmless baseline"}
        ]
    }
]

INITIAL_FIREWALL_RULES = [
    {
        "rule_id": "PT-40912",
        "ip_address": "203.0.113.77",
        "chain": "INPUT",
        "target": "DROP",
        "protocol": "TCP",
        "block_reason": "Stealth Scan: Multi-factor risk score 84 exceeded threshold 80",
        "enforced_at": "14:28:15",
        "packets_dropped": 14,
        "rule_status": "ACTIVE",
        "is_simulated": True
    },
    {
        "rule_id": "PT-39801",
        "ip_address": "10.0.0.45",
        "chain": "INPUT",
        "target": "DROP",
        "protocol": "ALL",
        "block_reason": "Fast Scan: SYN burst across 50 ports in 10s",
        "enforced_at": "14:12:05",
        "packets_dropped": 342,
        "rule_status": "ACTIVE",
        "is_simulated": True
    }
]

INITIAL_EVENTS = [
    {"event_id": "pkt-01", "display_time": "14:28:15", "source_ip": "203.0.113.77", "destination_port": 23, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Auto-Blocked by simulated drop rule"},
    {"event_id": "pkt-02", "display_time": "14:28:14", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-03", "display_time": "14:28:10", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-04", "display_time": "14:27:55", "source_ip": "172.16.4.9", "destination_port": 8443, "protocol": "TCP SYN", "detection_status": "Suspicious", "verdict": "Unusual application service probe"},
    {"event_id": "pkt-05", "display_time": "14:27:40", "source_ip": "192.168.1.20", "destination_port": 80, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTP session"},
    {"event_id": "pkt-06", "display_time": "14:26:40", "source_ip": "172.16.4.9", "destination_port": 8080, "protocol": "TCP SYN", "detection_status": "Suspicious", "verdict": "Unusual application service probe"},
    {"event_id": "pkt-07", "display_time": "14:26:12", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-08", "display_time": "14:25:01", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-09", "display_time": "14:24:20", "source_ip": "172.16.4.9", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Suspicious", "verdict": "Internal subnet probe"},
    {"event_id": "pkt-10", "display_time": "14:23:45", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-11", "display_time": "14:22:15", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-12", "display_time": "14:21:03", "source_ip": "172.16.4.9", "destination_port": 80, "protocol": "TCP SYN", "detection_status": "Suspicious", "verdict": "Internal subnet probe"},
    {"event_id": "pkt-13", "display_time": "14:20:10", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-14", "display_time": "14:18:22", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-15", "display_time": "14:16:15", "source_ip": "203.0.113.77", "destination_port": 1025, "protocol": "TCP SYN", "detection_status": "Confirmed Scan", "verdict": "Stealth probe (12.1m interval)"},
    {"event_id": "pkt-16", "display_time": "14:15:40", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-17", "display_time": "14:14:12", "source_ip": "192.168.1.20", "destination_port": 80, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTP session"},
    {"event_id": "pkt-18", "display_time": "14:12:05", "source_ip": "10.0.0.45", "destination_port": 3389, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Burst SYN scan → Auto-blocked"},
    {"event_id": "pkt-19", "display_time": "14:12:04", "source_ip": "10.0.0.45", "destination_port": 1433, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Burst SYN scan"},
    {"event_id": "pkt-20", "display_time": "14:12:03", "source_ip": "10.0.0.45", "destination_port": 3306, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Burst SYN scan"},
    {"event_id": "pkt-21", "display_time": "14:12:02", "source_ip": "10.0.0.45", "destination_port": 1521, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Burst SYN scan"},
    {"event_id": "pkt-22", "display_time": "14:12:01", "source_ip": "10.0.0.45", "destination_port": 5432, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Burst SYN scan"},
    {"event_id": "pkt-23", "display_time": "14:12:00", "source_ip": "10.0.0.45", "destination_port": 22, "protocol": "TCP SYN", "detection_status": "Blocked", "verdict": "Burst SYN scan"},
    {"event_id": "pkt-24", "display_time": "14:11:45", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-25", "display_time": "14:10:12", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-26", "display_time": "14:08:44", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-27", "display_time": "14:06:20", "source_ip": "172.16.4.9", "destination_port": 8080, "protocol": "TCP SYN", "detection_status": "Suspicious", "verdict": "Internal service probe"},
    {"event_id": "pkt-28", "display_time": "14:04:12", "source_ip": "203.0.113.77", "destination_port": 8080, "protocol": "TCP SYN", "detection_status": "Suspicious", "verdict": "Stealth probe (12.0m interval)"},
    {"event_id": "pkt-29", "display_time": "14:03:50", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP ACK", "detection_status": "Normal", "verdict": "Benign HTTPS session"},
    {"event_id": "pkt-30", "display_time": "14:01:10", "source_ip": "192.168.1.20", "destination_port": 443, "protocol": "TCP SYN", "detection_status": "Normal", "verdict": "Benign HTTPS session"}
]

def seed_demo_data(db: Session, force: bool = False):
    """
    Populates SQLite database with the 4 demonstration scenarios,
    historical risk progressions, initial connection logs, and simulated firewall rules.
    """
    existing_count = db.query(MonitoredIP).count()
    if existing_count > 0 and not force:
        return # Database already seeded

    if force:
        # Clear existing tables cleanly
        db.query(FirewallRule).delete()
        db.query(RiskHistory).delete()
        db.query(ConnectionEvent).delete()
        db.query(MonitoredIP).delete()
        db.commit()

    # 1. Insert Monitored IPs & Timeline Data
    for scenario in DEMO_SCENARIOS:
        ip_row = MonitoredIP(
            id=scenario["id"],
            ip_address=scenario["ip_address"],
            label=scenario["label"],
            host_type=scenario["host_type"],
            description=scenario["description"],
            current_status=scenario["current_status"],
            current_risk_score=scenario["current_risk_score"],
            port_diversity_score=scenario["port_diversity_score"],
            timing_score=scenario["timing_score"],
            target_score=scenario["target_score"],
            last_activity_at=scenario["last_activity_at"],
            blocked_at=scenario["blocked_at"],
            block_reason=scenario["block_reason"],
            is_allowlisted=scenario["is_allowlisted"],
            ports_probed=json.dumps(scenario["ports_probed"]),
            connection_attempts=scenario["connection_attempts"],
            scenario_id=scenario["id"]
        )
        db.add(ip_row)

        for pt in scenario["timeline_data"]:
            risk_point = RiskHistory(
                source_ip=scenario["ip_address"],
                minute=pt["minute"],
                risk_score=pt["score"],
                status=pt["status"],
                port=pt.get("port"),
                service=pt.get("service"),
                reason=pt["note"]
            )
            db.add(risk_point)

    # 2. Insert Firewall Rules (explicitly simulated)
    for rule in INITIAL_FIREWALL_RULES:
        fw_row = FirewallRule(
            rule_id=rule["rule_id"],
            ip_address=rule["ip_address"],
            chain=rule["chain"],
            target=rule["target"],
            protocol=rule["protocol"],
            block_reason=rule["block_reason"],
            enforced_at=rule["enforced_at"],
            packets_dropped=rule["packets_dropped"],
            rule_status=rule["rule_status"],
            is_simulated=True
        )
        db.add(fw_row)

    # 3. Insert Connection Events
    for evt in INITIAL_EVENTS:
        conn_row = ConnectionEvent(
            event_id=evt["event_id"],
            source_ip=evt["source_ip"],
            destination_port=evt["destination_port"],
            protocol=evt["protocol"],
            display_time=evt["display_time"],
            detection_status=evt["detection_status"],
            verdict=evt["verdict"],
            is_simulated=True
        )
        db.add(conn_row)

    db.commit()

