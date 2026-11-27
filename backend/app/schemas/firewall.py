from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class FirewallRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str # Rule ID e.g. "PT-40912"
    ruleName: Optional[str] = None
    ip: str
    chain: str = "INPUT"
    target: str = "DROP"
    protocol: str = "TCP"
    reason: str
    enforcedAt: str
    packetsDropped: int = 0
    status: str = "ACTIVE" # "ACTIVE", "REMOVED", "DRY_RUN"
    isSimulated: bool = False
    isAutomatic: bool = False
    verificationStatus: str = "VERIFIED" # "VERIFIED", "UNVERIFIED", "FAILED", "SIMULATED"
    executionOutput: Optional[str] = None

class BlockRequest(BaseModel):
    ip: str
    reason: Optional[str] = "Manual quarantine block requested by operator"
    dry_run: Optional[bool] = None

class UnblockRequest(BaseModel):
    ip: str
    reason: Optional[str] = "Quarantine reversed by operator during review"
    dry_run: Optional[bool] = None

class FirewallStatusResponse(BaseModel):
    status: str # "ONLINE", "DEGRADED", "ELEVATION_REQUIRED"
    is_admin: bool
    dry_run: bool
    auto_block_enabled: bool
    auto_block_threshold: int
    active_rules_count: int
    total_rules_count: int
    os_platform: str
    backend_type: str
    protected_ips: List[str]
    message: str

class AutoBlockConfigRequest(BaseModel):
    enabled: bool
    threshold: Optional[int] = 80

class DryRunConfigRequest(BaseModel):
    enabled: bool

class AllowlistRequest(BaseModel):
    ip: str
    reason: Optional[str] = "Operator added to allowlist"
