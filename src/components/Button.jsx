import React from 'react';

/**
 * Button Component
 * Supports marketing pills (rounded 100px) and in-app control buttons (rounded 6px).
 */
export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'destructive', 'dark'
  shape = 'app', // 'app' (6px square) or 'pill' (100px marketing pill)
  size = 'md', // 'sm', 'md', 'lg'
  icon,
  iconPosition = 'left',
  onClick,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const isPill = shape === 'pill';

  let bg = 'var(--primary)';
  let color = 'var(--on-primary)';
  let border = '1px solid var(--primary)';
  let hoverBg = '#262626';

  if (variant === 'secondary') {
    bg = 'var(--canvas-elevated)';
    color = 'var(--ink)';
    border = '1px solid var(--hairline)';
    hoverBg = 'var(--hairline-soft)';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    color = 'var(--ink)';
    border = '1px solid transparent';
    hoverBg = 'var(--hairline-soft)';
  } else if (variant === 'destructive') {
    bg = 'var(--error-soft)';
    color = 'var(--error-deep)';
    border = '1px solid var(--error-border)';
    hoverBg = 'rgba(238, 0, 0, 0.15)';
  }

  const paddingBySize = {
    sm: isPill ? '4px 14px' : '4px 8px',
    md: isPill ? '8px 18px' : '6px 12px',
    lg: isPill ? '12px 24px' : '10px 16px'
  };

  const fontSizeBySize = {
    sm: '12px',
    md: '14px',
    lg: '15px'
  };

  const heightBySize = {
    sm: '28px',
    md: '34px',
    lg: '42px'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        backgroundColor: bg,
        color: color,
        border: border,
        borderRadius: isPill ? 'var(--rounded-pill)' : 'var(--rounded-sm)',
        padding: paddingBySize[size] || paddingBySize.md,
        fontSize: fontSizeBySize[size] || fontSizeBySize.md,
        height: heightBySize[size] || heightBySize.md,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = bg;
      }}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          {icon}
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          {icon}
        </span>
      )}
    </button>
  );
};
