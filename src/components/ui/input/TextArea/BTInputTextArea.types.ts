export interface BTInputTextAreaProps {
  modelValue?: string;
  /** Field name — when set inside a `<BTForm>`, auto-wires value/error. */
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  maxLength?: number;
  validator?: (value: string) => string | null;
}
