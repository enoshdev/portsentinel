import sys
import time
import threading
from typing import Dict, List, Optional, Any
from backend.app.services.event_processor import event_processor
from backend.app.services.websocket_manager import ws_manager

try:
    from scapy.all import sniff, TCP, IP, IPv6
    from scapy.arch.windows import get_windows_if_list
    SCAPY_AVAILABLE = True
except Exception:
    SCAPY_AVAILABLE = False

class SnifferService:
    """
    Live Network Monitoring Service using Scapy and Npcap.
    Captures permitted TCP connection attempts, extracts connection metadata (IPs, ports, flags),
    and feeds events into the event processing pipeline.
    """

    def __init__(self):
        self.state: str = "Stopped" # "Monitoring", "Stopped", "Permission required", "Capture unavailable", "Error"
        self.error_message: Optional[str] = None
        self.selected_interface: Optional[str] = None
        self.interface_description: Optional[str] = None
        self.packets_captured: int = 0
        self.start_time: Optional[float] = None
        
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state and diagnostics of the monitoring service."""
        npcap_installed = self._check_npcap()
        return {
            "state": self.state,
            "is_monitoring": self.state == "Monitoring",
            "selected_interface": self.selected_interface,
            "interface_description": self.interface_description,
            "packets_captured": self.packets_captured,
            "uptime_seconds": int(time.time() - self.start_time) if self.start_time and self.state == "Monitoring" else 0,
            "npcap_available": npcap_installed,
            "scapy_available": SCAPY_AVAILABLE,
            "error_message": self.error_message
        }

    def _check_npcap(self) -> bool:
        if sys.platform != "win32":
            return True
        try:
            import os
            return os.path.exists("C:\\Windows\\System32\\Npcap")
        except Exception:
            return False

    def list_interfaces(self) -> List[Dict[str, Any]]:
        """Lists available network adapters and their IP bindings."""
        if not SCAPY_AVAILABLE:
            return []
        
        results = []
        try:
            if sys.platform == "win32":
                for iface in get_windows_if_list():
                    name = iface.get("name", "")
                    desc = iface.get("description", "")
                    ips = iface.get("ips", [])
                    # Skip non-physical virtual filter duplicates for clarity
                    if "Filter" in desc or "QoS" in desc or "WFP" in desc:
                        continue
                    results.append({
                        "id": name,
                        "name": name,
                        "description": desc,
                        "ips": [ip for ip in ips if ":" not in ip], # Primary IPv4
                        "all_ips": ips
                    })
            else:
                from scapy.all import get_if_list
                for name in get_if_list():
                    results.append({
                        "id": name,
                        "name": name,
                        "description": name,
                        "ips": []
                    })
        except Exception as e:
            self.error_message = f"Error listing interfaces: {str(e)}"
        
        return results

    def start_capture(self, interface_name: Optional[str] = None, filter_str: str = "tcp") -> Dict[str, Any]:
        """Starts live packet capture on the selected network adapter in a background thread."""
        if not SCAPY_AVAILABLE:
            self.state = "Capture unavailable"
            self.error_message = "Scapy library is not available in the current Python environment."
            return self.get_status()

        if self.state == "Monitoring":
            return self.get_status() # Already running

        # Check Npcap on Windows
        if sys.platform == "win32" and not self._check_npcap():
            self.state = "Capture unavailable"
            self.error_message = "Npcap driver was not detected. Please install Npcap with WinPcap compatibility enabled."
            return self.get_status()

        # Resolve interface
        if not interface_name:
            interfaces = self.list_interfaces()
            # Pick first active interface with an assigned IP
            active = next((i for i in interfaces if i["ips"] and not i["name"].startswith("Loopback")), None)
            if active:
                interface_name = active["name"]
                self.interface_description = active["description"]
            elif interfaces:
                interface_name = interfaces[0]["name"]
                self.interface_description = interfaces[0]["description"]
            else:
                interface_name = None

        self.selected_interface = interface_name
        self._stop_event.clear()
        self.packets_captured = 0
        self.start_time = time.time()
        self.error_message = None

        self._thread = threading.Thread(
            target=self._sniff_worker,
            args=(interface_name, filter_str),
            daemon=True
        )
        self._thread.start()
        self.state = "Monitoring"
        return self.get_status()

    def stop_capture(self) -> Dict[str, Any]:
        """Stops live network packet collection gracefully."""
        self._stop_event.set()
        self.state = "Stopped"
        self.start_time = None
        return self.get_status()

    def _sniff_worker(self, interface_name: Optional[str], filter_str: str):
        """Worker thread executing scapy.sniff with stop condition and timeout."""
        try:
            sniff_kwargs = {
                "filter": filter_str,
                "prn": self._packet_callback,
                "stop_filter": lambda _: self._stop_event.is_set(),
                "store": False,
                "timeout": 2 # Short loop timeout so stop_filter is checked frequently
            }
            if interface_name:
                sniff_kwargs["iface"] = interface_name

            while not self._stop_event.is_set():
                sniff(**sniff_kwargs)

        except PermissionError:
            self.state = "Permission required"
            self.error_message = "Administrator privileges are required to open raw packet capture on this interface."
        except Exception as e:
            self.state = "Error"
            self.error_message = f"Capture error: {str(e)}"
        finally:
            if self.state == "Monitoring":
                self.state = "Stopped"

    def _packet_callback(self, packet):
        """Processes captured packets: extracts metadata only, strictly avoiding payloads."""
        try:
            if not packet.haslayer(TCP):
                return

            tcp_layer = packet.getlayer(TCP)
            
            # Extract IPs
            src_ip = None
            dst_ip = "127.0.0.1"
            if packet.haslayer(IP):
                src_ip = packet[IP].src
                dst_ip = packet[IP].dst
            elif packet.haslayer(IPv6):
                src_ip = packet[IPv6].src
                dst_ip = packet[IPv6].dst

            if not src_ip:
                return

            dst_port = int(tcp_layer.dport)
            flags = str(tcp_layer.flags) # e.g. "S" (SYN), "SA", "A", "R" (RST)
            
            flag_labels = []
            if "S" in flags:
                flag_labels.append("SYN")
            if "A" in flags:
                flag_labels.append("ACK")
            if "R" in flags:
                flag_labels.append("RST")
            if "F" in flags:
                flag_labels.append("FIN")
            flag_str = "-".join(flag_labels) if flag_labels else flags

            self.packets_captured += 1

            # Route to event processor pipeline
            event_processor.process_event(
                source_ip=src_ip,
                destination_port=dst_port,
                destination_ip=dst_ip,
                protocol="TCP",
                tcp_flags=flag_str,
                timestamp=time.time(),
                event_origin="live"
            )

        except Exception as e:
            pass # Keep capture loop resilient

# Global singleton sniffer service
sniffer_service = SnifferService()

