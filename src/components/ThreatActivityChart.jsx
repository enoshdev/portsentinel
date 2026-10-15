import React, { useState } from 'react';

/**
 * ThreatActivityChart Component
 * Displays network-wide threat activity and risk trends over time.
 * Clean, readable SVG line chart with a simple time range control (Last 60 mins / Last 24 hours).
 */
export const ThreatActivityChart = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState('60m'); // '60m' or '24h'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 60-Minute Data (5-minute intervals)
  const data60m = [
    { label: 'T-60m', score: 8, scanVolume: 2, note: 'Normal background traffic' },
    { label: 'T-50m', score: 12, scanVolume: 3, note: '192.168.1.20 HTTPS sessions' },
    { label: 'T-45m', score: 18, scanVolume: 4, note: '203.0.113.77 probe on SSH (22)' },
    { label: 'T-40m', score: 26, scanVolume: 5, note: 'Periodic cadence detected' },
    { label: 'T-35m', score: 32, scanVolume: 8, note: '203.0.113.77 crosses Suspicious (30)' },
    { label: 'T-30m', score: 35, scanVolume: 7, note: 'Probing across multiple distinct ports' },
    { label: 'T-25m', score: 44, scanVolume: 9, note: '172.16.4.9 audit sweep initiated' },
    { label: 'T-20m', score: 56, scanVolume: 12, note: 'Multi-port probing in progress' },
    { label: 'T-15m', score: 88, scanVolume: 54, note: '10.0.0.45 fast SYN burst (Auto-blocked)' },
    { label: 'T-10m', score: 68, scanVolume: 15, note: '10.0.0.45 drop rule active' },
    { label: 'T-5m', score: 74, scanVolume: 18, note: '203.0.113.77 reaches Confirmed Scan (66)' },
    { label: 'Now', score: 84, scanVolume: 21, note: '203.0.113.77 threshold 80 reached (Auto-blocked)' }
  ];

  // 24-Hour Data (2-hour intervals)
  const data24h = [
    { label: '00:00', score: 10, scanVolume: 14, note: 'Nightly baseline' },
    { label: '04:00', score: 12, scanVolume: 18, note: 'Automated backup traffic' },
    { label: '08:00', score: 24, scanVolume: 35, note: 'Workday start, benign web traffic' },
    { label: '10:00', score: 38, scanVolume: 45, note: 'Internal audit scanning subnet' },
    { label: '12:00', score: 42, scanVolume: 50, note: 'Sporadic external probes' },
    { label: '14:00', score: 86, scanVolume: 120, note: 'Peak: Fast burst + stealth scans quarantined' },
    { label: '16:00', score: 55, scanVolume: 65, note: 'Active firewall rules dropping packets' },
    { label: '18:00', score: 30, scanVolume: 32, note: 'Off-peak traffic' },
    { label: '20:00', score: 16, scanVolume: 20, note: 'Normal evening traffic' },
    { label: '22:00', score: 14, scanVolume: 16, note: 'Benign telemetry' }
  ];

  const currentData = timeRange === '60m' ? data60m : data24h;

  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (currentData.length - 1)) * graphWidth;
  const getY = (val) => padding.top + graphHeight - (val / 100) * graphHeight;

  // Path generator
  const linePath = currentData.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.score);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaPath = `${linePath} L ${getX(currentData.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--canvas-elevated)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-md)',
        padding: '20px',
        boxShadow: 'var(--shadow-whisper)'
      }}
    >
      {/* Header & Time Filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
              monitoring
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
              Threat Activity Over Time
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--body)', marginTop: '2px' }}>
            Composite network risk index tracking suspicious port connection patterns.
          </p>
        </div>

        {/* Time Range Selector */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-sm)',
            padding: '2px'
          }}
        >
          <button
            onClick={() => setTimeRange('60m')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: timeRange === '60m' ? 600 : 400,
              borderRadius: 'var(--rounded-sm)',
              backgroundColor: timeRange === '60m' ? 'var(--ink)' : 'transparent',
              color: timeRange === '60m' ? 'var(--on-primary)' : 'var(--body)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Last 60 Minutes
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: timeRange === '24h' ? 600 : 400,
              borderRadius: 'var(--rounded-sm)',
              backgroundColor: timeRange === '24h' ? 'var(--ink)' : 'transparent',
              color: timeRange === '24h' ? 'var(--on-primary)' : 'var(--body)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Last 24 Hours
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="threatAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171717" stopOpacity="0.14" />
              <stop offset="70%" stopColor="#171717" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#171717" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding.left} y1={getY(80)} x2={width - padding.right} y2={getY(80)} stroke="#171717" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <text x={padding.left - 8} y={getY(80) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink)">80</text>
          <text x={width - padding.right} y={getY(80) - 4} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--ink)" opacity="0.7">
            AUTO-BLOCK THRESHOLD
          </text>

          <line x1={padding.left} y1={getY(30)} x2={width - padding.right} y2={getY(30)} stroke="var(--warning)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <text x={padding.left - 8} y={getY(30) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--warning)">30</text>
          <text x={width - padding.right} y={getY(30) - 4} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--warning)" opacity="0.8">
            SUSPICIOUS THRESHOLD
          </text>

          <line x1={padding.left} y1={getY(0)} x2={width - padding.right} y2={getY(0)} stroke="var(--hairline)" strokeWidth="1" />
          <text x={padding.left - 8} y={getY(0) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--mute)">0</text>

          {/* Shaded Area */}
          <path d={areaPath} fill="url(#threatAreaGrad)" />

          {/* Line Path */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {currentData.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.score);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={pt.label}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle cx={cx} cy={cy} r="14" fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 3.5}
                  fill={pt.score >= 80 ? 'var(--ink)' : pt.score >= 30 ? 'var(--warning)' : 'var(--safe)'}
                  stroke="var(--canvas-elevated)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />
                {/* X-axis labels */}
                <text
                  x={cx}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill={isHovered ? 'var(--ink)' : 'var(--mute)'}
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.min(80, Math.max(16, (hoveredIndex / (currentData.length - 1)) * 100))}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--ink)',
              color: 'var(--on-primary)',
              padding: '8px 12px',
              borderRadius: 'var(--rounded-sm)',
              boxShadow: 'var(--shadow-floating)',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              zIndex: 10,
              pointerEvents: 'none',
              minWidth: '200px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--faint)' }}>
              <span>{currentData[hoveredIndex].label}</span>
              <span style={{ color: 'var(--on-primary)', fontWeight: 600 }}>
                Score: {currentData[hoveredIndex].score}/100
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#eaeaea' }}>
              {currentData[hoveredIndex].note}
            </div>
            <div style={{ marginTop: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>
              {currentData[hoveredIndex].scanVolume} connection attempts analyzed
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Note */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--hairline-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--mute)'
        }}
      >
        <span>
          Spikes reflect aggregated multi-factor risk scores exceeding baseline levels during scan attempts.
        </span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          Updated in real time
        </span>
      </div>
    </div>
  );
};
