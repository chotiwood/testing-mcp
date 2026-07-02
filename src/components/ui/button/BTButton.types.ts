export type BTButtonVariant =
  | 'primary'
  | 'secondary-light'
  | 'secondary-white'
  | 'destructive'
  | 'outline'
  | 'ghost';

export type BTButtonSize = 'default' | 'small';

export interface BTButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style — default: 'primary'.
   * - `secondary-light` — neutral grey background (bg.secondary)
   * - `secondary-white` — white background with border
   */
  variant?: BTButtonVariant;
  /** Padding scale — 'default' (12×16 px regular, 40×40 icon-only) or 'small' (8 px regular, 32×32 icon-only). */
  size?: BTButtonSize;
  /** Renders only `children` (icon) without a label — square padding. */
  iconOnly?: boolean;
  /** Text label shown inside the button. */
  label?: string;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
}
