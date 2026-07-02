/**
 * BTDropdownList — public API types.
 *
 * Sliced from Figma node 668-8852.
 * Four visual variants:
 *   - `list`     — plain text items
 *   - `combobox` — avatar + name items
 *   - `checkbox` — checkbox control + label (multi-select)
 *   - `radio`    — radio button + label (single-select)
 *
 * The component is purely presentational. Filtering is caller-driven:
 * handle `update:searchQuery`, filter your items array, pass filtered
 * items back in. The empty state renders automatically when items = [].
 */
import type { BTAvatarItem } from '@/components/ui/avatar/BTAvatar.types';

export type BTDropdownListVariant = 'list' | 'combobox' | 'checkbox' | 'radio';

/**
 * A single row item in BTDropdownList.
 *
 * Generic over T so callers can use any value type (string, number, etc.).
 * Default is `string` for backwards compatibility.
 */
export interface BTDropdownItem<T = string> {
  /** Unique identifier returned in the `select` event. */
  value?: T;
  /** Display label shown in the list row. */
  label?: string;
  /** When true the row is non-interactive (dimmed + not clickable). */
  disabled?: boolean;
  /**
   * Whether this item is checked — used in any variant to apply the checked-row background highlight;
   * in `checkbox` and `radio` variants it marks the selected state, in `list` variant it highlights the currently selected item.
   */
  checked?: boolean;
  /** Avatar payload — only rendered in the `combobox` variant. */
  avatar?: BTAvatarItem;
  /**
   * When true, renders a × icon on the right (space-between layout). Signals
   * that tapping the row performs a destructive action (e.g. remove filter).
   */
  removable?: boolean;
}

/**
 * @deprecated Use BTDropdownItem instead. Will be removed in the next major.
 */
export type BTDropdownListItem<T = string> = BTDropdownItem<T>;

export interface BTDropdownListProps<T = string> {
  /**
   * Visual layout variant.
   * - `list`     — text-only rows (14px label)
   * - `combobox` — 24px avatar circle + name label
   * - `checkbox` — checkbox + label (checked rows have brand-primary-subtle bg)
   * - `radio`    — radio button + label (selected row has brand-primary-subtle bg)
   * @default 'list'
   */
  variant?: BTDropdownListVariant;
  /**
   * Items to display. When the array is empty the "not found" empty-state
   * illustration is shown automatically.
   */
  items: BTDropdownItem<T>[];
  /**
   * Show a search input at the top of the list.
   * @default false
   */
  searchable?: boolean;
  /**
   * Current search query (controlled). Bind with v-model:searchQuery.
   * @default ''
   */
  searchQuery?: string;
  /**
   * Text shown beneath the empty-state illustration.
   * @default 'No result found.'
   */
  emptyLabel?: string;
}

// Emits:
//   'select'              (value: T)      — user clicked an item
//   'update:searchQuery'  (query: string) — user typed in the search box
