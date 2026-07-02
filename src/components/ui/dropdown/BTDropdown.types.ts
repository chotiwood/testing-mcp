/**
 * BTDropdown — composable dropdown molecule types.
 */
import type { BTDropdownItem, BTDropdownListVariant } from '@/components/ui/dropdown-list/BTDropdownList.types';

/** Horizontal alignment of the floating list relative to its trigger. */
export type BTDropdownAlign = 'start' | 'center' | 'end';

export interface BTDropdownProps<T = string> {
  /** Items to display in the dropdown list. */
  items: BTDropdownItem<T>[];
  /**
   * Label shown on the default trigger button.
   * Ignored when using the `trigger` slot.
   * @default 'Select'
   */
  label?: string;
  /**
   * Visual layout of the dropdown list.
   * @default 'list'
   */
  variant?: BTDropdownListVariant;
  /**
   * Controlled value for single-select variants (list, combobox, radio).
   * The matching item will be rendered as checked/selected.
   */
  value?: T;
  /**
   * Controlled values for the checkbox multi-select variant.
   * Items whose value appears in this array are rendered as checked.
   */
  values?: T[];
  /**
   * Horizontal alignment of the floating list relative to the trigger.
   * - `start`: list start edge aligns with the trigger start edge (left in LTR).
   * - `center`: list is centered on the trigger.
   * - `end`: list end edge aligns with the trigger end edge (right in LTR).
   * @default 'start'
   */
  align?: BTDropdownAlign;
  /**
   * Show a search input at the top of the list.
   * @default false
   */
  searchable?: boolean;
  /**
   * Text shown in the empty state.
   * @default 'No result found.'
   */
  emptyLabel?: string;
}

// Emits:
//   'select'       (value: T)      — any single-item selection
//   'multiSelect'  (values: T[])   — checkbox: updated full list after toggle
//   'open'         ()              — dropdown opened
//   'close'        ()              — dropdown closed
