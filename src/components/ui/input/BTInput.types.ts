export type BTInputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url';

export interface BTInputProps {
  modelValue?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  errorText?: string;
  helperText?: string;
  type?: BTInputType;
  showPasswordToggle?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  clearable?: boolean;
  id?: string;
  name?: string;
  validator?: (value: string) => string | null;
}
