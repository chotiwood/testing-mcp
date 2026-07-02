/**
 * BTDropdownList — public API types (React).
 * Mirror of packages/ui/vue/…/BTDropdownList.types.ts — keep in sync.
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
  value?: T;
  label?: string;
  disabled?: boolean;
  /**
   * Whether this item is checked — used in `checkbox` and `radio` variants
   * to render the control as selected and apply the checked-row background.
   */
  checked?: boolean;
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
  /** @default 'list' */
  variant?: BTDropdownListVariant;
  items: BTDropdownItem<T>[];
  /** @default false */
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelect?: (value: T) => void;
  /** @default 'No result found.' */
  emptyLabel?: string;
  className?: string;
}
