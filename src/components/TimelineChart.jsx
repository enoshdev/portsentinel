import React, { useState } from 'react';
import { StatusChip } from './StatusChip';

/**
 * TimelineChart Component
 * The signature risk-over-time visualization of PortSentinel.
 * Displays clean 60-minute sliding window progression, readable threshold lines (30, 60, 80),
 * interactive event markers on probed ports, and scenario-specific plain-English explanations.
 */
export const TimelineChart = ({
  ipData, // Active IP scenario object from mockData
  height = 300,
  className = ''
}) => {
  const [activeMarker, setActiveMarker] = useState(null);

  if (!ipData) return null;

  const width = 860;
  const padding = { top: 30, right: 40, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Scales
  const getX = (minute) => padding.left + (minute / 60) * graphWidth;
  const getY = (score) => padding.top + graphHeight - (score / 100) * graphHeight;

  // Threshold Y positions
  const y30 = getY(30);
  const y60 = getY(60);
  const y80 = getY(80);

  // Generate points for active IP
  const points = ipData.timelineData || [
    { minute: 0, score: 0 },
    { minute: 60, score: ipData.score }
  ];

  // SVG path generator
  const createPath = (data) => {
    if (!data || data.length === 0) return '';
    return data.reduce((acc, pt, i) => {
      const x = getX(pt.minute);
      const y = getY(pt.score);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const createArea = (data) => {
    if (!data || data.length === 0) return '';
    const linePath = createPath(data);
    const lastPt = data[data.length - 1];
    const firstPt = data[0];
    const bottomY = getY(0);
    return `${linePath} L ${getX(lastPt.minute)} ${bottomY} L ${getX(firstPt.minute)} ${bottomY} Z`;
  };

  const activePath = createPath(points);
  const activeArea = createArea(points);

  // Dynamic explanation generated from the selected scenario's actual data
  const getDynamicExplanation = (ip) => {
    if (ip.id === 'stealth') {
      return 'The risk increased gradually from 6 to 84 as this source contacted multiple different administrative ports over a 60-minute window, crossing the auto-block threshold at minute 60.';
    }
    if (ip.id === 'fast') {
      return 'The risk spiked rapidly from 5 to 87 in under a minute due to an aggressive multi-port SYN burst, triggering an immediate simulated block.';
    }
    if (ip.id === 'office') {
      return 'The risk rose to 52 after this source contacted multiple internal application ports. This activity is flagged as Suspicious for operator review, but remains below the auto-block threshold.';
    }
    return 'The risk remained low and stable between 6 and 8. The source only accessed expected web ports (80 and 443) with natural browsing variance.';
  };

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
      {/* Chart Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--hairline-soft)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
              show_chart
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Risk Progression Over Time
            </h3>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--mute)',
                backgroundColor: 'var(--hairline-soft)',
                padding: '2px 8px',
                borderRadius: 'var(--rounded-sm)'
              }}
            >
              {ipData.ip}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--body)', margin: '4px 0 0 0' }}>
            Observed risk accumulation across the 60-minute monitoring window.
          </p>
        </div>

        {/* Current Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
            Current State:
          </span>
          <StatusChip status={ipData.status} size="sm" />
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171717" stopOpacity="0.12" />
              <stop offset="80%" stopColor="#171717" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#171717" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Threshold Lines */}
          {/* 100 Top Boundary */}
          <line x1={padding.left} y1={getY(100)} x2={width - padding.right} y2={getY(100)} stroke="var(--hairline)" strokeWidth="1" />
          <text x={padding.left - 8} y={getY(100) + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--mute)">100</text>

          {/* Threshold 80: Auto-Block */}
          <line
            x1={padding.left}
            y1={y80}
            x2={width - padding.right}
            y2={y80}
            stroke="#171717"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            opacity="0.45"
          />
          <text x={padding.left - 8} y={y80 + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink)" fontWeight="600">80</text>
          <text x={width - padding.right} y={y80 - 6} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--ink)" opacity="0.75">
            THRESHOLD 80: AUTO-BLOCK
          </text>

          {/* Threshold 60: Confirmed Scan */}
          <line
            x1={padding.left}
            y1={y60}
            x2={width - padding.right}
            y2={y60}
            stroke="var(--error)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <text x={padding.left - 8} y={y60 + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--error)">60</text>
          <text x={width - padding.right} y={y60 - 5} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--error)" opacity="0.75">
            THRESHOLD 60: CONFIRMED SCAN
          </text>

          {/* Threshold 30: Suspicious */}
          <line
            x1={padding.left}
            y1={y30}
            x2={width - padding.right}
            y2={y30}
            stroke="var(--warning)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <text x={padding.left - 8} y={y30 + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--warning)">30</text>
          <text x={width - padding.right} y={y30 - 5} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--warning)" opacity="0.8">
            THRESHOLD 30: SUSPICIOUS
          </text>

          {/* 0 Baseline */}
          <line x1={padding.left} y1={getY(0)} x2={width - padding.right} y2={getY(0)} stroke="var(--hairline)" strokeWidth="1" />
          <text x={padding.left - 8} y={getY(0) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--mute)">0</text>

          {/* Vertical Time Interval Markers (0, 15, 30, 45, 60 minutes) */}
          {[0, 15, 30, 45, 60].map((min) => {
            const x = getX(min);
            return (
              <g key={`time-${min}`}>
                <line
                  x1={x}
                  y1={getY(0)}
                  x2={x}
                  y2={getY(100)}
                  stroke="var(--hairline)"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill={min === 60 ? 'var(--ink)' : 'var(--mute)'}
                  fontWeight={min === 60 ? '600' : '400'}
                >
                  {min === 0 ? 'T-60m' : min === 60 ? 'Now (T-0m)' : `T-${60 - min}m`}
                </text>
              </g>
            );
          })}

          {/* Shaded Area under Curve */}
          <path d={activeArea} fill="url(#riskAreaGrad)" />

          {/* Main Risk Progression Curve */}
          <path
            d={activePath}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Event Markers */}
          {points.map((pt, index) => {
            const cx = getX(pt.minute);
            const cy = getY(pt.score);
            const isHovered = activeMarker?.minute === pt.minute;

            const isHigh = pt.score >= 80;
            const isMid = pt.score >= 30;

            return (
              <g
                key={`marker-${index}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveMarker(pt)}
                onMouseLeave={() => setActiveMarker(null)}
              >
                {/* Hit target */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />

                {/* Marker ring and point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={isHigh ? 'var(--ink)' : isMid ? 'var(--warning)' : 'var(--safe)'}
                  stroke="var(--canvas-elevated)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Port label if present */}
                {pt.port && (
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fill="var(--body)"
                    fontWeight="500"
                  >
                    :{pt.port}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {activeMarker && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.min(78, Math.max(18, (activeMarker.minute / 60) * 100))}%`,
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
              minWidth: '210px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--faint)' }}>
              <span>Minute {activeMarker.minute} (T-{60 - activeMarker.minute}m)</span>
              <span style={{ color: 'var(--on-primary)', fontWeight: 600 }}>Score: {activeMarker.score}/100</span>
            </div>
            {activeMarker.port && (
              <div style={{ marginTop: '4px', fontWeight: 500, color: 'var(--on-primary)' }}>
                Targeted Port {activeMarker.port} ({activeMarker.service || 'Service'})
              </div>
            )}
            {activeMarker.note && (
              <div style={{ marginTop: '2px', fontSize: '11px', color: '#eaeaea' }}>
                {activeMarker.note}
              </div>
            )}
            <div style={{ marginTop: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: activeMarker.score >= 80 ? '#fca5a5' : activeMarker.score >= 30 ? '#fde68a' : '#a7f3d0' }}>
              Classification: {activeMarker.status || 'Active'}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Scenario Explanation Box */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--canvas)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--rounded-sm)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '13px',
          color: 'var(--body)',
          lineHeight: 1.5
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)', flexShrink: 0, marginTop: '2px' }}>
          info
        </span>
        <div>
          <strong style={{ color: 'var(--ink)' }}>Scenario Analysis: </strong>
          {getDynamicExplanation(ipData)}
        </div>
      </div>
    </div>
  );
};
