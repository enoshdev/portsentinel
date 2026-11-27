import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Dict, Optional, Any
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models.monitored_ip import MonitoredIP
from backend.app.models.connection_event import ConnectionEvent
from backend.app.models.risk_history import RiskHistory
from backend.app.services.detection_engine import engine_instance, PORT_CRITICALITY
from backend.app.services.websocket_manager import ws_manager
from backend.app.services.firewall_service import firewall_service

PORT_NAMES: Dict[int, str] = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 135: "RPC", 139: "NetBIOS", 143: "IMAP",
    443: "HTTPS", 445: "SMB", 993: "IMAPS", 1025: "NFS-RPC",
    1433: "MSSQL", 1521: "Oracle", 3306: "MySQL", 3389: "RDP",
    5432: "PostgreSQL", 5900: "VNC", 8080: "Alt-HTTP", 8443: "Alt-HTTPS"
}

def get_service_name(port: int) -> str:
    return PORT_NAMES.get(port, f"Port {port}")

class EventProcessor:
    """
    Normalizes, deduplicates, and routes network connection events through the
    Intelligent Detection Engine, evaluates auto-mitigation policies, and persists results in SQLite.
    """

    def __init__(self):
        # Flow deduplication cache: (src_ip, dst_port) -> last_seen_timestamp
        self._flow_cache: Dict[str, float] = {}
        # Cooldown window in seconds for deduplicating identical connection retries
        self._flow_cooldown = 0.75

    def process_event(
        self,
        source_ip: str,
        destination_port: int,
        destination_ip: str = "127.0.0.1",
        protocol: str = "TCP",
        tcp_flags: str = "SYN",
        timestamp: Optional[float] = None,
        event_origin: str = "live",
        db: Optional[Session] = None,
        device_label: Optional[str] = None
    ) -> Dict[str, Any]:
        """Processes a single connection event and evaluates automated mitigation."""
        now_ts = timestamp if timestamp is not None else time.time()
        service = get_service_name(destination_port)

        # 1. Flow Deduplication Check
        flow_key = f"{source_ip}:{destination_port}"
        last_seen = self._flow_cache.get(flow_key, 0.0)
        is_duplicate = (now_ts - last_seen) < self._flow_cooldown
        self._flow_cache[flow_key] = now_ts

        # 2. Feed into Detection Engine sliding window
        if not is_duplicate:
            engine_instance.record_attempt(
                ip=source_ip,
                port=destination_port,
                timestamp=now_ts,
                protocol=protocol,
                tcp_flags=tcp_flags
            )

        # 3. Behavioral Evaluation
        evaluation = engine_instance.evaluate_host(source_ip, reference_time=now_ts)

        # 4. Persistence in SQLite
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            event_id = f"evt-{int(now_ts * 1000)}-{destination_port}"
            display_time = datetime.fromtimestamp(now_ts, tz=timezone.utc).strftime("%H:%M:%S")

            if is_duplicate:
                verdict = f"Subsequent packet in active flow to port {destination_port} ({service})"
            elif evaluation["is_fast_scan"]:
                verdict = f"Fast scan burst: Contacted port {destination_port} ({service}) in rapid sequence"
            elif evaluation["is_slow_scan"]:
                verdict = f"Stealth probe: Spaced attempt targeting port {destination_port} ({service})"
            elif evaluation["is_repeated_single_port"]:
                verdict = f"Repeated connection attempt to expected service {destination_port} ({service})"
            elif evaluation["score"] >= 60:
                verdict = f"Scan probe: Contacted sensitive port {destination_port} ({service})"
            elif evaluation["score"] >= 30:
                verdict = f"Suspicious activity: Connection attempt on port {destination_port} ({service})"
            else:
                verdict = f"Normal connection attempt to port {destination_port} ({service})"

            # Insert ConnectionEvent
            event_row = ConnectionEvent(
                event_id=event_id,
                source_ip=source_ip,
                destination_ip=destination_ip,
                destination_port=destination_port,
                protocol=f"{protocol} {tcp_flags}".strip(),
                tcp_flags=tcp_flags,
                timestamp=datetime.fromtimestamp(now_ts, tz=timezone.utc),
                display_time=display_time,
                event_type="CONNECTION_ATTEMPT",
                detection_status=evaluation["status"],
                verdict=verdict,
                is_simulated=(event_origin == "demonstration"),
                event_origin=event_origin
            )
            db.add(event_row)

            # Retrieve or create MonitoredIP
            host = db.query(MonitoredIP).filter(MonitoredIP.ip_address == source_ip).first()
            if not host:
                host_id = f"host-{source_ip.replace('.', '-').replace(':', '-')}"
                host = MonitoredIP(
                    id=host_id,
                    ip_address=source_ip,
                    label=device_label or ("Live Monitored Endpoint" if event_origin == "live" else f"Replay Endpoint ({source_ip})"),
                    host_type=device_label if device_label else "Discovered Host",
                    description=evaluation["reason"],
                    current_status=evaluation["status"],
                    current_risk_score=evaluation["score"],
                    port_diversity_score=evaluation["randomness"],
                    timing_score=evaluation["timing"],
                    target_score=evaluation["target"],
                    unique_ports_count=evaluation["unique_ports_count"],
                    repeated_attempts_count=evaluation["repeated_attempts_count"],
                    ports_probed=json.dumps(evaluation["ports_probed"]),
                    connection_attempts=1,
                    first_detected_at=datetime.fromtimestamp(now_ts, tz=timezone.utc),
                    last_activity_at=display_time,
                    event_origin=event_origin
                )
                db.add(host)
            else:
                if device_label:
                    host.label = device_label
                    host.host_type = device_label
                host.description = evaluation["reason"]
                host.current_status = evaluation["status"]
                host.current_risk_score = evaluation["score"]
                host.port_diversity_score = evaluation["randomness"]
                host.timing_score = evaluation["timing"]
                host.target_score = evaluation["target"]
                host.unique_ports_count = evaluation["unique_ports_count"]
                host.repeated_attempts_count = evaluation["repeated_attempts_count"]
                host.set_ports_list(evaluation["ports_probed"])
                host.connection_attempts += 1
                host.last_activity_at = display_time
                if event_origin != "demonstration":
                    host.event_origin = event_origin

            # Record timeline checkpoint in RiskHistory if score changed noticeably
            last_checkpoint = (
                db.query(RiskHistory)
                .filter(RiskHistory.source_ip == source_ip)
                .order_by(RiskHistory.id.desc())
                .first()
            )
            if not last_checkpoint or abs(last_checkpoint.risk_score - evaluation["score"]) >= 4 or last_checkpoint.status != evaluation["status"]:
                checkpoint_minute = min(60, int((now_ts % 3600) / 60))
                risk_pt = RiskHistory(
                    source_ip=source_ip,
                    minute=checkpoint_minute,
                    risk_score=evaluation["score"],
                    status=evaluation["status"],
                    port=destination_port,
                    service=service,
                    reason=evaluation["reason"]
                )
                db.add(risk_pt)

            db.commit()

            # 5. Phase 3: Automated Mitigation Evaluation
            auto_block_rule = None
            try:
                auto_block_rule = firewall_service.evaluate_and_auto_block(
                    db=db,
                    source_ip=source_ip,
                    risk_score=evaluation["score"],
                    detection_status=evaluation["status"],
                    reason=evaluation["reason"],
                    total_attempts=host.connection_attempts
                )
            except Exception:
                pass

            event_summary = {
                "event_id": event_id,
                "time": display_time,
                "source_ip": source_ip,
                "label": host.label,
                "destination_port": destination_port,
                "ports_probed": host.get_ports_list(),
                "connection_attempts": host.connection_attempts,
                "protocol": f"{protocol} {tcp_flags}".strip(),
                "status": host.current_status,
                "verdict": verdict,
                "score": host.current_risk_score,
                "signals": {
                    "diversity": evaluation["randomness"],
                    "timing": evaluation["timing"],
                    "target": evaluation["target"],
                    "unique_ports": evaluation["unique_ports_count"],
                    "repeated_attempts": evaluation["repeated_attempts_count"]
                },
                "auto_blocked": auto_block_rule is not None,
                "origin": event_origin
            }

            # Broadcast to WebSocket clients
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(ws_manager.broadcast({
                        "type": "NEW_EVENT",
                        "data": event_summary
                    }))
                    if auto_block_rule:
                        asyncio.create_task(ws_manager.broadcast({
                            "type": "FIREWALL_ACTION",
                            "action": "AUTO_BLOCK",
                            "rule": auto_block_rule.model_dump()
                        }))
            except Exception:
                pass

            return event_summary

        finally:
            if should_close_db:
                db.close()

# Global singleton processor
event_processor = EventProcessor()
