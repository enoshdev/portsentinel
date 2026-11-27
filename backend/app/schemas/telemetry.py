from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class TimelinePoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    minute: int
    score: int
    status: str
    port: Optional[int] = None
    service: Optional[str] = None
    note: str

class MonitoredIPResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ip: str
    label: str
    type: str
    description: str
    score: int
    status: str
    randomness: int = Field(description="Port Diversity: number of distinct ports probed (0-100)")
    timing: int = Field(description="Timing Pattern: robotic/periodic pacing score (0-100)")
    target: int = Field(description="Target Criticality: sensitive port weighting score (0-100)")
    lastSeen: str
    blockedAt: Optional[str] = None
    blockReason: Optional[str] = None
    isAllowlisted: bool = False
    portsProbed: List[int] = []
    timelineData: List[TimelinePoint] = []

class ConnectionEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    time: str
    srcIp: str
    dstPort: int
    proto: str
    status: str
    verdict: str
    isSimulated: bool = True

class ConnectionEventCreate(BaseModel):
    source_ip: str
    destination_port: int
    protocol: Optional[str] = "TCP SYN"
    verdict: Optional[str] = None
