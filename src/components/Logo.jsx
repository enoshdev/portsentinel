import React from 'react';

/**
 * PortSentinel Official Logo & Wordmark
 * Geometric radar mark with single solid probe dot and tight negative tracking.
 */
export const Logo = ({ size = 24, showWordmark = true, className = '', color = 'var(--ink)' }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', userSelect: 'none' }} className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, color }}
      >
        <path
          d="M 12 3.5 A 8.5 8.5 0 1 1 5.2 16.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="5.2" cy="16.5" r="1.8" fill="currentColor" />
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '-0.4px',
            color: 'var(--ink)',
            lineHeight: 1
          }}
        >
          PortSentinel
        </span>
      )}
    </div>
  );
};
