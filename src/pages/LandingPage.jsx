import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { StatusChip } from '../components/StatusChip';
import { ScoreBar } from '../components/ScoreBar';
import { INITIAL_MONITORED_IPS } from '../data/mockData';

/**
 * LandingPage Component (Home)
 * Streamlined to strictly 5 focused sections:
 * A. Hero (Headline, subtext, actions, realistic product preview)
 * B. The Problem & Our Approach (Fast vs slow vs normal visual comparison)
 * C. How It Works (5-step connected workflow)
 * D. Product Features (Risk scores, behavior analysis, activity timeline, threat management)
 * E. Final Action & Academic Footer (CTA, Team B21 credits)
 */
export const LandingPage = ({ onNavigateRoute }) => {
  const [selectedPreviewIpId, setSelectedPreviewIpId] = useState('stealth');
  const [comparisonTab, setComparisonTab] = useState('stealth'); // 'normal' | 'fast' | 'stealth'

  const previewIps = INITIAL_MONITORED_IPS;
  const activePreviewIp = previewIps.find((ip) => ip.id === selectedPreviewIpId) || previewIps[0];

  return (
    <div style={{ backgroundColor: 'var(--canvas)', minHeight: '100vh', color: 'var(--ink)' }}>
      {/* Top Navigation */}
      <TopBar currentRoute="home" onNavigateRoute={onNavigateRoute} />

      {/* =====================================================================
          SECTION A: Hero
          Headline, concise subtext, primary/secondary CTAs, realistic product preview
          ===================================================================== */}
      <section
        style={{
          padding: '64px 24px 56px',
          borderBottom: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas)'
        }}
      >
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 40px' }}>
            {/* Academic badge */}
            <div style={{ marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--body)',
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--hairline)',
                  padding: '3px 10px',
                  borderRadius: 'var(--rounded-full)',
                  boxShadow: 'var(--shadow-whisper)'
                }}
              >
                <span>Vasavi College of Engineering · Team B21</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: '44px',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-1.8px',
                color: 'var(--ink)',
                margin: '0 0 16px 0'
              }}
            >
              Catch suspicious port scans, <br />even the slow ones.
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--body)',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
                maxWidth: '680px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              PortSentinel monitors connection activity, looks for unusual patterns, and helps identify potential port scans before they become a bigger concern.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Button
                variant="primary"
                shape="pill"
                size="md"
                icon="terminal"
                onClick={() => onNavigateRoute('dashboard')}
              >
                Explore Dashboard
              </Button>
              <Button
                variant="secondary"
                shape="pill"
                size="md"
                icon="arrow_forward"
                onClick={() => onNavigateRoute('how-it-works')}
              >
                How It Works
              </Button>
            </div>
          </div>

          {/* Product Preview Card */}
          <div
            style={{
              backgroundColor: 'var(--canvas-elevated)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-md)',
              boxShadow: 'var(--shadow-floating)',
              overflow: 'hidden'
            }}
          >
            {/* Header chrome */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ marginLeft: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                  PortSentinel Command Center (Live Preview)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--safe)' }}>
                  ● 3 Scenarios Ready
                </span>
              </div>
            </div>

            {/* Interactive Preview Body */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', divideX: '1px solid var(--hairline)' }}>
              {/* Left Column: Monitored IPs List */}
              <div style={{ borderRight: '1px solid var(--hairline)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--canvas)' }}>
                  <div className="mono-eyebrow" style={{ color: 'var(--mute)' }}>MONITORED IP ADDRESSES</div>
                </div>
                <div>
                  {previewIps.slice(0, 3).map((item) => {
                    const isSelected = selectedPreviewIpId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPreviewIpId(item.id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--hairline)',
                          borderLeft: isSelected ? '3px solid var(--ink)' : '3px solid transparent',
                          backgroundColor: isSelected ? 'var(--canvas)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                              {item.ip}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--mute)' }}>{item.label}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: item.score >= 80 ? 'var(--error)' : item.score >= 30 ? 'var(--warning-deep)' : 'var(--safe)'
                              }}
                            >
                              {item.score}/100
                            </span>
                          </div>
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <StatusChip status={item.status} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: IP Summary & Risk Curve */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                        {activePreviewIp.ip}
                      </span>
                      <StatusChip status={activePreviewIp.status} size="sm" />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0', maxWidth: '480px' }}>
                      {activePreviewIp.id === 'stealth'
                        ? 'Probed 6 sensitive ports at 12-minute intervals. Threshold exceeded at minute 48.'
                        : activePreviewIp.id === 'fast'
                        ? 'Rapid 50-port SYN burst in 10 seconds. Instant automated isolation.'
                        : 'Routine web browsing on ports 80/443. Consistently safe baseline.'}
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon="arrow_forward"
                    onClick={() => onNavigateRoute('dashboard')}
                  >
                    Open in Dashboard
                  </Button>
                </div>

                {/* Mini SVG timeline curve */}
                <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', padding: '14px', border: '1px solid var(--hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)', marginBottom: '8px' }}>
                    <span>60-MINUTE RISK PROGRESSION</span>
                    <span>CURRENT SCORE: {activePreviewIp.score}/100</span>
                  </div>

                  <svg viewBox="0 0 500 90" style={{ width: '100%', height: '80px', display: 'block' }}>
                    {/* Baseline lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#171717" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                    <text x="495" y="16" textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink)">
                      80 AUTO-BLOCK
                    </text>

                    {/* Score curve */}
                    {activePreviewIp.id === 'stealth' && (
                      <path
                        d="M 10 80 Q 150 75 250 50 T 490 20"
                        fill="none"
                        stroke="var(--ink)"
                        strokeWidth="2.5"
                      />
                    )}
                    {activePreviewIp.id === 'fast' && (
                      <path
                        d="M 10 80 L 100 80 L 110 16 L 490 16"
                        fill="none"
                        stroke="var(--error)"
                        strokeWidth="2.5"
                      />
                    )}
                    {activePreviewIp.id === 'normal' && (
                      <path
                        d="M 10 80 L 120 78 L 240 82 L 360 80 L 490 80"
                        fill="none"
                        stroke="var(--safe)"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* End point marker */}
                    <circle
                      cx="490"
                      cy={activePreviewIp.id === 'stealth' ? '20' : activePreviewIp.id === 'fast' ? '16' : '80'}
                      r="4.5"
                      fill="var(--ink)"
                    />
                  </svg>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--faint)', marginTop: '4px' }}>
                    <span>T-60m</span>
                    <span>T-30m</span>
                    <span>Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION B: The Problem and Our Approach
          Plain English comparison: Fast vs Slow vs Normal
          ===================================================================== */}
      <section
        style={{
          padding: '64px 24px',
          borderBottom: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas-elevated)'
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>THE CHALLENGE</span>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-1px',
                color: 'var(--ink)',
                margin: '6px 0 10px 0'
              }}
            >
              Fast scanners get blocked. Slow scanners slip right past.
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--body)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.5 }}>
              Traditional firewalls rely on volume rules (e.g., "more than 20 packets a minute"). A patient attacker spaces probes 12 minutes apart, staying under the radar indefinitely.
            </p>
          </div>

          {/* Visual Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Scenario 1: Normal Traffic */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Normal Activity
                </span>
                <StatusChip status="Normal" size="sm" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--body)', marginBottom: '12px', lineHeight: 1.5 }}>
                A workstation accessing websites. Hits ports 80 &amp; 443 repeatedly with natural user browsing delay.
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--canvas-elevated)',
                  padding: '8px 10px',
                  borderRadius: 'var(--rounded-sm)',
                  border: '1px solid var(--hairline)',
                  color: 'var(--safe)'
                }}
              >
                Pattern: Low port spread · Risk: 8/100
              </div>
            </div>

            {/* Scenario 2: Fast Scan */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Fast Port Scan
                </span>
                <StatusChip status="Blocked" size="sm" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--body)', marginBottom: '12px', lineHeight: 1.5 }}>
                An aggressive tool probing 50 ports in seconds. Caught instantly by volume-based rules.
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--canvas-elevated)',
                  padding: '8px 10px',
                  borderRadius: 'var(--rounded-sm)',
                  border: '1px solid var(--hairline)',
                  color: 'var(--error)'
                }}
              >
                Pattern: High burst rate · Risk: 87/100
              </div>
            </div>

            {/* Scenario 3: Slow Stealth Scan */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--safe-border)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Potential Slow Scan
                </span>
                <StatusChip status="Blocked" size="sm" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--body)', marginBottom: '12px', lineHeight: 1.5 }}>
                Probes 1 sensitive port every 12 minutes. PortSentinel's sliding memory correlates attempts and blocks it.
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--safe-soft)',
                  padding: '8px 10px',
                  borderRadius: 'var(--rounded-sm)',
                  border: '1px solid var(--safe-border)',
                  color: 'var(--safe)'
                }}
              >
                PortSentinel: Memory across 60m · Risk: 84/100
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION C: How It Works — Connected 5-Step Workflow
          ===================================================================== */}
      <section
        style={{
          padding: '64px 24px',
          borderBottom: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas)'
        }}
      >
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>CONNECTED WORKFLOW</span>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-1px',
                color: 'var(--ink)',
                margin: '6px 0 10px 0'
              }}
            >
              From packet observation to automated defense in 5 steps
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--body)', margin: 0 }}>
              One clean pipeline designed for transparent, explainable threat detection.
            </p>
          </div>

          {/* 5-step horizontal pipeline */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '12px'
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '16px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)', marginBottom: '6px' }}>
                01. MONITOR
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                Monitor connections
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', margin: 0, lineHeight: 1.4 }}>
                Captures incoming port connection attempts across endpoints without saving user data.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '16px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)', marginBottom: '6px' }}>
                02. ANALYZE
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                Look for patterns
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', margin: 0, lineHeight: 1.4 }}>
                Evaluates port diversity, machine-paced delays, and sensitive service targets.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '16px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)', marginBottom: '6px' }}>
                03. EVALUATE
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                Calculate risk
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', margin: 0, lineHeight: 1.4 }}>
                Assigns an illustrative composite score from 0–100 updated in real time.
              </p>
            </div>

            {/* Step 4 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '16px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)', marginBottom: '6px' }}>
                04. CLASSIFY
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                Flag suspicious activity
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', margin: 0, lineHeight: 1.4 }}>
                Identifies hosts crossing Suspicious (30) or Confirmed Scan (60) thresholds.
              </p>
            </div>

            {/* Step 5 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '16px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--safe)', marginBottom: '6px' }}>
                05. MITIGATE
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                Simulate block
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', margin: 0, lineHeight: 1.4 }}>
                Reaches threshold 80 → Auto-blocks host. Easily reviewed and reversed in Block History.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION D: Product Features
          4 visually varied capability showcases
          ===================================================================== */}
      <section
        style={{
          padding: '64px 24px',
          borderBottom: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas-elevated)'
        }}
      >
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>CORE CAPABILITIES</span>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-1px',
                color: 'var(--ink)',
                margin: '6px 0 10px 0'
              }}
            >
              Engineered for clarity and immediate comprehension
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--body)', margin: 0 }}>
              Practical security insights without the clutter of complex dashboards.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Capability 1: Risk Scores */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  speed
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  Risk Scores (0–100)
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', lineHeight: 1.5, marginBottom: '14px' }}>
                See exactly which IPs look suspicious at a single glance with color-coded severity tiers.
              </p>
              <ScoreBar score={84} showLabels={true} height={5} />
            </div>

            {/* Capability 2: Behavior Analysis */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  psychology
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  Behavior Analysis
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', lineHeight: 1.5, marginBottom: '10px' }}>
                Understand what makes an IP unusual: Port Diversity, Timing Pattern, and Target Criticality.
              </p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', backgroundColor: 'var(--canvas-elevated)', border: '1px solid var(--hairline)', borderRadius: '3px' }}>
                  Diversity: 88/100
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', backgroundColor: 'var(--canvas-elevated)', border: '1px solid var(--hairline)', borderRadius: '3px' }}>
                  Timing: 94/100
                </span>
              </div>
            </div>

            {/* Capability 3: Activity Timeline */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  show_chart
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  Activity Timeline
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', lineHeight: 1.5, marginBottom: '10px' }}>
                Inspect how an IP's score changes over time with interactive markers on probed ports.
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                60-min window · Hover markers for ports
              </div>
            </div>

            {/* Capability 4: Threat Management */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  shield
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  Threat Management
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', lineHeight: 1.5, marginBottom: '10px' }}>
                Review detected scans and simulated blocks with one-click reversible unblocking.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusChip status="Blocked" size="sm" />
                <span style={{ fontSize: '11px', color: 'var(--mute)' }}>Safe simulation mode</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION E: Final Action & Academic Footer
          Invitation to explore dashboard + Team B21 credits
          ===================================================================== */}
      <section
        style={{
          padding: '64px 24px',
          backgroundColor: 'var(--canvas)',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 10px 0' }}>
            Experience PortSentinel in Action
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--body)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Open the Security Overview to monitor active connections, inspect behavioral evidence, and simulate quarantine actions.
          </p>
          <Button
            variant="primary"
            shape="pill"
            size="md"
            icon="terminal"
            onClick={() => onNavigateRoute('dashboard')}
          >
            Launch Interactive Dashboard
          </Button>
        </div>
      </section>

      {/* Official Academic Attribution Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas-elevated)',
          padding: '28px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--mute)'
        }}
      >
        <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
          Team B21 — Enosh, M. Bhanu Prasad, Yeshwanth
        </div>
        <div>
          Department of Information Technology, Vasavi College of Engineering (Autonomous), Hyderabad
        </div>
      </footer>
    </div>
  );
};
