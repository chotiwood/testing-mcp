import type { HTMLAttributes } from 'react';

/**
 * Props for BTLoading.
 *
 * @example
 * <BTLoading />
 * <BTLoading type="pulse" />
 * <BTLoading type="skeleton" width={200} />
 * <BTLoading type="progressbar" value={0.6} color="#e53e3e" />
 * <BTLoading type="logo" size={64} />
 */
export type BTLoadingType = 'spinner' | 'pulse' | 'skeleton' | 'progressbar' | 'logo';

export interface BTLoadingProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Which indicator to render.
   * @default 'spinner'
   */
  type?: BTLoadingType;
  /**
   * CSS color string applied to progressbar bar + track only.
   * Has no effect on spinner, pulse, skeleton, or logo.
   * @default 'var(--color-brand-primary)'
   */
  color?: string;
  /**
   * Determinate progress for progressbar (0–1).
   * Omit for indeterminate looping animation.
   */
  value?: number;
  /**
   * Width × height in px for spinner / pulse / logo.
   * @default 48
   */
  size?: number;
  /**
   * Width of skeleton block. Accepts px number or CSS string ('200px', '50%').
   * @default '100%'
   */
  width?: number | string;
  /**
   * Height of skeleton block. Accepts px number or CSS string ('80px', '100%').
   * @default '40px'
   */
  height?: number | string;
}
