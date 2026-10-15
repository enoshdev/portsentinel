import React, { useState, useMemo } from 'react';
import { TopBar } from '../components/TopBar';
import { StatusChip } from '../components/StatusChip';
import { Button } from '../components/Button';
import { ScoreBar } from '../components/ScoreBar';
import { TimelineChart } from '../components/TimelineChart';
import { ThreatActivityChart } from '../components/ThreatActivityChart';
import { Modal } from '../components/Modal';
import {
  INITIAL_MONITORED_IPS,
  INITIAL_FIREWALL_RULES,
  STATS_SUMMARY,
  INITIAL_PACKET_LOGS,
  getPortService
} from '../data/mockData';

/**
 * DashboardPage Component
 * Redesigned clean, intuitive 3-section Security Dashboard:
 * 1. Overview (4 compact metrics, Threat Activity line chart, Monitored IPs table, Recent Activity)
 * 2. Threat Analysis (Selected IP summary, Risk progression timeline, 3 plain-English detection signals, observed telemetry, simulate unblock)
 * 3. Block History (Audit table of simulated blocks with unblock action)
 */
export const DashboardPage = ({ onNavigateLanding, onNavigateRoute }) => {
  // Navigation State: Exactly 3 sections per specification
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'threat-analysis' | 'block-history'

  // Shared Data Store State
  const [monitoredIps, setMonitoredIps] = useState(INITIAL_MONITORED_IPS);
  const [firewallRules, setFirewallRules] = useState(INITIAL_FIREWALL_RULES);
  const [selectedIpId, setSelectedIpId] = useState('stealth'); // default scenario: stealth scan

  // Modal & Toast States
  const [unblockModalIp, setUnblockModalIp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Active selected IP object
  const activeIp = useMemo(() => {
    return monitoredIps.find((ip) => ip.id === selectedIpId) || monitoredIps[0];
  }, [monitoredIps, selectedIpId]);

  // Toast feedback helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset simulation state to initial baseline
  const handleResetData = () => {
    setMonitoredIps(INITIAL_MONITORED_IPS);
    setFirewallRules(INITIAL_FIREWALL_RULES);
    setSelectedIpId('stealth');
    triggerToast('Demonstration data reset to initial baseline.');
  };

  // Jump from Overview or Block History directly to Threat Analysis with that IP selected
  const handleInvestigateIp = (ipId) => {
    setSelectedIpId(ipId);
    setActiveTab('threat-analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simulate manual unblocking
  const handleConfirmUnblock = () => {
    if (!unblockModalIp) return;

    const targetIpAddr = unblockModalIp.ip;

    // Update monitored IP status to Normal
    setMonitoredIps((prev) =>
      prev.map((item) => {
        if (item.ip === targetIpAddr) {
          return {
            ...item,
            status: 'Normal',
            score: Math.min(item.score, 25),
            blockedAt: null,
            blockReason: 'Simulated unblock triggered during review'
          };
        }
        return item;
      })
    );

    // Remove from active firewall rules
    setFirewallRules((prev) => prev.filter((r) => r.ip !== targetIpAddr));

    const ipLabel = unblockModalIp.ip;
    setUnblockModalIp(null);
    triggerToast(`Simulated drop rule removed for ${ipLabel}. Host restored to normal monitoring.`);
  };

  // Simulate manual block (for demonstration)
  const handleSimulateBlock = (ipObj) => {
    setMonitoredIps((prev) =>
      prev.map((item) => {
        if (item.id === ipObj.id) {
          return {
            ...item,
            status: 'Blocked',
            score: Math.max(item.score, 85),
            blockedAt: new Date().toLocaleTimeString()
          };
        }
        return item;
      })
    );

    if (!firewallRules.some((r) => r.ip === ipObj.ip)) {
      setFirewallRules((prev) => [
        {
          id: `PT-${Math.floor(10000 + Math.random() * 90000)}`,
          ip: ipObj.ip,
          chain: 'INPUT',
          target: 'DROP',
          protocol: 'TCP',
          reason: `Manual test: Risk score ${Math.max(ipObj.score, 85)} exceeded threshold 80`,
          enforcedAt: new Date().toLocaleTimeString(),
          packetsDropped: 1,
          status: 'ACTIVE'
        },
        ...prev
      ]);
    }

    triggerToast(`Simulated block enforced for ${ipObj.ip}.`);
  };

  // Computed summary metrics
  const activeStats = useMemo(() => {
    const totalConnections = 42; // total active TCP flows
    const scansDetected = monitoredIps.filter((i) => i.status === 'Confirmed Scan' || i.status === 'Blocked').length;
    const ipsBlocked = monitoredIps.filter((i) => i.status === 'Blocked').length;
    return {
      activeConnections: totalConnections,
      scansDetected,
      ipsBlocked,
      avgResponse: '1.4 ms'
    };
  }, [monitoredIps]);

  // Plain English behavioral explanation for the selected IP
  const getPlainEnglishExplanation = (ip) => {
    if (ip.id === 'stealth') {
      return 'This source contacted different ports across a longer observation window (~12m intervals). Suspicious evidence accumulated over time until crossing the auto-block threshold at minute 60.';
    }
    if (ip.id === 'fast') {
      return 'This source contacted 50 distinct ports within a few seconds, showing automated scan velocity that triggered an immediate simulated block.';
    }
    if (ip.id === 'office') {
      return 'This internal host probed multiple web application ports across the subnet. It is flagged as Suspicious for operator review, but does not meet the threshold for blocking.';
    }
    return 'This workstation repeatedly accessed standard web ports (80/443). Normal, benign traffic with no scan patterns detected.';
  };

  // Filter packet logs for selected IP
  const activeIpLogs = useMemo(() => {
    return INITIAL_PACKET_LOGS.filter((l) => l.srcIp === activeIp.ip).slice(0, 10);
  }, [activeIp]);

  // Recent events for Overview feed (top 7 events)
  const recentEvents = useMemo(() => {
    return INITIAL_PACKET_LOGS.slice(0, 7);
  }, []);

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

      {/* 2. Page Subheader: Identity, Title, and Demo Mode indicator */}
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
                {activeTab === 'block-history' && 'Block History & Active Rules'}
              </h1>
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
                PortSentinel v1.0
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px', margin: 0 }}>
              {activeTab === 'overview' && 'Monitor connections, investigate suspicious activity, and review blocked threats.'}
              {activeTab === 'threat-analysis' && 'Examine why an IP was flagged, track risk score progression over time, and inspect behavioral evidence.'}
              {activeTab === 'block-history' && 'Review previous simulated firewall quarantine actions and safely reverse blocks.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="tertiary"
              size="sm"
              icon="restart_alt"
              onClick={handleResetData}
              title="Reset demonstration data to baseline"
            >
              Reset Data
            </Button>
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
                    across 4 hosts
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Live sliding telemetry window
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
                    1 Fast · 1 Stealth
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
                  <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>IPS BLOCKED</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                    shield
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)' }}>
                    {activeStats.ipsBlocked}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--error)' }}>
                    Simulated DROP
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Reversible in Block History
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
                  <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>AVG RESPONSE TIME</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--safe)' }}>
                    bolt
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)' }}>
                    {activeStats.avgResponse}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--safe)' }}>
                    eBPF speed
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '4px' }}>
                  Kernel-level detection latency
                </div>
              </div>
            </div>

            {/* Main Section: Threat Activity Chart */}
            <ThreatActivityChart />

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
                    Monitored IP Addresses
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                    Click "Investigate" on any row to open its detailed Threat Analysis breakdown.
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
                  {monitoredIps.length} endpoints tracked
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
                      <th style={{ padding: '10px 20px', width: '220px' }}>IP Address</th>
                      <th style={{ padding: '10px 16px', width: '240px' }}>Risk Score</th>
                      <th style={{ padding: '10px 16px', width: '160px' }}>Status</th>
                      <th style={{ padding: '10px 20px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoredIps.map((item) => {
                      const isHighRisk = item.score >= 80;
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                                {item.ip}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--mute)',
                                  backgroundColor: 'var(--canvas)',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--rounded-sm)',
                                  border: '1px solid var(--hairline)'
                                }}
                              >
                                {item.label}
                              </span>
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
                              <div style={{ flex: 1, maxWidth: '140px' }}>
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
                    })}
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
                    Recent Activity
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                    Latest connection attempts and detection verdicts across the network.
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                  Live stream
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
                      <th style={{ padding: '8px 16px', width: '150px' }}>Source IP</th>
                      <th style={{ padding: '8px 16px' }}>Event Description</th>
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
                  Select Demonstration Scenario:
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {monitoredIps.map((ip) => {
                  const isSelected = selectedIpId === ip.id;
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
                <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.5, margin: 0 }}>
                  {getPlainEnglishExplanation(activeIp)}
                </p>
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
                    OVERALL RISK SCORE
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
                      Simulate Unblock
                    </Button>
                  ) : (
                    <Button
                      variant="tertiary"
                      size="sm"
                      icon="shield"
                      onClick={() => handleSimulateBlock(activeIp)}
                      title="Test enforcement behavior for this IP"
                    >
                      Simulate Block
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
                      1. Port Diversity
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: activeIp.randomness >= 70 ? 'var(--error)' : 'var(--ink)' }}>
                      {activeIp.randomness}/100
                    </span>
                  </div>
                  <ScoreBar score={activeIp.randomness} showLabels={false} height={5} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)', marginTop: '10px' }}>
                    {activeIp.randomness >= 70 ? 'Explored multiple distinct ports' : 'Concentrated on expected services'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {activeIp.randomness >= 70
                      ? `Targeted ${activeIp.portsProbed?.length || 6} different ports across management and service layers.`
                      : 'Connections remain confined to standard web browsing ports (80/443).'}
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
                      2. Timing Pattern
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: activeIp.timing >= 70 ? 'var(--error)' : 'var(--ink)' }}>
                      {activeIp.timing}/100
                    </span>
                  </div>
                  <ScoreBar score={activeIp.timing} showLabels={false} height={5} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)', marginTop: '10px' }}>
                    {activeIp.timing >= 70 ? 'Paced machine cadence detected' : 'Natural human timing variance'}
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
                      3. Target-Port Pattern
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: activeIp.target >= 70 ? 'var(--error)' : 'var(--ink)' }}>
                      {activeIp.target}/100
                    </span>
                  </div>
                  <ScoreBar score={activeIp.target} showLabels={false} height={5} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)', marginTop: '10px' }}>
                    {activeIp.target >= 70 ? 'Critical admin ports targeted' : 'Standard benign ports'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {activeIp.target >= 70
                      ? 'Probes focus on high-risk administration vectors such as SSH, RDP, and Telnet.'
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
                  These three signals are illustrative detection indicators demonstrating the proposed multi-factor model, not independently validated attack probabilities.
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
                    Chronological packet observations contributing to this IP's risk calculation.
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
                      <th style={{ padding: '8px 16px', width: '130px' }}>Port / Service</th>
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
                  Active Simulated Firewall Rules
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--body)', margin: '2px 0 0 0' }}>
                  Hosts automatically blocked when their composite risk score met or exceeded threshold 80.
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
                Safe Demonstration Environment
              </span>
            </div>

            {/* Straightforward Block History Table */}
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
                      <th style={{ padding: '10px 20px', width: '160px' }}>IP Address</th>
                      <th style={{ padding: '10px 16px', width: '120px' }}>Time</th>
                      <th style={{ padding: '10px 16px' }}>Reason</th>
                      <th style={{ padding: '10px 16px', width: '110px' }}>Risk Score</th>
                      <th style={{ padding: '10px 16px', width: '130px' }}>Current Status</th>
                      <th style={{ padding: '10px 20px', width: '160px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firewallRules.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            padding: '48px 20px',
                            textAlign: 'center',
                            color: 'var(--mute)',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ marginBottom: '8px', fontWeight: 500, color: 'var(--ink)' }}>
                            No active simulated blocks
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
                              Restore Sample Blocked Scenarios
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
                              <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                                Rule ID: {rule.id}
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--mute)' }}>
                              {rule.enforcedAt}
                            </td>

                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--body)' }}>
                              {rule.reason}
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: 'var(--error)'
                                }}
                              >
                                {associatedIp.score}/100
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <StatusChip status="Blocked" size="sm" />
                            </td>

                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon="lock_open"
                                onClick={() => setUnblockModalIp(associatedIp)}
                              >
                                Simulate Unblock
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
          </div>
        )}
      </main>

      {/* Unblock Confirmation Modal */}
      <Modal
        isOpen={!!unblockModalIp}
        onClose={() => setUnblockModalIp(null)}
        title="Simulate Unblock"
        subtitle={`Remove simulated firewall block for IP ${unblockModalIp?.ip}`}
        confirmLabel="Simulate Unblock"
        onConfirm={handleConfirmUnblock}
        cancelLabel="Cancel"
      >
        <div style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            You are about to remove the simulated quarantine rule for IP{' '}
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
            # Simulated Action:<br />
            DROP rule removed · Host risk score reset to normal monitoring baseline (25/100)
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
            <strong>Academic Demo Safe Mode:</strong> This action strictly modifies the demonstration state and does not execute system-level commands on your operating system.
          </div>
        </div>
      </Modal>
    </div>
  );
};
