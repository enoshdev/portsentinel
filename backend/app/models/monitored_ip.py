import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MonitoredIP(Base):
    """
    Monitored IP database model representing an observed host endpoint.
    Maintains current risk posture, behavioral signals, and connection statistics.
    """
    __tablename__ = "monitored_ips"

    id = Column(String(50), primary_key=True, index=True) # e.g. 'stealth', 'fast', 'office', 'normal'
    ip_address = Column(String(45), unique=True, index=True, nullable=False) # IPv4 or IPv6
    label = Column(String(100), nullable=False) # e.g. "Slow / stealth scanner"
    host_type = Column(String(100), nullable=False, default="External Host") # e.g. "External Host", "Workstation"
    description = Column(Text, nullable=False)
    
    # Risk & Status
    current_status = Column(String(30), nullable=False, default="Normal") # 'Normal', 'Suspicious', 'Confirmed Scan', 'Blocked'
    current_risk_score = Column(Integer, nullable=False, default=0) # 0 to 100
    
    # 3 Behavioral Signals (0 to 100)
    port_diversity_score = Column(Integer, nullable=False, default=0) # Number of distinct ports contacted
    timing_score = Column(Integer, nullable=False, default=0)         # Inter-probe delay cadence
    target_score = Column(Integer, nullable=False, default=0)         # High-value admin ports weighting
    
    # Granular Port Breakdown (Distinguishing diversity vs repetition)
    unique_ports_count = Column(Integer, nullable=False, default=0)
    repeated_attempts_count = Column(Integer, nullable=False, default=0)
    
    # Telemetry details
    ports_probed = Column(Text, nullable=False, default="[]") # JSON list of port integers
    connection_attempts = Column(Integer, nullable=False, default=0)
    first_detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_activity_at = Column(String(30), default="") # e.g. "14:28:15"
    blocked_at = Column(String(50), nullable=True)
    block_reason = Column(Text, nullable=True)
    is_allowlisted = Column(Boolean, default=False)
    scenario_id = Column(String(50), nullable=True) # Links to demo scenario if applicable
    event_origin = Column(String(30), nullable=False, default="demonstration") # 'live', 'pcap_replay', 'demonstration'

    # Relationships
    connection_events = relationship("ConnectionEvent", back_populates="monitored_host", cascade="all, delete-orphan")
    risk_history = relationship("RiskHistory", back_populates="monitored_host", cascade="all, delete-orphan")
    firewall_rules = relationship("FirewallRule", back_populates="monitored_host", cascade="all, delete-orphan")

    def get_ports_list(self):
        try:
            return json.loads(self.ports_probed)
        except Exception:
            return []

    def set_ports_list(self, ports):
        self.ports_probed = json.dumps(ports)
        self.unique_ports_count = len(set(ports))
