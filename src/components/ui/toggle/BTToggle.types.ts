export type BTToggleVariant = 'default' | 'outline';
export type BTToggleSize    = 'default' | 'small';

export interface BTToggleProps {
  /** Text shown inside the toggle. */
  label: string;
  /** Controlled pressed/active state. Default: false. */
  pressed?: boolean;
  /** Visual style. Default: 'default'. */
  variant?: BTToggleVariant;
  /** Padding scale. Default: 'default'. */
  size?: BTToggleSize;
  /** Disables interaction and applies opacity:0.5. Default: false. */
  disabled?: boolean;
}
