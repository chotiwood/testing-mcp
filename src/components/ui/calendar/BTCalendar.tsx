'use client';
/**
 * BTCalendar — date picker organism.
 * Figma source: node 2561:1340.
 * Supports single-date and date-range modes with optional preset sidebar,
 * month/year dropdown navigation, event dots, and an Apply/Cancel footer.
 *
 * @example Single date picker
 * ```tsx
 * import { BTCalendar } from '@btech/ui-react';
 * const [date, setDate] = useState<Date | null>(null);
 * <BTCalendar value={date} onValueChange={setDate} />
 * ```
 *
 * @example Range picker with presets
 * ```tsx
 * <BTCalendar
 *   mode="range"
 *   rangeValue={range}
 *   onRangeValueChange={setRange}
 *   presets={myPresets}
 *   showFooter
 *   onApply={handleApply}
 *   onCancel={handleCancel}
 * />
 * ```
 */
import '@/components/ui/calendar/BTCalendar.css';
import { useState, useMemo, useEffect } from 'react';
import type { BTCalendarProps } from '@/components/ui/calendar/BTCalendar.types';
import { BTCalendarHeader } from '@/components/ui/calendar/internal/BTCalendarHeader';
import { BTCalendarGrid } from '@/components/ui/calendar/internal/BTCalendarGrid';
import { BTCalendarPresetPanel } from '@/components/ui/calendar/internal/BTCalendarPresetPanel';
import { BTButton } from '@/components/ui/button/BTButton';
import { addMonths, isSameDay, getMonthName, calendarStrings } from '@/components/ui/calendar/internal/calendar.utils';

type PresetChip = { key: string; label: string; date: Date; range: [Date, Date] };

function buildPresetChips(locale: string): PresetChip[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const s = calendarStrings(locale);

  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const dow = today.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - daysFromMonday);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart); lastWeekEnd.setDate(weekStart.getDate() - 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { key: 'yesterday',  label: s.yesterday,  date: yesterday,      range: [yesterday,      yesterday]      },
    { key: 'today',      label: s.today,      date: today,          range: [today,          today]          },
    { key: 'tomorrow',   label: s.tomorrow,   date: tomorrow,       range: [tomorrow,       tomorrow]       },
    { key: 'thisWeek',   label: s.thisWeek,   date: weekStart,      range: [weekStart,      weekEnd]        },
    { key: 'lastWeek',   label: s.lastWeek,   date: lastWeekStart,  range: [lastWeekStart,  lastWeekEnd]    },
    { key: 'thisMonth',  label: s.thisMonth,  date: thisMonthStart, range: [thisMonthStart, thisMonthEnd]   },
    { key: 'lastMonth',  label: s.lastMonth,  date: lastMonthStart, range: [lastMonthStart, lastMonthEnd]   },
  ];
}

export function BTCalendar({
  mode = 'single',
  value,
  onValueChange,
  rangeValue,
  onRangeValueChange,
  presets,
  minDate,
  maxDate,
  disabledDates,
  eventDates,
  initialMonth,
  locale = 'id-ID',
  showFooter = true,
  showPreset = false,
  onApply,
  onCancel,
}: BTCalendarProps) {
  // ── Display state ───────────────────────────────────────────────────────────

  const initialDisplayDate = useMemo(() => {
    if (initialMonth) return new Date(initialMonth);
    if (value) return new Date(value);
    if (rangeValue?.[0]) return new Date(rangeValue[0]);
    return new Date();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  const [displayDate, setDisplayDate] = useState<Date>(initialDisplayDate);
  const displayDate2 = useMemo(() => addMonths(displayDate, 1), [displayDate]);

  // ── Built-in preset chips ───────────────────────────────────────────────────

  const presetChips = useMemo<PresetChip[]>(
    () => (showPreset ? buildPresetChips(locale) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showPreset, locale],
  );

  function isChipActive(chip: PresetChip): boolean {
    if (mode === 'single') {
      return value ? isSameDay(value, chip.date) : false;
    }
    return rangeStart !== null && rangeEnd !== null
      ? isSameDay(rangeStart, chip.range[0]) && isSameDay(rangeEnd, chip.range[1])
      : false;
  }

  function handleChipClick(chip: PresetChip) {
    setActivePresetIndex(-1);
    if (mode === 'single') {
      setDisplayDate(new Date(chip.date));
      onValueChange?.(chip.date);
    } else {
      setRangeStart(chip.range[0]);
      setRangeEnd(chip.range[1]);
      setRangeHover(null);
      setDisplayDate(new Date(chip.range[0]));
      onRangeValueChange?.(chip.range);
    }
  }

  // ── Range selection state ───────────────────────────────────────────────────

  const [rangeStart, setRangeStart] = useState<Date | null>(rangeValue?.[0] ?? null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(rangeValue?.[1] ?? null);
  const [rangeHover, setRangeHover] = useState<Date | null>(null);

  useEffect(() => {
    setRangeStart(rangeValue?.[0] ?? null);
    setRangeEnd(rangeValue?.[1] ?? null);
  }, [rangeValue]);

  // ── Preset state ────────────────────────────────────────────────────────────

  const [activePresetIndex, setActivePresetIndex] = useState<number>(-1);

  function handlePresetSelect(index: number) {
    setActivePresetIndex(index);
    const preset = presets?.[index];
    if (!preset) return;
    const [start, end] = preset.getValue();
    if (mode === 'range' && start) {
      setRangeStart(start);
      setRangeEnd(end ?? null);
      setDisplayDate(new Date(start));
      onRangeValueChange?.(end ? [start, end] : null);
    } else if (mode === 'single' && start) {
      setDisplayDate(new Date(start));
      onValueChange?.(start);
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  const canGoPrev = useMemo(() => {
    if (!minDate) return true;
    const prev = addMonths(displayDate, -1);
    return (
      prev.getFullYear() > minDate.getFullYear() ||
      (prev.getFullYear() === minDate.getFullYear() &&
        prev.getMonth() >= minDate.getMonth())
    );
  }, [displayDate, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const next = addMonths(displayDate, mode === 'range' ? 2 : 1);
    return (
      next.getFullYear() < maxDate.getFullYear() ||
      (next.getFullYear() === maxDate.getFullYear() &&
        next.getMonth() <= maxDate.getMonth())
    );
  }, [displayDate, maxDate, mode]);

  function handlePrev() {
    setDisplayDate((d) => addMonths(d, -1));
  }

  function handleNext() {
    setDisplayDate((d) => addMonths(d, 1));
  }

  function handleSelectMonth(date: Date) {
    setDisplayDate(date);
  }

  function handleSelectYear(date: Date) {
    setDisplayDate(date);
  }

  // ── Day selection ───────────────────────────────────────────────────────────

  function handleDaySelect(date: Date) {
    setActivePresetIndex(-1);
    if (mode === 'single') {
      onValueChange?.(date);
      return;
    }
    if (!rangeStart) {
      setRangeStart(date);
      setRangeEnd(null);
    } else if (!rangeEnd) {
      if (isSameDay(date, rangeStart)) {
        setRangeStart(null);
        onRangeValueChange?.(null);
      } else if (date < rangeStart) {
        const newEnd = rangeStart;
        setRangeEnd(newEnd);
        setRangeStart(date);
        onRangeValueChange?.([date, newEnd]);
      } else {
        setRangeEnd(date);
        onRangeValueChange?.([rangeStart, date]);
      }
      setRangeHover(null);
    } else {
      if (isSameDay(date, rangeStart)) {
        setRangeEnd(null);
        setRangeHover(null);
      } else if (isSameDay(date, rangeEnd)) {
        setRangeStart(rangeEnd);
        setRangeEnd(null);
        setRangeHover(null);
      } else if (date >= rangeStart) {
        setRangeEnd(date);
        onRangeValueChange?.([rangeStart, date]);
        setRangeHover(null);
      } else {
        setRangeStart(date);
        onRangeValueChange?.([date, rangeEnd]);
      }
    }
  }

  function handleDayHover(date: Date | null) {
    if (mode === 'range' && rangeStart && !rangeEnd) {
      setRangeHover(date);
    }
  }

  // ── Formatted date display ──────────────────────────────────────────────────

  function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString(locale, { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  const formattedDateDisplay = useMemo(() => {
    if (mode === 'single') {
      return value ? formatDate(value) : 'DD MMM YYYY';
    }
    const start = rangeStart ? formatDate(rangeStart) : 'DD MMM YYYY';
    const end = rangeEnd ? formatDate(rangeEnd) : 'DD MMM YYYY';
    return `${start} - ${end}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, value, rangeStart, rangeEnd, locale]);

  const cancelLabel = calendarStrings(locale).cancel;
  const applyLabel = calendarStrings(locale).apply;
  const calendarAriaLabel = calendarStrings(locale).calendar;

  // Apply enabled only when a valid selection exists.
  const canApply =
    mode === 'range' ? !!rangeStart && !!rangeEnd : !!value;

  // ── Footer actions ──────────────────────────────────────────────────────────

  function handleApply() {
    if (mode === 'single') {
      onApply?.(value ?? null);
    } else {
      onApply?.(rangeStart && rangeEnd ? [rangeStart, rangeEnd] : null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={[
        'bt-calendar',
        presets?.length ? 'bt-calendar--has-presets' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="application"
      aria-label={calendarAriaLabel}
    >
      {/* Preset panel (left sidebar) */}
      {!!presets?.length && (
        <BTCalendarPresetPanel
          presets={presets}
          activePresetIndex={activePresetIndex}
          onSelect={handlePresetSelect}
        />
      )}

      {/* Calendar body */}
      <div className="bt-calendar__body">
        {/* Single mode: header inside months wrapper, one month */}
        {mode === 'single' ? (
          <div className="bt-calendar__months">
            <div className="bt-calendar__month">
              <BTCalendarHeader
                displayDate={displayDate}
                locale={locale}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onPrev={handlePrev}
                onNext={handleNext}
                onSelectMonth={handleSelectMonth}
                onSelectYear={handleSelectYear}
              />
              <BTCalendarGrid
                displayDate={displayDate}
                selectedDate={value ?? null}
                disabledDates={disabledDates}
                eventDates={eventDates}
                minDate={minDate}
                maxDate={maxDate}
                locale={locale}
                onSelect={handleDaySelect}
                onHover={handleDayHover}
              />
            </div>
          </div>
        ) : (
          /* Range mode: single shared header + two month columns with subtitles */
          <>
            <BTCalendarHeader
              displayDate={displayDate}
              locale={locale}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={handlePrev}
              onNext={handleNext}
              onSelectMonth={handleSelectMonth}
              onSelectYear={handleSelectYear}
            />

            <div className="bt-calendar__months">
              {/* Left month */}
              <div className="bt-calendar__month">
                <div className="bt-calendar__month-subtitle">
                  {getMonthName(displayDate, locale)}
                </div>
                <BTCalendarGrid
                  displayDate={displayDate}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  rangeHover={rangeHover}
                  disabledDates={disabledDates}
                  eventDates={eventDates}
                  minDate={minDate}
                  maxDate={maxDate}
                  locale={locale}
                  onSelect={handleDaySelect}
                  onHover={handleDayHover}
                />
              </div>

              {/* Right month */}
              <div className="bt-calendar__month">
                <div className="bt-calendar__month-subtitle">
                  {getMonthName(displayDate2, locale)}
                </div>
                <BTCalendarGrid
                  displayDate={displayDate2}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  rangeHover={rangeHover}
                  disabledDates={disabledDates}
                  eventDates={eventDates}
                  minDate={minDate}
                  maxDate={maxDate}
                  locale={locale}
                  onSelect={handleDaySelect}
                  onHover={handleDayHover}
                />
              </div>
            </div>
          </>
        )}

        {/* Preset chips (wrap row below the day grid) */}
        {showPreset && presetChips.length > 0 && (
          <div className="bt-calendar__preset-chips">
            {presetChips.map((chip) => (
              <BTButton
                key={chip.key}
                variant="secondary-white"
                size="small"
                label={chip.label}
                onClick={() => handleChipClick(chip)}
              />
            ))}
          </div>
        )}

        {/* Footer: date display + actions */}
        {showFooter && (
          <div className={`bt-calendar__footer${mode === 'range' ? ' bt-calendar__footer--range' : ''}`}>
            <div className="bt-calendar__date-display">{formattedDateDisplay}</div>
            <div className="bt-calendar__footer-actions">
              <BTButton
                variant="secondary-light"
                label={cancelLabel}
                onClick={onCancel}
              />
              <BTButton
                variant="primary"
                label={applyLabel}
                disabled={!canApply}
                onClick={handleApply}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

BTCalendar.displayName = 'BTCalendar';
