from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class FirewallRule(Base):
    """
    Firewall Record model tracking simulated or enforced quarantine rules.
    In Phase 1, all records are explicitly marked is_simulated=True.
    """
    __tablename__ = "firewall_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "PT-40912"
    rule_name = Column(String(100), nullable=True, index=True) # e.g. "PortSentinel_BLOCK_203.0.113.77"
    ip_address = Column(String(45), ForeignKey("monitored_ips.ip_address"), nullable=False, index=True)
    chain = Column(String(20), nullable=False, default="INPUT")
    target = Column(String(20), nullable=False, default="DROP")
    protocol = Column(String(20), nullable=False, default="TCP")
    rule_status = Column(String(20), nullable=False, default="ACTIVE") # "ACTIVE", "REMOVED", "DRY_RUN"
    block_reason = Column(Text, nullable=False) # Plain-English justification for the quarantine
    enforced_at = Column(String(50), nullable=False) # e.g. "14:28:15"
    packets_dropped = Column(Integer, nullable=False, default=0)
    is_simulated = Column(Boolean, nullable=False, default=True) # Explicitly distinguishes demonstration rules
    is_automatic = Column(Boolean, nullable=False, default=False) # Differentiates automatic vs manual blocks
    verification_status = Column(String(30), nullable=False, default="SIMULATED") # "VERIFIED", "UNVERIFIED", "FAILED", "SIMULATED"
    execution_output = Column(Text, nullable=True) # Output from netsh / PowerShell command
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to host
    monitored_host = relationship("MonitoredIP", back_populates="firewall_rules")

