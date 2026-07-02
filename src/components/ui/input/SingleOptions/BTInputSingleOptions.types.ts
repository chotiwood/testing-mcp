/**
 * BTInputSingleOptions — labeled radio button group types.
 *
 * Figma node 702-3422.
 */

/** A single option in the radio group. */
export interface BTInputSingleOptionsItem<T = string> {
  /** Unique value emitted when this option is selected. */
  value: T;
  /** Visible label beside the radio circle. */
  label?: string;
  /** Disables only this option while the group remains active. */
  disabled?: boolean;
}

export interface BTInputSingleOptionsProps<T = string> {
  /** Currently selected value — bind with v-model. */
  modelValue?: T | null;
  /** Group label shown above the radio list. */
  label?: string;
  /** Shows a red `*` after the label when true. */
  required?: boolean;
  /** Radio options to render. */
  items: BTInputSingleOptionsItem<T>[];
  /** Disables the entire group. */
  disabled?: boolean;
  /**
   * External error message. When set, all radio circles show the error border
   * and the text is displayed below the group in error colour.
   * Overrides any internal validator error.
   */
  errorText?: string;
  /** Helper text shown below the group in the default state. */
  helperText?: string;
  /** Native `name` attribute shared by all radio inputs for form grouping. */
  name?: string;
  /**
   * Validation function called by `validate()` (exposed via defineExpose).
   * Return an error string or null.
   */
  validator?: (value: T | null) => string | null;
}
