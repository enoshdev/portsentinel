import React from 'react';

/**
 * StatusChip Component
 * Strictly adheres to design.md Section 1 status chip rules.
 */
export const StatusChip = ({ status = 'Normal', size = 'md', className = '' }) => {
  const normalized = (status || 'Normal').toLowerCase();

  let bg = 'var(--hairline-soft)';
  let color = 'var(--body)';
  let borderColor = 'var(--hairline)';
  let dotColor = 'var(--mute)';
  let label = status;
  let isBlocked = false;

  if (normalized.includes('block')) {
    bg = 'var(--ink)';
    color = 'var(--on-primary)';
    borderColor = 'var(--ink)';
    label = 'Blocked';
    isBlocked = true;
  } else if (normalized.includes('confirm')) {
    bg = 'var(--error-soft)';
    color = 'var(--error-deep)';
    borderColor = 'var(--error-border)';
    dotColor = 'var(--error)';
    label = 'Confirmed Scan';
  } else if (normalized.includes('suspicious')) {
    bg = 'var(--warning-soft)';
    color = 'var(--warning-deep)';
    borderColor = 'var(--warning-border)';
    dotColor = 'var(--warning)';
    label = 'Suspicious';
  } else if (normalized.includes('allow') || normalized.includes('safe')) {
    bg = 'var(--safe-soft)';
    color = 'var(--safe)';
    borderColor = 'var(--safe-border)';
    dotColor = 'var(--safe)';
    label = 'Allowlisted';
  } else {
    // Normal
    bg = 'var(--hairline-soft)';
    color = 'var(--body)';
    borderColor = 'var(--hairline)';
    dotColor = 'var(--mute)';
    label = 'Normal';
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: isSmall ? '20px' : '24px',
        padding: isSmall ? '0 6px' : '0 8px',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--rounded-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}
    >
      {isBlocked ? (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: isSmall ? '12px' : '13px', lineHeight: 1 }}
        >
          lock
        </span>
      ) : (
        <span
          style={{
            width: isSmall ? '5px' : '6px',
            height: isSmall ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0
          }}
        />
      )}
      <span>{label}</span>
    </span>
  );
};
