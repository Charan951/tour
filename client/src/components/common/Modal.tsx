import React, { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** id of the element that names the dialog (usually the visible heading) */
  labelledBy?: string;
  /** fallback accessible name when there is no visible heading to point at */
  label?: string;
  /** max-width utility for the panel, e.g. "max-w-lg" */
  panelClassName?: string;
  /** disable closing on backdrop click (e.g. destructive forms) */
  disableBackdropClose?: boolean;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell: role="dialog" + aria-modal, focus trap, Escape to close,
 * focus return to the trigger, background scroll lock, backdrop click-to-close.
 * Wrap a modal's panel content in this instead of hand-rolling `fixed inset-0`.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  labelledBy,
  label,
  panelClassName = 'max-w-lg',
  disableBackdropClose = false,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    // move focus into the dialog
    const t = window.setTimeout(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      target?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = overflow;
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(e) => {
        if (!disableBackdropClose && e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        className={`relative my-auto w-full ${panelClassName} outline-none`}
      >
        {children}
      </div>
    </div>
  );
};
