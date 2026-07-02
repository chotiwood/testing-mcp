/**
 * BTItem — generic list item / row display molecule (React).
 * Figma: node 2056-48.
 *
 * Three container types: default (no chrome), outline, muted.
 * Optional left media: leftIcon node, BTAvatar, or image.
 * Optional right content: label text, BTButton outline-small, rightIcon node.
 *
 * @example Default with avatar
 * ```tsx
 * <BTItem
 *   title="Faisal Lestari"
 *   description="Software Engineer"
 *   leftAvatar={{ name: 'Faisal Lestari', color: 'blue' }}
 *   rightLabel="Admin"
 * />
 * ```
 *
 * @example Outline with button
 * ```tsx
 * <BTItem
 *   type="outline"
 *   title="Design Token Package"
 *   description="v2.3.1 — 4 changes"
 *   rightButton="View"
 *   onButtonClick={handleView}
 * />
 * ```
 */
import '@/components/ui/item/BTItem.css';
import * as React from 'react';
import type { ReactNode } from 'react';
import type { BTItemProps } from '@/components/ui/item/BTItem.types';
import { BTAvatar } from '@/components/ui/avatar/BTAvatar';
import { BTButton } from '@/components/ui/button/BTButton';

export function BTItem({
  title,
  description,
  type = 'default',
  leftAvatar,
  leftImage,
  leftIcon,
  rightLabel,
  rightButton,
  rightIcon,
  onButtonClick,
}: BTItemProps & { leftImage?: ReactNode }) {
  const hasRight = rightButton != null || rightLabel != null || rightIcon != null;

  return (
    <div
      className={[
        'bt-item',
        type === 'outline' ? 'bt-item--outline' : '',
        type === 'muted'   ? 'bt-item--muted'   : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Left area: media + label stack */}
      <div className="bt-item__left">
        {/* Avatar (highest precedence left media) */}
        {leftAvatar != null && (
          <BTAvatar item={leftAvatar} size="sm" />
        )}

        {/* Image slot — any element (network img, asset, SVG…) wrapped at 32×32 */}
        {leftAvatar == null && leftImage != null && (
          <span className="bt-item__media">{leftImage}</span>
        )}

        {/* Icon node (lowest left media precedence) */}
        {leftAvatar == null && leftImage == null && leftIcon != null && (
          <span className="bt-item__left-icon">{leftIcon}</span>
        )}

        {/* Title + description */}
        <span className="bt-item__label">
          <span className="bt-item__title">{title}</span>
          {description != null && (
            <span className="bt-item__description">{description}</span>
          )}
        </span>
      </div>

      {/* Right area */}
      {hasRight && (
        <div className="bt-item__right">
          {/* Button (takes precedence over label) */}
          {rightButton != null ? (
            <BTButton
              label={rightButton}
              variant="outline"
              size="small"
              onClick={onButtonClick}
            />
          ) : rightLabel != null ? (
            <span className="bt-item__right-label">{rightLabel}</span>
          ) : null}

          {/* Right icon */}
          {rightIcon != null && (
            <span className="bt-item__right-icon">{rightIcon}</span>
          )}
        </div>
      )}
    </div>
  );
}

BTItem.displayName = 'BTItem';
