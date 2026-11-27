from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ConnectionEvent(Base):
    """
    Connection Event database model recording individual connection attempts
    and packet observation verdicts.
    """
    __tablename__ = "connection_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "pkt-01"
    source_ip = Column(String(45), ForeignKey("monitored_ips.ip_address"), nullable=False, index=True)
    destination_ip = Column(String(45), nullable=False, default="127.0.0.1")
    destination_port = Column(Integer, nullable=False)
    protocol = Column(String(20), nullable=False, default="TCP SYN")
    tcp_flags = Column(String(20), nullable=False, default="") # e.g. "SYN", "ACK", "SYN-ACK", "RST"
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    display_time = Column(String(30), nullable=False) # e.g. "14:28:15"
    event_type = Column(String(50), nullable=False, default="CONNECTION_ATTEMPT")
    detection_status = Column(String(30), nullable=False, default="Normal") # 'Normal', 'Suspicious', 'Confirmed Scan', 'Blocked'
    verdict = Column(Text, nullable=False) # Plain-English explanation of the observation
    is_simulated = Column(Boolean, nullable=False, default=True) # Explicitly labels demonstration events
    event_origin = Column(String(30), nullable=False, default="demonstration") # 'live', 'pcap_replay', 'demonstration'

    # Relationship to host
    monitored_host = relationship("MonitoredIP", back_populates="connection_events")
