export interface BTInputTextAreaHandle {
  validate: () => boolean;
}

export interface BTInputTextAreaProps {
  /** Controlled value. */
  value?: string;
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  /** Hard caps input length. When set, a character counter is shown. */
  maxLength?: number;
  /** Kept for API compatibility — not used in rendering (auto-grow handles height). */
  rows?: number;
  /** Called on every keystroke. */
  onChange?: (value: string) => void;
  /** Called when the clear button is clicked. */
  onClear?: () => void;
  /** Return an error string to fail validation, null to pass. */
  validator?: (value: string) => string | null;
  className?: string;
}
