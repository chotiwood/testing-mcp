export type BTButtonVariant =
  | 'primary'
  | 'secondary-light'
  | 'secondary-white'
  | 'destructive'
  | 'outline'
  | 'ghost';

export type BTButtonSize = 'default' | 'small';

export interface BTButtonProps {
  /**
   * Visual style — default: 'primary'.
   * - `secondary-light` — neutral grey background (bg.secondary)
   * - `secondary-white` — white background with border
   */
  variant?: BTButtonVariant;
  /** Padding scale — 'default' (12×16 px regular, 40×40 icon-only) or 'small' (8 px regular, 32×32 icon-only). */
  size?: BTButtonSize;
  /** Disables interaction and applies disabled styling. */
  disabled?: boolean;
  /** Renders only the default slot (icon) without a label — square padding. */
  iconOnly?: boolean;
  /** Text label shown inside the button. */
  label?: string;
}
