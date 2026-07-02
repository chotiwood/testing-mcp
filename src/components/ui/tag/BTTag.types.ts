import * as React from 'react';

/**
 * Props for {@link BTTag}.
 *
 * @example
 * ```tsx
 * <BTTag label="Flutter" />
 * <BTTag label="Vue" variant="outline" onRemove={() => removeTag('Vue')} />
 * <BTTag label="React" leftIcon={<CircleIcon size={16} />} onRemove={...} />
 * ```
 */
export interface BTTagProps {
  /** Text label shown inside the tag. */
  label: string;
  /** Visual style. @default 'default' */
  variant?: 'default' | 'outline';
  /** Optional 16×16 node rendered to the left of the label (slot). */
  leftIcon?: React.ReactNode;
  /** When provided, renders a close × button. Caller removes tag from list. */
  onRemove?: () => void;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Props for {@link BTTagGroup}.
 *
 * @example
 * ```tsx
 * <BTTagGroup
 *   items={tags}
 *   type="wrap"
 *   spacing="loose"
 *   onRemove={(item, index) => setTags(t => t.filter((_, i) => i !== index))}
 * />
 * ```
 */
export interface BTTagGroupProps {
  /** List of tags to display. */
  items: BTTagItem[];
  /** Variant applied to all tags. @default 'default' */
  variant?: 'default' | 'outline';
  /** Gap between tags. @default 'default' (4px) */
  spacing?: 'default' | 'loose';
  /** Layout mode. @default 'scroll' */
  type?: 'scroll' | 'wrap';
  /** Called when user clicks close on a tag. Caller must update items. */
  onRemove?: (item: BTTagItem, index: number) => void;
  /** Additional CSS class names. */
  className?: string;
}

export interface BTTagItem {
  /** Display text. */
  label: string;
  /** Optional unique key; falls back to label. */
  id?: string;
}
