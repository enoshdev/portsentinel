import React from 'react';
import { Logo } from './Logo';

/**
 * Sidebar Navigation Component
 * Strictly adheres to design.md Section 4:
 * Fixed 220px width, #fafafa canvas background, 1px #ebebeb hairline right border.
 * 4 required sections: Overview, Monitored IPs, Connection Logs, Block History.
 */
export const Sidebar = ({
  activeTab = 'overview', // 'overview', 'monitored-ips', 'connection-logs', 'block-history'
  onSelectTab,
  onNavigateLanding,
  className = ''
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'grid_view' },
    { id: 'monitored-ips', label: 'Monitored IPs', icon: 'dns' },
    { id: 'connection-logs', label: 'Connection Logs', icon: 'terminal' },
    { id: 'block-history', label: 'Block History', icon: 'shield' }
  ];

  return (
    <aside
      className={className}
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--canvas)',
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px',
        userSelect: 'none',
        zIndex: 40
      }}
    >
      {/* Top Brand & Nav Section */}
      <div>
        {/* Brand Header */}
        <div
          onClick={onNavigateLanding}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            marginBottom: '20px',
            cursor: 'pointer',
            borderRadius: 'var(--rounded-sm)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hairline-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Return to Product Landing Page"
        >
          <Logo size={22} showWordmark={true} />
        </div>

        {/* Section Label */}
        <div
          style={{
            padding: '0 10px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--mute)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          Operations
        </div>

        {/* Navigation Item List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--rounded-sm)',
                  backgroundColor: isActive ? 'var(--hairline-soft)' : 'transparent',
                  color: isActive ? 'var(--ink)' : 'var(--body)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--hairline-soft)';
                    e.currentTarget.style.color = 'var(--ink)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--body)';
                  }
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    color: isActive ? 'var(--ink)' : 'var(--mute)'
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status & Academic Info */}
      <div
        style={{
          borderTop: '1px solid var(--hairline)',
          paddingTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Engine Status */}
        <div
          style={{
            padding: '8px 10px',
            backgroundColor: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--safe)',
                display: 'inline-block'
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink)', fontWeight: 600 }}>
              DAEMON SIMULATING
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mute)' }}>
            Sliding Window: 60m<br />
            Buffer: 60 Packets Correlated
          </div>
        </div>

        {/* Back to Landing link */}
        <button
          onClick={onNavigateLanding}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            color: 'var(--body)',
            borderRadius: 'var(--rounded-sm)',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            arrow_back
          </span>
          <span>Back to Landing Page</span>
        </button>

        {/* Team B21 Attribution */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            color: 'var(--mute)',
            padding: '0 4px',
            lineHeight: 1.4
          }}
        >
          Team B21 · Dept of IT<br />
          Vasavi College of Engg
        </div>
      </div>
    </aside>
  );
};
