'use client';
import { useMemo } from 'react';
import { generateCalendarDays, getWeekdayNames, type CalendarDay } from '@/components/ui/calendar/internal/calendar.utils';

interface BTCalendarGridProps {
  displayDate: Date;
  selectedDate?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  rangeHover?: Date | null;
  disabledDates?: (d: Date) => boolean;
  eventDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  locale?: string;
  onSelect: (date: Date) => void;
  onHover: (date: Date | null) => void;
}

function getDayClasses(day: CalendarDay): string {
  const cls = ['bt-calendar__day'];
  if (!day.isCurrentMonth) cls.push('bt-calendar__day--outside');
  if (day.isDisabled) cls.push('bt-calendar__day--disabled');
  if (day.isToday) cls.push('bt-calendar__day--today');
  if (day.isSelected) cls.push('bt-calendar__day--selected');
  if (day.isRangeStartOnly) cls.push('bt-calendar__day--range-start-only');
  if (day.isRangeStart && !day.isRangeStartOnly) {
    cls.push(day.isHoverPreviewPoint ? 'bt-calendar__day--range-start-hover' : 'bt-calendar__day--range-start');
  }
  if (day.isRangeEnd) {
    cls.push(day.isHoverPreviewPoint ? 'bt-calendar__day--range-end-hover' : 'bt-calendar__day--range-end');
  }
  if (day.isInRange && !day.isRangeStart && !day.isRangeEnd) cls.push('bt-calendar__day--in-range');
  if (day.isInRangeHover && !day.isRangeStart && !day.isRangeEnd) cls.push('bt-calendar__day--in-range-hover');
  return cls.join(' ');
}

export function BTCalendarGrid({
  displayDate,
  selectedDate = null,
  rangeStart = null,
  rangeEnd = null,
  rangeHover = null,
  disabledDates,
  eventDates,
  minDate,
  maxDate,
  locale = 'id-ID',
  onSelect,
  onHover,
}: BTCalendarGridProps) {
  const weekdays = useMemo(() => getWeekdayNames(locale), [locale]);

  const days = useMemo<CalendarDay[]>(
    () =>
      generateCalendarDays(displayDate.getFullYear(), displayDate.getMonth(), {
        selectedDate,
        rangeStart,
        rangeEnd,
        rangeHover,
        disabledDates,
        eventDates,
        minDate,
        maxDate,
      }),
    [
      displayDate,
      selectedDate,
      rangeStart,
      rangeEnd,
      rangeHover,
      disabledDates,
      eventDates,
      minDate,
      maxDate,
    ],
  );

  return (
    <div>
      {/* Weekday headers */}
      <div className="bt-calendar__weekdays">
        {weekdays.map((name) => (
          <div key={name} className="bt-calendar__weekday">
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        className="bt-calendar__days"
        role="grid"
        aria-label={displayDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        onMouseLeave={() => onHover(null)}
      >
        {days.map((day, idx) => (
          <button
            key={idx}
            type="button"
            className={getDayClasses(day)}
            disabled={day.isDisabled}
            aria-pressed={day.isSelected || day.isRangeStart || day.isRangeEnd}
            aria-label={day.date.toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            role="gridcell"
            onClick={() => {
              if (!day.isDisabled) onSelect(day.date);
            }}
            onMouseEnter={() => {
              if (!day.isDisabled) onHover(day.date);
            }}
          >
            {day.date.getDate()}
            {day.hasEvent && <span className="bt-calendar__day-dot" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}

BTCalendarGrid.displayName = 'BTCalendarGrid';
