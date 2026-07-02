/**
 * BTInputDropdown — input-family select (React).
 *
 * Figma node 555-3041.
 */
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';

export type BTInputDropdownSize = 'default' | 'small';

export interface BTInputDropdownProps<T = string> {
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  /** Currently selected value — must match one of items[n].value */
  value?: T | null;
  /** Floating label text */
  label?: string;
  /** Items to display in the panel */
  items: BTDropdownItem<T>[];
  /**
   * Show a search input at the top of the panel.
   * Filtering is done internally — parent does NOT need to filter items.
   * @default false
   */
  hasSearch?: boolean;
  /**
   * Field height variant.
   * - 'default' → 48px height
   * - 'small'   → auto height, smaller padding
   * @default 'default'
   */
  size?: BTInputDropdownSize;
  /** @default false */
  disabled?: boolean;
  /** @default false */
  readOnly?: boolean;
  /** @default false */
  required?: boolean;
  /** External error message */
  errorText?: string;
  helperText?: string;
  /** Used for label `for` / aria — auto-generated if omitted */
  id?: string;
  /**
   * Text shown in the empty state (no items or no search match).
   * @default 'No result found.'
   */
  emptyLabel?: string;
  /**
   * Convert a BTDropdownItem to a display string shown in the field.
   * Defaults to `item.label ?? ''`.
   */
  getLabel?: (item: BTDropdownItem<T>) => string;
  onChange?: (value: T | null) => void;
  onClear?: () => void;
  className?: string;
}
