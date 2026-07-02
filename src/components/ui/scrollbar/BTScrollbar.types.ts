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
  /** Additional CSS class names (Vue: `class`, React: `className`). */
  class?: string;
}
