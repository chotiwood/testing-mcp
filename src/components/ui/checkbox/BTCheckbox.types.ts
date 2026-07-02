export interface BTCheckboxProps {
  /**
   * Field name — when set inside a `<BTForm>`, auto-wires `modelValue`,
   * `update:modelValue`, and `errorText` from the form context.
   */
  name?: string;
  /** Controlled checked state — pair with @update:modelValue for v-model. */
  modelValue?: boolean;
  /** Puts the checkbox into the indeterminate (dash) state. */
  indeterminate?: boolean;
  /** Disables all interaction. */
  disabled?: boolean;
  /** Applies the error style to the box border and subtext. */
  error?: boolean;
  /** Optional text label beside the checkbox. */
  label?: string;
  /** Optional helper / error text below the label. */
  subtext?: string;
  /**
   * Error message rendered below the label (overrides `subtext`). Inside
   * `<BTForm>`, the form-resolved error fills this when omitted.
   */
  errorText?: string;
}
