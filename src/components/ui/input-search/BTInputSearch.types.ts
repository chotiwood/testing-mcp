export interface BTInputSearchProps {
  modelValue?: string;
  /** Field name — when set inside a `<BTForm>`, auto-wires value/error. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  validator?: (value: string) => string | null;
}
