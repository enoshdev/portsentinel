import React, { useState, useEffect, useMemo } from 'react';
import { TopBar } from '../components/TopBar';
import { StatusChip } from '../components/StatusChip';
import { Button } from '../components/Button';
import { ScoreBar } from '../components/ScoreBar';
import { TimelineChart } from '../components/TimelineChart';
import { ThreatActivityChart } from '../components/ThreatActivityChart';
import { Modal } from '../components/Modal';
import { api, createTelemetryWebSocket } from '../services/api';
import { getPortService } from '../data/mockData';

/**
 * DashboardPage Component
 * Connected to FastAPI + SQLite backend with persistent data storage:
 * 1. Overview (4 metrics, Threat Activity line chart, Monitored IPs table, Recent Activity)
 * 2. Threat Analysis (Selected IP summary, Risk progression timeline, 3 plain-English detection signals, observed telemetry, simulate unblock)
 * 3. Block History (Audit table of simulated blocks with unblock action)
 * 4. Phase 2 Real Network Monitoring & Live Sniffing Controls (Scapy + Npcap)
 * 5. Phase 2 Real Traffic Simulation & Testing Suite
 */
export const DashboardPage = ({ onNavigateLanding, onNavigateRoute }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'threat-analysis' | 'block-history'

  // Backend Connection & Data State
  const [backendStatus, setBackendStatus] = useState('loading'); // 'connected' | 'disconnected' | 'loading'
  const [backendError, setBackendError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [monitoredIps, setMonitoredIps] = useState([]);
  const [firewallRules, setFirewallRules] = useState([]);
  const [packetLogs, setPacketLogs] = useState([]);
  const [backendStats, setBackendStats] = useState(null);
  const [selectedIpId, setSelectedIpId] = useState('stealth');

  // Phase 2: Live Network Monitoring & Testing State
  const [monitoringState, setMonitoringState] = useState({
    state: 'Stopped',
    is_monitoring: false,
    selected_interface: null,
    interface_description: null,
    packets_captured: 0,
    npcap_available: true,
    scapy_available: true,
    error_message: null
  });
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [isStartingMonitoring, setIsStartingMonitoring] = useState(false);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [telemetryWsStatus, setTelemetryWsStatus] = useState('disconnected');
  const [clientDevice, setClientDevice] = useState(null);
  const [isClientScanning, setIsClientScanning] = useState(false);
  const [showSimTools, setShowSimTools] = useState(false);

  // Phase 3: Firewall & Mitigation State
  const [firewallStatus, setFirewallStatus] = useState({
    status: 'DRY_RUN',
    is_admin: false,
    dry_run: true,
    auto_block_enabled: false,
    auto_block_threshold: 80,
    active_rules_count: 0,
    total_rules_count: 0,
    protected_ips: ['127.0.0.1', '::1', 'localhost'],
    message: ''
  });
  const [blockModalTarget, setBlockModalTarget] = useState(null);

  // Modal & Toast States
  const [unblockModalIp, setUnblockModalIp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Toast feedback helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch firewall status
  const fetchFirewallStatus = async () => {
    try {
      const status = await api.getFirewallStatus();
      setFirewallStatus(status);
    } catch (e) {
      console.warn('Failed to fetch firewall status:', e);
    }
  };

  // Toggle Auto-Block
  const handleToggleAutoBlock = async () => {
    try {
      const nextState = !firewallStatus.auto_block_enabled;
      const res = await api.setAutoBlock(nextState, firewallStatus.auto_block_threshold);
      setFirewallStatus((prev) => ({ ...prev, auto_block_enabled: nextState }));
      triggerToast(res.message);
    } catch (err) {
      triggerToast(`Auto-block error: ${err.message}`);
    }
  };

  // Toggle Dry-Run
  const handleToggleDryRun = async () => {
    try {
      const nextDryRun = !firewallStatus.dry_run;
      const res = await api.setDryRun(nextDryRun);
      await fetchFirewallStatus();
      triggerToast(res.message);
    } catch (err) {
      triggerToast(`Dry-run toggle error: ${err.message}`);
    }
  };

  // Fetch monitoring diagnostics & interfaces
  const fetchMonitoringStatus = async () => {
    try {
      const status = await api.getMonitoringStatus();
      setMonitoringState(status);
      if (status.selected_interface) {
        setSelectedInterface(status.selected_interface);
      }
    } catch (e) {
      console.warn('Failed to fetch monitoring status:', e);
    }
  };

  const fetchInterfaces = async () => {
    try {
      const ifaces = await api.getInterfaces();
      setInterfaces(ifaces);
      if (ifaces.length > 0 && !selectedInterface) {
        // Prefer interface with active IP address
        const activeIface = ifaces.find((i) => i.ips && i.ips.length > 0 && !i.name.includes('Loopback')) || ifaces[0];
        setSelectedInterface(activeIface.name);
      }
    } catch (e) {
      console.warn('Failed to fetch interfaces:', e);
    }
  };

  // Register and identify current client device (phone / laptop)
  const fetchClientDevice = async () => {
    try {
      const info = await api.getClientDevice();
      setClientDevice(info);
    } catch (e) {
      console.warn('Could not register client device:', e);
    }
  };

  // Connect specific ports from this client device to demonstrate live port & risk calculation
  const handleConnectClientPorts = async (ports, labelText) => {
    setIsClientScanning(true);
    try {
      const res = await api.connectClientPorts(ports);
      triggerToast(`${labelText} (${res.client_ip}) -> Ports ${ports.join(', ')} | Score: ${res.final_score}/100 (${res.final_status})`);
      setClientDevice((prev) =>
        prev
          ? {
              ...prev,
              risk_score: res.final_score,
              status: res.final_status,
              ports_probed: res.ports_probed,
              connection_attempts: res.connection_attempts
            }
          : null
      );
      await fetchDashboardData();
    } catch (err) {
      triggerToast(`Connection error: ${err.message}`);
    } finally {
      setIsClientScanning(false);
    }
  };

  // Trigger real multi-port probe from this client device
  const handleTriggerClientScan = async () => {
    setIsClientScanning(true);
    try {
      const res = await api.triggerClientDeviceScan();
      triggerToast(`🔥 Probed ${res.probed_ports.length} ports from this device (${res.source_ip})! Risk Score: ${res.final_score} (${res.final_status}).`);
      setClientDevice((prev) =>
        prev
          ? {
              ...prev,
              risk_score: res.final_score,
              status: res.final_status,
              ports_probed: res.ports_probed,
              connection_attempts: res.connection_attempts
            }
          : null
      );
      await fetchDashboardData();
    } catch (err) {
      triggerToast(`Scan error: ${err.message}`);
    } finally {
      setIsClientScanning(false);
    }
  };

  // Fetch all primary dashboard data from FastAPI backend
  const fetchDashboardData = async (silent = false) => {
    const isSilent = silent === true;
    if (!isSilent) setIsLoading(true);
    try {
      await api.checkHealth();
      const [statsData, ipsData, rulesData, logsData, fwStatus] = await Promise.all([
        api.getDashboardStats(),
        api.getMonitoredIps(),
        api.getFirewallHistory(),
        api.getConnectionLogs({ limit: 50 }),
        api.getFirewallStatus()
      ]);

      setBackendStats(statsData);
      setMonitoredIps(ipsData);
      setFirewallRules(rulesData);
      setPacketLogs(logsData);
      setFirewallStatus(fwStatus);
      setBackendStatus('connected');
      setBackendError(null);
    } catch (err) {
      if (!isSilent) {
        console.warn('Backend unavailable:', err);
        setBackendStatus('disconnected');
        setBackendError(err.message || 'Cannot reach FastAPI backend server');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchMonitoringStatus();
    fetchInterfaces();
    fetchClientDevice();

    // Background 2s auto-sync so live dashboard never needs manual page refresh
    const syncTimer = setInterval(() => {
      fetchDashboardData(true);
      fetchMonitoringStatus();
    }, 2000);

    return () => clearInterval(syncTimer);
  }, []);

  // Real-time WebSocket Telemetry streaming
  useEffect(() => {
    const ws = createTelemetryWebSocket(
      (telemetry) => {
        if (telemetry.type === 'DATA_CLEARED') {
          fetchDashboardData(true);
          return;
        }
        if (telemetry.type === 'FIREWALL_ACTION') {
          triggerToast(`Automated Mitigation: Blocked ${telemetry.rule?.ip || 'host'} in Windows Firewall!`);
          fetchDashboardData(true);
          return;
        }

        if (telemetry.event_type === 'connection' || telemetry.data?.event_id) {
          const tData = telemetry.data || telemetry;
          // Increment captured packets
          setMonitoringState((prev) => ({
            ...prev,
            packets_captured: (prev.packets_captured || 0) + 1
          }));

          // Prepend new connection event to logs
          const newLog = {
            id: tData.event_id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            time: tData.time || new Date().toLocaleTimeString(),
            srcIp: tData.source_ip,
            dstPort: tData.destination_port,
            protocol: tData.protocol || 'TCP',
            verdict: tData.verdict || 'Observed connection attempt',
            status: tData.status || 'Normal',
            score: tData.score
          };

          setPacketLogs((prev) => [newLog, ...prev.slice(0, 99)]);

          // Update connected client device card if this event belongs to it
          setClientDevice((prevClient) => {
            if (prevClient && prevClient.client_ip === tData.source_ip) {
              return {
                ...prevClient,
                risk_score: tData.score,
                status: tData.status,
                ports_probed: tData.ports_probed || prevClient.ports_probed,
                connection_attempts: tData.connection_attempts ?? ((prevClient.connection_attempts || 1) + 1)
              };
            }
            return prevClient;
          });

          // Update or add IP in monitored list
          setMonitoredIps((prevIps) => {
            const index = prevIps.findIndex((ip) => ip.ip === tData.source_ip);
            if (index >= 0) {
              const updated = [...prevIps];
              const existingPorts = updated[index].portsProbed || [];
              const nextPorts = tData.ports_probed || (existingPorts.includes(tData.destination_port) ? existingPorts : [...existingPorts, tData.destination_port]);
              updated[index] = {
                ...updated[index],
                label: tData.label || updated[index].label,
                score: tData.score,
                status: tData.status,
                randomness: tData.signals?.diversity ?? updated[index].randomness,
                timing: tData.signals?.timing ?? updated[index].timing,
                target: tData.signals?.target ?? updated[index].target,
                unique_ports_count: tData.signals?.unique_ports ?? updated[index].unique_ports_count,
                repeated_attempts_count: tData.signals?.repeated_attempts ?? updated[index].repeated_attempts_count,
                portsProbed: nextPorts,
                connectionAttempts: tData.connection_attempts ?? ((updated[index].connectionAttempts || 1) + 1),
                description: tData.verdict || updated[index].description,
                lastSeen: new Date().toLocaleTimeString()
              };
              return updated;
            } else {
              const newHost = {
                id: `host-${tData.source_ip.replace(/\./g, '-').replace(/:/g, '-')}`,
                ip: tData.source_ip,
                label: tData.label || 'Live Monitored Endpoint',
                type: tData.label || 'Discovered Host',
                description: tData.verdict,
                score: tData.score,
                status: tData.status,
                randomness: tData.signals?.diversity || 0,
                timing: tData.signals?.timing || 0,
                target: tData.signals?.target || 0,
                unique_ports_count: tData.signals?.unique_ports || 1,
                repeated_attempts_count: tData.signals?.repeated_attempts || 0,
                portsProbed: tData.ports_probed || [tData.destination_port],
                connectionAttempts: tData.connection_attempts || 1,
                lastSeen: new Date().toLocaleTimeString(),
                timelineData: []
              };
              return [newHost, ...prevIps];
            }
          });
        } else if (telemetry.event_type === 'monitoring_status') {
          setMonitoringState((prev) => ({ ...prev, ...telemetry }));
        }
      },
      (status) => {
        setTelemetryWsStatus(status);
      }
    );

    return () => {
      ws.close();
    };
  }, []);

  // Start live network monitoring
  const handleStartMonitoring = async () => {
    setIsStartingMonitoring(true);
    try {
      const iface = selectedInterface || (interfaces[0]?.name);
      const res = await api.startMonitoring(iface, 'tcp');
      setMonitoringState(res);
      triggerToast(`Live network monitoring active on ${iface}.`);
    } catch (err) {
      triggerToast(`Capture error: ${err.message}`);
      await fetchMonitoringStatus();
    } finally {
      setIsStartingMonitoring(false);
    }
  };

  // Stop live network monitoring
  const handleStopMonitoring = async () => {
    try {
      const res = await api.stopMonitoring();
      setMonitoringState(res);
      triggerToast('Live network packet collection stopped.');
    } catch (err) {
      triggerToast(`Stop error: ${err.message}`);
    }
  };

  // Run controlled traffic simulation
  const handleRunSimulation = async (type) => {
    setIsSimulatingTraffic(true);
    try {
      if (type === 'fast-scan') {
        const res = await api.simulateFastScan();
        triggerToast(`Fast SYN sweep completed (20 ports in <5s). Risk Score: ${res.final_score} (${res.final_status}).`);
      } else if (type === 'slow-scan') {
        const res = await api.simulateSlowScan();
        triggerToast(`Stealth scan completed (clockwork intervals). Risk Score: ${res.final_score} (${res.final_status}).`);
      } else if (type === 'repeated-port') {
        const res = await api.simulateRepeatedPort();
        triggerToast(`Single-port test: 25 attempts on port 443 evaluated. False-positive prevented (Score: ${res.final_score}).`);
      } else if (type === 'normal') {
        const res = await api.simulateNormalTraffic();
        triggerToast(`Benign web browsing session generated. Score: ${res.final_score} (${res.final_status}).`);
      } else if (type === 'pcap') {
        const res = await api.replayPcap();
        triggerToast(`PCAP replay completed (${res.events_processed} packets routed through detection engine).`);
      }
      await fetchDashboardData();
    } catch (err) {
      triggerToast(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulatingTraffic(false);
    }
  };

  // Active selected IP object
  const activeIp = useMemo(() => {
    if (monitoredIps.length === 0) {
      return {
        id: 'stealth',
        ip: '203.0.113.77',
        label: 'Slow / stealth scanner',
        type: 'External Host',
        description: 'Patient, periodic reconnaissance across sensitive administration ports.',
        score: 84,
        status: 'Blocked',
        randomness: 88,
        timing: 94,
        target: 82,
        portsProbed: [22, 3389, 5900, 8080, 1025, 23],
        timelineData: []
      };
    }
    return monitoredIps.find((ip) => ip.id === selectedIpId || ip.ip === selectedIpId) || monitoredIps[0];
  }, [monitoredIps, selectedIpId]);

  // Reset demonstration data in SQLite via backend API
  const handleResetData = async () => {
    try {
      await api.resetDemoData();
      setSelectedIpId('stealth');
      await fetchDashboardData();
      triggerToast('Demonstration data reset to initial baseline in SQLite.');
    } catch (err) {
      triggerToast(`Reset failed: ${err.message}`);
    }
  };

  // Clear all demonstration/fake data in SQLite for 100% pure real device capture
  const handleClearAllData = async () => {
    try {
      await api.clearAllData();
      setSelectedIpId(null);
      await fetchDashboardData();
      triggerToast('All mock data cleared! Now in 100% Live Capture Mode.');
    } catch (err) {
      triggerToast(`Clear failed: ${err.message}`);
    }
  };

  // Jump from Overview or Block History directly to Threat Analysis with that IP selected
  const handleInvestigateIp = (ipId) => {
    setSelectedIpId(ipId);
    setActiveTab('threat-analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Unblock IP through real backend API (persisted in SQLite)
  const handleConfirmUnblock = async () => {
    if (!unblockModalIp) return;
    const targetIpAddr = unblockModalIp.ip;

    try {
      await api.unblockIp(targetIpAddr);
      await fetchDashboardData();
      triggerToast(`Quarantine removed for ${targetIpAddr}. Persisted in database.`);
    } catch (err) {
      triggerToast(`Failed to unblock: ${err.message}`);
    } finally {
      setUnblockModalIp(null);
    }
  };

  // Block IP through real backend API (persisted in SQLite)
  const handleSimulateBlock = async (ipObj) => {
    try {
      await api.blockIp(ipObj.ip, `Manual quarantine for ${ipObj.ip}`);
      await fetchDashboardData();
      triggerToast(`Quarantine rule created for ${ipObj.ip}. Persisted in database.`);
    } catch (err) {
      triggerToast(`Failed to block: ${err.message}`);
    }
  };

  // Real-time computed summary metrics (updates immediately with WebSocket telemetry)
  const activeStats = useMemo(() => {
    const scansDetected = monitoredIps.filter((i) => i.status === 'Confirmed Scan' || i.status === 'Blocked').length;
    const ipsBlocked = firewallRules.filter((r) => r.status === 'ACTIVE').length;
    const totalDeviceAttempts = monitoredIps.reduce((acc, ip) => acc + (ip.connectionAttempts || 1), 0);
    const activeConnections = Math.max(packetLogs.length, totalDeviceAttempts, backendStats?.activeConnections || 0);
    return {
      activeConnections,
      scansDetected: Math.max(scansDetected, backendStats?.scansDetected || 0),
      ipsBlocked: Math.max(ipsBlocked, backendStats?.ipsBlocked || 0),
      avgResponse: backendStats?.avgResponse || '1.4 ms'
    };
  }, [backendStats, monitoredIps, firewallRules, packetLogs]);

  // Plain English behavioral explanation for the selected IP
  const getPlainEnglishExplanation = (ip) => {
    if (ip.description && !['Slow / stealth scanner', 'Fast port scanner', 'Suspicious internal host', 'Normal user traffic'].includes(ip.description)) {
      return ip.description;
    }
    if (ip.id === 'stealth') {
      return 'This IP address checked multiple sensitive ports at robotic intervals (~12 minutes apart). Because attempts were spread over an hour, suspicion accumulated until reaching the auto-block threshold at minute 60.';
    }
    if (ip.id === 'fast') {
      return 'This IP address contacted distinct ports in rapid sub-second succession, showing automated scanning velocity that triggered an instant quarantine rule.';
    }
    if (ip.id === 'office') {
      return 'This internal computer probed multiple local web application ports. It has been marked as Suspicious for review, but has not reached the threshold for blocking.';
    }
    if (ip.id === 'normal') {
      return 'This workstation repeatedly accessed standard web ports (80 and 443). Normal, benign browsing traffic with no port scanning patterns.';
    }
    return ip.description || 'Observed host network connection attempts analyzed across multi-window observation cycles.';
  };

  // Filter packet logs for selected IP
  const activeIpLogs = useMemo(() => {
    return packetLogs.filter((l) => l.srcIp === activeIp.ip).slice(0, 10);
  }, [packetLogs, activeIp]);

  // Recent events for Overview feed (top 7 events)
  const recentEvents = useMemo(() => {
    return packetLogs.slice(0, 7);
  }, [packetLogs]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--canvas)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Top Bar Chrome with 3 Navigation Tabs */}
      <TopBar
        currentRoute="dashboard"
        dashboardTab={activeTab}
        onSelectDashboardTab={setActiveTab}
        onNavigateRoute={onNavigateRoute || onNavigateLanding}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink)',
            color: 'var(--on-primary)',
            padding: '10px 16px',
            borderRadius: 'var(--rounded-sm)',
            boxShadow: 'var(--shadow-floating)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 300
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--safe)' }}>
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Page Subheader: Identity, Title, Backend Connection Status, and Actions */}
      <div
        style={{
          backgroundColor: 'var(--canvas-elevated)',
          borderBottom: '1px solid var(--hairline)',
          padding: '16px 24px'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.4px', margin: 0 }}>
                {activeTab === 'overview' && 'Security Overview'}
                {activeTab === 'threat-analysis' && 'Threat Analysis & Investigation'}
                {activeTab === 'block-history' && 'Block History & Quarantine Rules'}
              </h1>

              {/* Backend Status Badge */}
              {backendStatus === 'connected' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--safe)',
                    backgroundColor: 'var(--safe-soft)',
                    border: '1px solid var(--safe-border)',
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Persistent SQLite database connected via FastAPI backend"
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--safe)' }} />
                  Backend Connected (SQLite)
                </span>
              )}

              {backendStatus === 'loading' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--mute)',
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)'
                  }}
                >
                  Connecting to Backend...
                </span>
              )}

              {backendStatus === 'disconnected' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--error)',
                    backgroundColor: 'rgba(238, 0, 0, 0.08)',
                    border: '1px solid rgba(238, 0, 0, 0.2)',
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
                  Backend Disconnected
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px', margin: 0 }}>
              {activeTab === 'overview' && 'Monitor connection attempts, investigate suspicious scan patterns, and review quarantined IPs.'}
              {activeTab === 'threat-analysis' && 'Understand why an IP address was flagged, track risk progression over time, and inspect behavioral signals.'}
              {activeTab === 'block-history' && 'Review persistent firewall quarantine records and safely unblock hosts.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="tertiary"
              size="sm"
              icon="refresh"
              onClick={fetchDashboardData}
              title="Refresh telemetry from backend"
            >
              Refresh
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              icon="delete_sweep"
              onClick={handleClearAllData}
              title="Clear all fake and mock data for 100% real live device testing"
              style={{ color: 'var(--error)' }}
            >
              Clear Fake Data
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              icon="restart_alt"
              onClick={handleResetData}
              title="Reset demonstration data to baseline in SQLite"
            >
              Reset Data
            </Button>
          </div>
        </div>
      </div>

      {/* Backend Disconnected Alert Banner */}
      {backendStatus === 'disconnected' && (
        <div
          style={{
            backgroundColor: 'rgba(238, 0, 0, 0.05)',
            borderBottom: '1px solid rgba(238, 0, 0, 0.2)',
            padding: '12px 24px',
            color: 'var(--error-deep)',
            fontSize: '13px'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--error)' }}>
                warning
              </span>
              <span>
                <strong>Backend Server Offline:</strong> Unable to connect to PortSentinel FastAPI server at <code style={{ fontFamily: 'var(--font-mono)' }}>http://127.0.0.1:8000</code>.
                Start the backend using <code style={{ fontFamily: 'var(--font-mono)', backgroundColor: 'var(--canvas)', padding: '2px 6px', borderRadius: '3px' }}>.\.venv\Scripts\uvicorn.exe backend.app.main:app --port 8000</code>.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon="sync"
              onClick={fetchDashboardData}
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Phase 2: Live Network Sniffer & Controlled Traffic Suite */}
      <div
        style={{
          backgroundColor: 'var(--canvas-elevated)',
          borderBottom: '1px solid var(--hairline)',
          padding: '14px 24px',
          boxShadow: 'var(--shadow-whisper)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Row 0: Live Connected Device Tracker (Your Phone / Client) */}
          <div
            style={{
              backgroundColor: 'var(--canvas)',
              border: clientDevice?.risk_score >= 80 ? '1px solid var(--error)' : '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-md)',
              padding: '14px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              boxShadow: clientDevice?.risk_score >= 80 ? '0 0 14px rgba(238, 0, 0, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: clientDevice?.risk_score >= 80 ? 'var(--error-soft)' : 'var(--safe-soft)',
                  color: clientDevice?.risk_score >= 80 ? 'var(--error)' : 'var(--safe)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {clientDevice?.device_type?.toLowerCase().includes('phone') ? 'smartphone' : clientDevice?.device_type?.includes('iPad') ? 'tablet' : 'laptop'}
                </span>
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Live Connected Device Tracker
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: clientDevice?.risk_score >= 80 ? 'var(--error)' : 'var(--safe)',
                      backgroundColor: clientDevice?.risk_score >= 80 ? 'var(--error-soft)' : 'var(--safe-soft)',
                      padding: '2px 8px',
                      borderRadius: 'var(--rounded-sm)'
                    }}
                  >
                    ● {clientDevice?.risk_score >= 80 ? 'FLAGGED AS SCANNER' : 'CONNECTED & MONITORED'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                  {clientDevice ? (
                    <>
                      <span>{clientDevice.device_type}</span>{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}>({clientDevice.client_ip})</span>{' '}
                      <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--mute)' }}>
                        — Ports: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{(clientDevice.ports_probed || [clientDevice.port]).length}</strong> ({(clientDevice.ports_probed || [clientDevice.port]).slice(0, 6).join(', ')}{(clientDevice.ports_probed?.length || 0) > 6 ? '...' : ''}) | Traffic: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{clientDevice.connection_attempts || 1} req</strong> | Score: <strong style={{ color: clientDevice.risk_score >= 80 ? 'var(--error)' : clientDevice.risk_score >= 30 ? 'var(--warning-deep)' : 'var(--safe)' }}>{clientDevice.risk_score}/100</strong>
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--mute)', fontStyle: 'italic' }}>Detecting connecting device...</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="tertiary"
                size="sm"
                icon="language"
                disabled={isClientScanning}
                onClick={() => handleConnectClientPorts([80, 443], 'Web Traffic')}
                title="Connect standard HTTP/HTTPS ports (80, 443) from this device"
              >
                🌐 Web (80, 443)
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                icon="terminal"
                disabled={isClientScanning}
                onClick={() => handleConnectClientPorts([22, 3306], 'SSH & DB Probe')}
                title="Probe sensitive SSH & MySQL ports (22, 3306) from this device"
              >
                🔑 SSH / DB (22, 3306)
              </Button>
              <Button
                variant={clientDevice?.risk_score >= 80 ? 'secondary' : 'primary'}
                size="sm"
                icon="radar"
                loading={isClientScanning}
                onClick={handleTriggerClientScan}
                title="Sweep 12 ports from this device to trigger high-risk scan detection"
                style={clientDevice?.risk_score < 80 ? { backgroundColor: '#f85149', borderColor: '#f85149' } : {}}
              >
                {isClientScanning ? 'Probing Ports...' : '🔥 Scan Ports (12 Ports)'}
              </Button>
            </div>
          </div>

          {/* Row 1: Real Network Packet Sniffer (Windows / Npcap / Scapy) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Genuine Monitoring State Chip: Green only if genuinely capturing */}
              {monitoringState.state === 'Monitoring' && (
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: 'var(--safe)',
                    backgroundColor: 'var(--safe-soft)',
                    border: '1px solid var(--safe-border)',
                    padding: '5px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--safe)',
                      boxShadow: '0 0 8px var(--safe)'
                    }}
                  />
                  Live Sniffing Active (Scapy + Npcap)
                </span>
              )}

              {monitoringState.state === 'Stopped' && (
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--body)',
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    padding: '5px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--mute)' }} />
                  Packet Collection Stopped
                </span>
              )}

              {monitoringState.state === 'Permission required' && (
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--warning-deep)',
                    backgroundColor: 'var(--warning-soft)',
                    border: '1px solid var(--warning-border)',
                    padding: '5px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                  Administrator / Npcap Required
                </span>
              )}

              {monitoringState.state === 'Capture unavailable' && (
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--warning-deep)',
                    backgroundColor: 'var(--warning-soft)',
                    border: '1px solid var(--warning-border)',
                    padding: '5px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                  Capture Unavailable
                </span>
              )}

              {monitoringState.state === 'Error' && (
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--error-deep)',
                    backgroundColor: 'var(--error-soft)',
                    border: '1px solid var(--error-border)',
                    padding: '5px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
                  Capture Error
                </span>
              )}

              {/* Interface Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="interface-select" style={{ fontSize: '11px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                  INTERFACE:
                </label>
                <select
                  id="interface-select"
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  disabled={monitoringState.state === 'Monitoring'}
                  style={{
                    backgroundColor: 'var(--canvas)',
                    color: 'var(--ink)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--rounded-sm)',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    maxWidth: '300px'
                  }}
                >
                  {interfaces.map((iface) => (
                    <option key={iface.name} value={iface.name}>
                      {iface.name} {iface.ips?.length ? `(${iface.ips[0]})` : ''} - {iface.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start / Stop Toggle Button */}
              {monitoringState.state === 'Monitoring' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="stop"
                  onClick={handleStopMonitoring}
                >
                  Stop Capture
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon="play_arrow"
                  onClick={handleStartMonitoring}
                  disabled={isStartingMonitoring}
                >
                  {isStartingMonitoring ? 'Starting...' : 'Start Live Capture'}
                </Button>
              )}
            </div>

            {/* Real-time Telemetry & Counters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Packet Counter */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  backgroundColor: 'var(--canvas)',
                  border: '1px solid var(--hairline)',
                  padding: '4px 10px',
                  borderRadius: 'var(--rounded-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--mute)' }}>
                  layers
                </span>
                <span style={{ color: 'var(--mute)' }}>Packets Captured:</span>
                <strong style={{ color: 'var(--ink)' }}>{monitoringState.packets_captured || 0}</strong>
              </div>

              {/* WebSocket Stream Badge */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: telemetryWsStatus === 'connected' ? 'var(--safe-soft)' : 'var(--canvas)',
                  color: telemetryWsStatus === 'connected' ? 'var(--safe)' : 'var(--mute)',
                  border: `1px solid ${telemetryWsStatus === 'connected' ? 'var(--safe-border)' : 'var(--hairline)'}`,
                  padding: '4px 8px',
                  borderRadius: 'var(--rounded-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title={telemetryWsStatus === 'connected' ? 'WebSocket stream active' : 'WebSocket connecting'}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: telemetryWsStatus === 'connected' ? 'var(--safe)' : 'var(--mute)'
                  }}
                />
                WebSocket: {telemetryWsStatus === 'connected' ? 'Live Stream' : 'Connecting'}
              </div>
            </div>
          </div>

          {/* Row 2: Compact Simulation Toggle + Firewall Enforcement Controls */}
          <div
            style={{
              borderTop: '1px solid var(--hairline)',
              paddingTop: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>
                SIMULATION & BENCHMARK SUITE:
              </span>
              <Button
                variant="tertiary"
                size="sm"
                icon={showSimTools ? 'expand_less' : 'expand_more'}
                onClick={() => setShowSimTools((prev) => !prev)}
              >
                {showSimTools ? 'Hide Simulation Tools' : 'Show Simulation Tools'}
              </Button>
            </div>

            {showSimTools && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
              <Button
                variant="tertiary"
                size="sm"
                icon="bolt"
                disabled={isSimulatingTraffic}
                onClick={() => handleRunSimulation('fast-scan')}
                title="Sends rapid SYN burst across 20 distinct ports within 5 seconds to test fast-scan detection."
              >
                Fast Scan Burst
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                icon="schedule"
                disabled={isSimulatingTraffic}
                onClick={() => handleRunSimulation('slow-scan')}
                title="Sends low-jitter machine-paced probes across sensitive ports to test stealth detection."
              >
                Slow / Stealth Scan
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                icon="repeat"
                disabled={isSimulatingTraffic}
                onClick={() => handleRunSimulation('repeated-port')}
                title="Generates 25 repeated connections to port 443 to verify single-port false-positive prevention."
              >
                Repeated Port 443 Check
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                icon="language"
                disabled={isSimulatingTraffic}
                onClick={() => handleRunSimulation('normal')}
                title="Generates benign web session packets (ports 80 & 443 with human jitter)."
              >
                Normal Web Browsing
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                icon="file_open"
                disabled={isSimulatingTraffic}
                onClick={() => handleRunSimulation('pcap')}
                title="Replays offline PCAP trace through the detection pipeline."
              >
                Replay PCAP File
              </Button>
            </div>
            )}
          </div>

          {/* Row 3: Firewall Enforcement & Automated Mitigation Controls */}
          <div
            style={{
              borderTop: '1px solid var(--hairline)',
              paddingTop: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>
                FIREWALL MITIGATION:
              </span>

              {/* Firewall Status Chip */}
              {firewallStatus.dry_run ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink)',
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    padding: '3px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Rules are tested, validated, and logged to SQLite without modifying OS firewall."
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#888' }} />
                  Mode: Dry-Run Simulation
                </span>
              ) : firewallStatus.is_admin ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--safe)',
                    backgroundColor: 'var(--safe-soft)',
                    border: '1px solid var(--safe-border)',
                    padding: '3px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Real Windows Defender Firewall block rules enforced via netsh advfirewall."
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--safe)', boxShadow: '0 0 6px var(--safe)' }} />
                  Windows Firewall: Active (Elevated)
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--warning-deep)',
                    backgroundColor: 'var(--warning-soft)',
                    border: '1px solid var(--warning-border)',
                    padding: '3px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Administrator privileges required for OS-level firewall modification."
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                  Elevation Required (Run as Admin)
                </span>
              )}

              {/* Mode Toggle Button */}
              <Button
                variant={firewallStatus.dry_run ? 'secondary' : 'primary'}
                size="sm"
                icon={firewallStatus.dry_run ? 'toggle_off' : 'toggle_on'}
                onClick={handleToggleDryRun}
                title={firewallStatus.dry_run ? 'Switch to real Windows Defender Firewall enforcement' : 'Switch to safe dry-run simulation mode'}
              >
                {firewallStatus.dry_run ? 'Enable Real OS Enforcement' : 'Switch to Dry-Run Mode'}
              </Button>

              {/* Auto-Block Toggle Button */}
              <Button
                variant={firewallStatus.auto_block_enabled ? 'primary' : 'tertiary'}
                size="sm"
                icon={firewallStatus.auto_block_enabled ? 'lock' : 'lock_open'}
                onClick={handleToggleAutoBlock}
                title="Automatically apply Windows Firewall block rule when threat score reaches 80/100"
              >
                Auto-Block: {firewallStatus.auto_block_enabled ? 'ENABLED (Score ≥80)' : 'DISABLED (Manual Only)'}
              </Button>
            </div>

            {/* Right side: Rules & Allowlist info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                {firewallRules.filter(r => r.status === 'ACTIVE').length} Active Rules · {firewallStatus.protected_ips?.length || 4} Protected IPs (Loopback safe)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Router */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1240px', width: '100%', margin: '0 auto' }}>
        
        {/* ========================================================================= */}
        {/* SECTION A — OVERVIEW                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Four Compact Summary Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}
            >
              {/* Metric 1: Active Connections */}
              <div
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-whisper)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>ACTIVE CONNECTIONS</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--mute)' }}>
                    hub
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)' }}>
                    {activeStats.activeConnections}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--mute)' }}>
                    recorded events
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Connection attempts in database
                </div>
              </div>

              {/* Metric 2: Scans Detected */}
              <div
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-whisper)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>SCANS DETECTED</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--error)' }}>
                    radar
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600, color: 'var(--error)' }}>
                    {activeStats.scansDetected}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--body)' }}>
                    {activeStats.scansDetected > 0 ? 'Active threats flagged' : 'No active scans'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Exceeded multi-factor threshold
                </div>
              </div>

              {/* Metric 3: IPs Blocked */}
              <div
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-whisper)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>QUARANTINED IPS</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                    shield
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)' }}>
                    {activeStats.ipsBlocked}
                  </span>
                  <span style={{ fontSize: '12px', color: activeStats.ipsBlocked > 0 ? 'var(--error)' : 'var(--mute)' }}>
                    {activeStats.ipsBlocked > 0 ? 'Firewall rules enforced' : 'No blocked hosts'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Persisted in SQLite database
                </div>
              </div>

              {/* Metric 4: Average Response Time */}
              <div
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-whisper)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>EVALUATION SPEED</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--safe)' }}>
                    bolt
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)' }}>
                    {activeStats.avgResponse}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--safe)' }}>
                    in-memory query
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Database lookup latency
                </div>
              </div>
            </div>

            {/* Main Section: Threat Activity Chart */}
            <ThreatActivityChart packetLogs={packetLogs} monitoredIps={monitoredIps} />

            {/* Monitored IPs Compact Table */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--hairline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    Connected Devices & Monitored IPs
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                    Shows every device accessing PortSentinel, which ports it connected to, and its live risk score.
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--mute)',
                    backgroundColor: 'var(--canvas)',
                    padding: '3px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    border: '1px solid var(--hairline)'
                  }}
                >
                  {monitoredIps.length} devices tracked live
                </span>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderBottom: '1px solid var(--hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--mute)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}
                    >
                      <th style={{ padding: '10px 20px' }}>Device & IP Address</th>
                      <th style={{ padding: '10px 16px' }}>Ports Accessed</th>
                      <th style={{ padding: '10px 16px', width: '210px' }}>Risk Score</th>
                      <th style={{ padding: '10px 16px', width: '150px' }}>Status</th>
                      <th style={{ padding: '10px 20px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoredIps.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--mute)', fontSize: '13px' }}>
                          No devices tracked yet. Open the live URL on your phone or start live network capture to see real-time connections.
                        </td>
                      </tr>
                    ) : (
                    monitoredIps.map((item) => {
                      const isHighRisk = item.score >= 80;
                      const ports = item.portsProbed || [];
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid var(--hairline)',
                            transition: 'background-color 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hairline-soft)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                                {item.ip}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--ink)',
                                  backgroundColor: 'var(--canvas)',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--rounded-sm)',
                                  border: '1px solid var(--hairline)',
                                  fontWeight: 500
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                                {ports.length} {ports.length === 1 ? 'port' : 'ports'} · {item.connectionAttempts || 1} {(item.connectionAttempts || 1) === 1 ? 'request' : 'requests'}
                              </span>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {ports.slice(0, 6).map((p) => (
                                  <span
                                    key={p}
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '11px',
                                      color: [21, 22, 23, 3389, 445, 5900].includes(p) ? 'var(--error-deep)' : 'var(--ink)',
                                      backgroundColor: [21, 22, 23, 3389, 445, 5900].includes(p) ? 'var(--error-soft)' : 'var(--canvas)',
                                      border: '1px solid var(--hairline)',
                                      padding: '1px 6px',
                                      borderRadius: '3px'
                                    }}
                                  >
                                    {p} ({getPortService(p)})
                                  </span>
                                ))}
                                {ports.length > 6 && (
                                  <span style={{ fontSize: '11px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                                    +{ports.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: isHighRisk ? 'var(--error)' : item.score >= 30 ? 'var(--warning-deep)' : 'var(--safe)',
                                  minWidth: '48px'
                                }}
                              >
                                {item.score}/100
                              </span>
                              <div style={{ flex: 1, maxWidth: '120px' }}>
                                <ScoreBar score={item.score} showLabels={false} height={5} />
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <StatusChip status={item.status} size="sm" />
                          </td>

                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                            <Button
                              variant={item.status === 'Blocked' ? 'secondary' : 'primary'}
                              size="sm"
                              icon="arrow_forward"
                              onClick={() => handleInvestigateIp(item.id)}
                            >
                              {item.status === 'Blocked' ? 'View details' : 'Investigate'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--hairline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    Recent Connection Events
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                    Chronological network connection attempts stored in the database.
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                  {packetLogs.length} events logged
                </span>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderBottom: '1px solid var(--hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--mute)',
                        textTransform: 'uppercase'
                      }}
                    >
                      <th style={{ padding: '8px 20px', width: '110px' }}>Time</th>
                      <th style={{ padding: '8px 16px', width: '150px' }}>IP Making Connection</th>
                      <th style={{ padding: '8px 16px' }}>Port Accessed & Plain-English Description</th>
                      <th style={{ padding: '8px 20px', width: '140px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {recentEvents.map((evt) => (
                      <tr
                        key={evt.id}
                        style={{ borderBottom: '1px solid var(--hairline)' }}
                      >
                        <td style={{ padding: '10px 20px', color: 'var(--mute)' }}>
                          {evt.time}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--ink)', fontWeight: 500 }}>
                          {evt.srcIp}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--body)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink)', marginRight: '6px' }}>
                            :{evt.dstPort} ({getPortService(evt.dstPort)})
                          </span>
                          — {evt.verdict}
                        </td>
                        <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                          <StatusChip status={evt.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION B — THREAT ANALYSIS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'threat-analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top IP Scenario Selector */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '14px 20px',
                boxShadow: 'var(--shadow-whisper)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  manage_search
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  Select Connected Device / IP:
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {monitoredIps.map((ip) => {
                  const isSelected = selectedIpId === ip.id || selectedIpId === ip.ip;
                  return (
                    <button
                      key={ip.id}
                      onClick={() => setSelectedIpId(ip.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--rounded-sm)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: isSelected ? 600 : 400,
                        backgroundColor: isSelected ? 'var(--ink)' : 'var(--canvas)',
                        color: isSelected ? 'var(--on-primary)' : 'var(--body)',
                        border: isSelected ? '1px solid var(--ink)' : '1px solid var(--hairline)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{ip.ip}</span>
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>({ip.label})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Selected IP Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-whisper)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
              }}
            >
              <div style={{ maxWidth: '680px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    {activeIp.ip}
                  </h2>
                  <StatusChip status={activeIp.status} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--body)',
                      backgroundColor: 'var(--canvas)',
                      padding: '2px 8px',
                      borderRadius: 'var(--rounded-sm)',
                      border: '1px solid var(--hairline)'
                    }}
                  >
                    {activeIp.type}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  {getPlainEnglishExplanation(activeIp)}
                </p>

                {/* Behavioral Granularity: Port Diversity vs Repetition */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--canvas)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--rounded-sm)',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--mute)' }}>
                      filter_list
                    </span>
                    <span style={{ color: 'var(--mute)' }}>Unique Ports Checked:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                      {activeIp.unique_ports_count ?? (activeIp.portsProbed?.length || 1)}
                    </strong>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'var(--canvas)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--rounded-sm)',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--mute)' }}>
                      repeat
                    </span>
                    <span style={{ color: 'var(--mute)' }}>Repeated Single-Port Attempts:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                      {activeIp.repeated_attempts_count ?? 0}
                    </strong>
                  </div>

                  {((activeIp.repeated_attempts_count ?? 0) >= 3 && (activeIp.randomness ?? 0) <= 20) && (
                    <div
                      style={{
                        backgroundColor: 'var(--safe-soft)',
                        border: '1px solid var(--safe-border)',
                        borderRadius: 'var(--rounded-sm)',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        color: 'var(--safe)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        verified
                      </span>
                      <span>Single-Port Protection: Repetitions do not trigger port scan alerts.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Display & Contextual Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: activeIp.score >= 80 ? 'var(--error)' : activeIp.score >= 30 ? 'var(--warning-deep)' : 'var(--safe)'
                      }}
                    >
                      {activeIp.score}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--mute)' }}>/ 100</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                    SUSPICIOUS ACTIVITY SCORE
                  </div>
                </div>

                <div>
                  {activeIp.status === 'Blocked' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="lock_open"
                      onClick={() => setUnblockModalIp(activeIp)}
                    >
                      Unblock Host
                    </Button>
                  ) : (
                    <Button
                      variant="tertiary"
                      size="sm"
                      icon="shield"
                      onClick={() => setBlockModalTarget(activeIp)}
                      title="Enforce quarantine block rule for this host"
                    >
                      Quarantine Host
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Risk Progression: Signature 60-Minute Timeline */}
            <div>
              <TimelineChart ipData={activeIp} height={300} showComparison={true} />
            </div>

            {/* 3. Why this IP was flagged: The 3 Detection Signals Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Why this IP was flagged
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                  Three core behavioral detection signals evaluated across the sliding observation window.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Signal 1: Port Diversity */}
                <div
                  style={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--rounded-sm)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>
                      1. Number of Ports Checked
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: activeIp.randomness >= 70 ? 'var(--error)' : 'var(--ink)' }}>
                      {activeIp.randomness}/100
                    </span>
                  </div>
                  <ScoreBar score={activeIp.randomness} showLabels={false} height={5} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)', marginTop: '10px' }}>
                    {activeIp.randomness >= 70 ? 'Checked multiple different ports' : 'Concentrated on expected services'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {activeIp.randomness >= 70
                      ? `Targeted ${activeIp.portsProbed?.length || 6} different ports across management and service layers.`
                      : 'Connections remain confined to standard web browsing ports (80 and 443).'}
                  </p>
                </div>

                {/* Signal 2: Timing Pattern */}
                <div
                  style={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--rounded-sm)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>
                      2. Frequency of Attempts
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: activeIp.timing >= 70 ? 'var(--error)' : 'var(--ink)' }}>
                      {activeIp.timing}/100
                    </span>
                  </div>
                  <ScoreBar score={activeIp.timing} showLabels={false} height={5} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)', marginTop: '10px' }}>
                    {activeIp.timing >= 70 ? 'Paced robotic intervals detected' : 'Natural human timing variation'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {activeIp.timing >= 70
                      ? 'Attempts follow a deliberate delay pattern designed to stay below fixed rate-limits.'
                      : 'Connection delays vary naturally according to user browsing patterns.'}
                  </p>
                </div>

                {/* Signal 3: Target-Port Pattern */}
                <div
                  style={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--rounded-sm)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>
                      3. Sensitive Ports Accessed
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: activeIp.target >= 70 ? 'var(--error)' : 'var(--ink)' }}>
                      {activeIp.target}/100
                    </span>
                  </div>
                  <ScoreBar score={activeIp.target} showLabels={false} height={5} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)', marginTop: '10px' }}>
                    {activeIp.target >= 70 ? 'Critical administration ports targeted' : 'Standard benign ports'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {activeIp.target >= 70
                      ? 'Probes focus on high-risk administration ports such as SSH, RDP, and Telnet.'
                      : 'Traffic targets harmless public web ports without touching sensitive interfaces.'}
                  </p>
                </div>
              </div>

              {/* Clarification Note */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--hairline-soft)',
                  fontSize: '11px',
                  color: 'var(--mute)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>info</span>
                <span>
                  These three signals are behavioral indicators computed from connection logs stored in the persistent SQLite database.
                </span>
              </div>
            </div>

            {/* 4. Observed Events Table */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--hairline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    Observed Events for {activeIp.ip}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                    Chronological connection observations contributing to this IP address's score.
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                  {activeIpLogs.length} events recorded
                </span>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderBottom: '1px solid var(--hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--mute)',
                        textTransform: 'uppercase'
                      }}
                    >
                      <th style={{ padding: '8px 20px', width: '110px' }}>Timestamp</th>
                      <th style={{ padding: '8px 16px', width: '130px' }}>Port Accessed</th>
                      <th style={{ padding: '8px 16px', width: '100px' }}>Protocol</th>
                      <th style={{ padding: '8px 16px' }}>Observation Summary</th>
                      <th style={{ padding: '8px 20px', width: '140px', textAlign: 'right' }}>Classification</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {activeIpLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--mute)' }}>
                          No specific events recorded in this window.
                        </td>
                      </tr>
                    ) : (
                      activeIpLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                          <td style={{ padding: '10px 20px', color: 'var(--mute)' }}>{log.time}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--ink)', fontWeight: 500 }}>
                            <span
                              style={{
                                backgroundColor: 'var(--hairline-soft)',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                border: '1px solid var(--hairline)'
                              }}
                            >
                              :{log.dstPort} ({getPortService(log.dstPort)})
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--body)' }}>{log.proto}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--body)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
                            {log.verdict}
                          </td>
                          <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                            <StatusChip status={log.status} size="sm" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION C — BLOCK HISTORY                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'block-history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-whisper)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Active Firewall Quarantine Rules
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--body)', margin: '2px 0 0 0' }}>
                  Hosts blocked when their composite suspicious activity score met or exceeded threshold 80. Stored in SQLite.
                </p>
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--safe)',
                  backgroundColor: 'var(--safe-soft)',
                  border: '1px solid var(--safe-border)',
                  padding: '3px 8px',
                  borderRadius: 'var(--rounded-sm)'
                }}
              >
                Persistent SQLite Quarantine
              </span>
            </div>

            {/* Block History Table */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderBottom: '1px solid var(--hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--mute)',
                        textTransform: 'uppercase'
                      }}
                    >
                      <th style={{ padding: '10px 20px', width: '220px' }}>IP & Rule Name</th>
                      <th style={{ padding: '10px 16px', width: '110px' }}>Trigger</th>
                      <th style={{ padding: '10px 16px', width: '160px' }}>Enforcement Mode</th>
                      <th style={{ padding: '10px 16px', width: '120px' }}>Verification</th>
                      <th style={{ padding: '10px 16px' }}>Block Reason</th>
                      <th style={{ padding: '10px 16px', width: '90px' }}>Status</th>
                      <th style={{ padding: '10px 20px', width: '140px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firewallRules.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            padding: '48px 20px',
                            textAlign: 'center',
                            color: 'var(--mute)',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ marginBottom: '8px', fontWeight: 500, color: 'var(--ink)' }}>
                            No quarantine rules recorded
                          </div>
                          <div>
                            All monitored hosts are operating under normal observation.
                          </div>
                          <div style={{ marginTop: '16px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon="restart_alt"
                              onClick={handleResetData}
                            >
                              Restore Baseline Quarantine Scenarios
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      firewallRules.map((rule) => {
                        const associatedIp = monitoredIps.find((i) => i.ip === rule.ip) || {
                          ip: rule.ip,
                          score: 85,
                          status: 'Blocked'
                        };

                        const isRealOS = !rule.isSimulated;
                        const isAuto = rule.isAutomatic;

                        return (
                          <tr
                            key={rule.id}
                            style={{
                              borderBottom: '1px solid var(--hairline)',
                              transition: 'background-color 0.12s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hairline-soft)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                                {rule.ip}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                                {rule.ruleName || `PortSentinel_BLOCK_${rule.ip}`}
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontFamily: 'var(--font-mono)',
                                  backgroundColor: isAuto ? 'var(--warning-soft)' : 'var(--canvas)',
                                  color: isAuto ? 'var(--warning-deep)' : 'var(--ink)',
                                  border: `1px solid ${isAuto ? 'var(--warning-border)' : 'var(--hairline)'}`,
                                  padding: '2px 6px',
                                  borderRadius: '3px'
                                }}
                              >
                                {isAuto ? 'Auto-Mitigated' : 'Manual Block'}
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontFamily: 'var(--font-mono)',
                                  backgroundColor: isRealOS ? 'var(--safe-soft)' : 'var(--canvas)',
                                  color: isRealOS ? 'var(--safe)' : 'var(--body)',
                                  border: `1px solid ${isRealOS ? 'var(--safe-border)' : 'var(--hairline)'}`,
                                  padding: '2px 6px',
                                  borderRadius: '3px'
                                }}
                              >
                                {isRealOS ? 'Real OS (netsh)' : 'Dry-Run Sim'}
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontFamily: 'var(--font-mono)',
                                  color: rule.verificationStatus === 'VERIFIED' ? 'var(--safe)' : 'var(--mute)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                  {rule.verificationStatus === 'VERIFIED' ? 'check_circle' : 'info'}
                                </span>
                                {rule.verificationStatus || 'VERIFIED'}
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--body)' }}>
                              {rule.reason}
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <StatusChip status={rule.status === 'REMOVED' ? 'Normal' : 'Blocked'} size="sm" />
                            </td>

                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              {rule.status === 'ACTIVE' ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon="lock_open"
                                  onClick={() => setUnblockModalIp(associatedIp)}
                                >
                                  Unblock
                                </Button>
                              ) : (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                                  Removed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Block Confirmation Modal */}
      <Modal
        isOpen={!!blockModalTarget}
        onClose={() => setBlockModalTarget(null)}
        title="Confirm Quarantine Block"
        subtitle={`Enforce Windows Firewall rule for IP ${blockModalTarget?.ip}`}
        confirmLabel="Apply Block Rule"
        onConfirm={async () => {
          if (!blockModalTarget) return;
          try {
            await api.blockIp(blockModalTarget.ip, `Manual quarantine for ${blockModalTarget.ip}`);
            await fetchDashboardData();
            triggerToast(`Quarantine rule enforced for ${blockModalTarget.ip}.`);
          } catch (err) {
            triggerToast(`Block failed: ${err.message}`);
          } finally {
            setBlockModalTarget(null);
          }
        }}
        cancelLabel="Cancel"
      >
        <div style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            You are about to enforce an inbound packet block rule for host{' '}
            <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
              {blockModalTarget?.ip}
            </strong>.
          </p>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--ink)',
              marginBottom: '12px'
            }}
          >
            # Policy Details:<br />
            Rule Name: PortSentinel_BLOCK_{blockModalTarget?.ip}<br />
            Mode: {firewallStatus.dry_run ? 'Dry-Run Simulation (Safe)' : 'Windows Defender Firewall (netsh advfirewall)'}<br />
            Direction: Inbound / Protocol: All TCP
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--mute)' }}>
            The rule will be applied, verified by the operating system, and logged to persistent SQLite storage.
          </p>
        </div>
      </Modal>

      {/* Unblock Confirmation Modal */}
      <Modal
        isOpen={!!unblockModalIp}
        onClose={() => setUnblockModalIp(null)}
        title="Unblock Host"
        subtitle={`Remove quarantine rule for IP ${unblockModalIp?.ip}`}
        confirmLabel="Unblock Host"
        onConfirm={handleConfirmUnblock}
        cancelLabel="Cancel"
      >
        <div style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            You are about to remove the quarantine rule for IP address{' '}
            <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
              {unblockModalIp?.ip}
            </strong>.
          </p>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--ink)',
              marginBottom: '12px'
            }}
          >
            # Removal Action:<br />
            Rule Name: PortSentinel_BLOCK_{unblockModalIp?.ip}<br />
            Action: Deletes exact rule from Windows Defender Firewall and sets SQLite status to REMOVED.
          </div>

          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--safe-soft)',
              border: '1px solid var(--safe-border)',
              borderRadius: 'var(--rounded-sm)',
              fontSize: '11px',
              color: 'var(--safe)'
            }}
          >
            <strong>Phase 3 Real Protection:</strong> Rule removal is verified against Windows Firewall, and the host monitoring status is restored to Normal.
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default DashboardPage;
