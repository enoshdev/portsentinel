from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class RiskHistory(Base):
    """
    Risk History database model tracking temporal progression of suspicious activity scores
    across sliding observation windows.
    """
    __tablename__ = "risk_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_ip = Column(String(45), ForeignKey("monitored_ips.ip_address"), nullable=False, index=True)
    minute = Column(Integer, nullable=False) # Timeline minute (e.g. 0, 12, 24, 36, 48, 60)
    risk_score = Column(Integer, nullable=False) # 0 to 100
    status = Column(String(30), nullable=False, default="Normal") # 'Normal', 'Suspicious', 'Confirmed Scan', 'Blocked'
    port = Column(Integer, nullable=True) # Destination port probed at this checkpoint, if any
    service = Column(String(50), nullable=True) # Service name (e.g. "SSH", "RDP")
    reason = Column(Text, nullable=False) # Plain-English explanation of why the score shifted
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to host
    monitored_host = relationship("MonitoredIP", back_populates="risk_history")

