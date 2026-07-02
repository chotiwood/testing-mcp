/**
 * BTInputDate — tap-to-open date/range picker (React).
 * Figma node 543-2651.
 */
export type BTInputDateMode = 'single' | 'range';
export type BTInputDateSize = 'default' | 'small';

export interface BTInputDateProps {
  mode?: BTInputDateMode;
  size?: BTInputDateSize;
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  /** Single-mode value (controlled). */
  value?: Date | null;
  /** Range-mode value (controlled). */
  rangeValue?: [Date, Date] | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  errorText?: string;
  helperText?: string;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
  locale?: string;
  /** Show Apply/Cancel footer. Default: true. */
  showFooter?: boolean;
  /** Show built-in preset chips. Default: false. */
  showPreset?: boolean;
  onChange?: (value: Date | null) => void;
  onRangeValueChange?: (value: [Date, Date] | null) => void;
  onClear?: () => void;
  validator?: (value: Date | null) => string | null;
  rangeValidator?: (value: [Date, Date] | null) => string | null;
  className?: string;
}

export interface BTInputDateHandle {
  validate: () => boolean;
}
