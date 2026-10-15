import React from 'react';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';

/**
 * AboutPage Component
 * Provides project context, academic background, design principles,
 * and Team B21 credits for Vasavi College of Engineering.
 */
export const AboutPage = ({ onNavigateRoute }) => {
  return (
    <div style={{ backgroundColor: 'var(--canvas)', minHeight: '100vh', color: 'var(--ink)' }}>
      {/* Top Navigation */}
      <TopBar currentRoute="about" onNavigateRoute={onNavigateRoute} />

      {/* Main Content Container */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>
            ACADEMIC CAPSTONE PROJECT
          </span>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 600,
              letterSpacing: '-1.4px',
              color: 'var(--ink)',
              marginTop: '8px',
              marginBottom: '12px'
            }}
          >
            About PortSentinel
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--body)',
              maxWidth: '620px',
              margin: '0 auto',
              lineHeight: 1.5
            }}
          >
            Stealth-Aware Port Scan Detection &amp; Automated Mitigation System engineered for modern network defense.
          </p>
        </div>

        {/* Project Background & Motivation */}
        <div
          style={{
            backgroundColor: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-md)',
            padding: '28px 32px',
            boxShadow: 'var(--shadow-whisper)',
            marginBottom: '32px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px 0' }}>
            Problem Motivation
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            Conventional intrusion detection systems (IDS) and firewalls rely primarily on volumetric rate-limiting—flagging hosts that initiate more than <em>N</em> connections per minute. While effective against noisy automated tools, adversaries have adapted by executing <strong>stealth scans</strong>: probing a single port every 10–15 minutes across hours or days.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
            Because individual probes remain far below static thresholds, conventional firewalls flush their memory and let the reconnaissance succeed undetected. PortSentinel was developed to demonstrate how <strong>temporal behavioral correlation</strong> and <strong>sliding observation windows</strong> expose low-and-slow reconnaissance without raising false alarms on normal traffic.
          </p>
        </div>

        {/* 4 Core Design Principles */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0' }}>
            Core Engineering Principles
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Principle 1 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  history
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Sliding Behavioral Memory
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5, margin: 0 }}>
                Maintains a rolling 60-minute window so evidence from patient probes accumulates rather than vanishing at fixed clock intervals.
              </p>
            </div>

            {/* Principle 2 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--safe)' }}>
                  lock
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Privacy-Preserving
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5, margin: 0 }}>
                Inspects only network header metadata (ports, timestamps, IP addresses). User packet contents and encryption payloads are never decrypted or recorded.
              </p>
            </div>

            {/* Principle 3 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--link)' }}>
                  science
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Safe Academic Simulation
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5, margin: 0 }}>
                Runs in a fully isolated testbed. Blocks and unblocks strictly modify local state, allowing reproducible evaluations without risking host disruption.
              </p>
            </div>

            {/* Principle 4 */}
            <div
              style={{
                backgroundColor: 'var(--canvas-elevated)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-whisper)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  chat
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  Plain-English Transparency
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.5, margin: 0 }}>
                Eliminates unexplained black-box metrics. Every flag connects back to understandable evidence: port spread, robotic pacing, and service sensitivity.
              </p>
            </div>
          </div>
        </div>

        {/* Academic Institution & Team Attribution */}
        <div
          style={{
            backgroundColor: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-md)',
            padding: '28px 32px',
            boxShadow: 'var(--shadow-whisper)',
            marginBottom: '48px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>INSTITUTIONAL AFFILIATION</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px', margin: 0 }}>
                Department of Information Technology
              </h3>
              <div style={{ fontSize: '14px', color: 'var(--body)', marginTop: '4px' }}>
                Vasavi College of Engineering (Autonomous)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mute)' }}>
                Affiliated to Osmania University · Hyderabad, India
              </div>
            </div>

            <div
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--rounded-sm)',
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--ink)',
                fontWeight: 600
              }}
            >
              Major Project Batch 2026 · Team B21
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--hairline)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            <div style={{ padding: '12px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>TEAM MEMBER</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>Enosh</div>
              <div style={{ fontSize: '11px', color: 'var(--body)' }}>Architecture &amp; Core Detection Engine</div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>TEAM MEMBER</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>M. Bhanu Prasad</div>
              <div style={{ fontSize: '11px', color: 'var(--body)' }}>Telemetry Ingestion &amp; Pattern Analysis</div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>TEAM MEMBER</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>Yeshwanth</div>
              <div style={{ fontSize: '11px', color: 'var(--body)' }}>Mitigation Logic &amp; Evaluation Testing</div>
            </div>
          </div>
        </div>

        {/* CTA to Dashboard */}
        <div style={{ textAlign: 'center' }}>
          <Button
            variant="primary"
            shape="pill"
            size="md"
            icon="terminal"
            onClick={() => onNavigateRoute('dashboard')}
          >
            Open Interactive Security Dashboard
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas-elevated)',
          padding: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--mute)'
        }}
      >
        <div>Team B21 — Enosh, M. Bhanu Prasad, Yeshwanth | Department of IT, Vasavi College of Engineering</div>
      </footer>
    </div>
  );
};
