/**
 * BTScrollbar — overflow wrapper with btech token scrollbar styling (Figma 2037:4).
 *
 * Wraps any overflowing content and applies a thin, token-coloured scrollbar.
 * Set an explicit height (or max-height) on the host element for overflow to
 * take effect.
 *
 * @example
 * ```tsx
 * // Vertical scroll (default)
 * <BTScrollbar style={{ height: 300 }}>
 *   {items.map((item, i) => <div key={i}>{item}</div>)}
 * </BTScrollbar>
 *
 * // Horizontal scroll
 * <BTScrollbar direction="x" style={{ width: 400 }}>
 *   <div style={{ whiteSpace: 'nowrap', width: 800 }}>Wide content…</div>
 * </BTScrollbar>
 * ```
 */
import React from 'react';
import '@/components/ui/scrollbar/BTScrollbar.css';
import type { BTScrollbarProps } from '@/components/ui/scrollbar/BTScrollbar.types';

export const BTScrollbar = React.forwardRef<
  HTMLDivElement,
  BTScrollbarProps & React.HTMLAttributes<HTMLDivElement>
>(function BTScrollbar({ direction = 'y', className, children, ...rest }, ref) {
  const classes = [
    'bt-scrollbar',
    `bt-scrollbar--${direction}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});

BTScrollbar.displayName = 'BTScrollbar';
