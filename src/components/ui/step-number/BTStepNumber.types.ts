/**
 * BTStepNumber — reusable step/page pill component types.
 *
 * Figma: node 3007-2442.
 *
 * Five states:
 * - Default  — bordered, transparent bg, primary text
 * - Hover    — subtle bg (CSS :hover)
 * - Active   — subtle bg + brand-primary border
 * - Disabled — no border, disabled text
 * - Ellipsis — no border, shows ⋯ icon (non-interactive)
 */
export interface BTStepNumberProps {
  /** Page or step number to display. Ignored when `isEllipsis` is true. */
  page: number;
  /** Marks this pill as the current active page. @default false */
  isActive?: boolean;
  /** Disables interaction. @default false */
  isDisabled?: boolean;
  /** Shows the more_horiz (⋯) icon instead of a number. Non-interactive. @default false */
  isEllipsis?: boolean;
}
