import time
import random
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.config import settings
from backend.app.models.firewall_rule import FirewallRule
from backend.app.models.monitored_ip import MonitoredIP
from backend.app.schemas.firewall import FirewallRuleResponse, FirewallStatusResponse
from backend.app.services.windows_firewall import windows_firewall

class FirewallService:
    """
    Core Firewall & Mitigation Management Service for PortSentinel.
    Coordinates between the SQLite database, the Windows Defender Firewall backend,
    the real-time detection engine, and operator controls.
    Supports real OS enforcement, dry-run simulation, and automated mitigation.
    """

    def __init__(self):
        # Operational states (configurable at runtime via API/UI)
        self._dry_run: bool = settings.FIREWALL_DRY_RUN
        self._auto_block_enabled: bool = settings.AUTO_BLOCK_ENABLED
        self._auto_block_threshold: int = settings.AUTO_BLOCK_THRESHOLD

    @property
    def dry_run(self) -> bool:
        return self._dry_run

    @dry_run.setter
    def dry_run(self, value: bool) -> None:
        self._dry_run = bool(value)

    @property
    def auto_block_enabled(self) -> bool:
        return self._auto_block_enabled

    @auto_block_enabled.setter
    def auto_block_enabled(self, value: bool) -> None:
        self._auto_block_enabled = bool(value)

    @property
    def auto_block_threshold(self) -> int:
        return self._auto_block_threshold

    @auto_block_threshold.setter
    def auto_block_threshold(self, value: int) -> None:
        self._auto_block_threshold = max(0, min(100, int(value)))

    def get_service_status(self, db: Session) -> FirewallStatusResponse:
        """Retrieves comprehensive operational posture of the firewall mitigation subsystem."""
        is_elevated = windows_firewall.is_admin()
        active_count = db.query(FirewallRule).filter(FirewallRule.rule_status == "ACTIVE").count()
        total_count = db.query(FirewallRule).count()

        if self._dry_run:
            status = "DRY_RUN"
            msg = "Dry-Run mode active: Firewall rules will be validated and tracked in SQLite without modifying Windows Firewall."
        elif not is_elevated:
            status = "ELEVATION_REQUIRED"
            msg = "Administrator elevation required: Real Windows Defender Firewall rules require running PortSentinel as an Administrator."
        else:
            status = "ONLINE"
            msg = "Windows Defender Firewall active: System is fully elevated and capable of applying real OS-level packet filters."

        return FirewallStatusResponse(
            status=status,
            is_admin=is_elevated,
            dry_run=self._dry_run,
            auto_block_enabled=self._auto_block_enabled,
            auto_block_threshold=self._auto_block_threshold,
            active_rules_count=active_count,
            total_rules_count=total_count,
            os_platform="Windows (netsh advfirewall)",
            backend_type="Windows Defender Firewall",
            protected_ips=windows_firewall.get_allowlist(),
            message=msg
        )

    def get_active_rules(self, db: Session) -> List[FirewallRuleResponse]:
        """Returns all currently active firewall rules from SQLite."""
        rules = (
            db.query(FirewallRule)
            .filter(FirewallRule.rule_status == "ACTIVE")
            .order_by(FirewallRule.id.desc())
            .all()
        )
        return [self._to_response(r) for r in rules]

    def get_all_rules(self, db: Session) -> List[FirewallRuleResponse]:
        """Returns full audit history of all rules (ACTIVE, REMOVED, DRY_RUN)."""
        rules = db.query(FirewallRule).order_by(FirewallRule.id.desc()).all()
        return [self._to_response(r) for r in rules]

    def _to_response(self, r: FirewallRule) -> FirewallRuleResponse:
        return FirewallRuleResponse(
            id=r.rule_id,
            ruleName=r.rule_name,
            ip=r.ip_address,
            chain=r.chain,
            target=r.target,
            protocol=r.protocol,
            reason=r.block_reason,
            enforcedAt=r.enforced_at,
            packetsDropped=r.packets_dropped,
            status=r.rule_status,
            isSimulated=r.is_simulated,
            isAutomatic=r.is_automatic,
            verificationStatus=r.verification_status,
            executionOutput=r.execution_output
        )

    def block_ip(
        self,
        db: Session,
        target_ip: str,
        reason: Optional[str] = None,
        is_automatic: bool = False,
        override_dry_run: Optional[bool] = None
    ) -> FirewallRuleResponse:
        """
        Enforces a quarantine block rule for a given IP address.
        - Validates the IP format.
        - Verifies protected host / allowlist exemption.
        - Applies rule via netsh advfirewall (or simulates if dry-run).
        - Verifies rule in the OS.
        - Persists rule in SQLite and updates MonitoredIP record.
        """
        # 1. Validate IP address format
        try:
            canonical_ip = windows_firewall.validate_ip(target_ip)
        except ValueError as e:
            raise ValueError(f"Invalid IP address: {str(e)}")

        # 2. Protection check (Loopback, host IPs, allowlist)
        is_prot, prot_msg = windows_firewall.is_protected_ip(canonical_ip)
        if is_prot:
            raise ValueError(f"Cannot block protected IP ({canonical_ip}): {prot_msg}")

        # Determine effective dry-run setting
        is_dry = self._dry_run if override_dry_run is None else bool(override_dry_run)
        is_elevated = windows_firewall.is_admin()

        rule_name = windows_firewall.get_rule_name(canonical_ip)
        display_time = datetime.now(timezone.utc).strftime("%H:%M:%S")
        block_reason_text = reason or f"{'Automated' if is_automatic else 'Manual'} quarantine: suspicious scan activity from {canonical_ip}"

        execution_output = ""
        verification_status = "SIMULATED"
        is_simulated = True

        if is_dry:
            # Dry-run execution
            verification_status = "SIMULATED"
            is_simulated = True
            execution_output = f"[DRY-RUN] Simulated execution: netsh advfirewall firewall add rule name={rule_name} dir=in action=block remoteip={canonical_ip}"
        else:
            # Real OS enforcement requested
            if not is_elevated:
                raise PermissionError(
                    "Administrator privileges are required to modify Windows Firewall rules. "
                    "Run PortSentinel in an elevated terminal or enable Dry-Run mode."
                )

            # Apply and verify via Windows Firewall manager
            success, rule_n, msg, out = windows_firewall.add_inbound_block_rule(
                canonical_ip, rule_name=rule_name, reason=block_reason_text
            )
            execution_output = out or msg
            if not success:
                raise RuntimeError(f"Windows Firewall block operation failed: {msg}")

            verification_status = "VERIFIED"
            is_simulated = False

        # 3. Retrieve or update Host record
        host = db.query(MonitoredIP).filter(
            or_(MonitoredIP.ip_address == canonical_ip, MonitoredIP.id == target_ip)
        ).first()

        if host:
            host.current_status = "Blocked"
            host.current_risk_score = max(host.current_risk_score, 85)
            host.blocked_at = display_time
            host.block_reason = block_reason_text

        # 4. Check if existing rule record exists in SQLite for this IP
        existing_rule = db.query(FirewallRule).filter(
            FirewallRule.ip_address == canonical_ip,
            FirewallRule.rule_status == "ACTIVE"
        ).first()

        if existing_rule:
            existing_rule.rule_name = rule_name
            existing_rule.block_reason = block_reason_text
            existing_rule.enforced_at = display_time
            existing_rule.is_simulated = is_simulated
            existing_rule.is_automatic = is_automatic
            existing_rule.verification_status = verification_status
            existing_rule.execution_output = execution_output
            existing_rule.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_rule)
            rule_record = existing_rule
        else:
            # Generate collision-free unique rule ID
            unique_ts = int(time.time() * 1000) % 10000000
            new_rule_id = f"PT-{unique_ts}-{random.randint(100, 999)}"
            rule_record = FirewallRule(
                rule_id=new_rule_id,
                rule_name=rule_name,
                ip_address=canonical_ip,
                chain="INPUT",
                target="DROP",
                protocol="TCP",
                rule_status="ACTIVE",
                block_reason=block_reason_text,
                enforced_at=display_time,
                packets_dropped=1,
                is_simulated=is_simulated,
                is_automatic=is_automatic,
                verification_status=verification_status,
                execution_output=execution_output,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(rule_record)
            db.commit()
            db.refresh(rule_record)

        return self._to_response(rule_record)

    def unblock_ip(
        self,
        db: Session,
        target_ip: str,
        reason: Optional[str] = None,
        override_dry_run: Optional[bool] = None
    ) -> Tuple[bool, str]:
        """
        Removes quarantine block rule for a given IP address.
        - Deletes rule from Windows Firewall (if real mode).
        - Verifies rule deletion in OS.
        - Updates SQLite record status to REMOVED.
        - Restores MonitoredIP status to Normal.
        """
        try:
            canonical_ip = windows_firewall.validate_ip(target_ip)
        except ValueError:
            canonical_ip = target_ip.strip()

        is_dry = self._dry_run if override_dry_run is None else bool(override_dry_run)
        is_elevated = windows_firewall.is_admin()

        rule_name = windows_firewall.get_rule_name(canonical_ip)

        # 1. Perform OS removal if real rule was active
        if not is_dry:
            if not is_elevated:
                raise PermissionError(
                    "Administrator privileges are required to delete Windows Firewall rules. "
                    "Run PortSentinel in an elevated terminal or enable Dry-Run mode."
                )

            success, msg, out = windows_firewall.delete_inbound_block_rule(rule_name)
            if not success:
                raise RuntimeError(f"Windows Firewall rule deletion failed: {msg}")

        # 2. Update SQLite records
        active_rules = db.query(FirewallRule).filter(
            FirewallRule.ip_address == canonical_ip,
            FirewallRule.rule_status == "ACTIVE"
        ).all()

        for r in active_rules:
            r.rule_status = "REMOVED"
            r.verification_status = "VERIFIED_REMOVAL" if not is_dry else "SIMULATED_REMOVAL"
            r.updated_at = datetime.utcnow()

        # 3. Restore host status in monitored_ips
        host = db.query(MonitoredIP).filter(
            or_(MonitoredIP.ip_address == canonical_ip, MonitoredIP.id == target_ip)
        ).first()

        if host:
            host.current_status = "Normal"
            host.current_risk_score = min(host.current_risk_score, 20)
            host.blocked_at = None
            host.block_reason = reason or "Quarantine reversed by operator during review"

        db.commit()
        return True, f"Quarantine successfully removed and verified for {canonical_ip}."

    def evaluate_and_auto_block(
        self,
        db: Session,
        source_ip: str,
        risk_score: int,
        detection_status: str,
        reason: str,
        total_attempts: int
    ) -> Optional[FirewallRuleResponse]:
        """
        Evaluates detection outcome against automated mitigation policies.
        Enforces strict safeguards:
        - Auto-blocking must be explicitly enabled.
        - Risk score must meet or exceed threshold.
        - IP must not be protected (loopback / local adapter / allowlist).
        - Must have >1 connection attempt (prevents blocking on isolated glitch).
        - Must not already have an active rule.
        """
        if not self._auto_block_enabled:
            return None

        if risk_score < self._auto_block_threshold and detection_status != "Blocked":
            return None

        # Safeguard: Do not block an IP based solely on a single connection attempt
        if total_attempts < 2:
            return None

        # Safeguard: Protected IP check
        is_prot, _ = windows_firewall.is_protected_ip(source_ip)
        if is_prot:
            return None

        # Safeguard: Do not duplicate block attempt if active rule already exists
        existing = db.query(FirewallRule).filter(
            FirewallRule.ip_address == source_ip,
            FirewallRule.rule_status == "ACTIVE"
        ).first()
        if existing:
            return None

        try:
            return self.block_ip(
                db=db,
                target_ip=source_ip,
                reason=f"Automatic mitigation: {reason}",
                is_automatic=True
            )
        except Exception:
            return None

# Global singleton firewall service
firewall_service = FirewallService()

# Module-level aliases for backwards compatibility
def get_active_firewall_rules(db: Session) -> List[FirewallRuleResponse]:
    return firewall_service.get_active_rules(db)

def block_ip(db: Session, target_ip: str, reason: Optional[str] = None) -> FirewallRuleResponse:
    return firewall_service.block_ip(db, target_ip, reason=reason)

def unblock_ip(db: Session, target_ip: str, reason: Optional[str] = None) -> bool:
    success, _ = firewall_service.unblock_ip(db, target_ip, reason=reason)
    return success
