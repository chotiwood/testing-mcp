'use client';
import { useMemo } from 'react';
import { getMonthShortName, calendarStrings } from '@/components/ui/calendar/internal/calendar.utils';

interface BTCalendarMonthViewProps {
  displayDate: Date;
  locale?: string;
  selectedDate?: Date | null;
  onSelect: (date: Date) => void;
}

function isSelectedMonth(date: Date, selectedDate: Date | null | undefined): boolean {
  if (!selectedDate) return false;
  return (
    selectedDate.getFullYear() === date.getFullYear() &&
    selectedDate.getMonth() === date.getMonth()
  );
}

function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function BTCalendarMonthView({
  displayDate,
  locale = 'id-ID',
  selectedDate = null,
  onSelect,
}: BTCalendarMonthViewProps) {
  const months = useMemo(() => {
    const year = displayDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(year, i, 1);
      return { date, label: getMonthShortName(date, locale) };
    });
  }, [displayDate, locale]);

  return (
    <div className="bt-calendar__month-grid" role="grid" aria-label={calendarStrings(locale).pickMonth}>
      {months.map(({ date, label }) => (
        <button
          key={date.getMonth()}
          type="button"
          className={[
            'bt-calendar__month-item',
            isSelectedMonth(date, selectedDate) ? 'bt-calendar__month-item--selected' : '',
            isCurrentMonth(date) && !isSelectedMonth(date, selectedDate)
              ? 'bt-calendar__month-item--current'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="gridcell"
          aria-pressed={isSelectedMonth(date, selectedDate)}
          onClick={() => onSelect(date)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

BTCalendarMonthView.displayName = 'BTCalendarMonthView';
