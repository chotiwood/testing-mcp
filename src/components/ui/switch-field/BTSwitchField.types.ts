export interface BTSwitchFieldProps {
  /** Field name — when set inside a `<BTForm>`, auto-wires modelValue/error. */
  name?: string;
  /** Error string rendered as subtext (right-side by default). */
  errorText?: string;
  modelValue?: boolean;
  disabled?: boolean;
  error?: boolean;
  /** Visual size of the track. 'md' = Default (40×20px); 'sm' = Small (24×12px). Default: 'md'. */
  size?: 'md' | 'sm';
  labelLeft?: string;
  subtextLeft?: string;
  labelRight?: string;
  subtextRight?: string;
  /** Short text inside the track pill (e.g. "ON"). Width becomes content-sized; thumb swaps sides. */
  innerText?: string;
}
