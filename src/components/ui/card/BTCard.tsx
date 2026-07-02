/**
 * BTCard — flexible card organism with three visual variants.
 *
 * Figma: node 93:157 (no D/M prefix — all platforms).
 *
 * @example
 * ```tsx
 * // Default with footer
 * <BTCard title="Order #123" description="Placed 26 May" onCancel={dismiss} onSubmit={confirm}>
 *   <p>Order contents here.</p>
 * </BTCard>
 *
 * // Small (no footer)
 * <BTCard variant="small" title="Summary" description="3 items" />
 *
 * // Image — pass any element via the `image` ReactNode prop
 * <BTCard
 *   variant="image"
 *   title="Title"
 *   description="Desc"
 *   image={<img src="/photo.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Photo" />}
 *   onCancel={dismiss}
 *   onSubmit={confirm}
 * />
 *
 * // Custom image widget (video, shimmer overlay, etc.)
 * <BTCard
 *   variant="image"
 *   title="Title"
 *   image={<video src="/promo.mp4" autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
 *   onSubmit={confirm}
 * />
 * ```
 */
import * as React from 'react';
import '@/components/ui/card/BTCard.css';
import type { BTCardProps } from '@/components/ui/card/BTCard.types';
import { BTButton } from '@/components/ui/button/BTButton';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export interface BTCardReactProps extends BTCardProps {
  /** Content placed right of the title text (20px wide). Default/Image only. */
  titleAction?: React.ReactNode;
  /** Content placed right of the entire header block (20px wide). Default/Image only. */
  headerAside?: React.ReactNode;
  /** Main body content area (slot3 in Figma). */
  children?: React.ReactNode;
  /**
   * Image for `variant="image"` — any ReactNode (img, video, custom widget, etc.).
   * The card handles clipping; pass your element with `width:100%; height:100%; object-fit:cover`.
   *
   * @example
   * ```tsx
   * image={<img src="/photo.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Photo" />}
   * ```
   */
  image?: React.ReactNode;
  /** Replaces the built-in Cancel + Submit footer entirely. */
  footer?: React.ReactNode;
  /** Fired when the Cancel button is clicked. */
  onCancel?: () => void;
  /** Fired when the Submit button is clicked. */
  onSubmit?: () => void;
  className?: string;
}

export const BTCard = React.forwardRef<HTMLDivElement, BTCardReactProps>(
  function BTCard(
    {
      variant = 'default',
      title,
      description,
      image,
      hasFooter,
      cancelLabel = 'Cancel',
      submitLabel = 'Submit',
      titleAction,
      headerAside,
      children,
      footer,
      onCancel,
      onSubmit,
      className,
    },
    ref,
  ) {
    const showFooter = hasFooter !== undefined ? hasFooter : variant !== 'small';

    const hasHeader =
      title != null || description != null || Boolean(titleAction) || (Boolean(headerAside) && variant !== 'small');

    /** Shared header row — reused in both image and default/small branches. */
    const headerRow = hasHeader ? (
      <div className="bt-card__header-row">
        <div className="bt-card__header">
          {(title != null || titleAction) && (
            <div className="bt-card__title-row">
              {title != null && <p className="bt-card__title">{title}</p>}
              {titleAction && <div className="bt-card__title-action">{titleAction}</div>}
            </div>
          )}
          {description && <p className="bt-card__description">{description}</p>}
        </div>
        {headerAside && variant !== 'small' && (
          <div className="bt-card__header-aside">{headerAside}</div>
        )}
      </div>
    ) : null;

    const bodySlot = children ? <div className="bt-card__body">{children}</div> : null;

    const footerSlot = showFooter
      ? footer ?? (
          <div className="bt-card__footer">
            <BTButton label={cancelLabel} variant="secondary-light" size="small" onClick={onCancel} />
            <BTButton label={submitLabel} variant="primary" size="small" onClick={onSubmit} />
          </div>
        )
      : null;

    return (
      <div ref={ref} className={cn(`bt-card bt-card--${variant}`, className)}>
        {variant === 'image' ? (
          <>
            {image && <div className="bt-card__image-slot">{image}</div>}
            <div className="bt-card__image-content">
              {headerRow}
              {bodySlot}
              {footerSlot}
            </div>
          </>
        ) : (
          <>
            {headerRow}
            {bodySlot}
            {footerSlot}
          </>
        )}
      </div>
    );
  },
);

BTCard.displayName = 'BTCard';
