export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isRangeStartOnly: boolean;
  isInRange: boolean;
  isHoverPreviewPoint: boolean;
  isInRangeHover: boolean;
  isDisabled: boolean;
  hasEvent: boolean;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime();
  const s = start.getTime();
  const e = end.getTime();
  const lo = Math.min(s, e);
  const hi = Math.max(s, e);
  return d > lo && d < hi;
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(1); // avoid day-overflow when changing month
  d.setMonth(d.getMonth() + n);
  return d;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function clampDate(date: Date, min?: Date, max?: Date): Date {
  let d = date;
  if (min && d < min) d = min;
  if (max && d > max) d = max;
  return d;
}

type CalendarLang = 'id' | 'en' | 'ar' | 'he';

export function calendarLang(locale: string): CalendarLang {
  if (locale.startsWith('ar')) return 'ar';
  if (locale.startsWith('he') || locale.startsWith('iw')) return 'he';
  if (locale.startsWith('id')) return 'id';
  return 'en';
}

const CAL_STRINGS = {
  id: {
    cancel: 'Batal', apply: 'Terapkan',
    yesterday: 'Kemarin', today: 'Hari ini', tomorrow: 'Besok',
    thisWeek: 'Minggu ini', lastWeek: 'Minggu lalu',
    thisMonth: 'Bulan ini', lastMonth: 'Bulan lalu',
    calendar: 'Kalender', pickMonth: 'Pilih bulan', pickYear: 'Pilih tahun',
  },
  en: {
    cancel: 'Cancel', apply: 'Apply',
    yesterday: 'Yesterday', today: 'Today', tomorrow: 'Tomorrow',
    thisWeek: 'This week', lastWeek: 'Last week',
    thisMonth: 'This month', lastMonth: 'Last month',
    calendar: 'Calendar', pickMonth: 'Select month', pickYear: 'Select year',
  },
  ar: {
    cancel: 'إلغاء', apply: 'تطبيق',
    yesterday: 'أمس', today: 'اليوم', tomorrow: 'غدًا',
    thisWeek: 'هذا الأسبوع', lastWeek: 'الأسبوع الماضي',
    thisMonth: 'هذا الشهر', lastMonth: 'الشهر الماضي',
    calendar: 'التقويم', pickMonth: 'اختر الشهر', pickYear: 'اختر السنة',
  },
  he: {
    cancel: 'ביטול', apply: 'החל',
    yesterday: 'אתמול', today: 'היום', tomorrow: 'מחר',
    thisWeek: 'השבוע', lastWeek: 'השבוע שעבר',
    thisMonth: 'החודש', lastMonth: 'החודש שעבר',
    calendar: 'לוח שנה', pickMonth: 'בחר חודש', pickYear: 'בחר שנה',
  },
} as const;

export function calendarStrings(locale: string) {
  return CAL_STRINGS[calendarLang(locale)];
}

export function getWeekdayNames(locale: string): string[] {
  const names: string[] = [];
  // Start from Sunday (0) — create 7 days starting from a known Sunday (2021-01-03)
  for (let i = 0; i < 7; i++) {
    const date = new Date(2021, 0, 3 + i); // Jan 3, 2021 is Sunday
    names.push(
      date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', ''),
    );
  }
  return names;
}

export function getMonthName(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function getMonthShortName(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'short' });
}

/** Returns the short month name for a 1-based month number (1 = January). */
function getMonthShortNameByNumber(month: number, locale: string): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
}

/** Formats a date as "DD MMM YYYY" (e.g. "11 Jan 2026"). Returns empty string if null. */
export function formatDate(date: Date | null | undefined, locale: string): string {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = getMonthShortNameByNumber(date.getMonth() + 1, locale);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Formats a date range as "DD MMM YYYY - DD MMM YYYY". Shows only start if end is null. */
export function formatDateRange(
  start: Date | null | undefined,
  end: Date | null | undefined,
  locale: string
): string {
  if (!start) return '';
  if (!end) return formatDate(start, locale);
  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}

function isDateDisabled(
  date: Date,
  options: {
    disabledDates?: (d: Date) => boolean;
    minDate?: Date;
    maxDate?: Date;
  },
): boolean {
  if (options.minDate) {
    const minStart = new Date(
      options.minDate.getFullYear(),
      options.minDate.getMonth(),
      options.minDate.getDate(),
    );
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (dateStart < minStart) return true;
  }
  if (options.maxDate) {
    const maxStart = new Date(
      options.maxDate.getFullYear(),
      options.maxDate.getMonth(),
      options.maxDate.getDate(),
    );
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (dateStart > maxStart) return true;
  }
  if (options.disabledDates && options.disabledDates(date)) return true;
  return false;
}

export function generateCalendarDays(
  year: number,
  month: number, // 0-indexed
  options: {
    selectedDate?: Date | null;
    rangeStart?: Date | null;
    rangeEnd?: Date | null;
    rangeHover?: Date | null;
    disabledDates?: (d: Date) => boolean;
    eventDates?: Date[];
    minDate?: Date;
    maxDate?: Date;
  } = {},
): CalendarDay[] {
  const days: CalendarDay[] = [];

  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0 = Sunday

  // Fill from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(buildDay(date, false, options));
  }

  // Current month days
  const daysInMonth = getDaysInMonth(year, month);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push(buildDay(date, true, options));
  }

  // Fill to complete 42 cells (6 rows × 7 cols)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push(buildDay(date, false, options));
  }

  return days;
}

function buildDay(
  date: Date,
  isCurrentMonth: boolean,
  options: {
    selectedDate?: Date | null;
    rangeStart?: Date | null;
    rangeEnd?: Date | null;
    rangeHover?: Date | null;
    disabledDates?: (d: Date) => boolean;
    eventDates?: Date[];
    minDate?: Date;
    maxDate?: Date;
  },
): CalendarDay {
  const { selectedDate, rangeStart, rangeEnd, rangeHover, eventDates } = options;

  const selected = !!(selectedDate && isSameDay(date, selectedDate));

  let rangeStartDay = false;
  let rangeEndDay = false;
  let rangeStartOnly = false;
  let inRange = false;
  let isHoverPreviewPoint = false;
  let isInRangeHover = false;

  if (rangeStart) {
    const hasHoverPreview = !rangeEnd && rangeHover && !isSameDay(rangeHover, rangeStart);
    const effectiveEnd = rangeEnd ?? (hasHoverPreview ? rangeHover! : null);

    if (effectiveEnd) {
      const lo = rangeStart <= effectiveEnd ? rangeStart : effectiveEnd;
      const hi = rangeStart <= effectiveEnd ? effectiveEnd : rangeStart;
      rangeStartDay = isSameDay(date, lo);
      rangeEndDay = isSameDay(date, hi);
      const inRangeBetween = isInRange(date, lo, hi);

      if (hasHoverPreview) {
        isHoverPreviewPoint = isSameDay(date, rangeHover!);
        isInRangeHover = inRangeBetween;
      } else {
        inRange = inRangeBetween;
      }
    } else {
      rangeStartDay = isSameDay(date, rangeStart);
      rangeStartOnly = rangeStartDay;
    }
  }

  const hasEvent = !!(
    eventDates && eventDates.some((ed) => isSameDay(ed, date))
  );

  const disabled = isDateDisabled(date, options);

  return {
    date,
    isCurrentMonth,
    isToday: isToday(date),
    isSelected: selected,
    isRangeStart: rangeStartDay,
    isRangeEnd: rangeEndDay,
    isRangeStartOnly: rangeStartOnly,
    isInRange: inRange,
    isHoverPreviewPoint,
    isInRangeHover,
    isDisabled: disabled,
    hasEvent,
  };
}
