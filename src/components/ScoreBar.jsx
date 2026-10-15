import React from 'react';

/**
 * ScoreBar Component
 * Renders a precision risk score bar with 30 / 60 / 80 threshold indicators.
 */
export const ScoreBar = ({ score = 0, showLabels = true, height = 6, className = '' }) => {
  const boundedScore = Math.max(0, Math.min(100, score));

  // Determine color based on threshold rules
  let barColor = 'var(--safe)';
  if (boundedScore >= 80) {
    barColor = 'var(--ink)'; // Blocked is solid ink #171717 per design.md
  } else if (boundedScore >= 60) {
    barColor = 'var(--error)';
  } else if (boundedScore >= 30) {
    barColor = 'var(--warning)';
  }

  return (
    <div className={className} style={{ width: '100%' }}>
      {showLabels && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--mute)'
          }}
        >
          <span>Risk Score</span>
          <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px' }}>
            {boundedScore} <span style={{ fontWeight: 400, color: 'var(--mute)' }}>/ 100</span>
          </span>
        </div>
      )}

      {/* Progress track */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'var(--hairline-soft)',
          borderRadius: 'var(--rounded-full)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${boundedScore}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 'var(--rounded-full)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Threshold Markers at 30, 60, 80 */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            zIndex: 2
          }}
          title="Threshold 30: Suspicious"
        />
        <div
          style={{
            position: 'absolute',
            left: '60%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            zIndex: 2
          }}
          title="Threshold 60: Confirmed Scan"
        />
        <div
          style={{
            position: 'absolute',
            left: '80%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            zIndex: 2
          }}
          title="Threshold 80: Blocked"
        />
      </div>

      {showLabels && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '3px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--faint)'
          }}
        >
          <span>0 Normal</span>
          <span style={{ marginLeft: '18%' }}>30 Suspicious</span>
          <span style={{ marginLeft: '10%' }}>60 Confirmed</span>
          <span>80 Blocked</span>
        </div>
      )}
    </div>
  );
};
