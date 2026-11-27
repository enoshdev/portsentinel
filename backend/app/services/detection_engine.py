import math
import statistics
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional, Any
from sqlalchemy.orm import Session
from backend.app.models.monitored_ip import MonitoredIP
from backend.app.models.risk_history import RiskHistory

# Port Criticality Weights (0 to 100)
PORT_CRITICALITY: Dict[int, int] = {
    # Administrative & Remote Access (Highest Criticality)
    22: 95,    # SSH
    23: 98,    # Telnet
    3389: 95,  # RDP (Remote Desktop)
    5900: 90,  # VNC
    445: 90,   # SMB / Active Directory
    135: 88,   # Microsoft RPC Endpoint Mapper
    139: 85,   # NetBIOS
    1025: 85,  # NFS / RPC
    21: 80,    # FTP
    
    # Database & Internal Infrastructure
    1433: 88,  # Microsoft SQL Server
    1521: 85,  # Oracle DB
    3306: 82,  # MySQL
    5432: 82,  # PostgreSQL
    6379: 80,  # Redis
    27017: 80, # MongoDB
    8080: 50,  # Alternative HTTP
    8443: 50,  # Alternative HTTPS
    
    # Routine Public Web & Core Services (Low Criticality Baseline)
    80: 10,    # HTTP
    443: 10,   # HTTPS
    53: 15,    # DNS
    123: 10,   # NTP
}

DEFAULT_UNKNOWN_PORT_CRITICALITY = 40

class ObservationEvent:
    def __init__(self, timestamp: float, port: int, protocol: str = "TCP", tcp_flags: str = ""):
        self.timestamp = timestamp
        self.port = port
        self.protocol = protocol
        self.tcp_flags = tcp_flags

class DetectionEngine:
    """
    Intelligent Port-Scan Detection Engine.
    Evaluates normalized connection events across short (30s), medium (15m), and long (60m)
    sliding observation windows to dynamically compute:
    1. Port Diversity (distinguishing multi-port sweeps from repeated attempts)
    2. Timing Pattern (detecting rapid bursts vs robotic low-jitter intervals)
    3. Target-Port Pattern (criticality weighting)
    4. Composite Risk Score (0-100) and Plain-English Explanation
    """

    def __init__(self):
        # In-memory sliding window history: ip_address -> List[ObservationEvent]
        self._history: Dict[str, List[ObservationEvent]] = {}
        # Maximum history retention: 2 hours in seconds
        self._max_retention_seconds = 7200

    def record_attempt(self, ip: str, port: int, timestamp: Optional[float] = None, protocol: str = "TCP", tcp_flags: str = "") -> None:
        """Appends a connection attempt to the source IP's sliding window."""
        t = timestamp if timestamp is not None else datetime.now(timezone.utc).timestamp()
        if ip not in self._history:
            self._history[ip] = []
        
        self._history[ip].append(ObservationEvent(t, port, protocol, tcp_flags))
        self._prune(ip, t)

    def _prune(self, ip: str, current_time: float) -> None:
        """Removes observations older than max retention window."""
        if ip in self._history:
            cutoff = current_time - self._max_retention_seconds
            self._history[ip] = [evt for evt in self._history[ip] if evt.timestamp >= cutoff]

    def clear_history(self, ip: Optional[str] = None) -> None:
        """Clears memory history for a given IP or all IPs."""
        if ip:
            self._history.pop(ip, None)
        else:
            self._history.clear()

    def evaluate_host(self, ip: str, reference_time: Optional[float] = None) -> Dict[str, Any]:
        """
        Runs comprehensive multi-window behavioral analysis on the source IP.
        Returns calculated signal scores (0-100), composite risk score, status classification,
        and plain-English explanation.
        """
        now = reference_time if reference_time is not None else datetime.now(timezone.utc).timestamp()
        events = self._history.get(ip, [])

        # Filter events across 3 observation windows:
        # 1. Short (30 seconds) -> Fast bursts
        # 2. Medium (15 minutes) -> Progressive sweeps
        # 3. Long (60 minutes) -> Slow / stealth reconnaissance
        short_window = [e for e in events if now - e.timestamp <= 30]
        med_window = [e for e in events if now - e.timestamp <= 900]
        long_window = [e for e in events if now - e.timestamp <= 3600]

        total_attempts = len(long_window)
        if total_attempts == 0:
            return {
                "ip": ip,
                "score": 0,
                "status": "Normal",
                "randomness": 0,
                "timing": 0,
                "target": 0,
                "unique_ports_count": 0,
                "repeated_attempts_count": 0,
                "is_fast_scan": False,
                "is_slow_scan": False,
                "is_repeated_single_port": False,
                "reason": "No active connections recorded in observation window."
            }

        # ---------------------------------------------------------------------
        # 1. PORT DIVERSITY ANALYSIS & REPEATED-PORT DISTINCTION
        # ---------------------------------------------------------------------
        ports = [e.port for e in long_window]
        unique_ports = sorted(list(set(ports)))
        num_unique = len(unique_ports)
        repeated_attempts = total_attempts - num_unique

        # Count occurrences per port
        port_counts = {}
        for p in ports:
            port_counts[p] = port_counts.get(p, 0) + 1
        
        max_single_port_count = max(port_counts.values()) if port_counts else 0
        single_port_ratio = max_single_port_count / total_attempts if total_attempts > 0 else 0

        # Check if traffic is primarily repeated attempts against 1-2 ports
        is_repeated_single_port = (num_unique <= 2 and total_attempts >= 5 and single_port_ratio >= 0.80)

        if is_repeated_single_port:
            # Heavily discount port diversity: hitting port 443 repeatedly is NOT a port scan
            port_diversity_score = min(15, num_unique * 6)
        else:
            # Multi-port scanning curve
            if num_unique == 1:
                port_diversity_score = 8
            elif num_unique == 2:
                port_diversity_score = 18
            elif num_unique <= 4:
                port_diversity_score = 25 + (num_unique - 2) * 12 # 25 - 49
            elif num_unique <= 8:
                port_diversity_score = 50 + (num_unique - 4) * 6  # 56 - 74
            elif num_unique <= 15:
                port_diversity_score = 75 + (num_unique - 8) * 2  # 77 - 89
            else:
                port_diversity_score = min(100, 90 + (num_unique - 15))

        # ---------------------------------------------------------------------
        # 2. TIMING PATTERN ANALYSIS
        # ---------------------------------------------------------------------
        timing_score = 15 # default baseline
        is_fast_scan = False
        is_slow_scan = False

        # Fast scan check: evaluated on short window (30s)
        short_unique = len(set(e.port for e in short_window))
        if len(short_window) >= 8 and short_unique >= 6:
            # Velocity: distinct ports contacted per second
            velocity = short_unique / max(1.0, (short_window[-1].timestamp - short_window[0].timestamp))
            is_fast_scan = True
            timing_score = min(100, int(70 + min(30, velocity * 10)))
        elif len(long_window) >= 3:
            # Calculate inter-arrival intervals (delta_t)
            sorted_times = sorted([e.timestamp for e in long_window])
            deltas = [sorted_times[i] - sorted_times[i - 1] for i in range(1, len(sorted_times))]
            
            if deltas:
                mean_delta = statistics.mean(deltas)
                # If probes are spaced out (e.g. > 15s between attempts)
                if mean_delta >= 15.0 and len(deltas) >= 2:
                    stdev_delta = statistics.stdev(deltas) if len(deltas) > 1 else 0.0
                    cv = stdev_delta / mean_delta if mean_delta > 0 else 1.0 # Coefficient of variation
                    
                    # Low jitter (CV < 0.25) indicates clockwork robotic pacing (Slow Scan)
                    if cv < 0.25 and num_unique >= 3:
                        is_slow_scan = True
                        # Robotic precision gives elevated timing score
                        timing_score = min(100, int(80 + (0.25 - cv) * 60))
                    elif cv < 0.45 and num_unique >= 4:
                        timing_score = 65
                    else:
                        # Natural human browsing variance
                        timing_score = max(10, min(35, int(cv * 30)))
                else:
                    # Rapid consecutive attempts
                    timing_score = max(20, min(65, int(50 - mean_delta)))

        # ---------------------------------------------------------------------
        # 3. TARGET-PORT CRITICALITY ANALYSIS
        # ---------------------------------------------------------------------
        if unique_ports:
            port_weights = [PORT_CRITICALITY.get(p, DEFAULT_UNKNOWN_PORT_CRITICALITY) for p in unique_ports]
            target_score = int(sum(port_weights) / len(port_weights))
        else:
            target_score = 10

        # If traffic is standard web browsing (80/443), cap target score low
        if set(unique_ports).issubset({80, 443, 53}):
            target_score = min(target_score, 12)

        # ---------------------------------------------------------------------
        # 4. COMPOSITE RISK SCORE CALCULATION
        # ---------------------------------------------------------------------
        # Formula: 40% Port Diversity + 35% Timing Pattern + 25% Target Criticality
        raw_score = (0.40 * port_diversity_score) + (0.35 * timing_score) + (0.25 * target_score)
        
        # Protective adjustment: If it's verified repeated attempts against 1 port (e.g. browsing port 443),
        # prevent false positive escalation
        if is_repeated_single_port and not (port_diversity_score >= 50):
            raw_score = min(raw_score, 24)

        composite_score = max(0, min(100, int(round(raw_score))))

        # Status assignment
        if composite_score >= 80:
            status = "Blocked"
        elif composite_score >= 60:
            status = "Confirmed Scan"
        elif composite_score >= 30:
            status = "Suspicious"
        else:
            status = "Normal"

        # ---------------------------------------------------------------------
        # 5. PLAIN-ENGLISH REASONING GENERATION
        # ---------------------------------------------------------------------
        if is_fast_scan:
            reason = f"Fast port sweep: Rapid burst contacting {num_unique} distinct ports in under 30 seconds."
        elif is_slow_scan:
            reason = f"Stealth port scan: Machine-paced probes spaced across observation window contacting {num_unique} ports."
        elif is_repeated_single_port:
            reason = f"Normal service traffic: {total_attempts} repeated attempts directed to port {unique_ports[0]}."
        elif composite_score >= 60:
            reason = f"Confirmed scan: Probing across {num_unique} ports with elevated administration target weighting."
        elif composite_score >= 30:
            reason = f"Suspicious activity: Probed {num_unique} different ports, warranting operator review."
        else:
            reason = f"Benign traffic baseline: Connections remain confined to standard ports with normal timing variance."

        return {
            "ip": ip,
            "score": composite_score,
            "status": status,
            "randomness": port_diversity_score,
            "timing": timing_score,
            "target": target_score,
            "unique_ports_count": num_unique,
            "repeated_attempts_count": repeated_attempts,
            "is_fast_scan": is_fast_scan,
            "is_slow_scan": is_slow_scan,
            "is_repeated_single_port": is_repeated_single_port,
            "reason": reason,
            "ports_probed": unique_ports
        }

    def evaluate_ip_behavior(self, ip: str, events: Optional[List[Dict[str, Any]]] = None, reference_time: Optional[float] = None) -> Dict[str, Any]:
        """Convenience evaluation method accepting event dicts directly."""
        if events:
            self.clear_history(ip)
            for e in events:
                port = e.get("dst_port") or e.get("port", 80)
                t = e.get("timestamp")
                flags = e.get("tcp_flags", "SYN")
                proto = e.get("protocol", "TCP")
                self.record_attempt(ip=ip, port=port, timestamp=t, protocol=proto, tcp_flags=flags)
            ref_t = reference_time or (events[-1].get("timestamp") if events else None)
            res = self.evaluate_host(ip, reference_time=ref_t)
        else:
            res = self.evaluate_host(ip, reference_time=reference_time)

        # Expose convenient field aliases
        res["distinct_ports"] = res["unique_ports_count"]
        res["repeated_attempts"] = res["repeated_attempts_count"]
        res["port_diversity_score"] = res["randomness"]
        res["timing_score"] = res["timing"]
        res["target_score"] = res["target"]
        res["composite_score"] = res["score"]
        res["primary_reason"] = res["reason"]
        return res

# Global singleton engine instance
engine_instance = DetectionEngine()
detection_engine = engine_instance
