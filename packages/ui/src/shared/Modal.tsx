'use client';

import React, { useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Pixel or CSS value, e.g. 560 or '42rem' */
  maxWidth?: number | string;
  /** Higher z-index for stacking over other overlays */
  zIndex?: number;
  className?: string;
  bodyClassName?: string;
  /** If false, clicking the backdrop does not close (e.g. destructive flows) */
  closeOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  zIndex = 10000,
  className,
  bodyClassName,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxW =
    maxWidth === undefined
      ? undefined
      : typeof maxWidth === 'number'
        ? `${maxWidth}px`
        : maxWidth;

  return (
    <div
      className="adm-overlay adm-overlay--stacked"
      style={{ zIndex }}
      role="presentation"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`adm-modal ${className ?? ''}`.trim()}
        style={maxW ? { maxWidth: maxW, width: 'min(100%, 90vw)' } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'adm-modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="adm-modalHeader">
            <h3 id="adm-modal-title" className="adm-modalTitle">
              {title}
            </h3>
            <button type="button" className="adm-btn" style={{ padding: '4px 10px', fontSize: 16, lineHeight: 1 }} onClick={onClose} aria-label="Close">
              &times;
            </button>
          </div>
        )}
        <div className={bodyClassName}>{children}</div>
        {footer !== undefined && <div className="adm-modalFooter">{footer}</div>}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="adm-btnCancel" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'adm-btnDanger' : 'adm-btnSave'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--adm-text-muted)', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}
