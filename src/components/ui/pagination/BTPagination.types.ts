/**
 * BTPagination — data pagination molecule.
 * Figma: node 749-2846.
 *
 * Three variants:
 * - 'number'  Full numbered paging with first/prev/pages/next/last.
 * - 'display' Rows-per-page selector + prev/next.
 * - 'step'    Step N of M + Prev/Next.
 */
export type BTPaginationVariant = 'display' | 'step' | 'number';

export interface BTPaginationProps {
  /** Which pagination pattern to render. @default 'number' */
  variant?: BTPaginationVariant;

  // ── number + display ─────────────────────────────────────────────────────
  /** Current active page (1-indexed). */
  currentPage?: number;
  /** Total number of pages. Required for 'number' variant. */
  totalPages?: number;

  // ── display ──────────────────────────────────────────────────────────────
  /** Total item count — used in range label display. */
  totalCount?: number;
  /** Items shown per page. @default 10 */
  rowsPerPage?: number;
  /** Rows-per-page dropdown options. @default [10, 20, 50] */
  rowsPerPageOptions?: number[];

  // ── step ─────────────────────────────────────────────────────────────────
  /** Current step (1-indexed). Required for 'step' variant. */
  currentStep?: number;
  /** Total steps. Required for 'step' variant. */
  totalSteps?: number;

  /** Accessible label for the nav wrapper. @default 'Pagination' */
  ariaLabel?: string;
}
