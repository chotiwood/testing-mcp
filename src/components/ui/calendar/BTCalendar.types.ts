export type BTCalendarMode = 'single' | 'range';

export interface BTCalendarPreset {
  label: string;
  getValue: () => [Date, Date?];
}

export interface BTCalendarProps {
  mode?: BTCalendarMode;                            // default: 'single'
  value?: Date | null;                              // single-mode controlled value
  onValueChange?: (val: Date | null) => void;
  rangeValue?: [Date, Date] | null;                 // range-mode controlled value
  onRangeValueChange?: (val: [Date, Date] | null) => void;
  presets?: BTCalendarPreset[];                     // sidebar presets (omit = no panel)
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  eventDates?: Date[];
  initialMonth?: Date;
  locale?: string;                                  // default: 'id-ID'
  showFooter?: boolean;                             // default: false; shows Apply+Cancel
  showPreset?: boolean;                             // default: false; shows built-in date preset chips below the grid
  onApply?: (val: Date | [Date, Date] | null) => void;
  onCancel?: () => void;
}
