'use client';

import { useEffect, useId, useRef } from 'react';
import { ui } from './ui';

/** Accessible confirmation modal used instead of window.confirm(). */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]" onClick={() => !busy && onCancel()} />
      <div ref={panelRef} className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl p-6">
        <h2 id={titleId} className="font-display text-xl font-bold text-navy">{title}</h2>
        <div className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed space-y-2">{children}</div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={ui.btnSecondary}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={tone === 'danger' ? ui.btnDanger : ui.btnPrimary}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
