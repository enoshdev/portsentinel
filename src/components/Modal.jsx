import React, { useEffect } from 'react';
import { Button } from './Button';

/**
 * Modal Component
 * Strictly adheres to design.md Section 5:
 * Level-2 floating layered shadow, #ffffff canvas-elevated, 1px #ebebeb hairline, 12px radius,
 * subtle rgba(0,0,0,0.35) backdrop overlay.
 */
export const Modal = ({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  confirmLabel,
  onConfirm,
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  maxWidth = '480px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: maxWidth,
          backgroundColor: 'var(--canvas-elevated)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--rounded-md)',
          boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.04), 0px 8px 16px -4px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'var(--body)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              borderRadius: 'var(--rounded-sm)',
              color: 'var(--mute)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mute)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>{children}</div>

        {/* Footer Actions */}
        {(onConfirm || onClose) && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--hairline)',
              backgroundColor: 'var(--canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            {onClose && (
              <Button variant="secondary" size="sm" onClick={onClose}>
                {cancelLabel}
              </Button>
            )}
            {onConfirm && (
              <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
                {confirmLabel || 'Confirm'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
