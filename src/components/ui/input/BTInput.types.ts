export type BTInputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url';

export interface BTInputProps {
  /** Controlled value. Pair with onChange. */
  value?: string;
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
  /** Left content (icon, currency symbol). React.ReactNode equivalent of Vue's prefix slot. */
  prefix?: React.ReactNode;
  /** Right content (custom icon, button) — lowest suffix priority. */
  suffix?: React.ReactNode;
  /** Called with the new string value on every keystroke. */
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Called after the field is cleared via the clear button. */
  onClear?: () => void;
  className?: string;
}
