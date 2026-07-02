/**
 * BTTag — removable pill label atom.
 * Figma source: node 3050-6361.
 * Mirrors @btech/ui-vue BTTag one-to-one (same prop names, same render priority).
 *
 * ## Usage:
 * ```tsx
 * // Simple
 * <BTTag label="Flutter" />
 *
 * // With left icon + remove
 * <BTTag
 *   label="Vue"
 *   leftIcon={<CircleIcon size={16} />}
 *   onRemove={() => removeTag('Vue')}
 * />
 *
 * // Outline
 * <BTTag label="React" variant="outline" onRemove={handleRemove} />
 * ```
 */
import * as React from 'react';
import type { BTTagProps } from '@/components/ui/tag/BTTag.types';
import '@/components/ui/tag/BTTag.css';

export const BTTag = React.forwardRef<HTMLSpanElement, BTTagProps>(
  (
    {
      label,
      variant = 'default',
      leftIcon,
      onRemove,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'bt-tag',
      `bt-tag--${variant}`,
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} data-testid="bt-tag" {...rest}>
        {leftIcon && <span className="bt-tag__icon">{leftIcon}</span>}
        <span className="bt-tag__label">{label}</span>
        {onRemove && (
          <button
            className="bt-tag__close"
            type="button"
            aria-label="Remove tag"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM11 10.29L10.29 11L8 8.71L5.71 11L5 10.29L7.29 8L5 5.71L5.71 5L8 7.29L10.29 5L11 5.71L8.71 8L11 10.29Z" fill="currentColor"/>
            </svg>
          </button>
        )}
      </span>
    );
  },
);

BTTag.displayName = 'BTTag';
