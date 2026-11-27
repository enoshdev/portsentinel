from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.firewall import (
    FirewallRuleResponse,
    FirewallStatusResponse,
    BlockRequest,
    UnblockRequest,
    AutoBlockConfigRequest,
    DryRunConfigRequest,
    AllowlistRequest
)
from backend.app.services.firewall_service import firewall_service
from backend.app.services.windows_firewall import windows_firewall

router = APIRouter(prefix="/firewall", tags=["Firewall & Mitigation"])

@router.get("/status", response_model=FirewallStatusResponse)
def get_firewall_status(db: Session = Depends(get_db)):
    """Retrieve operational status, elevation posture, dry-run state, and auto-block configuration."""
    return firewall_service.get_service_status(db)

@router.get("/rules", response_model=List[FirewallRuleResponse])
def list_active_firewall_rules(db: Session = Depends(get_db)):
    """Retrieve all currently active quarantine rules."""
    return firewall_service.get_active_rules(db)

@router.get("/history", response_model=List[FirewallRuleResponse])
def list_firewall_rule_history(db: Session = Depends(get_db)):
    """Retrieve complete audit history of all quarantine rules (Active, Removed, Dry-Run)."""
    return firewall_service.get_all_rules(db)

@router.post("/block", response_model=FirewallRuleResponse, status_code=status.HTTP_200_OK)
def block_host(request: BlockRequest, db: Session = Depends(get_db)):
    """
    Apply an inbound quarantine block rule for a source IP.
    Executes real netsh advfirewall commands if elevated, or dry-run simulation if configured.
    """
    if not request.ip or not request.ip.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid IP address is required."
        )
    try:
        return firewall_service.block_ip(
            db=db,
            target_ip=request.ip.strip(),
            reason=request.reason,
            is_automatic=False,
            override_dry_run=request.dry_run
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/unblock", status_code=status.HTTP_200_OK)
def unblock_host(request: UnblockRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Safely reverse quarantine for an IP.
    Deletes the exact PortSentinel Windows Firewall rule, verifies removal, and restores host status to Normal.
    """
    if not request.ip or not request.ip.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid IP address is required."
        )
    try:
        success, message = firewall_service.unblock_ip(
            db=db,
            target_ip=request.ip.strip(),
            reason=request.reason,
            override_dry_run=request.dry_run
        )
        return {"success": success, "message": message}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/auto-block", status_code=status.HTTP_200_OK)
def configure_auto_block(request: AutoBlockConfigRequest) -> Dict[str, Any]:
    """Configure automatic mitigation upon detection of confirmed threats."""
    firewall_service.auto_block_enabled = request.enabled
    if request.threshold is not None:
        firewall_service.auto_block_threshold = request.threshold
    return {
        "success": True,
        "auto_block_enabled": firewall_service.auto_block_enabled,
        "auto_block_threshold": firewall_service.auto_block_threshold,
        "message": f"Automatic blocking is now {'ENABLED' if firewall_service.auto_block_enabled else 'DISABLED'} (Threshold: {firewall_service.auto_block_threshold}/100)."
    }

@router.post("/dry-run", status_code=status.HTTP_200_OK)
def configure_dry_run(request: DryRunConfigRequest) -> Dict[str, Any]:
    """Toggle between dry-run simulation mode and real OS Windows Firewall enforcement."""
    firewall_service.dry_run = request.enabled
    return {
        "success": True,
        "dry_run": firewall_service.dry_run,
        "message": f"Dry-run mode is now {'ENABLED (Safe Simulation)' if firewall_service.dry_run else 'DISABLED (Real Windows Firewall Enforcement)'}."
    }

@router.get("/allowlist", status_code=status.HTTP_200_OK)
def get_allowlist() -> Dict[str, Any]:
    """List currently protected IPs exempt from blocking."""
    return {
        "protected_ips": windows_firewall.get_allowlist()
    }

@router.post("/allowlist/add", status_code=status.HTTP_200_OK)
def add_to_allowlist(request: AllowlistRequest) -> Dict[str, Any]:
    """Add an IP to the protected allowlist."""
    try:
        added = windows_firewall.add_to_allowlist(request.ip)
        return {"success": True, "ip": added, "message": f"{added} added to protected allowlist."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/allowlist/remove", status_code=status.HTTP_200_OK)
def remove_from_allowlist(request: AllowlistRequest) -> Dict[str, Any]:
    """Remove an IP from the protected allowlist."""
    try:
        removed = windows_firewall.remove_from_allowlist(request.ip)
        return {"success": removed, "ip": request.ip, "message": f"{request.ip} removed from allowlist."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
