from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    activeConnections: int
    scansDetected: int
    ipsBlocked: int
    avgResponse: str = "1.4 ms"
    slidingWindowMinutes: int = 60
    totalPackets: int
    systemStatus: str = "CONNECTED"
    demoMode: bool = True

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "PortSentinel API"
    version: str = "1.0.0"
    database: str = "connected"
    phase: int = 1
    demo_mode: bool = True
    timestamp: str

