import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.monitored_ip import MonitoredIP
from backend.app.models.connection_event import ConnectionEvent
from backend.app.models.risk_history import RiskHistory
from backend.app.models.firewall_rule import FirewallRule
from backend.app.schemas.telemetry import (
    MonitoredIPResponse,
    TimelinePoint,
    ConnectionEventResponse,
    ConnectionEventCreate
)
from backend.app.schemas.dashboard import DashboardStatsResponse
from backend.app.config import settings

PORT_NAMES: Dict[int, str] = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    135: "RPC",
    139: "NetBIOS",
    143: "IMAP",
    443: "HTTPS",
    445: "SMB",
    993: "IMAPS",
    1025: "NFS-RPC",
    1433: "MSSQL",
    1521: "Oracle",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    5900: "VNC",
    8080: "Alt-HTTP",
    8443: "Alt-HTTPS"
}

def get_port_service(port: int) -> str:
    return PORT_NAMES.get(port, "Unknown")

def get_dashboard_stats(db: Session) -> DashboardStatsResponse:
    total_connections = db.query(ConnectionEvent).count()
    active_ips = db.query(MonitoredIP).all()
    
    scans_detected = sum(
        1 for ip in active_ips if ip.current_status in ("Confirmed Scan", "Blocked")
    )
    ips_blocked = db.query(FirewallRule).filter(FirewallRule.rule_status == "ACTIVE").count()
    
    return DashboardStatsResponse(
        activeConnections=total_connections,
        scansDetected=scans_detected,
        ipsBlocked=ips_blocked,
        avgResponse="1.4 ms",
        slidingWindowMinutes=60,
        totalPackets=total_connections,
        systemStatus="CONNECTED",
        demoMode=settings.DEMO_MODE
    )

def format_monitored_ip(ip_row: MonitoredIP, db: Session) -> MonitoredIPResponse:
    # Query timeline data ordered by minute
    timeline_rows = (
        db.query(RiskHistory)
        .filter(RiskHistory.source_ip == ip_row.ip_address)
        .order_by(RiskHistory.minute.asc())
        .all()
    )
    
    timeline_points = [
        TimelinePoint(
            minute=pt.minute,
            score=pt.risk_score,
            status=pt.status,
            port=pt.port,
            service=pt.service,
            note=pt.reason
        )
        for pt in timeline_rows
    ]
    
    return MonitoredIPResponse(
        id=ip_row.id,
        ip=ip_row.ip_address,
        label=ip_row.label,
        type=ip_row.host_type,
        description=ip_row.description,
        score=ip_row.current_risk_score,
        status=ip_row.current_status,
        randomness=ip_row.port_diversity_score,
        timing=ip_row.timing_score,
        target=ip_row.target_score,
        lastSeen=ip_row.last_activity_at or datetime.utcnow().strftime("%H:%M:%S"),
        blockedAt=ip_row.blocked_at,
        blockReason=ip_row.block_reason,
        isAllowlisted=ip_row.is_allowlisted,
        portsProbed=ip_row.get_ports_list(),
        connectionAttempts=ip_row.connection_attempts or 1,
        timelineData=timeline_points
    )

def get_all_monitored_ips(db: Session) -> List[MonitoredIPResponse]:
    rows = db.query(MonitoredIP).all()
    return [format_monitored_ip(row, db) for row in rows]

def get_monitored_ip_by_identifier(db: Session, identifier: str) -> Optional[MonitoredIPResponse]:
    # Match either by scenario id ('stealth') or by IP string ('203.0.113.77')
    ip_row = db.query(MonitoredIP).filter(
        or_(MonitoredIP.id == identifier, MonitoredIP.ip_address == identifier)
    ).first()
    
    if not ip_row:
        return None
    return format_monitored_ip(ip_row, db)

def get_risk_history_for_ip(db: Session, identifier: str) -> List[TimelinePoint]:
    ip_row = db.query(MonitoredIP).filter(
        or_(MonitoredIP.id == identifier, MonitoredIP.ip_address == identifier)
    ).first()
    
    if not ip_row:
        return []
    
    timeline_rows = (
        db.query(RiskHistory)
        .filter(RiskHistory.source_ip == ip_row.ip_address)
        .order_by(RiskHistory.minute.asc())
        .all()
    )
    
    return [
        TimelinePoint(
            minute=pt.minute,
            score=pt.risk_score,
            status=pt.status,
            port=pt.port,
            service=pt.service,
            note=pt.reason
        )
        for pt in timeline_rows
    ]

def get_connection_logs(
    db: Session,
    ip: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[ConnectionEventResponse]:
    query = db.query(ConnectionEvent)
    
    if ip:
        query = query.filter(ConnectionEvent.source_ip == ip)
    
    if status and status.upper() != "ALL":
        status_map = {
            "BLOCKED": "Blocked",
            "CONFIRMED": "Confirmed Scan",
            "SUSPICIOUS": "Suspicious",
            "NORMAL": "Normal"
        }
        mapped_status = status_map.get(status.upper(), status)
        query = query.filter(ConnectionEvent.detection_status == mapped_status)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                ConnectionEvent.source_ip.like(search_filter),
                ConnectionEvent.protocol.like(search_filter),
                ConnectionEvent.verdict.like(search_filter)
            )
        )
    
    events = query.order_by(ConnectionEvent.id.desc()).offset(offset).limit(limit).all()
    
    return [
        ConnectionEventResponse(
            id=evt.event_id,
            time=evt.display_time,
            srcIp=evt.source_ip,
            dstPort=evt.destination_port,
            proto=evt.protocol,
            status=evt.detection_status,
            verdict=evt.verdict,
            isSimulated=evt.is_simulated
        )
        for evt in events
    ]

def record_connection_event(db: Session, event_in: ConnectionEventCreate) -> ConnectionEventResponse:
    display_time = datetime.utcnow().strftime("%H:%M:%S")
    event_id = f"evt-{int(datetime.utcnow().timestamp() * 1000)}"
    
    # Check if host exists in monitored IPs
    host = db.query(MonitoredIP).filter(MonitoredIP.ip_address == event_in.source_ip).first()
    detection_status = host.current_status if host else "Normal"
    
    verdict = event_in.verdict
    if not verdict:
        service = get_port_service(event_in.destination_port)
        verdict = f"Observed probe on port {event_in.destination_port} ({service})"
    
    new_event = ConnectionEvent(
        event_id=event_id,
        source_ip=event_in.source_ip,
        destination_port=event_in.destination_port,
        protocol=event_in.protocol or "TCP SYN",
        display_time=display_time,
        detection_status=detection_status,
        verdict=verdict,
        is_simulated=True
    )
    db.add(new_event)
    
    # Update host activity
    if host:
        host.last_activity_at = display_time
        host.connection_attempts += 1
        ports = host.get_ports_list()
        if event_in.destination_port not in ports:
            ports.append(event_in.destination_port)
            host.set_ports_list(ports)
    
    db.commit()
    db.refresh(new_event)
    
    return ConnectionEventResponse(
        id=new_event.event_id,
        time=new_event.display_time,
        srcIp=new_event.source_ip,
        dstPort=new_event.destination_port,
        proto=new_event.protocol,
        status=new_event.detection_status,
        verdict=new_event.verdict,
        isSimulated=new_event.is_simulated
    )

