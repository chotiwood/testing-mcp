/**
 * BTInputMultiOptions — labeled checkbox group types.
 *
 * Figma node 859-2091.
 */

/** A single option in the checkbox group. */
export interface BTInputMultiOptionsItem<T = string> {
  /** Unique value added to / removed from the value array on toggle. */
  value: T;
  /** Visible label beside the checkbox. */
  label?: string;
  /** Disables only this option while the group remains active. */
  disabled?: boolean;
}

export interface BTInputMultiOptionsProps<T = string> {
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  /** Currently selected values. Defaults to empty array. */
  value?: T[];
  /** Called when the user toggles an option. */
  onChange?: (value: T[]) => void;
  /** Group label shown above the checkbox list. */
  label?: string;
  /** Shows a red `*` after the label when true. */
  required?: boolean;
  /** Checkbox options to render. */
  items: BTInputMultiOptionsItem<T>[];
  /** Disables the entire group. */
  disabled?: boolean;
  /**
   * External error message. When set, all checkboxes show the error border
   * and the text is displayed below the group in error colour.
   * Overrides any internal validator error.
   */
  errorText?: string;
  /** Helper text shown below the group in the default state. */
  helperText?: string;
  /**
   * Validation function called by `validate()` (via ref handle).
   * Return an error string or null.
   */
  validator?: (value: T[]) => string | null;
  /** Additional CSS class names. */
  className?: string;
}

export interface BTInputMultiOptionsHandle {
  /** Runs the validator and shows the error message. Returns true when valid. */
  validate(): boolean;
}
