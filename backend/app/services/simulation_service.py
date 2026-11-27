import os
import time
import random
from typing import Dict, List, Any
from backend.app.services.event_processor import event_processor

try:
    from scapy.all import IP, IPv6, TCP, wrpcap, rdpcap
    SCAPY_PCAP_AVAILABLE = True
except Exception:
    SCAPY_PCAP_AVAILABLE = False

class SimulationService:
    """
    Controlled traffic generator and PCAP replay service for demonstrating and testing
    detection algorithms without attacking external systems.
    """

    def generate_normal_traffic(self, source_ip: str = "192.168.1.105", count: int = 15) -> Dict[str, Any]:
        """Generates benign web browsing traffic hitting ports 80 and 443 with natural timing variance."""
        events_generated = []
        base_time = time.time() - (count * 4)

        for i in range(count):
            t = base_time + (i * 4) + random.uniform(0.5, 3.5) # Sporadic human gaps
            port = 443 if random.random() < 0.75 else 80
            evt = event_processor.process_event(
                source_ip=source_ip,
                destination_port=port,
                protocol="TCP",
                tcp_flags="ACK",
                timestamp=t,
                event_origin="live"
            )
            events_generated.append(evt)

        return {
            "type": "NORMAL_TRAFFIC",
            "source_ip": source_ip,
            "events_count": len(events_generated),
            "summary": "Simulated benign web session (ports 80/443 with human variance)",
            "final_status": events_generated[-1]["status"] if events_generated else "Normal",
            "final_score": events_generated[-1]["score"] if events_generated else 0
        }

    def generate_repeated_single_port(self, source_ip: str = "192.168.1.180", count: int = 25, port: int = 443) -> Dict[str, Any]:
        """Generates repeated connection attempts against a single port (retries / heavy browsing)."""
        events_generated = []
        base_time = time.time() - (count * 2)

        for i in range(count):
            t = base_time + (i * 2) + random.uniform(0.1, 0.5)
            evt = event_processor.process_event(
                source_ip=source_ip,
                destination_port=port,
                protocol="TCP",
                tcp_flags="SYN",
                timestamp=t,
                event_origin="live"
            )
            events_generated.append(evt)

        return {
            "type": "REPEATED_SINGLE_PORT",
            "source_ip": source_ip,
            "port": port,
            "events_count": len(events_generated),
            "summary": f"{count} repeated connection attempts on port {port}. Verified single-port exemption.",
            "final_status": events_generated[-1]["status"] if events_generated else "Normal",
            "final_score": events_generated[-1]["score"] if events_generated else 0,
            "is_repeated_single_port": True
        }

    def generate_fast_scan(self, source_ip: str = "10.0.0.99", port_count: int = 20) -> Dict[str, Any]:
        """Generates a rapid multi-port SYN sweep probing 20 distinct ports within 5 seconds."""
        target_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 1521, 3306, 3389, 5432, 5900, 8080]
        events_generated = []
        base_time = time.time() - 5.0

        for i, port in enumerate(target_ports[:port_count]):
            t = base_time + (i * 0.2) # Sub-second rapid burst
            evt = event_processor.process_event(
                source_ip=source_ip,
                destination_port=port,
                protocol="TCP",
                tcp_flags="SYN",
                timestamp=t,
                event_origin="live"
            )
            events_generated.append(evt)

        return {
            "type": "FAST_SCAN",
            "source_ip": source_ip,
            "ports_probed": target_ports[:port_count],
            "events_count": len(events_generated),
            "summary": f"Fast SYN sweep across {len(events_generated)} distinct ports in under 5 seconds.",
            "final_status": events_generated[-1]["status"] if events_generated else "Blocked",
            "final_score": events_generated[-1]["score"] if events_generated else 85
        }

    def generate_slow_scan(self, source_ip: str = "203.0.113.199", probe_count: int = 6) -> Dict[str, Any]:
        """Generates a slow/stealth scan probing sensitive ports at fixed clockwork intervals (~12m simulated)."""
        target_ports = [22, 3389, 5900, 8080, 1025, 23]
        events_generated = []
        now = time.time()
        # Simulated 12-minute intervals (720 seconds each)
        interval_seconds = 720

        for i, port in enumerate(target_ports[:probe_count]):
            # Probes spread out: minute 0, 12, 24, 36, 48, 60
            t = (now - 3600) + (i * interval_seconds) + random.uniform(-2, 2) # Low robotic jitter (CV < 0.1)
            evt = event_processor.process_event(
                source_ip=source_ip,
                destination_port=port,
                protocol="TCP",
                tcp_flags="SYN",
                timestamp=t,
                event_origin="live"
            )
            events_generated.append(evt)

        return {
            "type": "SLOW_SCAN",
            "source_ip": source_ip,
            "ports_probed": target_ports[:probe_count],
            "events_count": len(events_generated),
            "summary": f"Stealth scan: {len(events_generated)} sensitive ports probed at machine-paced ~12 min intervals.",
            "final_status": events_generated[-1]["status"] if events_generated else "Confirmed Scan",
            "final_score": events_generated[-1]["score"] if events_generated else 80
        }

    def create_sample_pcap(self, file_path: str) -> str:
        """Creates a sample .pcap file on disk containing a fast sweep and slow probes."""
        if not SCAPY_PCAP_AVAILABLE:
            raise RuntimeError("Scapy is required to generate PCAP files.")

        packets = []
        base_time = time.time() - 60

        # Fast sweep packets from 10.0.0.88
        for i, port in enumerate([22, 80, 443, 3389, 8080, 21, 23, 445]):
            pkt = IP(src="10.0.0.88", dst="192.168.1.1") / TCP(sport=50000 + i, dport=port, flags="S")
            pkt.time = base_time + (i * 0.3)
            packets.append(pkt)

        # Normal browsing from 192.168.1.55
        for i in range(10):
            pkt = IP(src="192.168.1.55", dst="192.168.1.1") / TCP(sport=60000 + i, dport=443, flags="A")
            pkt.time = base_time + (i * 3.5)
            packets.append(pkt)

        wrpcap(file_path, packets)
        return file_path

    def replay_pcap(self, file_path: str) -> Dict[str, Any]:
        """Reads a .pcap file and streams packets into the event processor pipeline."""
        if not SCAPY_PCAP_AVAILABLE:
            raise RuntimeError("Scapy is required to read PCAP files.")

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PCAP file not found: {file_path}")

        packets = rdpcap(file_path)
        events_processed = 0

        for pkt in packets:
            if pkt.haslayer(TCP) and (pkt.haslayer(IP) or pkt.haslayer(IPv6)):
                src_ip = pkt[IP].src if pkt.haslayer(IP) else pkt[IPv6].src
                dst_ip = pkt[IP].dst if pkt.haslayer(IP) else pkt[IPv6].dst
                dst_port = int(pkt[TCP].dport)
                flags = str(pkt[TCP].flags)
                pkt_time = float(pkt.time) if hasattr(pkt, "time") else time.time()

                event_processor.process_event(
                    source_ip=src_ip,
                    destination_port=dst_port,
                    destination_ip=dst_ip,
                    protocol="TCP",
                    tcp_flags=flags,
                    timestamp=pkt_time,
                    event_origin="pcap_replay"
                )
                events_processed += 1

        return {
            "file": file_path,
            "packets_in_file": len(packets),
            "events_processed": events_processed,
            "origin": "pcap_replay"
        }

# Global singleton simulation service
simulation_service = SimulationService()
