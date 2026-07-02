import type React from 'react';

export interface BTCheckboxProps {
  /**
   * Field name — when set inside a `<BTForm>`, auto-wires `checked`,
   * `onChange`, and `errorText` from the form context.
   */
  name?: string;
  /** Controlled checked state. */
  checked?: boolean;
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
   * Error message rendered below the label (and overrides `subtext` when set).
   * Inside `<BTForm>`, the form-resolved error fills this when omitted.
   */
  errorText?: string;
  /** Called when the user toggles the checkbox. */
  onChange?: (checked: boolean) => void;
  /** Called when focus leaves the checkbox. Marks the field touched in `<BTForm>`. */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}
