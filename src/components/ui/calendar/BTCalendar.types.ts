export type BTCalendarMode = 'single' | 'range';

export interface BTCalendarPreset {
  label: string;
  getValue: () => [Date, Date?];
}

export interface BTCalendarProps {
  mode?: BTCalendarMode;            // default: 'single'
  modelValue?: Date | null;         // single-mode v-model
  rangeValue?: [Date, Date] | null; // range-mode v-model:rangeValue
  presets?: BTCalendarPreset[];     // sidebar presets (omit = no panel)
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  eventDates?: Date[];
  initialMonth?: Date;
  locale?: string;                  // default: 'id-ID'
  showFooter?: boolean;             // default: true; shows Apply+Cancel
  showPreset?: boolean;             // default: false; shows built-in date preset chips below the grid
}
