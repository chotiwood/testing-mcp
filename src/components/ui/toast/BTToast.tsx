/**
 * BTToast — single toast card.
 *
 * Figma source: node 95:101 (file WANr9drWYNYbMPuT2sMeHi).
 *
 * @example
 *   <BTToast item={item} onClose={() => dismiss(item.id)} />
 */
import type { JSX } from 'react';
import '@/components/ui/toast/BTToast.css';
import type { BTToastItem } from '@/components/ui/toast/BTToast.types';

interface BTToastProps {
  item: BTToastItem;
  onClose: () => void;
}

function CloseIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 L6 18" />
      <path d="M6 6 L18 18" />
    </svg>
  );
}

function StatusIcon({ type }: { type: BTToastItem['type'] }): JSX.Element | null {
  if (type === 'success') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M7 12 L10 15 L17 8" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7 L12 13" />
        <path d="M12 16 L12 17" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 L1.82 18 A2 2 0 0 0 3.64 21 L20.36 21 A2 2 0 0 0 22.18 18 L13.71 3.86 A2 2 0 0 0 10.29 3.86 Z" />
        <path d="M12 9 L12 13" />
        <path d="M12 16 L12 17" />
      </svg>
    );
  }
  if (type === 'info') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16 L12 12" />
        <path d="M12 8 L12 9" />
      </svg>
    );
  }
  return null;
}

// Auto-detect direction from text content — the toast is portaled to
// <body> so ancestor dir="rtl" doesn't reach it. Any Arabic/Hebrew glyph
// in the title or description flips the toast to RTL.
const RTL_GLYPH = /[֐-ۿݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/;

export function BTToast({ item, onClose }: BTToastProps): JSX.Element {
  const isDefault = item.type === 'default';
  const isDescription = item.type === 'description';
  const hasIcon = !isDefault && !isDescription;
  const dir: 'ltr' | 'rtl' = RTL_GLYPH.test(
    `${item.title ?? ''} ${(item as { description?: string }).description ?? ''}`,
  )
    ? 'rtl'
    : 'ltr';

  return (
    <div className={`bt-toast bt-toast--${item.type}`} dir={dir} role="status" aria-live="polite">
      {hasIcon && (
        <span className={`bt-toast__icon bt-toast__icon--${item.type}`} aria-hidden="true">
          <StatusIcon type={item.type} />
        </span>
      )}

      <div className="bt-toast__body">
        {isDefault ? (
          <>
            <p className="bt-toast__title">{item.title}</p>
            <button type="button" className="bt-toast__close" aria-label="Close" onClick={onClose}>
              <CloseIcon />
            </button>
          </>
        ) : isDescription ? (
          <>
            <div className="bt-toast__row">
              <p className="bt-toast__title">{item.title}</p>
              <button type="button" className="bt-toast__close" aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </button>
            </div>
            {item.description && <p className="bt-toast__description">{item.description}</p>}
            {item.actionLabel && (
              <button type="button" className="bt-toast__action" onClick={() => item.onAction?.()}>
                {item.actionLabel}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="bt-toast__row">
              <p className="bt-toast__title">{item.title}</p>
              <button type="button" className="bt-toast__close" aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </button>
            </div>
            {item.description && <p className="bt-toast__description">{item.description}</p>}
          </>
        )}
      </div>
    </div>
  );
}
