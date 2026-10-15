/**
 * PortSentinel Mock Data Store
 * Ground truth for the stealth detection simulation, 4 behavioral profiles,
 * and realistic live packet telemetry feeds.
 *
 * Scoring model:
 * Score = 0.40 * PortDiversity + 0.35 * TimingPattern + 0.25 * TargetCriticality
 * Tiers:
 * 0 - 29: Normal
 * 30 - 59: Suspicious
 * 60 - 79: Confirmed Scan
 * 80 - 100: Blocked (Auto-quarantined)
 */

export const INITIAL_MONITORED_IPS = [
  {
    id: 'stealth',
    ip: '203.0.113.77',
    label: 'Slow / stealth scanner',
    type: 'External Host',
    description: 'Patient, periodic reconnaissance across sensitive administration ports. Clockwork ~12 min intervals designed to evade fixed rate-limits.',
    score: 84,
    status: 'Blocked',
    randomness: 88, // Port Diversity
    timing: 94,     // Timing Pattern (robotic low jitter)
    target: 82,     // Target Criticality (admin ports SSH, RDP, Telnet)
    lastSeen: '14:28:15',
    blockedAt: '14:28:15 (Minute 60)',
    blockReason: 'Multi-factor risk threshold exceeded (84 >= 80). Robotic 12m cadence + sensitive port probing.',
    isAllowlisted: false,
    portsProbed: [22, 3389, 5900, 8080, 1025, 23],
    timelineData: [
      { minute: 0, score: 6, status: 'Normal', port: 22, service: 'SSH', note: 'Initial probe on Port 22' },
      { minute: 12, score: 21, status: 'Normal', port: 3389, service: 'RDP', note: 'Second probe on Port 3389 — fixed delay' },
      { minute: 24, score: 38, status: 'Suspicious', port: 5900, service: 'VNC', note: 'Crosses Suspicious threshold (30)' },
      { minute: 36, score: 52, status: 'Suspicious', port: 8080, service: 'Alt-HTTP', note: 'Fourth distinct port probed' },
      { minute: 48, score: 66, status: 'Confirmed Scan', port: 1025, service: 'NFS-RPC', note: 'Crosses Confirmed Scan threshold (60)' },
      { minute: 60, score: 84, status: 'Blocked', port: 23, service: 'Telnet', note: 'Threshold 80 reached → Simulated auto-block' }
    ]
  },
  {
    id: 'fast',
    ip: '10.0.0.45',
    label: 'Fast port scanner',
    type: 'Automated Script',
    description: 'Burst scanning tool (SYN sweep) probing 50 distinct ports within 10 seconds. Score spiked from 5 to 87 in under a minute.',
    score: 87,
    status: 'Blocked',
    randomness: 96, // Port Diversity
    timing: 75,     // Timing Pattern (sub-second rapid burst)
    target: 88,     // Target Criticality (wide port sweep)
    lastSeen: '14:12:05',
    blockedAt: '14:12:05 (Minute 14)',
    blockReason: 'Burst port sweep (50 ports in 10s) and elevated sensitive target weighting.',
    isAllowlisted: false,
    portsProbed: [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 1521, 3306, 3389, 5432, 5900, 8080],
    timelineData: [
      { minute: 0, score: 5, status: 'Normal', note: 'Idle baseline' },
      { minute: 13, score: 5, status: 'Normal', note: 'Pre-scan idle' },
      { minute: 14, score: 87, status: 'Blocked', note: 'Rapid 50-port SYN burst → Instant simulated block' },
      { minute: 20, score: 87, status: 'Blocked', note: 'Firewall drop rule enforced' },
      { minute: 40, score: 87, status: 'Blocked', note: 'Packets dropped' },
      { minute: 60, score: 87, status: 'Blocked', note: 'Quarantine retained' }
    ]
  },
  {
    id: 'office',
    ip: '172.16.4.9',
    label: 'Suspicious internal host',
    type: 'Internal Workstation',
    description: 'Internal host probing local web application ports. Risk score 52 is elevated and warrants investigation, but has not reached the threshold for blocking.',
    score: 52,
    status: 'Suspicious',
    randomness: 58, // Port Diversity
    timing: 50,     // Timing Pattern (moderate batch pacing)
    target: 46,     // Target Criticality (application web ports)
    lastSeen: '14:26:40',
    blockedAt: null,
    blockReason: null,
    isAllowlisted: false,
    portsProbed: [80, 443, 8080, 8443],
    timelineData: [
      { minute: 0, score: 10, status: 'Normal', note: 'Normal internal traffic' },
      { minute: 15, score: 24, status: 'Normal', port: 80, service: 'HTTP', note: 'Standard port access' },
      { minute: 30, score: 38, status: 'Suspicious', port: 8080, service: 'Alt-HTTP', note: 'Unusual port request — enters Suspicious tier' },
      { minute: 45, score: 48, status: 'Suspicious', port: 8443, service: 'Alt-HTTPS', note: 'Additional service probed' },
      { minute: 60, score: 52, status: 'Suspicious', port: 443, service: 'HTTPS', note: 'Elevated score 52 — awaiting operator review' }
    ]
  },
  {
    id: 'normal',
    ip: '192.168.1.20',
    label: 'Normal user traffic',
    type: 'Corporate Workstation',
    description: 'Standard employee web browsing and SaaS connectivity. Bursty, natural human timing hitting ports 443 and 80 repeatedly.',
    score: 8,
    status: 'Normal',
    randomness: 8,  // Port Diversity (web only)
    timing: 12,     // Timing Pattern (human variance)
    target: 5,      // Target Criticality (standard web ports)
    lastSeen: '14:28:22',
    blockedAt: null,
    blockReason: null,
    isAllowlisted: false,
    portsProbed: [443, 80],
    timelineData: [
      { minute: 0, score: 6, status: 'Normal', port: 443, service: 'HTTPS', note: 'Benign web session' },
      { minute: 15, score: 9, status: 'Normal', port: 80, service: 'HTTP', note: 'Benign web session' },
      { minute: 30, score: 7, status: 'Normal', port: 443, service: 'HTTPS', note: 'Benign web session' },
      { minute: 45, score: 8, status: 'Normal', port: 443, service: 'HTTPS', note: 'Benign web session' },
      { minute: 60, score: 8, status: 'Normal', port: 80, service: 'HTTP', note: 'Stable harmless baseline' }
    ]
  }
];

export const INITIAL_FIREWALL_RULES = [
  {
    id: 'PT-40912',
    ip: '203.0.113.77',
    chain: 'INPUT',
    target: 'DROP',
    protocol: 'TCP',
    reason: 'Stealth Scan: Multi-factor risk score 84 exceeded threshold 80',
    enforcedAt: '14:28:15',
    packetsDropped: 14,
    status: 'ACTIVE'
  },
  {
    id: 'PT-39801',
    ip: '10.0.0.45',
    chain: 'INPUT',
    target: 'DROP',
    protocol: 'ALL',
    reason: 'Fast Scan: SYN burst across 50 ports in 10s',
    enforcedAt: '14:12:05',
    packetsDropped: 342,
    status: 'ACTIVE'
  }
];

export const STATS_SUMMARY = {
  activeMonitoredIPs: 4,
  scansDetected: 2,
  ipsBlocked: 2,
  avgResponseTimeMs: 1.4,
  packetsProcessedPerMin: 16420,
  slidingWindowMinutes: 60
};

// Generate realistic packet log rows
const PORT_NAMES = {
  22: 'SSH',
  23: 'Telnet',
  80: 'HTTP',
  443: 'HTTPS',
  445: 'SMB',
  1025: 'NFS-RPC',
  3389: 'RDP',
  5900: 'VNC',
  8080: 'Alt-HTTP',
  8443: 'Alt-HTTPS'
};

export const INITIAL_PACKET_LOGS = [
  { id: 'pkt-01', time: '14:28:15', srcIp: '203.0.113.77', dstPort: 23, proto: 'TCP SYN', status: 'Blocked', verdict: 'Auto-Blocked by simulated drop rule' },
  { id: 'pkt-02', time: '14:28:14', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-03', time: '14:28:10', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-04', time: '14:27:55', srcIp: '172.16.4.9', dstPort: 8443, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Unusual application service probe' },
  { id: 'pkt-05', time: '14:27:40', srcIp: '192.168.1.20', dstPort: 80, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTP session' },
  { id: 'pkt-06', time: '14:26:40', srcIp: '172.16.4.9', dstPort: 8080, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Unusual application service probe' },
  { id: 'pkt-07', time: '14:26:12', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-08', time: '14:25:01', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-09', time: '14:24:20', srcIp: '172.16.4.9', dstPort: 443, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Internal subnet probe' },
  { id: 'pkt-10', time: '14:23:45', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-11', time: '14:22:15', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-12', time: '14:21:03', srcIp: '172.16.4.9', dstPort: 80, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Internal subnet probe' },
  { id: 'pkt-13', time: '14:20:10', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-14', time: '14:18:22', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-15', time: '14:16:15', srcIp: '203.0.113.77', dstPort: 1025, proto: 'TCP SYN', status: 'Confirmed Scan', verdict: 'Stealth probe (12.1m interval)' },
  { id: 'pkt-16', time: '14:15:40', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-17', time: '14:14:12', srcIp: '192.168.1.20', dstPort: 80, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTP session' },
  { id: 'pkt-18', time: '14:12:05', srcIp: '10.0.0.45', dstPort: 3389, proto: 'TCP SYN', status: 'Blocked', verdict: 'Burst SYN scan → Auto-blocked' },
  { id: 'pkt-19', time: '14:12:04', srcIp: '10.0.0.45', dstPort: 1433, proto: 'TCP SYN', status: 'Blocked', verdict: 'Burst SYN scan' },
  { id: 'pkt-20', time: '14:12:03', srcIp: '10.0.0.45', dstPort: 3306, proto: 'TCP SYN', status: 'Blocked', verdict: 'Burst SYN scan' },
  { id: 'pkt-21', time: '14:12:02', srcIp: '10.0.0.45', dstPort: 1521, proto: 'TCP SYN', status: 'Blocked', verdict: 'Burst SYN scan' },
  { id: 'pkt-22', time: '14:12:01', srcIp: '10.0.0.45', dstPort: 5432, proto: 'TCP SYN', status: 'Blocked', verdict: 'Burst SYN scan' },
  { id: 'pkt-23', time: '14:12:00', srcIp: '10.0.0.45', dstPort: 22, proto: 'TCP SYN', status: 'Blocked', verdict: 'Burst SYN scan' },
  { id: 'pkt-24', time: '14:11:45', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-25', time: '14:10:12', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-26', time: '14:08:44', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-27', time: '14:06:20', srcIp: '172.16.4.9', dstPort: 8080, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Internal service probe' },
  { id: 'pkt-28', time: '14:04:12', srcIp: '203.0.113.77', dstPort: 8080, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Stealth probe (12.0m interval)' },
  { id: 'pkt-29', time: '14:03:50', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-30', time: '14:01:10', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-31', time: '13:59:45', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-32', time: '13:57:12', srcIp: '172.16.4.9', dstPort: 443, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Internal audit probe' },
  { id: 'pkt-33', time: '13:55:04', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-34', time: '13:52:15', srcIp: '203.0.113.77', dstPort: 5900, proto: 'TCP SYN', status: 'Suspicious', verdict: 'Stealth probe (12.0m interval)' },
  { id: 'pkt-35', time: '13:50:20', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-36', time: '13:48:40', srcIp: '192.168.1.20', dstPort: 80, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTP session' },
  { id: 'pkt-37', time: '13:46:11', srcIp: '172.16.4.9', dstPort: 80, proto: 'TCP SYN', status: 'Normal', verdict: 'Internal audit probe' },
  { id: 'pkt-38', time: '13:44:22', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-39', time: '13:42:05', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-40', time: '13:40:15', srcIp: '203.0.113.77', dstPort: 3389, proto: 'TCP SYN', status: 'Normal', verdict: 'Stealth probe (12.1m interval)' },
  { id: 'pkt-41', time: '13:38:50', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-42', time: '13:36:12', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-43', time: '13:34:02', srcIp: '172.16.4.9', dstPort: 80, proto: 'TCP SYN', status: 'Normal', verdict: 'Internal audit probe' },
  { id: 'pkt-44', time: '13:31:45', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-45', time: '13:28:15', srcIp: '203.0.113.77', dstPort: 22, proto: 'TCP SYN', status: 'Normal', verdict: 'Initial reconnaissance probe' },
  { id: 'pkt-46', time: '13:27:10', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-47', time: '13:25:40', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-48', time: '13:23:12', srcIp: '192.168.1.20', dstPort: 80, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTP session' },
  { id: 'pkt-49', time: '13:21:05', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-50', time: '13:19:40', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-51', time: '13:17:15', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-52', time: '13:15:30', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-53', time: '13:14:02', srcIp: '192.168.1.20', dstPort: 80, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTP session' },
  { id: 'pkt-54', time: '13:12:44', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-55', time: '13:10:18', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-56', time: '13:08:22', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-57', time: '13:06:10', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-58', time: '13:04:45', srcIp: '192.168.1.20', dstPort: 80, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTP session' },
  { id: 'pkt-59', time: '13:02:12', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP ACK', status: 'Normal', verdict: 'Benign HTTPS session' },
  { id: 'pkt-60', time: '13:00:00', srcIp: '192.168.1.20', dstPort: 443, proto: 'TCP SYN', status: 'Normal', verdict: 'Benign HTTPS session' }
];

export const getPortService = (port) => PORT_NAMES[port] || 'Unknown';

export const calculateStatus = (score) => {
  if (score >= 80) return 'Blocked';
  if (score >= 60) return 'Confirmed Scan';
  if (score >= 30) return 'Suspicious';
  return 'Normal';
};
