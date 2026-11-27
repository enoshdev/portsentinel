import sys
import subprocess
import ipaddress
from typing import List, Dict, Any, Tuple, Optional, Callable
from backend.app.config import settings

class WindowsFirewallManager:
    """
    Dedicated Windows Firewall Manager for PortSentinel.
    Executes supported Windows Defender Firewall commands via netsh advfirewall.
    Enforces safe subprocess argument passing, strict IP validation, protected host exemption,
    and post-operation OS verification.
    """

    def __init__(self, command_runner: Optional[Callable[[List[str], int], Tuple[int, str, str]]] = None):
        self._command_runner = command_runner or self._default_runner
        self._in_memory_allowlist: set[str] = set(settings.PROTECTED_IPS)

    def _default_runner(self, cmd: List[str], timeout: int = 5) -> Tuple[int, str, str]:
        """Safely executes a subprocess without shell=True, capturing stdout/stderr."""
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )
            return res.returncode, res.stdout.strip(), res.stderr.strip()
        except subprocess.TimeoutExpired:
            return -1, "", f"Command timed out after {timeout} seconds"
        except Exception as e:
            return -1, "", str(e)

    def is_admin(self) -> bool:
        """Determines if the current process has Windows Administrator elevation."""
        if sys.platform == "win32":
            try:
                import ctypes
                return bool(ctypes.windll.shell32.IsUserAnAdmin())
            except Exception:
                return False
        else:
            import os
            return os.geteuid() == 0

    def validate_ip(self, ip_str: str) -> str:
        """
        Strictly validates an IPv4 or IPv6 address.
        Raises ValueError with clear message if invalid.
        """
        if not ip_str or not isinstance(ip_str, str):
            raise ValueError("IP address string is empty or invalid.")
        cleaned = ip_str.strip()
        try:
            addr = ipaddress.ip_address(cleaned)
            return str(addr)
        except ValueError:
            raise ValueError(f"Invalid IP address format: '{cleaned}'. Must be a valid IPv4 or IPv6 address.")

    def get_rule_name(self, ip_str: str) -> str:
        """Generates predictable, unique rule name for PortSentinel."""
        canonical_ip = self.validate_ip(ip_str)
        return f"{settings.FIREWALL_RULE_PREFIX}{canonical_ip}"

    def is_protected_ip(self, ip_str: str, host_ips: Optional[List[str]] = None) -> Tuple[bool, str]:
        """
        Checks whether the target IP is protected (loopback, local adapter, or configured allowlist).
        Returns (is_protected, reason).
        """
        try:
            canonical = self.validate_ip(ip_str)
            addr = ipaddress.ip_address(canonical)
        except ValueError as e:
            return False, str(e)

        # 1. Loopback addresses (127.0.0.0/8, ::1)
        if addr.is_loopback:
            return True, f"Loopback address ({canonical}) is strictly protected from blocking."

        # 2. Unspecified (0.0.0.0, ::)
        if addr.is_unspecified:
            return True, f"Unspecified address ({canonical}) cannot be blocked."

        # 3. Multicast or reserved
        if addr.is_multicast or addr.is_reserved:
            return True, f"Multicast or reserved address ({canonical}) cannot be blocked."

        # 4. In-memory allowlist & settings
        if canonical in self._in_memory_allowlist or canonical in settings.PROTECTED_IPS:
            return True, f"IP address ({canonical}) is in the configured protection allowlist."

        # 5. Local adapter IPs if provided
        if host_ips:
            for hip in host_ips:
                try:
                    if hip and ipaddress.ip_address(hip.strip()) == addr:
                        return True, f"IP address ({canonical}) matches local host network adapter."
                except Exception:
                    continue

        return False, ""

    def get_allowlist(self) -> List[str]:
        """Returns the list of currently protected IP addresses."""
        return sorted(list(self._in_memory_allowlist))

    def add_to_allowlist(self, ip_str: str) -> str:
        """Adds an IP to the protected allowlist."""
        canonical = self.validate_ip(ip_str)
        self._in_memory_allowlist.add(canonical)
        return canonical

    def remove_from_allowlist(self, ip_str: str) -> bool:
        """Removes an IP from the protected allowlist."""
        canonical = self.validate_ip(ip_str)
        if canonical in ("127.0.0.1", "::1", "localhost"):
            raise ValueError("Loopback and localhost addresses are permanently protected and cannot be removed.")
        if canonical in self._in_memory_allowlist:
            self._in_memory_allowlist.remove(canonical)
            return True
        return False

    def show_rule(self, rule_name: str) -> Tuple[bool, Dict[str, Any], str]:
        """
        Queries Windows Firewall for a specific rule.
        Returns (exists, properties_dict, raw_output).
        """
        cmd = ["netsh", "advfirewall", "firewall", "show", "rule", f"name={rule_name}"]
        code, stdout, stderr = self._command_runner(cmd, 5)
        raw = stdout if stdout else stderr

        if code == 0 and "Rule Name:" in stdout:
            properties = {"name": rule_name}
            for line in stdout.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    properties[key.strip()] = val.strip()
            return True, properties, raw
        else:
            return False, {}, raw

    def add_inbound_block_rule(
        self,
        ip_str: str,
        rule_name: Optional[str] = None,
        reason: str = "PortSentinel threat mitigation"
    ) -> Tuple[bool, str, str, str]:
        """
        Applies an inbound Windows Firewall block rule for the specified remote IP.
        Verifies that the rule actually exists in Windows Firewall before confirming.
        Returns (success, rule_name, message, output).
        """
        canonical_ip = self.validate_ip(ip_str)
        target_rule_name = rule_name or self.get_rule_name(canonical_ip)

        # 1. Protection check
        is_prot, prot_reason = self.is_protected_ip(canonical_ip)
        if is_prot:
            return False, target_rule_name, f"Blocked operation rejected: {prot_reason}", ""

        # 2. Check if rule already exists in Windows Firewall
        exists, _, existing_out = self.show_rule(target_rule_name)
        if exists:
            return True, target_rule_name, f"Rule '{target_rule_name}' is already active in Windows Firewall.", existing_out

        # 3. Execute netsh add rule
        cmd = [
            "netsh", "advfirewall", "firewall", "add", "rule",
            f"name={target_rule_name}",
            "dir=in",
            "action=block",
            f"remoteip={canonical_ip}",
            "enable=yes",
            f"description={reason}"
        ]
        code, stdout, stderr = self._command_runner(cmd, 6)
        output = stdout if stdout else stderr

        if code != 0:
            err_msg = stderr or stdout or "Unknown Windows Firewall error"
            if "requires elevation" in err_msg.lower() or "run as administrator" in err_msg.lower():
                return False, target_rule_name, "Permission denied: Administrator elevation required to modify Windows Firewall.", err_msg
            return False, target_rule_name, f"Failed to apply Windows Firewall rule: {err_msg}", output

        # 4. Mandatory OS Verification
        verified, props, verif_out = self.show_rule(target_rule_name)
        if not verified:
            return False, target_rule_name, "Rule creation command returned 0, but rule was not found during OS verification.", verif_out

        return True, target_rule_name, f"Successfully created and verified Windows Firewall block rule '{target_rule_name}'.", output

    def delete_inbound_block_rule(self, rule_name: str) -> Tuple[bool, str, str]:
        """
        Removes an inbound Windows Firewall block rule by exact name.
        Verifies that the rule is no longer present before confirming.
        Returns (success, message, output).
        """
        # 1. Check if rule exists
        exists, _, _ = self.show_rule(rule_name)
        if not exists:
            return True, f"Rule '{rule_name}' does not exist in Windows Firewall (already removed).", ""

        # 2. Execute netsh delete rule
        cmd = ["netsh", "advfirewall", "firewall", "delete", "rule", f"name={rule_name}"]
        code, stdout, stderr = self._command_runner(cmd, 6)
        output = stdout if stdout else stderr

        if code != 0:
            err_msg = stderr or stdout or "Unknown error"
            if "requires elevation" in err_msg.lower() or "run as administrator" in err_msg.lower():
                return False, "Permission denied: Administrator elevation required to delete Windows Firewall rules.", err_msg
            return False, f"Failed to delete Windows Firewall rule: {err_msg}", output

        # 3. Mandatory OS Verification of deletion
        still_exists, _, verif_out = self.show_rule(rule_name)
        if still_exists:
            return False, f"Rule deletion command executed, but rule '{rule_name}' still exists in Windows Firewall.", verif_out

        return True, f"Successfully removed and verified deletion of Windows Firewall rule '{rule_name}'.", output

    def list_portsentinel_rules(self) -> List[Dict[str, Any]]:
        """Queries Windows Firewall and parses all rules starting with PortSentinel_BLOCK_."""
        cmd = ["netsh", "advfirewall", "firewall", "show", "rule", "name=all"]
        code, stdout, _ = self._command_runner(cmd, 8)
        if code != 0 or not stdout:
            return []

        rules = []
        current_rule = {}
        for line in stdout.splitlines():
            line_str = line.strip()
            if line_str.startswith("Rule Name:"):
                if current_rule and current_rule.get("name", "").startswith(settings.FIREWALL_RULE_PREFIX):
                    rules.append(current_rule)
                current_rule = {"name": line_str.split(":", 1)[1].strip()}
            elif ":" in line_str and current_rule:
                k, v = line_str.split(":", 1)
                current_rule[k.strip()] = v.strip()

        if current_rule and current_rule.get("name", "").startswith(settings.FIREWALL_RULE_PREFIX):
            rules.append(current_rule)

        return rules

# Global singleton instance
windows_firewall = WindowsFirewallManager()
