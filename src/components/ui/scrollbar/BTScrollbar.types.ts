/**
 * BTScrollbar — shared prop types (Vue + React).
 */

/** Scroll axis shown with custom scrollbar styling. */
export type BTScrollbarDirection = 'x' | 'y' | 'both';

export interface BTScrollbarProps {
  /**
   * Which axis shows the custom scrollbar.
   * @default 'y'
   */
  direction?: BTScrollbarDirection;
  /** Additional CSS class names. */
  className?: string;
  /** Child content rendered inside the scrollable container. */
  children?: React.ReactNode;
}
