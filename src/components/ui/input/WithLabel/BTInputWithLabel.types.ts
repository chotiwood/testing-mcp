/**
 * Props for {@link BTInputWithLabel}.
 *
 * @example Left label (unit prefix like "kg", "IDR")
 * <BTInputWithLabel left-label="kg" label="Weight" v-model="value" />
 *
 * @example Right label
 * <BTInputWithLabel right-label="m²" label="Area" v-model="value" />
 *
 * @example Both sides
 * <BTInputWithLabel left-label="From" right-label="IDR" label="Amount" v-model="value" />
 */
export interface BTInputWithLabelProps {
  /** Current value (v-model). */
  modelValue?: string;

  /**
   * Text shown inside the left label pill.
   * When omitted no left pill is rendered.
   */
  leftLabel?: string;

  /**
   * Text shown inside the right label pill.
   * When omitted no right pill is rendered.
   */
  rightLabel?: string;

  /**
   * Floating label inside the input — sits centred when empty/idle,
   * floats small (12 px) at the top on focus or when the field has a value.
   */
  label?: string;

  /** Appends " *" (red) to the floating label. @default false */
  required?: boolean;

  /** Hint text shown inside the input when empty and focused. */
  placeholder?: string;

  /** Disables all interaction and dims the field. @default false */
  disabled?: boolean;

  /** Makes the field read-only (shows value, blocks edits). @default false */
  readOnly?: boolean;

  /** Red border + validation text shown below the field. */
  errorText?: string;

  /** Text shown below the field when there is no error. */
  helperText?: string;

  /** HTML id forwarded to the underlying <input>. */
  id?: string;

  /** HTML name forwarded to the underlying <input>. */
  name?: string;

  /** Maximum character count; also used by showCharCount. */
  maxLength?: number;

  /** Show current / max character counter below the field. @default false */
  showCharCount?: boolean;
}
