export interface BTInputSearchHandle {
  validate: () => boolean;
}

export interface BTInputSearchProps {
  /** Controlled search query value. */
  value?: string;
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  /** External error message — overrides internal validator error. */
  errorText?: string;
  /** Helper text shown below the field in default state. */
  helperText?: string;
  /** Called on every keystroke. */
  onChange?: (value: string) => void;
  /** Called when the user submits via Enter key. */
  onSearch?: (value: string) => void;
  /** Called when the clear button is clicked. */
  onClear?: () => void;
  /** Imperative validator — return null for valid, string for error message. */
  validator?: (value: string) => string | null;
  className?: string;
}
