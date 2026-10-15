import React from 'react';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { StatusChip } from '../components/StatusChip';
import { ScoreBar } from '../components/ScoreBar';

/**
 * HowItWorksPage Component
 * Plain-English explanation of PortSentinel's stealth-aware detection process
 * designed for reviewers without networking background.
 */
export const HowItWorksPage = ({ onNavigateRoute }) => {
  return (
    <div style={{ backgroundColor: 'var(--canvas)', minHeight: '100vh', color: 'var(--ink)' }}>
      {/* Top Navigation */}
      <TopBar currentRoute="how-it-works" onNavigateRoute={onNavigateRoute} />

      {/* Main Content Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>
            DETECTION METHODOLOGY
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
            How PortSentinel Works
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
            Traditional firewalls catch aggressive bursts. PortSentinel uses sliding-window pattern analysis to detect patient, low-and-slow reconnaissance.
          </p>
        </div>

        {/* The 3 Main Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '56px' }}>
          {/* Step 1 */}
          <div
            style={{
              backgroundColor: 'var(--canvas-elevated)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-md)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-whisper)',
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 280px) 1fr',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--ink)',
                    color: 'var(--on-primary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)'
                  }}
                >
                  STEP 01
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  visibility
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                Watch connection activity
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
                Every device on a network uses communication channels called <strong>ports</strong>. A standard user accesses ports 80 and 443 for web browsing. PortSentinel observes incoming connection requests over a rolling 60-minute window without inspecting or saving sensitive user payloads.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              backgroundColor: 'var(--canvas-elevated)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-md)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-whisper)',
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 280px) 1fr',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--ink)',
                    color: 'var(--on-primary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)'
                  }}
                >
                  STEP 02
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
                  analytics
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                Look for suspicious patterns
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
                Instead of only counting packet quantities, the system evaluates three core behavior signals:
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: 'var(--body)', lineHeight: 1.6 }}>
                <li><strong>Port Diversity:</strong> Did the host explore multiple different service ports (e.g. SSH, RDP, Telnet)?</li>
                <li><strong>Timing Pattern:</strong> Do attempts happen on machine-like, robotic intervals (e.g., exactly every 12 minutes)?</li>
                <li><strong>Target Criticality:</strong> Are high-value administration ports being targeted rather than public websites?</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              backgroundColor: 'var(--canvas-elevated)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-md)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-whisper)',
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 280px) 1fr',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--ink)',
                    color: 'var(--on-primary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)'
                  }}
                >
                  STEP 03
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--safe)' }}>
                  gavel
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                Assess risk &amp; automate defense
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
                PortSentinel combines the behavioral signals into an intuitive <strong>0–100 Risk Score</strong>. When the score crosses threshold 80, the system triggers a simulated firewall block to safeguard the network. Operators can inspect the full evidence chain and reverse the block at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Short Window vs. Long Sliding Window Comparison */}
        <div
          style={{
            backgroundColor: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-md)',
            padding: '28px',
            boxShadow: 'var(--shadow-whisper)',
            marginBottom: '48px'
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>WHY SLIDING WINDOWS MATTER</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px', margin: 0 }}>
              Fixed Rate Limits vs. PortSentinel Behavioral Memory
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px', margin: 0 }}>
              Why a short 1-minute time window misses stealth scans, while a 60-minute window catches them.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Conventional */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--error)' }}>
                  cancel
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Traditional 60-Second Rule
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', lineHeight: 1.5, marginBottom: '12px' }}>
                Resets counters every 60 seconds. A stealth scanner sending 1 probe every 12 minutes never exceeds the threshold (1 packet &lt; 20 packets/min threshold).
              </p>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--hairline)',
                  padding: '8px 12px',
                  borderRadius: 'var(--rounded-sm)',
                  color: 'var(--error)'
                }}
              >
                Minute 12: 1 probe → Counter resets to 0<br />
                Minute 24: 1 probe → Counter resets to 0<br />
                Verdict: <strong>Evaded indefinitely</strong>
              </div>
            </div>

            {/* PortSentinel */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--safe-border)',
                borderRadius: 'var(--rounded-sm)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--safe)' }}>
                  check_circle
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  PortSentinel 60-Minute Memory
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--body)', lineHeight: 1.5, marginBottom: '12px' }}>
                Preserves temporal history across a 60-minute sliding window. Correlates probe cadence, port spread, and high-risk service targets.
              </p>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--safe-soft)',
                  border: '1px solid var(--safe-border)',
                  padding: '8px 12px',
                  borderRadius: 'var(--rounded-sm)',
                  color: 'var(--safe)'
                }}
              >
                Minute 12: Score rises to 21 (Normal)<br />
                Minute 24: Score rises to 38 (Suspicious)<br />
                Minute 48: Score hits 66 (Confirmed)<br />
                Minute 60: Score hits 84 → <strong>Auto-Blocked</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Real Example Walkthrough */}
        <div
          style={{
            backgroundColor: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-md)',
            padding: '28px',
            boxShadow: 'var(--shadow-whisper)',
            marginBottom: '48px'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--mute)' }}>PRACTICAL EXAMPLE</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px', margin: 0 }}>
              Investigating IP 203.0.113.77 in Plain English
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>WHAT IT DID</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                Probed 6 sensitive ports across 60 minutes
              </div>
              <div style={{ fontSize: '12px', color: 'var(--body)', marginTop: '4px' }}>
                Sent requests to SSH (22), RDP (3389), VNC (5900), Alt-HTTP (8080), NFS (1025), and Telnet (23).
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>HOW IT BEHAVED</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                Robotic 12-minute intervals
              </div>
              <div style={{ fontSize: '12px', color: 'var(--body)', marginTop: '4px' }}>
                Zero delay jitter. Humans browse sporadically; automated tools pace themselves like clockwork.
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>WHAT HAPPENED</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--error)', marginTop: '4px' }}>
                Risk score reached 84 → Blocked
              </div>
              <div style={{ fontSize: '12px', color: 'var(--body)', marginTop: '4px' }}>
                Simulated firewall dropped subsequent packets. Reviewer can unblock with one click.
              </div>
            </div>
          </div>
        </div>

        {/* CTA to Dashboard */}
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            backgroundColor: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-md)'
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            Ready to inspect the live demonstration?
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--body)', marginTop: '6px', marginBottom: '20px' }}>
            Switch between fast scans, stealth scans, and normal traffic in our interactive Security Overview.
          </p>
          <Button
            variant="primary"
            shape="pill"
            size="md"
            icon="terminal"
            onClick={() => onNavigateRoute('dashboard')}
          >
            Launch Security Dashboard
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
