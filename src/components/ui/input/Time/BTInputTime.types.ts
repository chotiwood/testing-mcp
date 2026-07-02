/**
 * BTInputTime — masked time-input field.
 * Figma node 555-2975.
 *
 * @example
 * <BTInputTime label="Start time" v-model="time" />
 * <BTInputTime label="Duration" format="HH:mm:ss" v-model="duration" />
 * <BTInputTime label="Meeting" format="hh:mm a" v-model="meeting" />
 */

export type BTInputTimeFormat = 'HH:mm' | 'HH:mm:ss' | 'hh:mm a';

export type BTInputTimeSize = 'default' | 'small';

export interface BTInputTimeProps {
  /** Current time value — string matching the active format.
   *  e.g. "17:58" for HH:mm, "17:58:30" for HH:mm:ss, "05:30 PM" for hh:mm a.
   *  Pass null to clear. */
  modelValue?: string | null;

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
   * - default: 48 px fixed height, padding-y 8 px / 8 px (floating)
   * - small:   ~40 px auto height, padding-y 12 px / 4 px (floating), value font 12 px
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

  /** Field name — used by BTForm coordinator to register the value. */
  name?: string;
}
