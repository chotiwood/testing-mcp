/**
 * BTCard — type definitions.
 *
 * A flexible card organism with three visual variants:
 * - `default` — full card with title, description, optional body, optional footer.
 * - `small`   — compact card with title + description only (no footer).
 * - `image`   — card with a top image, then same structure as default.
 *
 * Figma: node 93:157 (no D/M prefix — all platforms).
 */

/** Visual variant of the card. */
export type BTCardVariant = 'default' | 'small' | 'image';

export interface BTCardProps {
  /** Visual variant. @default 'default' */
  variant?: BTCardVariant;
  /** Card title — bold at the top. */
  title: string;
  /** Supporting description shown below the title. */
  description?: string;
  /**
   * Show the cancel + submit footer.
   * Defaults to `true` for `default` and `image`, `false` for `small`.
   * Pass `null` (or omit) to use the variant default.
   */
  hasFooter?: boolean | null;
  /** Label for the cancel button. @default 'Cancel' */
  cancelLabel?: string;
  /** Label for the submit button. @default 'Submit' */
  submitLabel?: string;
}
// Image for variant="image" is passed via the `#image` named slot:
//
// ```vue
// <BTCard variant="image" title="Title">
//   <template #image>
//     <img src="/photo.jpg" style="width:100%;height:100%;object-fit:cover" alt="Photo" />
//   </template>
// </BTCard>
// ```
