/**
 * BTInputDate — tap-to-open date/range picker.
 * Figma node 543-2651.
 */
export type BTInputDateMode = 'single' | 'range';

/** Field height variant.
 * - default: 48 px fixed height, padding-y 16 px / 8 px (floating)
 * - small:   ~40 px auto height, padding-y 12 px / 4 px (floating), value font 12 px
 */
export type BTInputDateSize = 'default' | 'small';

export interface BTInputDateProps {
  /** Picker mode — single date or date range. Default: 'single'. */
  mode?: BTInputDateMode;

  /** Height variant — 'default' (48 px) or 'small' (~40 px). Default: 'default'. */
  size?: BTInputDateSize;

  /** Single-mode value (v-model). */
  modelValue?: Date | null;

  /** Range-mode value (v-model:rangeValue). */
  rangeValue?: [Date, Date] | null;

  /** Floating label text. */
  label?: string;

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  /** External error message — shows below the field in red. */
  errorText?: string;

  /** Helper text shown below the field. */
  helperText?: string;

  /** Override the generated `id` used for label association. */
  id?: string;

  /** Field name — used by BTForm coordinator to register the value. */
  name?: string;

  /** Earliest selectable date. */
  minDate?: Date;

  /** Latest selectable date. */
  maxDate?: Date;

  /** Locale string passed through to BTCalendar (e.g. 'id-ID', 'en-US'). */
  locale?: string;

  /**
   * Show the Apply / Cancel footer row inside the calendar panel.
   * When true: panel closes only on Apply or Cancel (Cancel reverts to previous value).
   * When false: panel auto-closes immediately on date selection.
   * Default: false (fast single-click UX).
   */
  showFooter?: boolean;

  /**
   * Show built-in preset chips below the calendar grid
   * (Yesterday, Today, Tomorrow, This week, Last week, This month, Last month).
   * Default: false.
   */
  showPreset?: boolean;
}
