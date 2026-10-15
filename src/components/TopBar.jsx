import React from 'react';
import { Logo } from './Logo';
import { Button } from './Button';

/**
 * TopBar Component
 * Global Navigation Chrome supporting:
 * - Public Website Navigation: Home, How It Works, Dashboard, About + "Explore Dashboard" CTA
 * - Dashboard Operations Navigation: Overview, Threat Analysis, Block History + "Exit to Home" CTA
 */
export const TopBar = ({
  currentRoute = 'home', // 'home' | 'how-it-works' | 'about' | 'dashboard'
  dashboardTab = 'overview', // 'overview' | 'threat-analysis' | 'block-history'
  onSelectDashboardTab,
  onNavigateRoute,
  className = ''
}) => {
  const isDashboard = currentRoute === 'dashboard';

  // Public website navigation items
  const publicNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'about', label: 'About' }
  ];

  // Dashboard operation tabs
  const dashboardTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'threat-analysis', label: 'Threat Analysis' },
    { id: 'block-history', label: 'Block History' }
  ];

  return (
    <header
      className={className}
      style={{
        height: '60px',
        borderBottom: '1px solid var(--hairline)',
        backgroundColor: 'var(--canvas-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        userSelect: 'none'
      }}
    >
      {/* Brand Logo & Navigation Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div
          onClick={() => onNavigateRoute && onNavigateRoute('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="PortSentinel Home"
        >
          <Logo size={22} showWordmark={true} />
        </div>

        {/* Public Website Navigation Links */}
        {!isDashboard && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {publicNavItems.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigateRoute && onNavigateRoute(item.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: 'var(--font-sans)',
                    backgroundColor: isActive ? 'var(--hairline-soft)' : 'transparent',
                    color: isActive ? 'var(--ink)' : 'var(--body)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--canvas)';
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
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Dashboard 3-Section Navigation Tabs */}
        {isDashboard && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {dashboardTabs.map((tab) => {
              const isActive = dashboardTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectDashboardTab && onSelectDashboardTab(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: 'var(--font-sans)',
                    backgroundColor: isActive ? 'var(--hairline-soft)' : 'transparent',
                    color: isActive ? 'var(--ink)' : 'var(--mute)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--canvas)';
                      e.currentTarget.style.color = 'var(--ink)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--mute)';
                    }
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Trailing Meta & Primary Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Simulated Data Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--safe)',
            backgroundColor: 'var(--safe-soft)',
            border: '1px solid var(--safe-border)',
            padding: '3px 9px',
            borderRadius: 'var(--rounded-full)'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--safe)',
              display: 'inline-block'
            }}
            className="animate-pulse-dot"
          />
          <span>Simulated Data</span>
        </span>

        {isDashboard ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateRoute && onNavigateRoute('home')}
            icon="home"
          >
            Exit to Home
          </Button>
        ) : (
          <Button
            variant="primary"
            shape="pill"
            size="sm"
            onClick={() => onNavigateRoute && onNavigateRoute('dashboard')}
            icon="terminal"
          >
            Explore Dashboard
          </Button>
        )}
      </div>
    </header>
  );
};
