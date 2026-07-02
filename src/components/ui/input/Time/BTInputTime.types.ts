/**
 * BTInputTime — masked time-input field (React).
 * Figma node 555-2975.
 *
 * @example
 * <BTInputTime label="Start time" value={time} onChange={setTime} />
 * <BTInputTime label="Duration" format="HH:mm:ss" value={dur} onChange={setDur} />
 * <BTInputTime label="Meeting" format="hh:mm a" value={t} onChange={setT} />
 */

export type BTInputTimeFormat = 'HH:mm' | 'HH:mm:ss' | 'hh:mm a';

export type BTInputTimeSize = 'default' | 'small';

export interface BTInputTimeProps {
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;

  /** Current time value — string matching the active format.
   *  e.g. "17:58" for HH:mm, "17:58:30" for HH:mm:ss, "05:30 PM" for hh:mm a.
   *  Pass null to clear. */
  value?: string | null;

  /** Floating label text. */
  label?: string;

  /**
   * Display and input format.
   * - 'HH:mm'    → 24-hour, 4 digits (HHMM)
   * - 'HH:mm:ss' → 24-hour with seconds, 6 digits (HHMMSS)
   * - 'hh:mm a'  → 12-hour, 4 digits + AM/PM toggle
   * @default 'HH:mm'
   */
  format?: BTInputTimeFormat;

  /** Field height variant.
   * - default: 48 px fixed height
   * - small:   auto height with smaller padding
   * @default 'default'
   */
  size?: BTInputTimeSize;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;

  /** External error message — overrides internal validator error. */
  errorText?: string;

  /** Helper text shown below the field. */
  helperText?: string;

  /** Override the generated `id` used for label association. */
  id?: string;

  /** Called when time value changes (null when cleared or incomplete). */
  onChange?: (value: string | null) => void;

  /** Called when the clear (×) button is clicked. */
  onClear?: () => void;

  /** Validator function — returns error string or null if valid. */
  validator?: (value: string | null) => string | null;

  /** Additional CSS class names applied to the field row. */
  className?: string;
}

export interface BTInputTimeHandle {
  /** Runs the validator and shows an error message if invalid. Returns true if valid. */
  validate: () => boolean;
}
