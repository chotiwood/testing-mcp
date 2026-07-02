/**
 * Props for {@link BTTag}.
 *
 * @example
 * <BTTag label="Flutter" />
 * <BTTag label="Vue" variant="outline" :onRemove="() => remove('Vue')" />
 */
export interface BTTagProps {
  /** Text label shown inside the tag. */
  label: string;
  /** Visual style. @default 'default' */
  variant?: 'default' | 'outline';
  /** When provided, renders a close × button. Caller removes tag from list. */
  onRemove?: () => void;
}

/**
 * Props for {@link BTTagGroup}.
 */
export interface BTTagGroupProps {
  /** List of tags to display. */
  items: BTTagItem[];
  /** Visual variant applied to all tags. @default 'default' */
  variant?: 'default' | 'outline';
  /** Gap between tags. @default 'default' (4px) */
  spacing?: 'default' | 'loose';
  /** Layout mode. @default 'scroll' */
  type?: 'scroll' | 'wrap';
  /** Called when user clicks close on a tag. Caller must update items. */
  onRemove?: (item: BTTagItem, index: number) => void;
}

export interface BTTagItem {
  /** Display text. */
  label: string;
  /** Optional unique key; falls back to label. */
  id?: string;
}
