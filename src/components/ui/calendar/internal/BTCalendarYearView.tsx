'use client';
import { useMemo, useEffect, useRef } from 'react';
import { calendarStrings } from '@/components/ui/calendar/internal/calendar.utils';

interface BTCalendarYearViewProps {
  displayDate: Date;
  selectedDate?: Date | null;
  locale?: string;
  onSelect: (date: Date) => void;
}

export function BTCalendarYearView({
  displayDate,
  selectedDate = null,
  locale = 'id-ID',
  onSelect,
}: BTCalendarYearViewProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const current = displayDate.getFullYear();
    const start = current - 10;
    const end = current + 10;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [displayDate]);

  const selectedYear = selectedDate ? selectedDate.getFullYear() : null;

  useEffect(() => {
    // Scroll selected year into view
    if (listRef.current) {
      const selected = listRef.current.querySelector('.bt-calendar__year-item--selected');
      if (selected) {
        (selected as HTMLElement).scrollIntoView({ block: 'center' });
      }
    }
  }, []);

  function onYearClick(year: number) {
    const date = new Date(displayDate);
    date.setFullYear(year);
    date.setDate(1);
    onSelect(date);
  }

  return (
    <div
      ref={listRef}
      className="bt-calendar__year-list"
      role="listbox"
      aria-label={calendarStrings(locale).pickYear}
    >
      {years.map((year) => (
        <button
          key={year}
          type="button"
          className={[
            'bt-calendar__year-item',
            year === selectedYear ? 'bt-calendar__year-item--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="option"
          aria-selected={year === selectedYear}
          onClick={() => onYearClick(year)}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

BTCalendarYearView.displayName = 'BTCalendarYearView';
