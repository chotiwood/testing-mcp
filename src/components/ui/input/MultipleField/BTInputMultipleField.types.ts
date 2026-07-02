import type { BTTagItem } from '@/components/ui/tag/BTTag.types';
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';

export type BTInputMultipleFieldType = 'wrap' | 'scroll';

/**
 * Props for {@link BTInputMultipleField}.
 *
 * @example
 * ```tsx
 * <BTInputMultipleField
 *   value={selectedTags}
 *   onChange={setSelectedTags}
 *   label="Frameworks"
 *   items={frameworkItems}
 *   hasSearch
 * />
 * ```
 *
 * @example Free-text only (no predefined items)
 * ```tsx
 * <BTInputMultipleField value={tags} onChange={setTags} label="Skills" />
 * ```
 */
export interface BTInputMultipleFieldProps {
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  /**
   * Current list of tags. The component calls onChange with the updated list
   * on every change.
   */
  value?: BTTagItem[];
  /**
   * Predefined selectable options shown in a checkbox dropdown.
   * Each option is toggled into/out of the tag list.
   */
  items?: BTDropdownItem<string>[];
  /**
   * Floating label — sits centered when empty/idle, floats small on focus
   * or when the field has content.
   */
  label?: string;
  /**
   * Tag layout.
   * - 'wrap'   — tags flow into multiple rows; field height grows.
   * - 'scroll' — single fixed-height row; tags scroll horizontally.
   * @default 'wrap'
   */
  type?: BTInputMultipleFieldType;
  /** Appends " *" (red) to the label. @default false */
  required?: boolean;
  /** Disables all interaction and dims the field. @default false */
  disabled?: boolean;
  /** Red border + validation text shown below the field. */
  errorText?: string;
  /** Text shown below the field when there is no error. */
  helperText?: string;
  /**
   * Show a search input at the top of the predefined-items dropdown.
   * @default false
   */
  hasSearch?: boolean;
  /**
   * Custom filter applied when hasSearch is true and the user types.
   * Receives the full items list and current query; returns filtered subset.
   * Defaults to case-insensitive label.includes(query).
   */
  itemsFilter?: (
    items: BTDropdownItem<string>[],
    query: string,
  ) => BTDropdownItem<string>[];
  /**
   * Text shown beneath the empty-state illustration in the dropdown.
   * @default 'No result found.'
   */
  emptyLabel?: string;
  /** Called with the updated tag list on every change. */
  onChange?: (tags: BTTagItem[]) => void;
  /**
   * Called on validate(). Return null for valid, or an error string.
   * The returned string is shown below the field as an error.
   */
  validator?: (tags: BTTagItem[]) => string | null;
}

/**
 * Imperative handle exposed via forwardRef.
 * Access via `ref.current.validate()`.
 */
export interface BTInputMultipleFieldHandle {
  /** Runs the validator; shows the error inline; returns true if valid. */
  validate: () => boolean;
}
