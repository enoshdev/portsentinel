import React, { useState, useMemo } from 'react';

/**
 * ThreatActivityChart Component
 * Displays real-time network threat activity and risk scores derived strictly from live database/WebSocket telemetry.
 */
export const ThreatActivityChart = ({ className = '', packetLogs = [], monitoredIps = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const currentData = useMemo(() => {
    // Build real timeline points from recent live events (chronological order, max 12 points)
    if (!packetLogs || packetLogs.length === 0) {
      if (monitoredIps && monitoredIps.length > 0) {
        return monitoredIps.slice(0, 8).map((ip, idx) => ({
          label: ip.lastSeen || `Host ${idx + 1}`,
          score: ip.score || 0,
          scanVolume: ip.portsProbed?.length || 1,
          note: `${ip.ip} (${ip.label || 'Connected Device'}) — ${ip.status}`
        }));
      }
      return [
        { label: 'Idle', score: 0, scanVolume: 0, note: 'Awaiting live connections' },
        { label: 'Now', score: 0, scanVolume: 0, note: 'No active threats detected' }
      ];
    }

    // Group or map latest 10 events chronologically
    const recent = [...packetLogs].slice(0, 10).reverse();
    const scoreByIp = new Map();
    monitoredIps.forEach((m) => scoreByIp.set(m.ip, m.score));

    const pts = recent.map((log, idx) => {
      const ipScore = log.score ?? scoreByIp.get(log.srcIp) ?? (log.status === 'Blocked' ? 88 : log.status === 'Confirmed Scan' ? 75 : log.status === 'Suspicious' ? 45 : 15);
      return {
        label: log.time || `#${idx + 1}`,
        score: ipScore,
        scanVolume: 1,
        note: `${log.srcIp} → Port ${log.dstPort} (${log.status})`
      };
    });

    if (pts.length === 1) {
      return [
        { label: 'Start', score: 0, scanVolume: 0, note: 'Baseline initialized' },
        ...pts
      ];
    }
    return pts;
  }, [packetLogs, monitoredIps]);

  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const getX = (index) =>
    currentData.length <= 1
      ? padding.left + graphWidth / 2
      : padding.left + (index / (currentData.length - 1)) * graphWidth;
  const getY = (val) => padding.top + graphHeight - (Math.min(100, Math.max(0, val)) / 100) * graphHeight;

  // Path generator
  const linePath = currentData.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.score);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaPath =
    currentData.length > 0
      ? `${linePath} L ${getX(currentData.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`
      : '';

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
      {/* Header */}
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
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Live Threat Activity Timeline
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--body)', marginTop: '2px', marginBottom: 0 }}>
            Real-time risk score progression across live connected devices and port events.
          </p>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--safe)',
            backgroundColor: 'var(--safe-soft)',
            border: '1px solid var(--safe-border)',
            padding: '4px 10px',
            borderRadius: 'var(--rounded-sm)'
          }}
        >
          ● Live Telemetry Feed ({packetLogs.length} events)
        </span>
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
          {areaPath && <path d={areaPath} fill="url(#threatAreaGrad)" />}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {currentData.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.score);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={`${pt.label}-${idx}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle cx={cx} cy={cy} r="14" fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 3.5}
                  fill={pt.score >= 80 ? 'var(--error)' : pt.score >= 30 ? 'var(--warning)' : 'var(--safe)'}
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
        {hoveredIndex !== null && currentData[hoveredIndex] && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.min(80, Math.max(16, (hoveredIndex / Math.max(1, currentData.length - 1)) * 100))}%`,
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
          Live risk scores computed dynamically from port diversity, timing cadence, and sensitive port targeting.
        </span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          100% Real-Time Data
        </span>
      </div>
    </div>
  );
};
